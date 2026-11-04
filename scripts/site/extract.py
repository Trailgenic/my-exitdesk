#!/usr/bin/env python3
"""One-time: turn the existing collection pages into site-src content + templates.

Infers each collection's template from its pages, names the fields, writes
site-src/templates/<c>.html and site-src/content/<c>.json, then proves that
building from them reproduces every existing page byte for byte.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from infer import group_fields, infer_collection  # noqa: E402
from build import ROOT, SITE, SRC, render  # noqa: E402
from hubs import extract_hubs  # noqa: E402

PATHS = {"glossary": "/glossary", "podcast": "/podcast", "ma-topics": "/ma-topics",
         "ma-resources": "/ma-resources"}

# Friendlier names for automatically found fields (by collection).
RENAME = json.loads((Path(__file__).parent / "field-names.json").read_text()) \
    if (Path(__file__).parent / "field-names.json").exists() else {}


def auto_name(ctx: str) -> str:
    ctx = ctx.rstrip()
    m = re.search(r'"([A-Za-z]+)":\s*"$', ctx)
    if m:
        return re.sub(r"(?<!^)([A-Z])", r"_\1", m.group(1)).lower()
    if ctx.endswith('data-wf-item-slug="'):
        return "slug"
    if ctx.endswith("<title>"):
        return "seo_title"
    if ctx.endswith('<meta content="'):
        return "meta_description"
    m = re.search(r'class="([^"]+)">$', ctx)
    if m:
        cls = [c for c in m.group(1).split() if not c.startswith("w-")] or m.group(1).split()
        return re.sub(r"[^a-z0-9]+", "_", cls[-1].lower()).strip("_")
    m = re.search(r'([a-z-]+)="$', ctx)
    if m:
        return m.group(1).replace("-", "_")
    return "field"


def main():
    for c, path in PATHS.items():
        files = sorted((SITE / path.strip("/")).glob("*/index.html"))
        pages = [f.read_text("utf-8") for f in files]
        parts, values = infer_collection(pages)
        fields, smap, vectors = group_fields(parts, values)

        # Name fields from the text just before their defining slot.
        ctx, prev = [], ""
        for p in parts:
            if p is None:
                ctx.append(prev[-200:])
            else:
                prev = p
        names, used = [], {}
        for f, src in enumerate(fields):
            base = auto_name(ctx[src])
            used[base] = used.get(base, 0) + 1
            names.append(base if used[base] == 1 else f"{base}_{used[base]}")
        names = [RENAME.get(c, {}).get(n, n) for n in names]

        # Template text.
        out, k = [], 0
        for p in parts:
            if p is None:
                f, how, a, b = smap[k]
                if how == "ifempty":
                    out.append("{{@" + names[f] + "|ifempty:" + a + "||" + b + "}}")
                else:
                    tag = "{{@" + names[f] + ("" if how == "same" else "|" + how) + "}}"
                    out.append(a + tag + b)
                k += 1
            else:
                if "{{@" in p:
                    raise ValueError("placeholder syntax collides with page text")
                out.append(p)
        template = "".join(out)

        items = []
        for i, f in enumerate(files):
            entry = {}
            for fi, src in enumerate(fields):
                entry[names[fi]] = vectors[src][i]
            # slug first, then the rest in template order
            items.append({"slug": entry.pop("slug"), **entry} if "slug" in entry else entry)

        (SRC / "templates").mkdir(parents=True, exist_ok=True)
        (SRC / "content").mkdir(parents=True, exist_ok=True)
        (SRC / "templates" / f"{c}.html").write_text(template, "utf-8")
        defaults = json.loads((Path(__file__).parent / "defaults.json").read_text()).get(c, {})
        content = {"collection": c, "path": path, "fields": names, "defaults": defaults, "items": items}
        hub = extract_hubs(c, content)
        if hub:
            extra = hub.pop("extra")
            for name, per_slug in extra.items():
                for item in items:
                    if item["slug"] in per_slug:
                        item[name] = per_slug[item["slug"]]
            content["hub"] = hub
        (SRC / "content" / f"{c}.json").write_text(
            json.dumps(content, indent=2, ensure_ascii=False) + "\n", "utf-8")

        bad = [str(f) for f, item, page in zip(files, items, pages) if render(template, item, defaults) != page]
        print(f"{c}: {len(items)} entries, fields: {', '.join(names)}")
        print(f"   byte-identical: {len(items) - len(bad)}/{len(items)}")
        for b in bad:
            print("   MISMATCH", b)


if __name__ == "__main__":
    main()
