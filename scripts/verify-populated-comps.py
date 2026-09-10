import concurrent.futures,hashlib,json,re,subprocess,tempfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
b=json.loads((root/'site-foundation/editorial/public-company-comps-workbench.json').read_text());checks=[]
def get(u):
 with tempfile.NamedTemporaryFile() as f:
  r=subprocess.run(['curl','-fsSL','--max-time','30',u,'-o',f.name],capture_output=True)
  return u,r.returncode,Path(f.name).read_bytes()
urls=[b['url'],b['url'].replace('www.mikeye.com','mikeye.com'),'https://www.mikeye.com/m-and-a','https://www.mikeye.com/tools-and-models',b['download']['url'],'https://mcp.mikeye.com/datasets/ma-library.json','https://my-exitdesk.vercel.app/datasets/ma-library.json']
with concurrent.futures.ThreadPoolExecutor(max_workers=7) as p: results=list(p.map(get,urls))
for u,code,data in results:
 checks.append({'check':'URL loads: '+u,'passed':code==0})
 if u==b['download']['url']:checks.append({'check':'Populated download SHA256 and size','passed':hashlib.sha256(data).hexdigest()==b['download']['sha256'] and len(data)==b['download']['bytes']});continue
 if '/datasets/' in u:
  inv=json.loads(data);r=next(x for x in inv['resources'] if x['id']==b['id']);checks.append({'check':'Populated inventory metadata: '+u,'passed':r['download']==b['download'] and r['summary']==b['summary']});continue
 html=data.decode()
 if '/ma-resources/' in u:checks.append({'check':'Guide has populated link and no blank template download: '+u,'passed':b['download']['url'] in html and 'a10eafcef6e045b4bc275073cf5053997ba92005' not in html and '254' in html})
 else:checks.append({'check':'Index links populated workbench: '+u,'passed':'public-company-comps-workbench' in html and b['download']['url'] in html})
 schemas=[json.loads(x) for x in re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',html,re.S)];nodes=[n for x in schemas for n in x.get('@graph',[x])];n=next(x for x in nodes if x.get('@id')==b['url']+'#resource');checks.append({'check':'MediaObject uses populated workbook: '+u,'passed':n['encoding']['contentUrl']==b['download']['url'] and n['encoding']['name']==b['download']['filename']})
report={'passed':sum(c['passed'] for c in checks),'failed':sum(not c['passed'] for c in checks),'checks':checks};(root/'site-foundation/public-comps-release/populated-audit.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report));assert not report['failed']
