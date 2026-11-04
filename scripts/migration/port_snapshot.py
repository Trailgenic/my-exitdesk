#!/usr/bin/env python3
"""Turn the live-site snapshot into files the Vercel project serves.

Pages   -> public/_site/<path>/index.html (served at the same address via
           rewrites in next.config.mjs)
Files   -> public/assets/webflow/... (every image, stylesheet, script and
           download that Webflow hosted for this site)
Root    -> public/robots.txt, public/sitemap.xml (llms.txt already lives here)

Links to Webflow's file servers are rewritten to this site. Inside page
metadata and structured data the new links are absolute (https://www.mikeye.com/...),
everywhere else they are root-relative so preview deployments work too.

Usage: python3 scripts/migration/port_snapshot.py [snapshot_dir]
"""
from __future__ import annotations

import html
import json
import re
import shutil
import sys
import urllib.parse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SNAP = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "migration-snapshot"
PUBLIC = ROOT / "public"
SITE_OUT = PUBLIC / "_site"
ASSET_OUT = PUBLIC / "assets" / "webflow"
CANONICAL = "https://www.mikeye.com"
SITE_ID = "69499e76d9c11f22288abc28"

CDN = re.compile(r"https://cdn\.prod\.website-files\.com/" + SITE_ID + r"/([^\s\"'<>)\\,]+)")
JQUERY = re.compile(r"https://d3e54v103j8qbb\.cloudfront\.net/js/(jquery-[0-9.]+\.min\.[0-9a-f]+\.js)\?site=" + SITE_ID)
FORMS_SCRIPT = '<script src="/assets/site/forms.js" type="text/javascript"></script>'
FORM_NAMES = ("Acquisition Lens Request", "Library Updates")

missing: set[str] = set()


def safe_name(rel_url_path: str) -> str:
    """Webflow file path -> a file name with no spaces or special characters."""
    decoded = urllib.parse.unquote(html.unescape(rel_url_path))
    parts = decoded.split("/")
    return "/".join(re.sub(r"[^A-Za-z0-9._-]+", "-", p).strip("-") for p in parts)


def snapshot_asset(url: str) -> Path:
    p = urllib.parse.urlparse(url)
    return SNAP / "assets" / p.netloc / urllib.parse.unquote(p.path).lstrip("/")


def local_url(rel: str, absolute: bool) -> str:
    path = "/assets/webflow/" + safe_name(rel)
    return CANONICAL + path if absolute else path


def rewrite(text: str, absolute: bool) -> str:
    def cdn_sub(m: re.Match) -> str:
        rel = m.group(1)
        src = "https://cdn.prod.website-files.com/" + SITE_ID + "/" + html.unescape(rel)
        if not snapshot_asset(src).exists():
            missing.add(src)
        return local_url(rel, absolute)

    text = CDN.sub(cdn_sub, text)
    text = JQUERY.sub(lambda m: (CANONICAL if absolute else "") + "/assets/webflow/js/" + m.group(1), text)
    return text


LD_JSON = re.compile(r'(<script[^>]*type="application/ld\+json"[^>]*>)(.*?)(</script>)', re.S | re.I)
META = re.compile(r"<meta\b[^>]*>", re.I)
LINK_CANON = re.compile(r'<link\b[^>]*rel="(?:canonical|alternate)"[^>]*>', re.I)


def port_html(text: str) -> str:
    # Webflow's file server is no longer used.
    text = text.replace('<link href="https://cdn.prod.website-files.com" rel="preconnect" crossorigin="anonymous"/>', "")
    # Structured data and metadata: absolute links.
    text = LD_JSON.sub(lambda m: m.group(1) + rewrite(m.group(2), True) + m.group(3), text)
    text = META.sub(lambda m: rewrite(m.group(0), True), text)
    text = LINK_CANON.sub(lambda m: rewrite(m.group(0), True), text)
    # Everything else: root-relative links.
    text = rewrite(text, False)
    # Native Webflow forms now post to this site instead of Webflow.
    if any(f'data-name="{n}"' in text for n in FORM_NAMES):
        jq = text.find('<script src="/assets/webflow/js/jquery-')
        if jq == -1:
            jq = text.rfind("</body>")
        text = text[:jq] + FORMS_SCRIPT + text[jq:]
    return text


def main():
    manifest = json.loads((SNAP / "manifest.json").read_text())

    if SITE_OUT.exists():
        shutil.rmtree(SITE_OUT)
    if ASSET_OUT.exists():
        shutil.rmtree(ASSET_OUT)
    SITE_OUT.mkdir(parents=True)
    ASSET_OUT.mkdir(parents=True)

    # 1. Files Webflow hosted.
    copied = 0
    for url, rec in manifest["assets"].items():
        if rec.get("status") != 200 or "file" not in rec:
            continue
        p = urllib.parse.urlparse(url)
        src = SNAP / rec["file"]
        if p.netloc == "cdn.prod.website-files.com" and p.path.startswith("/" + SITE_ID + "/"):
            rel = p.path[len(SITE_ID) + 2:]
            dest = ASSET_OUT / safe_name(rel)
        elif p.netloc == "d3e54v103j8qbb.cloudfront.net":
            dest = ASSET_OUT / "js" / Path(p.path).name
        else:
            continue  # my-exitdesk.vercel.app files already live in this repo
        dest.parent.mkdir(parents=True, exist_ok=True)
        data = src.read_bytes()
        if dest.suffix == ".css":
            data = rewrite(data.decode("utf-8"), False).encode("utf-8")
        dest.write_bytes(data)
        copied += 1

    # 2. Pages.
    pages = 0
    for path, rec in sorted(manifest["pages"].items()):
        if rec.get("status") != 200 or "file" not in rec:
            continue
        if "html" not in (rec.get("contentType") or ""):
            continue
        text = (SNAP / rec["file"]).read_text("utf-8")
        out = SITE_OUT / ("index.html" if path == "/" else path.strip("/") + "/index.html")
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(port_html(text), "utf-8")
        pages += 1

    # 3. Root files.
    for name in ("robots.txt", "sitemap.xml"):  # served as-is
        src = SNAP / "root" / name
        if src.exists():
            shutil.copyfile(src, PUBLIC / name)
    # public/llms.txt is the maintained copy (newer than the one Webflow served).

    # 4. Machine-readable files in public/ that link to Webflow-hosted downloads.
    for name in ("llms.txt", "ontology.json", "datasets/ma-library.json"):
        f = PUBLIC / name
        if f.exists():
            t = f.read_text("utf-8")
            new = rewrite(t, True)
            if new != t:
                f.write_text(new, "utf-8")
                print(f"rewrote download links in public/{name}")

    # 5. Anything still pointing at Webflow's servers?
    leftovers = []
    for f in list(SITE_OUT.rglob("*.html")) + list(ASSET_OUT.rglob("*.css")):
        t = f.read_text("utf-8", "replace")
        t = t.replace("<!-- This site was created in Webflow. https://webflow.com -->", "")
        for m in re.finditer(r"https?://[a-z0-9.-]*(?:website-files\.com|webflow\.com|webflow\.io|cloudfront\.net)[^\s\"'<>)]*", t):
            leftovers.append(f"{f.relative_to(ROOT)}: {m.group(0)[:120]}")

    print(f"pages written: {pages}; files copied: {copied}")
    print(f"referenced but not captured: {len(missing)}")
    for m in sorted(missing):
        print("  missing:", m)
    print(f"remaining Webflow references: {len(leftovers)}")
    for l in sorted(set(leftovers))[:40]:
        print("  ", l)


if __name__ == "__main__":
    main()
