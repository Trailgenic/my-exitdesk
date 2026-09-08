"""Audit the rendered Webflow launch, without performing writes or purchases.

Usage: python scripts/verify-launch.py https://mike-ye.webflow.io
Use https://www.mikeye.com only after the production publication.
"""
import concurrent.futures
import json
from pathlib import Path
import sys
import urllib.request
from urllib.parse import urlparse
import xml.etree.ElementTree as ET

from bs4 import BeautifulSoup

base = (sys.argv[1] if len(sys.argv) > 1 else "https://mike-ye.webflow.io").rstrip("/")
root = Path(__file__).resolve().parents[1]
inventory = json.loads((root / "site-foundation/launch/ma-library.json").read_text())
new_paths = [urlparse(r["url"]).path for r in inventory["resources"] if r["download"]]
core = ["/", "/m-and-a", "/tools-and-models", *new_paths]
paths = list(dict.fromkeys(core + ["/intelligence", "/glossary", "/podcast", "/about", "/about/record", "/exit", "/exit/score", "/exit/checkout"]))

def fetch(path):
    request = urllib.request.Request(base + path, headers={"User-Agent": "MikeYe-Launch-Verification/1.0"})
    with urllib.request.urlopen(request, timeout=45) as response:
        return path, response.status, response.read().decode("utf-8")

errors, reports = [], []
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    results = list(pool.map(fetch, paths))
for path, status, html in results:
    soup = BeautifulSoup(html, "html.parser")
    scripts = soup.find_all("script", type="application/ld+json")
    if soup.find("script", src="https://my-exitdesk.vercel.app/exit-campaign.js"):
        errors.append(f"{path}: pending Stalled Exit campaign loader would be released; preserve separately before this launch")
    schemas = []
    try:
        for script in scripts:
            schema = json.loads(script.string or script.get_text())
            schemas.extend(schema.get("@graph", [schema]))
    except (ValueError, AttributeError) as exc:
        errors.append(f"{path}: invalid JSON-LD: {exc}")
    # Webflow's currency formatter intentionally contains template tokens in
    # executable JS; inspect searchable output, not those runtime templates.
    searchable = soup.get_text() + json.dumps(schemas) + str(soup.find_all("meta"))
    if "{{wf" in searchable:
        errors.append(f"{path}: unresolved CMS binding")
    if any("#undefined" in json.dumps(n) for n in schemas):
        errors.append(f"{path}: undefined ontology ID")
    canonical = soup.find("link", rel="canonical")
    actual = canonical.get("href", "") if canonical else ""
    if actual.rstrip("/") != ("https://www.mikeye.com" + path).rstrip("/"):
        errors.append(f"{path}: canonical {actual}")
    robots = [m.get("content", "") for m in soup.find_all("meta", attrs={"name": "robots"})]
    if path in core:
        if len(soup.find_all("h1")) != 1:
            errors.append(f"{path}: expected exactly one H1")
        if any("noindex" in r.lower() for r in robots):
            errors.append(f"{path}: launch page remains noindex")
        main = soup.find("main", id="main-content")
        if not main or main.get("tabindex") != "-1":
            errors.append(f"{path}: missing focusable main landmark")
        if soup.find("a", href="/rebuild-foundation#products"):
            errors.append(f"{path}: navigation points to draft homepage")
        if not any(n.get("@type") == "Person" and n.get("@id") == "https://www.mikeye.com/#person" for n in schemas):
            errors.append(f"{path}: missing canonical author identity")
        if any(n.get("@type") == "SoftwareApplication" for n in schemas):
            errors.append(f"{path}: unrelated global software schema")
    if path in new_paths:
        if not any("LearningResource" in n.get("@type", []) for n in schemas):
            errors.append(f"{path}: missing learning resource schema")
        expected = next(r["download"]["url"] for r in inventory["resources"] if urlparse(r["url"]).path == path)
        if not soup.find("a", href=expected):
            errors.append(f"{path}: expected workbook link missing")
    reports.append({"path": path, "status": status, "title": soup.title.get_text() if soup.title else None, "canonical": actual, "schemas": len(schemas), "h1": len(soup.find_all("h1")), "robots": robots})

_, _, sitemap = fetch("/sitemap.xml")
locations = [n.text for n in ET.fromstring(sitemap).iter() if n.tag.endswith("}loc")]
for path in core:
    if not any(urlparse(url).path.rstrip("/") == path.rstrip("/") for url in locations):
        errors.append(f"{path}: absent from sitemap")
for url in locations:
    if "/rebuild-foundation" in url or "/ma-topics/" in url or "/acquisition-lens" in url:
        errors.append(f"Draft or thin page in sitemap: {url}")

report = {"base": base, "pages": reports, "sitemapUrls": len(locations), "errors": errors, "scope": "HTTP, rendered HTML, JSON-LD, metadata, landmarks, download links, sitemap. This is not a mobile visual review or a payment test."}
print(json.dumps(report, indent=2))
sys.exit(bool(errors))
