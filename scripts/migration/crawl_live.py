#!/usr/bin/env python3
"""Snapshot the live mikeye.com (Webflow) site before migrating it to Vercel.

Saves the exact HTML served for every reachable page, every stylesheet,
script, image and downloadable file hosted by Webflow, and a manifest of
status codes and redirects. Standard library only.

Usage: python3 scripts/migration/crawl_live.py <output_dir>
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ORIGIN = "https://www.mikeye.com"
SITE_HOSTS = {"www.mikeye.com", "mikeye.com"}
ASSET_HOSTS = {
    "cdn.prod.website-files.com",
    "assets-global.website-files.com",
    "uploads-ssl.webflow.com",
    "d3e54v103j8qbb.cloudfront.net",  # Webflow's jQuery
    "s3.amazonaws.com",
    "my-exitdesk.vercel.app",
}
UA = "mikeye-migration-snapshot/1.0"
MAX_PAGES = 600
DEADLINE = time.time() + 22 * 60

# Every published path known from the Webflow API on 2026-11-04, plus files
# that live at the site root. The crawler also follows links and the sitemap.
SEED_PATHS = [
    "/", "/about", "/about/record", "/m-and-a", "/tools-and-models", "/intelligence",
    "/intelligence/judgment-as-a-service", "/intelligence/dependency-vs-leverage",
    "/intelligence/timing-asymmetry", "/intelligence/signal-vs-narrative",
    "/intelligence/scarcity-vs-growth", "/glossary", "/podcast", "/ella",
    "/exit", "/exit/score", "/exit/checkout", "/exit/success", "/exit/desk",
    "/exit/articles", "/exit/sample", "/exit/partners", "/exit/story", "/exit/valuation",
    "/exit/sample/pinnacle-hvac", "/exit/sample/meridian-advisory",
    "/exit/sample/apex-landscape", "/exit/sample/fitwire-daily",
    "/exit/articles/buzzangle-case-study", "/exit/articles/sourcing-journal-case-study",
    "/exit/articles/long-beach-surgical-case-study", "/exit/articles/what-buyers-actually-look-for",
    "/exit/articles/founder-dependence-kills-deals", "/exit/articles/business-valuation-multiples-explained",
    "/exit/articles/when-to-sell-your-business", "/exit/articles/how-buyers-evaluate-revenue-quality",
    "/exit/articles/what-cpas-miss-about-exit-planning", "/exit/articles/ai-impact-on-business-valuation",
    "/exit/articles/exit-readiness-checklist",
    "/received-offer-to-buy-my-business", "/who-owns-what-before-selling-business",
    "/exit-planning-resources-for-cpas", "/exit-readiness-for-financial-advisors",
    "/exit-planning-for-estate-attorneys", "/exit-readiness-for-business-brokers",
    "/acquisition-lens", "/negotiation-intelligence", "/digital-discovery-equity",
    "/robots.txt", "/sitemap.xml", "/llms.txt", "/llms-full.txt", "/.well-known/llms.txt",
    "/favicon.ico", "/this-page-does-not-exist-404-check",
]


def fetch(url: str, follow: bool = True, tries: int = 2):
    """Return (status, headers, body, final_url). Never raises on HTTP errors."""
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *a, **k):
            return None

    opener = urllib.request.build_opener() if follow else urllib.request.build_opener(NoRedirect)
    last_err = None
    for attempt in range(tries):
        t0 = time.time()
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Encoding": "identity"})
        try:
            with opener.open(req, timeout=20) as r:
                body = r.read()
                print(f"  {r.status} {url} ({len(body)}b, {time.time()-t0:.1f}s)", flush=True)
                return r.status, dict(r.headers), body, r.geturl()
        except urllib.error.HTTPError as e:
            print(f"  {e.code} {url}", flush=True)
            return e.code, dict(e.headers or {}), e.read() if e.fp else b"", url
        except Exception as e:  # network hiccup
            last_err = e
            print(f"  ERR {url}: {e!r} after {time.time()-t0:.1f}s", flush=True)
            time.sleep(2 * (attempt + 1))
    return 0, {"error": repr(last_err)}, b"", url


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links: list[str] = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if not value:
                continue
            if name == "content" and not value.startswith(("http://", "https://", "/")):
                continue  # meta descriptions and titles, not links
            if name in ("href", "src", "content", "data-src", "poster"):
                self.links.append(value)
            elif name == "srcset":
                for part in value.split(","):
                    bit = part.strip().split(" ")[0]
                    if bit:
                        self.links.append(bit)


CSS_URL = re.compile(r"url\(\s*['\"]?([^'\")]+)['\"]?\s*\)")
ANY_ASSET_URL = re.compile(
    r"https?://(?:cdn\.prod\.website-files\.com|assets-global\.website-files\.com|uploads-ssl\.webflow\.com|"
    r"s3\.amazonaws\.com/webflow-prod-assets|my-exitdesk\.vercel\.app)/[^\s\"'<>)\\]+"
)


def page_file(out: Path, path: str) -> Path:
    clean = path.split("?")[0].split("#")[0]
    if clean in ("", "/"):
        return out / "pages" / "index.html"
    if re.search(r"\.(txt|xml|ico|json)$", clean):
        return out / "root" / clean.lstrip("/")
    return out / "pages" / clean.strip("/") / "index.html"


def asset_file(out: Path, url: str) -> Path:
    p = urllib.parse.urlparse(url)
    path = urllib.parse.unquote(p.path).lstrip("/") or "index"
    if p.query:
        path += "__" + hashlib.sha1(p.query.encode()).hexdigest()[:8]
    return out / "assets" / p.netloc / path


def main():
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "migration-snapshot")
    out.mkdir(parents=True, exist_ok=True)
    manifest = {"origin": ORIGIN, "fetchedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "pages": {}, "assets": {}, "hostChecks": {}}

    # How each host variant behaves (apex -> www, http -> https).
    for variant in ["https://mikeye.com/", "http://mikeye.com/", "http://www.mikeye.com/",
                    "https://www.mikeye.com/exit/", "https://www.mikeye.com/About"]:
        st, hd, _, _ = fetch(variant, follow=False)
        manifest["hostChecks"][variant] = {"status": st, "location": hd.get("Location") or hd.get("location")}

    queue = list(SEED_PATHS)
    seen_pages: set[str] = set()
    asset_urls: set[str] = set()

    # Sitemap first so every listed URL is queued.
    st, _, body, _ = fetch(ORIGIN + "/sitemap.xml")
    if st == 200:
        for loc in re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", body.decode("utf-8", "replace")):
            queue.append(urllib.parse.urlparse(loc).path or "/")

    while queue and len(seen_pages) < MAX_PAGES and time.time() < DEADLINE:
        path = queue.pop(0)
        path = path.split("#")[0]
        if not path.startswith("/") or re.search(r"\s", path):
            continue
        if path in seen_pages:
            continue
        seen_pages.add(path)
        url = ORIGIN + path
        st, hd, body, final = fetch(url, follow=False)
        rec = {"status": st, "contentType": hd.get("Content-Type") or hd.get("content-type"),
               "location": hd.get("Location") or hd.get("location")}
        if st in (301, 302, 307, 308) and rec["location"]:
            target = urllib.parse.urljoin(url, rec["location"])
            tp = urllib.parse.urlparse(target)
            if tp.netloc in SITE_HOSTS:
                queue.append(tp.path or "/")
            manifest["pages"][path] = rec
            continue
        if body:
            f = page_file(out, path)
            f.parent.mkdir(parents=True, exist_ok=True)
            f.write_bytes(body)
            rec["file"] = str(f.relative_to(out))
            rec["sha256"] = hashlib.sha256(body).hexdigest()
        manifest["pages"][path] = rec
        ctype = (rec["contentType"] or "")
        if "html" not in ctype:
            text = body.decode("utf-8", "replace")
            asset_urls.update(ANY_ASSET_URL.findall(text))
            continue
        text = body.decode("utf-8", "replace")
        parser = LinkParser()
        try:
            parser.feed(text)
        except Exception:
            pass
        asset_urls.update(ANY_ASSET_URL.findall(text))
        for link in parser.links:
            absu = urllib.parse.urljoin(url, link.strip())
            pu = urllib.parse.urlparse(absu)
            if pu.scheme not in ("http", "https"):
                continue
            if pu.netloc in SITE_HOSTS:
                if not re.search(r"\.(png|jpe?g|gif|svg|webp|avif|css|js|pdf|xlsx|docx)$", pu.path, re.I):
                    queue.append(pu.path or "/")
            elif pu.netloc in ASSET_HOSTS:
                asset_urls.add(absu)
        time.sleep(0.15)

    # Download assets; scan CSS and JS for further asset references.
    pending = sorted(asset_urls)
    done: set[str] = set()
    while pending and time.time() < DEADLINE:
        aurl = pending.pop(0)
        if aurl in done:
            continue
        done.add(aurl)
        st, hd, body, _ = fetch(aurl)
        rec = {"status": st, "contentType": hd.get("Content-Type") or hd.get("content-type"),
               "bytes": len(body)}
        if st == 200 and body:
            f = asset_file(out, aurl)
            f.parent.mkdir(parents=True, exist_ok=True)
            f.write_bytes(body)
            rec["file"] = str(f.relative_to(out))
            rec["sha256"] = hashlib.sha256(body).hexdigest()
            if aurl.split("?")[0].endswith((".css", ".js")):
                text = body.decode("utf-8", "replace")
                refs = set(ANY_ASSET_URL.findall(text))
                if aurl.split("?")[0].endswith(".css"):
                    refs.update(urllib.parse.urljoin(aurl, u) for u in CSS_URL.findall(text)
                                if not u.startswith("data:"))
                for r in refs:
                    if urllib.parse.urlparse(r).netloc in ASSET_HOSTS and r not in done:
                        pending.append(r)
        manifest["assets"][aurl] = rec
        time.sleep(0.05)

    (out / "manifest.json").write_text(json.dumps(manifest, indent=2, sort_keys=True))
    ok = sum(1 for r in manifest["pages"].values() if r["status"] == 200)
    print(f"pages: {len(manifest['pages'])} ({ok} ok), assets: {len(manifest['assets'])}")


if __name__ == "__main__":
    main()
