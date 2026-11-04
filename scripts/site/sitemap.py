"""Keep public/sitemap.xml in step with the collection pages.

New entries are added; entries whose page changed in this build get today's
date as their last-modified time. Every other line is left as it is.
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SITEMAP = ROOT / "public" / "sitemap.xml"
CANONICAL = "https://www.mikeye.com"


def build_sitemap(check: bool, changed: list[str]) -> list[str]:
    text = SITEMAP.read_text("utf-8")
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    original = text
    wanted = []
    for f in sorted((ROOT / "site-src" / "content").glob("*.json")):
        content = json.loads(f.read_text("utf-8"))
        for item in content["items"]:
            wanted.append(f"{content['path']}/{item['slug']}")
    changed_paths = {"/" + re.sub(r"^public/_site/|/index\.html$", "", c) for c in changed}
    for path in wanted:
        loc = f"<loc>{CANONICAL}{path}</loc>"
        if loc not in text:
            entry = f"    <url>\n        {loc}\n        <lastmod>{now}</lastmod>\n    </url>\n"
            text = text.replace("</urlset>", entry + "</urlset>")
        elif path in changed_paths:
            text = re.sub(re.escape(loc) + r"(\s*)<lastmod>[^<]*</lastmod>",
                          lambda m: loc + m.group(1) + f"<lastmod>{now}</lastmod>", text)
    if text != original:
        if not check:
            SITEMAP.write_text(text, "utf-8")
        return ["public/sitemap.xml"]
    return []
