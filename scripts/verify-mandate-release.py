"""Verify the published acquisition mandate phase without modifying remote content."""
import concurrent.futures, datetime, hashlib, html, json, re, subprocess, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'site-foundation/mandate-release/production-audit.json'
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
    'https://mikeye.com/ma-resources/acquisition-mandate-target-screen',
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
resource_url = next(r['url'] for r in inventory['resources'] if r['id']=='acquisition-mandate-target-screen')
resource_html = by_url[resource_url]['body'].decode()
for label,markup in [('M&A Library',library_html),('Tools & Models',by_url['https://www.mikeye.com/tools-and-models']['body'].decode())]:
    check(label+' links mandate guide',resource_url in markup or '/ma-resources/acquisition-mandate-target-screen' in markup)
check('Mandate sitemap inclusion',resource_url in by_url['https://www.mikeye.com/sitemap.xml']['body'].decode())
for rid in ['deal-workflow','workflow-diligence','synergy-value-bridge','loi-economics-risk-allocator']:
    u=next(r['url'] for r in inventory['resources'] if r['id']==rid)
    check('Reciprocal guide link: '+rid,'/ma-resources/acquisition-mandate-target-screen' in by_url[u]['body'].decode() and u.replace('https://www.mikeye.com','') in resource_html)
visible = html.unescape(re.sub('<[^>]+>',' ',re.sub(r'<script\b.*?</script>','',resource_html,flags=re.S)))
check('No public production notes',not re.search(r'AI.generated|unvalidated|source register|editorial.review|source IDs',visible,re.I))
check('Methodology workbook link',inventory['resources'][next(i for i,r in enumerate(inventory['resources']) if r['id']=='acquisition-mandate-target-screen')]['download']['url'] in resource_html)
def graph_nodes(markup):
    result=[]
    for raw in re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',markup,re.S):
        obj=json.loads(raw);result.extend(obj.get('@graph',[obj]))
    return result
resource_nodes=graph_nodes(resource_html)
resource_node=next((n for n in resource_nodes if n.get('@id')==resource_url+'#resource'),{})
mandate_record=next(r for r in inventory['resources'] if r['id']=='acquisition-mandate-target-screen')
check('Resource is CreativeWork and LearningResource',all(t in resource_node.get('@type',[]) for t in ['CreativeWork','LearningResource']))
encoding = resource_node.get('encoding', {})
check('MediaObject matches verified workbook',
      encoding.get('@type') == 'MediaObject'
      and encoding.get('contentUrl') == mandate_record['download']['url']
      and encoding.get('name') == mandate_record['download']['url'].rsplit('/', 1)[-1]
      and encoding.get('encodingFormat') == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      and ('contentSize' not in encoding or encoding['contentSize'] == str(mandate_record['download']['bytes'])+' bytes'))
check('Resource breadcrumbs include canonical guide',any(n.get('@type')=='BreadcrumbList' and any(x.get('item')==resource_url for x in n.get('itemListElement',[])) for n in resource_nodes))
for url,suffix,count in [('https://www.mikeye.com/m-and-a','#resources',17),('https://www.mikeye.com/tools-and-models','#tools',12)]:
    nodes=graph_nodes(by_url[url]['body'].decode());node=next((n for n in nodes if n.get('@id')==url+suffix),{})
    check('Resource ItemList count: '+url,node.get('numberOfItems')==count and len(node.get('itemListElement',[]))==count)
    ids={n.get('@id') for n in nodes}
    check('Resource ItemList references resolve: '+url,all(x.get('item',{}).get('@id') in ids for x in node.get('itemListElement',[])))
for stage in inventory['transactionPath']['stages']:
    stage_block=library_html.split('id="stage-'+stage['id']+'"',1)[-1].split('id="stage-',1)[0]
    check('Native stage resource: '+stage['name'], 'id="stage-'+stage['id']+'"' in library_html and stage['url'] in stage_block)

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
audit={'verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'checks':checks,'pages':pages,'downloads':downloads,'passed':sum(c['passed'] for c in checks),'failed':sum(not c['passed'] for c in checks),'visualQA':{'desktop':'Production mandate guide and transaction path inspected in browser. Staged Tools & Models card visually reviewed, with its live link verified by HTTP. All workbook tabs rendered and inspected.','responsive':'Existing native templates and responsive card classes retained. Desktop views showed no horizontal overflow. A separate mobile browser viewport was unavailable.','excelEngine':'See workbook-qa.json for calculation and scenario checks using artifact-tool. Desktop Excel was unavailable.'}}
OUT.write_text(json.dumps(audit,indent=2)+'\n')
print(json.dumps({k:audit[k] for k in ['verifiedAt','passed','failed']}))
for c in checks:
    if not c['passed']:print(json.dumps(c))
raise SystemExit(bool(audit['failed']))
