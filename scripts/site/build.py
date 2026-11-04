#!/usr/bin/env python3
"""Build the collection pages (glossary, podcast, M&A topics, M&A resources)
from site-src/content/*.json and site-src/templates/*.html.

Each entry in a content file becomes public/_site/<path>/<slug>/index.html.
Placeholders in templates:
  {{@field}}                 the entry's value as written
  {{@field|text}}            re-escaped for page text
  {{@field|attr}}            re-escaped for an HTML attribute
  {{@field|json}}            escaped for a JSON string (structured data)
  {{@field|text39}} / {{@field|json39}}  same, with apostrophes as &#39;
  {{@field|ifempty:A||B}}    A when the field is empty, B otherwise

A field missing from an entry falls back to the collection's "defaults":
another field ("summary"), another field re-escaped ("summary|json39"), or
fixed text with fields filled in ("fmt:{name} | Mike Ye"). New entries
therefore only need the basics.

Usage:
  python3 scripts/site/build.py           write pages, hub lists, sitemap
  python3 scripts/site/build.py --check   fail if any page would change
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from infer import TRANSFORMS  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "site-src"
SITE = ROOT / "public" / "_site"
PLACEHOLDER = re.compile(r"\{\{@([a-z0-9_]+)(?:\|([a-z0-9]+)(?::(.*?))?)?\}\}", re.S)
COLLECTIONS = ["glossary", "podcast", "ma-topics", "ma-resources"]


def field(entry: dict, name: str, defaults: dict) -> str:
    seen = set()
    while name not in entry:
        if name in seen or name not in defaults:
            raise KeyError(f"{entry.get('slug')}: missing field {name!r}")
        seen.add(name)
        spec = defaults[name]
        if spec.startswith("fmt:"):  # fixed text with {field} references
            return re.sub(r"\{([a-z0-9_]+)\}", lambda m: field(entry, m.group(1), defaults), spec[4:])
        if "|" in spec:  # "other_field|transform"
            src, how = spec.split("|", 1)
            return TRANSFORMS[how](field(entry, src, defaults))
        name = spec
    return entry[name]


def render(template: str, entry: dict, defaults: dict) -> str:
    def sub(m: re.Match) -> str:
        value = field(entry, m.group(1), defaults)
        how, arg = m.group(2), m.group(3)
        if not how or how == "same":
            return value
        if how == "ifempty":
            empty, full = arg.split("||", 1)
            return empty if not value.strip() else full
        return TRANSFORMS[how](value)
    return PLACEHOLDER.sub(sub, template)


def load(collection: str):
    content = json.loads((SRC / "content" / f"{collection}.json").read_text("utf-8"))
    template = (SRC / "templates" / f"{collection}.html").read_text("utf-8")
    return content, template


def build_collection(collection: str, check: bool) -> list[str]:
    content, template = load(collection)
    changed = []
    for entry in content["items"]:
        out = SITE / content["path"].strip("/") / entry["slug"] / "index.html"
        html = render(template, entry, content.get("defaults", {}))
        if not out.exists() or out.read_text("utf-8") != html:
            changed.append(str(out.relative_to(ROOT)))
            if not check:
                out.parent.mkdir(parents=True, exist_ok=True)
                out.write_text(html, "utf-8")
    return changed


def main():
    check = "--check" in sys.argv
    changed = []
    for c in COLLECTIONS:
        changed += build_collection(c, check)
    try:
        from hubs import build_hubs  # noqa: E402
        changed += build_hubs(check)
    except ImportError:
        pass
    try:
        from sitemap import build_sitemap  # noqa: E402
        changed += build_sitemap(check, changed)
    except ImportError:
        pass
    if check:
        if changed:
            print("Would change:")
            for c in changed:
                print("  " + c)
            sys.exit(1)
        print("All generated pages are up to date.")
    else:
        print(f"Wrote {len(changed)} changed file(s).")
        for c in changed:
            print("  " + c)


if __name__ == "__main__":
    main()
