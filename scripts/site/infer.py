"""Infer one page template + per-item values from a set of pages that share a layout.

Pages are split into small tokens (runs between < > and " characters), the
first page is aligned with every other page, and every stretch that differs
in any page becomes a slot. Each page is then read back through the template
to get its slot values. Slots whose values are the same text (or the same
text with fixed words around it, or a differently escaped copy of it) across
every page are merged into one field.
"""
from __future__ import annotations

import difflib
import html
import json
import re

TOKEN = re.compile(r'([<>"])')


def tokens(text: str) -> list[str]:
    return [t for t in TOKEN.split(text) if t != ""]


def infer_slots(pages: list[str]):
    base = tokens(pages[0])
    variable = [False] * len(base)
    gaps: set[int] = set()  # slot positions between tokens (insertions)
    for other in pages[1:]:
        sm = difflib.SequenceMatcher(None, base, tokens(other), autojunk=False)
        for tag, i1, i2, _j1, _j2 in sm.get_opcodes():
            if tag == "equal":
                continue
            if i1 == i2:
                gaps.add(i1)
            for i in range(i1, i2):
                variable[i] = True
    # Build template parts: literal strings and slot markers.
    parts: list[object] = []
    lit: list[str] = []
    i = 0
    n = len(base)
    while i <= n:
        if i in gaps or (i < n and variable[i]):
            if lit:
                parts.append("".join(lit))
                lit = []
            parts.append(None)  # slot
            while i < n and variable[i]:
                i += 1
            if i in gaps and (not parts or parts[-1] is not None):
                pass
            # a gap at the end of a variable run is part of the same slot
            gaps.discard(i) if i < n and not variable[i] else None
            continue
        if i < n:
            lit.append(base[i])
        i += 1
    if lit:
        parts.append("".join(lit))
    # Merge adjacent slots.
    merged: list[object] = []
    for p in parts:
        if p is None and merged and merged[-1] is None:
            continue
        merged.append(p)
    return merged


def extract(parts: list[object], page: str) -> list[str] | None:
    pattern = "".join("(.*?)" if p is None else re.escape(p) for p in parts)
    m = re.fullmatch(pattern, page, re.S)
    return list(m.groups()) if m else None


def render(parts: list[object], values: list[str]) -> str:
    out, k = [], 0
    for p in parts:
        if p is None:
            out.append(values[k])
            k += 1
        else:
            out.append(p)
    return "".join(out)


# --- relating slots to each other ------------------------------------------

def esc_text(s: str) -> str:
    return html.escape(s, quote=False).replace("'", "&#x27;")


def esc_attr(s: str) -> str:
    return html.escape(s, quote=True).replace("&#x27;", "&#x27;")


def esc_json(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)[1:-1]


TRANSFORMS = {
    "same": lambda s: s,
    "text": lambda s: esc_text(html.unescape(s)),
    "attr": lambda s: esc_attr(html.unescape(s)),
    "json": lambda s: esc_json(html.unescape(s)),
    "text39": lambda s: esc_text(html.unescape(s)).replace("&#x27;", "&#39;"),
    "json39": lambda s: esc_json(esc_text(html.unescape(s)).replace("&#x27;", "&#39;")),
}


def relate(source: list[str], target: list[str]):
    """Return (transform, prefix, suffix) if target == prefix + T(source) + suffix for all items."""
    for name, fn in TRANSFORMS.items():
        try:
            derived = [fn(s) for s in source]
        except Exception:
            continue
        first = derived[0]
        if not first or first not in target[0]:
            continue
        at = target[0].index(first)
        pre, suf = target[0][:at], target[0][at + len(first):]
        if all(t == pre + d + suf for t, d in zip(target, derived)):
            return name, pre, suf
    return None


def group_fields(parts: list[object], values_by_page: list[list[str]]):
    """Map every slot to a field (+ how to derive it). Returns (fields, slot_map)."""
    nslots = len(values_by_page[0])
    vectors = [[vals[j] for vals in values_by_page] for j in range(nslots)]
    fields: list[int] = []  # slot index that defines each field
    slot_map: list[tuple[int, str, str, str]] = [None] * nslots  # type: ignore
    order = sorted(range(nslots), key=lambda j: (sum(map(len, vectors[j])), j))
    for j in order:
        vec = vectors[j]
        found = None
        for f, src in enumerate(fields):
            rel = relate(vectors[src], vec)
            if rel:
                found = (f, *rel)
                break
        if found is None:
            for f, src in enumerate(fields):
                rule = empty_rule(vectors[src], vec)
                if rule:
                    found = (f, "ifempty", *rule)
                    break
        if found is None:
            fields.append(j)
            found = (len(fields) - 1, "same", "", "")
        slot_map[j] = found
    # Second pass: a field that only says whether another field is empty.
    for f, src in enumerate(fields):
        if any(m[1] == "ifempty" and m[0] == f for m in slot_map):
            continue
        for g, other in enumerate(fields):
            if g == f:
                continue
            rule = empty_rule(vectors[other], vectors[src])
            if rule and all(m[1] != "ifempty" or m[0] != g for m in slot_map):
                for j, m in enumerate(slot_map):
                    if m[0] == f and m[1] == "same" and not m[2] and not m[3]:
                        slot_map[j] = (g, "ifempty", *rule)
                break
    used = sorted({m[0] for m in slot_map})
    remap = {old: new for new, old in enumerate(used)}
    fields = [fields[old] for old in used]
    slot_map = [(remap[m[0]], *m[1:]) for m in slot_map]
    return fields, slot_map, vectors


def empty_rule(source: list[str], target: list[str]):
    """target is one fixed text when source is empty and another otherwise."""
    when_empty = {t for s, t in zip(source, target) if not s.strip()}
    when_full = {t for s, t in zip(source, target) if s.strip()}
    if len(when_empty) == 1 and len(when_full) == 1 and when_empty != when_full:
        return when_empty.pop(), when_full.pop()
    return None


# --- rich text blocks --------------------------------------------------------
# Each Webflow rich-text block (<div class="... w-richtext ...">...</div>) is
# one field. Its contents are lifted out before alignment so shared phrases
# inside long text don't split it into fragments.

RICH_OPEN = re.compile(r'<div\b[^>]*class="[^"]*\bw-richtext\b[^"]*"[^>]*>')
DIV_TAG = re.compile(r'<div\b|</div>')


def close_of(text: str, start: int) -> int:
    """Index of the </div> closing the div whose content starts at `start`."""
    depth = 1
    for m in DIV_TAG.finditer(text, start):
        depth += 1 if m.group(0) == "<div" else -1
        if depth == 0:
            return m.start()
    raise ValueError("unbalanced div")


def lift_rich(text: str, page_no: int):
    out, rich, pos = [], [], 0
    for m in RICH_OPEN.finditer(text):
        if m.start() < pos:
            continue  # nested inside a block already lifted
        end = close_of(text, m.end())
        out.append(text[pos:m.end()])
        out.append(f"\x00R{page_no}.{len(rich)}\x00")
        rich.append(text[m.end():end])
        pos = end
    out.append(text[pos:])
    return "".join(out), rich


def infer_collection(pages: list[str]):
    lifted = [lift_rich(p, i) for i, p in enumerate(pages)]
    norm = [l[0] for l in lifted]
    parts = infer_slots(norm)
    values = []
    for i, n in enumerate(norm):
        v = extract(parts, n)
        if v is None:
            raise ValueError(f"page {i} does not fit the template")
        rich = lifted[i][1]
        v = [re.sub(r"\x00R\d+\.(\d+)\x00", lambda m: rich[int(m.group(1))], x) for x in v]
        values.append(v)
    for p in parts:
        if p is not None and "\x00" in p:
            raise ValueError("rich block marker left in template literal")
    return parts, values
