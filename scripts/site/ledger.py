#!/usr/bin/env python3
"""Apply the MikeYe.com Ledger design system to every page in public/_site.

What it does to each page:
  1. Maps the old palette to Ledger tokens in every <style> block and inline style
     (gold accent -> navy, cream -> paper, greys -> the label/muted scale).
  2. Swaps typefaces: EB Garamond / Georgia -> Newsreader, DM Mono / Courier ->
     Inter small capitals, Arial / Helvetica -> Inter.
  3. Replaces the old header and footer (where present) and inserts the shared
     Ledger header, breadcrumb and footer on every page.
  4. Loads the Google fonts and /assets/site/ledger.css after the page's own styles.
Structured data and page text are not touched. Idempotent: safe to re-run.

Usage: python3 scripts/site/ledger.py [--check]
"""
from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SITE = ROOT / "public" / "_site"
WEBFLOW_CSS = ROOT / "public" / "assets" / "webflow" / "css" / "mike-ye.webflow.shared.675a2fff6.css"

COLORS = {
    # ink scale
    "#1A1A18": "#1C1B18", "#10100F": "#1C1B18", "#1C1B19": "#1C1B18", "#222": "#1C1B18", "#333": "#3D3A33",
    "#2A2A26": "#3D3A33", "#44443D": "#3D3A33",
    "#555550": "#5A564D", "#5C5C54": "#5A564D", "#5A5446": "#5A564D",
    "#888880": "#6B665C", "#AAAAAA": "#6B665C", "#AAA": "#6B665C",
    # lines
    "#C8C4BA": "#D9D3C6", "#E0DDD6": "#D9D3C6", "#D4CDB8": "#D9D3C6", "#CEC9BC": "#D9D3C6",
    "#D8D1C4": "#D9D3C6", "#B8AB91": "#D9D3C6", "#DDD": "#D9D3C6", "#CCC": "#D9D3C6",
    # paper
    "#F7F5F0": "#F6F3EC", "#F2F0EB": "#FBF9F4", "#FDFCF9": "#FBF9F4", "#F0EDE5": "#FBF9F4", "#EEEBE4": "#FBF9F4",
    # old gold accent -> navy
    "#C8A96E": "#1F3A5F", "#79602E": "#1F3A5F", "#75623A": "#1F3A5F", "#B8965A": "#1F3A5F",
    "#B8975C": "#1F3A5F", "#675126": "#1F3A5F", "#D3B57E": "#1F3A5F", "#A99567": "#1F3A5F", "#23463A": "#1F3A5F",
}
SERIF = "'Newsreader', Georgia, serif"
SANS = "'Inter', system-ui, sans-serif"
FONT_RULES = [
    (re.compile(r"font-family\s*:\s*['\"]?EB Garamond['\"]?[^;}\"]*", re.I), "font-family: " + SERIF),
    (re.compile(r"font-family\s*:\s*Georgia\s*,[^;}\"]*", re.I), "font-family: " + SERIF),
    (re.compile(r"font-family\s*:\s*['\"]?DM Mono['\"]?[^;}\"]*", re.I), "font-family: " + SANS),
    (re.compile(r"font-family\s*:\s*['\"]?Courier New['\"]?[^;}\"]*", re.I), "font-family: " + SANS),
    (re.compile(r"font-family\s*:\s*monospace", re.I), "font-family: " + SANS),
    (re.compile(r"font-family\s*:\s*(Arial|Helvetica)[^;}\"]*", re.I), "font-family: " + SANS),
    (re.compile(r"font-family\s*:\s*['\"]?Inter['\"]?\s*,[^;}\"]*", re.I), "font-family: " + SANS),
    # shorthand `font: 400 1.6rem/1.25 "EB Garamond", Georgia, serif`
    (re.compile(r"(font\s*:[^;}]*?)['\"]?EB Garamond['\"]?[^;}\"]*", re.I), r"\1" + SERIF),
    (re.compile(r"(font\s*:[^;}]*?)['\"]?DM Mono['\"]?[^;}\"]*", re.I), r"\1" + SANS),
    (re.compile(r"(font\s*:[^;}]*?)(?<!Newsreader', )Georgia\s*,[^;}\"]*", re.I), r"\1" + SERIF),
]
# Section footers that duplicate the shared one (the page's own provenance footers stay).
OLD_SECTION_FOOTERS = re.compile(r'<footer class="(ad-footer|ed-footer)">.*?</footer>', re.S)
FONT_LINK = ('<link rel="preconnect" href="https://fonts.googleapis.com">'
             '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&amp;family=Inter:wght@400;500;600&amp;display=swap">'
             '<link rel="stylesheet" href="/assets/site/ledger.css">')
MARK = "<!-- ledger -->"

SECTIONS = [
    ("/exit/articles", "Exit Desk", "/exit", "Articles", "/exit/articles"),
    ("/exit/sample", "Exit Desk", "/exit", "Sample reports", "/exit/sample"),
    ("/exit", "Exit Desk", "/exit", None, None),
    ("/ma-resources", "M&A Library", "/m-and-a", "Tools & Models", "/tools-and-models"),
    ("/ma-topics", "M&A Library", "/m-and-a", None, None),
    ("/glossary", "M&A Glossary", "/glossary", None, None),
    ("/podcast", "The Mike Ye Briefing", "/podcast", None, None),
    ("/intelligence", "Decision Frameworks", "/intelligence", None, None),
    ("/about", "About", "/about", None, None),
]
NAV = [("/m-and-a", "M&A Library"), ("/tools-and-models", "Tools & Models"), ("/intelligence", "Decision Frameworks"),
       ("/podcast", "The Briefing"), ("/about", "About")]


def header(path: str) -> str:
    links = []
    for href, label in NAV:
        cur = ' aria-current="true"' if path == href or (href != "/about" and path.startswith(href + "/")) or (
            href == "/m-and-a" and path.startswith(("/ma-resources", "/ma-topics"))) else ""
        links.append(f'<a href="{href}"{cur}>{html.escape(label)}</a>')
    links.append('<a href="/exit" class="lg-cta">Work with Mike</a>')
    return (f'{MARK}<a href="#main-content" class="lg-skip">Skip to content</a>'
            f'<header class="lg-header"><div class="lg-header-in"><a href="/" class="lg-brand">'
            f'<span class="lg-brand-name">Mike Ye</span><span class="lg-brand-note">M&amp;A · Corporate Development</span></a>'
            f'<nav aria-label="Primary" class="lg-nav">{"".join(links)}</nav></div></header>')


def crumbs(path: str, title: str) -> str:
    if path == "/":
        return ""
    parts = ['<a href="/">Home</a>']
    for prefix, sec, sec_href, sub, sub_href in SECTIONS:
        if path == prefix or path.startswith(prefix + "/"):
            if path != sec_href:
                parts.append(f'<a href="{sec_href}">{html.escape(sec)}</a>')
            if sub and path != sub_href and path.startswith(prefix + "/"):
                parts.append(f'<a href="{sub_href}">{html.escape(sub)}</a>')
            break
    short = title if "{{@" in title else re.split(r"\s*[|—–]\s*", title)[0].strip()
    parts.append(f"<span>{short[:80]}</span>")
    return f'<nav aria-label="Breadcrumb" class="lg-crumbs">{"<span>/</span>".join(parts)}</nav>'


FOOTER = f'''{MARK}<footer class="lg-footer"><div class="lg-footer-in">
<div class="lg-footer-brand"><a href="/about" class="lg-brand"><span class="lg-brand-name">Mike Ye</span></a><p>M&amp;A judgment across the full deal lifecycle.</p></div>
<div class="lg-footer-col"><span>Library</span><a href="/m-and-a">M&amp;A Library</a><a href="/tools-and-models">Tools &amp; Models</a><a href="/glossary">M&amp;A Glossary</a></div>
<div class="lg-footer-col"><span>Thinking</span><a href="/intelligence">Decision Frameworks</a><a href="/podcast">The Mike Ye Briefing</a><a href="/exit/articles">Articles</a></div>
<div class="lg-footer-col"><span>Services</span><a href="/exit">Exit Desk</a><a href="/acquisition-lens">Acquisition Lens</a><a href="/exit/partners">For advisors</a></div>
<div class="lg-footer-col"><span>Contact</span><a href="mailto:mike@mikeye.com">mike@mikeye.com</a><a href="https://www.linkedin.com/in/michaelye73/">LinkedIn</a><a href="https://mcp.mikeye.com/.well-known/tool-registry.json">Machine-readable access</a></div>
<p class="lg-footer-legal">Educational resources and decision frameworks. Transaction-specific conclusions require appropriate professional review.</p>
</div></footer>'''


def restyle_css(text: str) -> str:
    def color(m: re.Match) -> str:
        c = m.group(0).upper()
        return COLORS.get(c, m.group(0))
    text = re.sub(r"#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b", color, text)
    for rx, rep in FONT_RULES:
        text = rx.sub(rep, text)
    text = re.sub(r"('Newsreader', )+'Newsreader'", "'Newsreader'", text)
    text = re.sub(r"('Inter', )+'Inter'", "'Inter'", text)
    return text


LD = re.compile(r"<script[^>]*application/ld\+json[^>]*>.*?</script>", re.S)
ACCENT_ON_INK = "#A9C1E0"  # the accent as it reads on ink sections (8.8:1)
RULE = re.compile(r"([^{}]+)\{([^{}]*)\}")


def dark_accent_css(page_css: str, base_css: str) -> str:
    """Rules that keep the accent visible inside ink-coloured sections.

    For every container painted ink and every selector coloured accent, emit
    `container selector {color: light accent}` so kickers, labels and links inside
    dark sections don't vanish. Buttons (ink fills with light text) are skipped."""
    dark, accent = [], []
    for css in (base_css, page_css):
        css = re.sub(r"@(media|supports)[^{]*\{", "", css)  # flatten nested blocks
        for m in RULE.finditer(css):
            selectors = [x.strip() for x in m.group(1).split(",")]
            body = m.group(2)
            if re.search(r"background(?:-color)?\s*:\s*#1C1B18", body, re.I):
                for sel in selectors:
                    if ":" in sel or re.search(r"btn|button|submit|-fill|::", sel, re.I) or sel.startswith("/*"):
                        continue
                    dark.append(sel)
            if re.search(r"(?<![-\w])color\s*:\s*#1F3A5F", body, re.I):
                for sel in selectors:
                    if ":" not in sel and not sel.startswith("/*"):
                        accent.append(sel)
    dark = list(dict.fromkeys(dark)); accent = list(dict.fromkeys(accent))
    if not dark or not accent:
        return ""
    rules = [f"{d} {a}{{color:{ACCENT_ON_INK}}}" for d in dark for a in accent]
    rules += [f"{d} a:hover{{color:{ACCENT_ON_INK}}}" for d in dark]
    return "<style id=\"lg-dark\">" + "".join(rules) + "</style>"
STYLE = re.compile(r"<style[^>]*>.*?</style>", re.S)
INLINE = re.compile(r'style="([^"]*)"')


def restyle_page(text: str) -> str:
    """Restyle CSS without touching structured-data blocks."""
    out, pos = [], 0
    for m in LD.finditer(text):
        out.append(_restyle_markup(text[pos:m.start()]))
        out.append(m.group(0))
        pos = m.end()
    out.append(_restyle_markup(text[pos:]))
    return "".join(out)


def _restyle_markup(chunk: str) -> str:
    chunk = STYLE.sub(lambda m: restyle_css(m.group(0)), chunk)
    chunk = INLINE.sub(lambda m: 'style="' + restyle_css(m.group(1)) + '"', chunk)
    return chunk


OLD_HEADER = re.compile(r'<header class="my1-header">.*?</header>', re.S)
OLD_FOOTER = re.compile(r'<footer class="my1-footer">.*?</footer>', re.S)
OLD_SKIP = re.compile(r'<a href="#main-content" class="my1-skip">[^<]*</a>')
LG_HEADER = re.compile(re.escape(MARK) + r'<a href="#main-content" class="lg-skip">.*?</header>(<nav aria-label="Breadcrumb" class="lg-crumbs">.*?</nav>)?', re.S)
LG_FOOTER = re.compile(re.escape(MARK) + r'<footer class="lg-footer">.*?</footer>', re.S)


def frame(text: str, path: str) -> str:
    # Breadcrumb label: the page's main heading, else its title.
    h1 = re.search(r"<h1\b[^>]*>(.*?)</h1>", text, re.S)
    title = re.sub(r"<[^>]+>", "", h1.group(1)).strip() if h1 else (
        re.search(r"<title>(.*?)</title>", text, re.S).group(1) if re.search(r"<title>", text) else "")
    # strip any earlier application, then the old Webflow frame
    text = LG_HEADER.sub("", text)
    text = LG_FOOTER.sub("", text)
    text = OLD_HEADER.sub("", text)
    text = OLD_FOOTER.sub("", text)
    text = OLD_SKIP.sub("", text)
    text = OLD_SECTION_FOOTERS.sub("", text)
    # The main stylesheet was recolored, so its integrity fingerprint no longer matches: drop it.
    text = re.sub(r'(<link href="/assets/webflow/css/[^"]+"[^>]*?) integrity="[^"]*"( crossorigin="anonymous")?', r"\1", text)
    # fonts + stylesheet, once, at the end of <head>
    if "/assets/site/ledger.css" not in text:
        text = text.replace("</head>", FONT_LINK + "</head>", 1)
    # accent visibility inside dark sections (page-specific, regenerated each run)
    text = re.sub(r'<style id="lg-dark">.*?</style>', "", text, flags=re.S)
    page_css = "\n".join(m.group(0) for m in STYLE.finditer(text))
    dark = dark_accent_css(page_css, WEBFLOW_CSS.read_text("utf-8"))
    if dark:
        text = text.replace("</body>", dark + "</body>", 1)
    # header right after <body>
    body = re.search(r"<body[^>]*>", text)
    insert_at = body.end()
    text = text[:insert_at] + header(path) + crumbs(path, title) + text[insert_at:]
    # footer before the trailing scripts
    tail = re.search(r'<script src="/assets/(site/forms\.js|webflow/js/jquery)', text)
    at = tail.start() if tail else text.rfind("</body>")
    text = text[:at] + FOOTER + text[at:]
    # the page's main landmark for the skip link
    if 'id="main-content"' not in text:
        text = re.sub(r"(<main\b)(?![^>]*\bid=)", r'\1 id="main-content"', text, count=1)
    return text


def main():
    check = "--check" in sys.argv
    changed = []
    css = WEBFLOW_CSS.read_text("utf-8")
    new_css = restyle_css(css)
    if new_css != css:
        changed.append(str(WEBFLOW_CSS.relative_to(ROOT)))
        if not check:
            WEBFLOW_CSS.write_text(new_css, "utf-8")
    # Pages generated from site-src entries are owned by build.py (their templates carry the frame).
    generated = []
    for cf in (ROOT / "site-src" / "content").glob("*.json"):
        generated.append(json.loads(cf.read_text("utf-8"))["path"].rstrip("/") + "/")
    for f in sorted(SITE.rglob("index.html")):
        rel = f.parent.relative_to(SITE)
        path = "/" if str(rel) == "." else "/" + str(rel).replace("\\", "/")
        if any(path.startswith(g) for g in generated):
            continue
        text = f.read_text("utf-8")
        ld_before = LD.findall(text)
        new = frame(restyle_page(text), path)
        assert LD.findall(new) == ld_before, f"structured data changed on {path}"
        if new != text:
            changed.append(str(f.relative_to(ROOT)))
            if not check:
                f.write_text(new, "utf-8")
    print(f"{'would change' if check else 'updated'} {len(changed)} file(s)")
    if check and changed:
        sys.exit(1)


if __name__ == "__main__":
    main()
