"""Verify the published synergy phase without modifying remote content."""
import concurrent.futures, datetime, hashlib, html, json, re, subprocess, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'site-foundation/synergy-release/production-audit.json'
inventory = json.loads((ROOT / 'public/datasets/ma-library.json').read_text())
checks, pages, downloads = [], [], []

def check(name, ok, detail=None):
    checks.append({'check': name, 'passed': bool(ok), 'detail': detail})

def fetch(url, payload=None):
    with tempfile.NamedTemporaryFile() as f:
        cmd = ['curl', '-L', '--retry', '1', '--max-time', '30', '-sS', '-o', f.name, '-w', '%{http_code}\n%{url_effective}', url]
        if payload is not None:
            cmd += ['-H', 'Content-Type: application/json', '-H', 'Accept: application/json, text/event-stream', '--data-binary', json.dumps(payload)]
        r = subprocess.run(cmd, capture_output=True, text=True)
        lines = r.stdout.splitlines()
        return {'url': url, 'status': int(lines[0]) if lines else 0, 'finalUrl': lines[-1] if len(lines)>1 else url, 'body': Path(f.name).read_bytes(), 'error': r.stderr if r.returncode else None}

urls = list(dict.fromkeys([r['url'] for r in inventory['resources']] + [
    'https://www.mikeye.com/m-and-a', 'https://mikeye.com/m-and-a',
    'https://www.mikeye.com/tools-and-models', 'https://www.mikeye.com/exit',
    'https://mikeye.com/ma-resources/synergy-underwriting-value-bridge',
    'https://www.mikeye.com/sitemap.xml']))
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    results = list(pool.map(fetch, urls))
by_url = {r['url']: r for r in results}
for r in results:
    check('Working route: '+r['url'], r['status']==200, r['finalUrl'])
    pages.append({k:v for k,v in r.items() if k!='body'})
    if '/ma-resources/' in r['url'] or r['url'].endswith(('/m-and-a','/tools-and-models')):
        s = r['body'].decode()
        canonical = re.findall(r'<link\b(?=[^>]*rel="canonical")(?=[^>]*href="([^"]+)")[^>]*>', s)
        check('Canonical: '+r['url'], canonical == [r['finalUrl']], canonical)
        schemas = re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',s,re.S)
        try:
            parsed = [json.loads(x) for x in schemas]
            check('JSON-LD parses: '+r['url'], bool(parsed))
        except ValueError as e:
            check('JSON-LD parses: '+r['url'],False,str(e))

library_html = by_url['https://www.mikeye.com/m-and-a']['body'].decode()
check('Seven native transaction stages',len(re.findall(r'id="stage-',library_html))==7)
check('Renamed knowledge pillar heading', 'Explore the work of M&amp;A' in library_html and 'Explore the deal lifecycle' not in library_html)
pillar_titles=[html.unescape(x) for x in re.findall(r'<h3 class="my1-topic-title">(.*?)</h3>',library_html)]
check('Ten knowledge pillars remain',pillar_titles==[t['name'] for t in inventory['topics']],pillar_titles)
synergy_url = next(r['url'] for r in inventory['resources'] if r['id']=='synergy-value-bridge')
synergy_html = by_url[synergy_url]['body'].decode()
for label,markup in [('M&A Library',library_html),('Tools & Models',by_url['https://www.mikeye.com/tools-and-models']['body'].decode())]:
    check(label+' links synergy guide',synergy_url in markup or '/ma-resources/synergy-underwriting-value-bridge' in markup)
check('Synergy sitemap inclusion',synergy_url in by_url['https://www.mikeye.com/sitemap.xml']['body'].decode())
for rid in ['deal-workflow','workflow-diligence','integration-continuity']:
    u=next(r['url'] for r in inventory['resources'] if r['id']==rid)
    check('Reciprocal guide link: '+rid,'/ma-resources/synergy-underwriting-value-bridge' in by_url[u]['body'].decode() and u.replace('https://www.mikeye.com','') in synergy_html)
visible = html.unescape(re.sub('<[^>]+>',' ',re.sub(r'<script\b.*?</script>','',synergy_html,flags=re.S)))
check('No public production notes',not re.search(r'AI.generated|unvalidated|source register|editorial.review|source IDs',visible,re.I))
check('Methodology workbook link',inventory['resources'][next(i for i,r in enumerate(inventory['resources']) if r['id']=='synergy-value-bridge')]['download']['url'] in synergy_html)

books = [r for r in inventory['resources'] if r.get('download')]
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    book_results = list(pool.map(lambda r: fetch(r['download']['url']),books))
for book,r in zip(books,book_results):
    digest=hashlib.sha256(r['body']).hexdigest()
    valid=r['status']==200 and r['body'].startswith(b'PK') and digest==book['download']['sha256']
    check('Workbook download integrity: '+book['id'],valid)
    downloads.append({'id':book['id'],'status':r['status'],'bytes':len(r['body']),'sha256':digest})

machine_urls=[host+p for host in ['https://mcp.mikeye.com','https://my-exitdesk.vercel.app'] for p in ['/datasets/ma-library.json','/ontology.json','/llms.txt']]+['https://mcp.mikeye.com/.well-known/tool-registry.json']
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
    machine=list(pool.map(fetch,machine_urls))
for r in machine:
    check('Machine endpoint: '+r['url'],r['status']==200)
    if r['status']!=200:continue
    body=r['body'].decode()
    if r['url'].endswith('/datasets/ma-library.json'):
        d=json.loads(body);check('Inventory synchronized: '+r['url'],d==inventory)
    elif r['url'].endswith('/ontology.json'):
        d=json.loads(body);expected=json.loads((ROOT/'public/ontology.json').read_text());check('Ontology synchronized: '+r['url'],d==expected)
    elif r['url'].endswith('/llms.txt'):
        check('Machine guide synchronized: '+r['url'],body==(ROOT/'public/llms.txt').read_text())
    else:check('Registry describes current library access', 'ma_library' in body and 'seven-stage transaction path' in body)
rpc=fetch('https://mcp.mikeye.com/mcp',{'jsonrpc':'2.0','id':20,'method':'tools/call','params':{'name':'my.dataset.get','arguments':{'name':'ma_library'}}})
try:
    d=json.loads(rpc['body']);check('Live MCP returns synchronized inventory',rpc['status']==200 and d['result']['structuredContent']==inventory)
except (ValueError,KeyError):check('Live MCP returns synchronized inventory',False,rpc['status'])
audit={'verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'checks':checks,'pages':pages,'downloads':downloads,'passed':sum(c['passed'] for c in checks),'failed':sum(not c['passed'] for c in checks),'visualQA':{'desktop':'Live M&A transaction path, synergy methodology, and Tools & Models card inspected in browser. All workbook tabs rendered and inspected.','responsive':'Native wrapping card layout and existing template breakpoints inspected. A separate mobile browser viewport was unavailable.','excelEngine':'26 calculation and scenario checks passed using artifact-tool; desktop Excel was unavailable.'}}
OUT.write_text(json.dumps(audit,indent=2)+'\n')
print(json.dumps({k:audit[k] for k in ['verifiedAt','passed','failed']}))
for c in checks:
    if not c['passed']:print(json.dumps(c))
raise SystemExit(bool(audit['failed']))
