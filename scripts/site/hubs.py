"""Lists of entries on hub pages (glossary index, podcast index, M&A Library topics).

Each hub list is regenerated from the entries named in the collection's
content file ("hub": {"lists": [{"label": ..., "slugs": [...]}, ...]}), using
the list-item template in site-src/templates/<collection>.hub-item.html.
Everything else on the hub page is left exactly as it is.

`extract_hubs()` (run once, from extract) reads today's hub pages and writes
the item templates, list order and any hub-only fields (e.g. episode labels).
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from infer import close_of, extract, infer_slots, relate, render as render_parts

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "site-src"
SITE = ROOT / "public" / "_site"

HUBS = {
    "glossary": {"page": "glossary", "list": r'<div role="list" class="w-dyn-items w-row">',
                 "item": '<div role="listitem"', "close": "div",
                 "label": r'<div class="gloss-hub__category-label">([^<]*)</div>'},
    "ma-topics": {"page": "m-and-a", "list": r'<div role="list" class="my1-topic-grid w-dyn-items">',
                  "item": '<div role="listitem"', "close": "div", "hub_fields": ["order_number"]},
    "podcast": {"page": "podcast", "list": r'<ul class="hub-list">', "item": '\n    <li class="hub-row">',
                "close": "ul", "first_only": True,
                "hub_fields": ["episode_label", "hub_blurb"]},  # second list = upcoming episodes, hand-written
}
SLUG_IN = re.compile(r'href="(?:https://www\.mikeye\.com)?/[a-z-]+/([a-z0-9-]+)"')


def regions(page: str, spec: dict):
    """(start, end) of the inside of every list container on the page."""
    out = []
    for m in re.finditer(spec["list"], page):
        if spec["close"] == "div":
            end = close_of(page, m.end())
        else:
            end = page.index("</ul>", m.end())
        out.append((m.end(), end))
    return out[:1] if spec.get("first_only") else out


def split_items(body: str, marker: str):
    starts = [m.start() for m in re.finditer(re.escape(marker), body)]
    if not starts:
        return body, [], ""
    head = body[:starts[0]]
    blocks = [body[a:b] for a, b in zip(starts, starts[1:] + [len(body)])]
    tail, sep = "", ""
    if marker.startswith("\n"):  # whitespace between items is kept out of the items
        trimmed = [b.rstrip() for b in blocks]
        gaps = {b[len(t):] for b, t in zip(blocks[:-1], trimmed[:-1])}
        if len(gaps) > 1:
            raise ValueError("uneven spacing between list items")
        sep = gaps.pop() if gaps else ""
        tail = blocks[-1][len(trimmed[-1]):]
        blocks = trimmed
    return head, blocks, tail, sep


def extract_hubs(collection: str, content: dict) -> dict | None:
    from build import TRANSFORMS  # noqa
    spec = HUBS.get(collection)
    if not spec:
        return None
    page = (SITE / spec["page"] / "index.html").read_text("utf-8")
    lists, blocks_all, slugs_all = [], [], []
    for start, end in regions(page, spec):
        head, blocks, tail, sep = split_items(page[start:end], spec["item"])
        if head.strip() or (tail and tail.strip()):
            raise ValueError(f"{collection}: unexpected text around list items")
        slugs = [SLUG_IN.search(b).group(1) for b in blocks]
        entry = {"slugs": slugs, "head": head, "tail": tail, "sep": sep}
        if "label" in spec:
            labels = re.findall(spec["label"], page[:start])
            entry["label"] = labels[-1] if labels else ""
        lists.append(entry)
        blocks_all += blocks
        slugs_all += slugs

    parts = infer_slots(blocks_all) if len(blocks_all) > 1 else [blocks_all[0]]
    values = [extract(parts, b) for b in blocks_all]
    if any(v is None for v in values):
        raise ValueError(f"{collection}: hub items do not share one layout")
    by_slug = {e["slug"]: e for e in content["items"]}
    names = list(content["fields"])
    out, k = [], 0
    extra_fields: dict[str, dict[str, str]] = {}
    for p in parts:
        if p is not None:
            out.append(p)
            continue
        vec = [v[k] for v in values]
        k += 1
        tag = None
        for name in names:
            src = [by_slug[s].get(name, "") for s in slugs_all]
            rel = relate(src, vec) if all(src) else None
            if rel:
                how, pre, suf = rel
                tag = pre + "{{@" + name + ("" if how == "same" else "|" + how) + "}}" + suf
                break
        if tag is None:  # a value only the hub shows (blurb, episode label, number)
            wanted = spec.get("hub_fields", [])
            name = wanted[len(extra_fields)] if len(extra_fields) < len(wanted) else f"hub_{len(extra_fields) + 1}"
            extra_fields[name] = dict(zip(slugs_all, vec))
            tag = "{{@" + name + "}}"
        out.append(tag)
    template = "".join(out)
    (SRC / "templates" / f"{collection}.hub-item.html").write_text(template, "utf-8")
    return {"page": spec["page"], "lists": lists, "extra": extra_fields}


def build_hubs(check: bool) -> list[str]:
    from build import load, render
    changed = []
    pages: dict[str, str] = {}
    for collection, spec in HUBS.items():
        tpl_file = SRC / "templates" / f"{collection}.hub-item.html"
        if not tpl_file.exists():
            continue
        content, _ = load(collection)
        hub = content.get("hub")
        if not hub:
            continue
        item_tpl = tpl_file.read_text("utf-8")
        by_slug = {e["slug"]: e for e in content["items"]}
        path = SITE / spec["page"] / "index.html"
        page = pages.get(spec["page"]) or path.read_text("utf-8")
        found = regions(page, spec)
        if len(found) != len(hub["lists"]):
            raise ValueError(f"{collection}: hub page has {len(found)} lists, content has {len(hub['lists'])}")
        # Replace from the end so earlier offsets stay valid.
        for (start, end), lst in reversed(list(zip(found, hub["lists"]))):
            items = lst.get("sep", "").join(
                render(item_tpl, by_slug[s], content.get("defaults", {})) for s in lst["slugs"])
            page = page[:start] + lst.get("head", "") + items + lst.get("tail", "") + page[end:]
        pages[spec["page"]] = page
    for name, page in pages.items():
        path = SITE / name / "index.html"
        if path.read_text("utf-8") != page:
            changed.append(str(path.relative_to(ROOT)))
            if not check:
                path.write_text(page, "utf-8")
    return changed
