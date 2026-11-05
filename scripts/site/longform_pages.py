#!/usr/bin/env python3
"""One-time: move the hand-built Exit Desk articles and sample reports onto the
Ledger long-form layout (title block + side panel, contents rail beside the text).

Each page's own body markup and styles are kept inside the new frame; only the
masthead is lifted into the title block. Pages already converted are skipped.
Structured data is never touched.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from infer import close_of  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
SITE = ROOT / "public" / "_site"
LD = re.compile(r"<script[^>]*application/ld\+json[^>]*>.*?</script>", re.S)

ARTICLE_PANEL = ('<aside class="lg-panel" aria-label="Apply this to your business">'
                 '<span class="lg-panel-label">Apply this to your business</span>'
                 '<p>See your business the way a serious buyer will, before you go to market.</p>'
                 '<a class="lg-btn" href="/exit/score">Take the free assessment</a>'
                 '<a href="/exit/sample" class="lg-panel-note">Or read a sample report →</a></aside>')
SAMPLE_PANEL = ('<aside class="lg-panel" aria-label="Get this report for your business">'
                '<span class="lg-panel-label">Get this report for your business</span>'
                '<p>A buyer-lens readiness report on your own company.</p>'
                '<dl><dt>Under $1M revenue</dt><dd>$199</dd><dt>$1M and above</dt><dd>$499</dd></dl>'
                '<a class="lg-btn" href="/exit/checkout">Get your report</a>'
                '<a href="/exit/sample" class="lg-panel-note">All sample reports →</a></aside>')
# Two sample reports were published without a headline.
MISSING_H1 = {"fitwire-daily": "FitWire Daily", "meridian-advisory": "Meridian Advisory Group"}


def inner(tag_html: str) -> str:
    return re.sub(r"^<[^>]+>|</[a-z0-9]+>$", "", tag_html.strip(), flags=re.S)


def take(pattern: str, text: str):
    m = re.search(pattern, text, re.S)
    if not m:
        return None, text
    return m.group(0), text[:m.start()] + text[m.end():]


def element_at(text: str, start: int) -> tuple[int, int]:
    """(start, end) of the div/header element opening at `start`."""
    tag = re.match(r"<(div|header)\b[^>]*>", text[start:])
    if tag.group(1) == "div":
        return start, close_of(text, start + tag.end()) + len("</div>")
    return start, text.index("</header>", start) + len("</header>")


def convert(path: Path, sample: bool) -> bool:
    text = path.read_text("utf-8")
    if "data-lg-doc" in text:
        return False
    ld_before = LD.findall(text)
    m = re.search(r'<(div|main) class="([a-z0-9]+)-root"([^>]*)>', text)
    if not m:
        raise ValueError(f"{path}: no root")
    kind, prefix = m.group(1), m.group(2)
    body_start = m.end()
    body_end = close_of(text, body_start) if kind == "div" else text.index("</main>", body_start)
    body = text[body_start:body_end]

    _, body = take(r'<a class="[a-z0-9]+-nav-back"[^>]*>.*?</a>', body)
    body = re.sub(r"<p </p>", "", body)
    conf, body = take(r'<div class="[a-z0-9]+-confidential">.*?</div>', body)

    mm = re.search(r'<(div|header) class="(?:[a-z0-9]+-masthead|sx-masthead)">', body)
    kicker = h1 = lead = tags = ""
    if mm:
        a, b = element_at(body, mm.start())
        mast, body = body[a:b], body[:a] + body[b:]
        lab = re.search(r'<div class="[a-z0-9]+-label">(.*?)</div>', mast, re.S)
        kicker = lab.group(1).strip() if lab else ""
        h = re.search(r"<h1\b[^>]*>(.*?)</h1>", mast, re.S)
        h1 = h.group(1).strip() if h else ""
        sub = re.search(r'<p class="[a-z0-9]+-(?:subtitle|profile)">(.*?)</p>', mast, re.S)
        lead = sub.group(1).strip() if sub else ""
        tr = re.search(r'<div class="[a-z0-9]+-tag-row">.*?</div>', mast, re.S)
        tags = re.sub(r'class="[a-z0-9]+-tag-row"', 'class="lg-tags"', tr.group(0)) if tr else ""
        tags = re.sub(r'class="[a-z0-9]+-tag"', 'class="lg-tag"', tags)
    slug = path.parent.name
    if not h1 and slug in MISSING_H1:
        h1 = MISSING_H1[slug]
        desc = re.search(r'<meta content="([^"]*)" name="description"', text)
        lead = desc.group(1) if desc else ""
    if not h1:
        raise ValueError(f"{path}: no headline found")
    if conf:
        kicker = "Sample report · Fictional company"
    if not kicker:
        kicker = "Exit Desk · Case study" if not sample else "Exit Desk · Sample report"
    elif kicker.lower().startswith("exit desk"):
        kicker = "Exit Desk · Editorial"

    head = (f'<section class="lg-doc-head"><div class="lg-doc-title"><p class="lg-kicker">{kicker}</p>'
            f'<h1>{h1}</h1>' + (f'<p class="lg-lead">{lead}</p>' if lead else "") + tags +
            '</div>' + (SAMPLE_PANEL if sample else ARTICLE_PANEL) + '</section>')
    new_body = (f'<div class="lg-doc" data-lg-doc>{head}<section class="lg-doc-body">'
                '<nav class="lg-rail" aria-label="On this page" data-lg-rail><span>Contents</span></nav>'
                f'<article class="lg-prose">{body}</article></section></div>')
    open_tag = m.group(0).replace(f'class="{prefix}-root"', f'class="{prefix}-root lg-root"')
    text = text[:m.start()] + open_tag + new_body + text[body_end:]
    if 'src="/assets/site/rail.js"' not in text:
        text = text.replace("</body>", '<script src="/assets/site/rail.js" defer></script></body>', 1)
    assert LD.findall(text) == ld_before, f"structured data changed on {path}"
    path.write_text(text, "utf-8")
    return True


def main():
    done = 0
    for f in sorted((SITE / "exit" / "articles").glob("*/index.html")):
        done += convert(f, sample=False)
    for f in sorted((SITE / "exit" / "sample").glob("*/index.html")):
        done += convert(f, sample=True)
    print(f"converted {done} page(s)")


if __name__ == "__main__":
    main()
