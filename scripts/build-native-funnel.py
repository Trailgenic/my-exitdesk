"""Convert the saved working funnel into native Webflow markup and hosted JS."""
from pathlib import Path
import re
from bs4 import BeautifulSoup, Comment

root = Path(__file__).resolve().parents[1]
out = root / 'site-foundation/native-funnel'
out.mkdir(exist_ok=True)
public = root / 'public'
shared_header = (root / 'site-foundation/header.html').read_text()
shared_footer = (root / 'site-foundation/footer.html').read_text()
all_css = []

def native_css(css):
    """Keep editable class rules; the companion stylesheet preserves complex selectors."""
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    result = []
    pos = 0
    while pos < len(css):
        start = css.find('{', pos)
        if start < 0: break
        selector = css[pos:start].strip()
        end, depth = start + 1, 1
        while depth:
            if css[end] == '{': depth += 1
            elif css[end] == '}': depth -= 1
            end += 1
        body = css[start+1:end-1]
        if selector.startswith('@media'):
            result.append(selector+'{'+native_css(body)+'}')
        else:
            for part in selector.split(','):
                if re.fullmatch(r'\.[\w-]+', part.strip()):
                    result.append(part.strip()+'{'+body+'}')
        pos = end
    return '\n'.join(result)

for name, prefix, source in [
    ('overview', 'ed', 'exit-production-embed.html'),
    ('score', 'es', 'exit-score-production-embed.html'),
    ('checkout', 'ec', 'exit-checkout-production-embed.html')
]:
    soup = BeautifulSoup((root / 'site-foundation/launch' / source).read_text(), 'html.parser')
    css = '\n'.join(x.get_text() for x in soup.find_all('style'))
    css = re.sub(r'@import\s+url\([^)]*\)\s*;', '', css)
    css = css.replace("'EB Garamond', Georgia, serif", 'Georgia, serif').replace("'EB Garamond', serif", 'Georgia, serif').replace("'DM Mono', monospace", "'Courier New', monospace")
    css = re.sub(r'@media \(max-width: (?:700|580)px\)', '@media screen and (max-width: 767px)', css)
    # The shared header supplies the wide site frame; forms retain reading widths.
    css += f'\n.{prefix}-root {{ padding-top:48px; padding-right:0; padding-left:0; max-width:780px; width:100%; }}\n'
    css += f'\n@media screen and (max-width: 767px) {{ .{prefix}-root {{ padding-top:32px; }} }}\n'
    all_css.append(css)
    (out / f'{name}.css').write_text(css)
    (out / f'{name}-native.css').write_text(native_css(css))
    main = soup.select_one('.' + prefix + '-root')
    main.name = 'main'
    main['id'] = 'main-content'
    main['tabindex'] = '-1'
    main['data-native-funnel'] = name
    for comment in main.find_all(string=lambda x: isinstance(x, Comment)):
        comment.extract()
    # Real buttons support keyboard activation; events are attached in the hosted script.
    for option in main.select('.es-option'):
        option.name = 'button'
        option['type'] = 'button'
        option['aria-pressed'] = 'false'
    for element in main.select('[onclick]'):
        value = element.attrs.pop('onclick')
        match = re.fullmatch(r'(\w+)\((.*?)\)', value)
        element['data-funnel-action'] = match[1]
        arg = match[2].strip("'\"")
        if arg and arg != 'this': element['data-funnel-argument'] = arg
    for button in main.find_all('button'):
        button['type'] = 'button'
    for q in main.select('.es-question'):
        q['role'] = 'group'
        title = q.select_one('.es-q-text')
        title['id'] = q['id'] + '-title'
        q['aria-labelledby'] = title['id']
        title['tabindex'] = '-1'
    for field in main.select('input[type="email"]'):
        field['aria-label'] = 'Email address'
        field['autocomplete'] = 'email'
        field['name'] = 'email'
        row = field.parent
        row.name = 'form'
        row['action'] = '#'
        row['data-score-email'] = field['id'].split('-')[-1]
    for notice in main.select('.es-email-confirm, .ec-error, .ec-loading'):
        notice['role'] = 'status'
        notice['aria-live'] = 'polite'
    for title in main.select('.ed-thesis-headline, .ed-case-title, .ed-path-title'):
        title.name = 'h2' if 'ed-thesis-headline' in title.get('class', []) else 'h3'
    if name in ['score','checkout']:
        note = soup.new_tag('p', attrs={'class':'funnel-runtime-notice','id':'funnel-runtime-notice','role':'status'})
        note.string = 'Loading the '+('assessment' if name == 'score' else 'secure checkout')+'… If it does not load, refresh this page.'
        main.insert(0,note)
    if name == 'checkout':
        # A payment cannot start before the script has resolved its displayed tier.
        main.select_one('#ec-pay-btn')['disabled'] = ''
    html = '<div class="my1-root"><a class="my1-skip" href="#main-content">Skip to content</a>'+shared_header+str(main)+shared_footer+'</div>'
    assert '<script' not in html and '<style' not in html and 'onclick=' not in html
    (out / f'{name}.html').write_text(html)
    inline = '\n'.join(s.get_text() for s in soup.find_all('script') if not s.get('src'))
    if not inline: continue
    if name == 'score':
        inline = (public/'exit-score-content.js').read_text()+'\n'+inline
        inline = inline.replace("o.classList.remove('selected');", "o.classList.remove('selected'); o.setAttribute('aria-pressed','false');")
        inline = inline.replace("el.classList.add('selected');", "el.classList.add('selected'); el.setAttribute('aria-pressed','true');")
        inline = inline.replace("document.getElementById('es-q' + currentQ).classList.add('active');", "document.getElementById('es-q' + currentQ).classList.add('active'); document.getElementById('es-q' + currentQ + '-title').focus();")
        inline = inline.replace("document.getElementById('es-score-display').textContent = total;", "document.getElementById('es-score-display').textContent = total; document.getElementById('main-content').focus();")
        inline = inline.replace("\nif (total >= 40) {", "\ndocument.getElementById('es-path-high').style.display = 'none'; document.getElementById('es-path-low').style.display = 'none';\nif (total >= 40) {")
    if name == 'checkout':
        inline = inline.replace("if (score) {", "if (score !== null && Number.isFinite(Number(score)) && Number(score) >= 0 && Number(score) <= 100) {")
        inline = inline.replace(".then(function(r) { return r.json(); })", ".then(function(r) { if (!r.ok) throw new Error('Checkout unavailable'); return r.json(); })")
        inline += "\ndocument.getElementById('ec-pay-btn').disabled = false;\n"
    bind = """
var root = document.querySelector('[data-native-funnel]');
root.addEventListener('submit', function(event) {
  var form = event.target.closest('[data-score-email]');
  if (!form) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  window.saveScore(form.dataset.scoreEmail);
}, true);
root.addEventListener('click', function(event) {
  var button = event.target.closest('[data-funnel-action]');
  if (!button || !root.contains(button) || button.disabled) return;
  var action = button.dataset.funnelAction;
  var arg = button.dataset.funnelArgument;
  if (action === 'selectOption') window.selectOption(button);
  else if (action === 'nextQ') window.nextQ(Number(arg));
  else if (action === 'prevQ') window.prevQ(Number(arg));
  else if (action === 'showResults') window.showResults();
  else if (action === 'saveScore') window.saveScore(arg);
  else if (action === 'startCheckout') window.startCheckout();
});
var notice = document.getElementById('funnel-runtime-notice');
if (notice) notice.remove();
root.dataset.runtimeReady = 'true';
"""
    upgrade = """
root.querySelectorAll('[data-funnel-action]').forEach(function(control) {
  if (control.tagName === 'BUTTON') return;
  var button = document.createElement('button');
  Array.from(control.attributes).forEach(function(attr) {
    if (attr.name !== 'href') button.setAttribute(attr.name, attr.value);
  });
  button.type = 'button';
  while (control.firstChild) button.appendChild(control.firstChild);
  control.replaceWith(button);
});
root.querySelectorAll('[data-funnel-action="nextQ"], [data-funnel-action="showResults"]').forEach(function(button) {
  button.disabled = true;
});
"""
    version = '1.0.2' if name == 'score' else '1.0.1'
    wrapped = '/* Mike Ye | Native Exit Desk runtime v'+version+'. */\n'+"(function(){ function boot(){ var root=document.querySelector('[data-native-funnel=\""+name+"\"]'); if(!root || root.dataset.runtimeReady==='true')return;\n"+upgrade+inline+'\n'+bind+"\n} if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',boot,{once:true});}else{boot();} })();\n"
    (public / f'exit-{name}-native-v1.js').write_text(wrapped)

extra = '''
.es-option { width:100%; text-align:left; font-family:Georgia,serif; }
.es-option:focus-visible, .es-btn:focus-visible, .ec-cta-btn:focus-visible { outline:2px solid #826b3f; outline-offset:3px; }
.ed-section-label, .es-section-label { white-space:normal; }
.ed-thesis-headline, .ed-case-title, .ed-path-title { margin-top:0; }
.ed-root *, .es-root *, .ec-root * { box-sizing:border-box; }
.funnel-runtime-notice { font-family:Georgia,serif; font-size:16px; line-height:1.6; }
.es-meta-item span { margin-left:0.5em; }
[data-score-email] { display:flex; flex-wrap:wrap; gap:8px; width:100%; }
[data-score-email] input { flex:1; min-width:180px; }
@media screen and (max-width: 767px) {
 .ed-thesis-grid { grid-template-columns:1fr !important; }
 .es-dim-row { grid-template-columns:110px minmax(0,1fr) 28px; }
 .es-radar-wrap, .es-delta-block, .es-email-block, .es-finding, .es-dim-block { padding:20px; }
 .es-cta-btn, .ec-cta-btn { max-width:100%; white-space:normal; }
 .es-cta-credential { line-height:1.6; }
}
'''
(out/'shared.css').write_text('\n'.join(all_css)+extra)
(public/'exit-funnel-native-v1.css').write_text('\n'.join(all_css)+extra)
print('Built three native layouts, shared styles, and two versioned runtimes.')
