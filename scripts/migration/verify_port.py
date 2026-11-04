#!/usr/bin/env python3
"""Check a running copy of the site against the live-site snapshot.

For every page Webflow served: same address returns 200 and exactly the
ported HTML. Also checks every linked file on this site resolves, the
host/slash redirects, the 404 page, and root files.

Usage: python3 scripts/migration/verify_port.py http://localhost:3000
"""
from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SNAP = ROOT / "migration-snapshot"
SITE = ROOT / "public" / "_site"
BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000").rstrip("/")


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


opener = urllib.request.build_opener(NoRedirect)


def get(path: str):
    try:
        with opener.open(urllib.request.Request(BASE + path), timeout=30) as r:
            return r.status, dict(r.headers), r.read()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers or {}), e.read() if e.fp else b""


failures: list[str] = []
manifest = json.loads((SNAP / "manifest.json").read_text())

# 1. Every page, byte for byte.
pages = [p for p, r in manifest["pages"].items()
         if r["status"] == 200 and "html" in (r.get("contentType") or "")]
linked: set[str] = set()
for path in sorted(pages):
    st, hd, body = get(path)
    expected = (SITE / ("index.html" if path == "/" else path.strip("/") + "/index.html")).read_bytes()
    if st != 200:
        failures.append(f"page {path}: status {st}")
    elif body != expected:
        failures.append(f"page {path}: content differs from ported file")
    elif "text/html" not in (hd.get("Content-Type") or hd.get("content-type") or ""):
        failures.append(f"page {path}: content type {hd.get('Content-Type')}")
    for m in re.finditer(r'(?:src|href)="(/[^"#?]*)', body.decode("utf-8", "replace")):
        linked.add(m.group(1))

# 2. Every same-site link and file referenced by the pages.
for path in sorted(linked):
    if path.startswith("//"):
        continue
    st, hd, _ = get(urllib.parse.quote(path))
    if st in (301, 308) and (hd.get("Location") or hd.get("location") or "").rstrip("/") == path.rstrip("/"):
        continue
    if st != 200:
        failures.append(f"link {path}: status {st}")

# 3. Behaviour checks.
checks = [
    ("/exit/", (301, 308), "/exit"),
    ("/exit/run", (301, 308), "/exit/score"),
    ("/exit/articles/what-buyers-actually-look", (301, 308), "/exit/articles/what-buyers-actually-look-for"),
    ("/_site/about/index.html", (301, 308), "/about"),
    ("/checkout", (200, 307, 308), None),
    ("/this-page-does-not-exist-404-check", (404,), None),
    ("/robots.txt", (200,), None),
    ("/sitemap.xml", (200,), None),
    ("/llms.txt", (200,), None),
    ("/ontology.json", (200,), None),
]
for path, ok, target in checks:
    st, hd, body = get(path)
    loc = hd.get("Location") or hd.get("location") or ""
    if st not in ok or (target and not loc.endswith(target)):
        failures.append(f"check {path}: status {st} location {loc!r}")

# 4. Downloads: same bytes as Webflow served.
for url, rec in manifest["assets"].items():
    if "cdn.prod.website-files.com" in url and rec.get("status") == 200 and url.endswith((".xlsx", ".pdf", ".docx")):
        name = re.sub(r"[^A-Za-z0-9._-]+", "-", urllib.parse.unquote(url.rsplit("/", 1)[1]))
        st, _, body = get("/assets/webflow/" + name)
        if st != 200 or body != (SNAP / rec["file"]).read_bytes():
            failures.append(f"download {name}: status {st} or bytes differ")

print(f"pages checked: {len(pages)}; links checked: {len(linked)}")
if failures:
    print(f"FAILURES ({len(failures)}):")
    for f in failures:
        print("  " + f)
    sys.exit(1)
print("ALL CHECKS PASSED")
