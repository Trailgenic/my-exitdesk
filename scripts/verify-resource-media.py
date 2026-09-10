"""Check the rendered media bindings on every affected CMS resource page."""
import concurrent.futures, datetime, json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
host = sys.argv[1] if len(sys.argv) > 1 else 'https://www.mikeye.com'
config = json.loads((ROOT / 'site-foundation/loi-release/resource-template-media.json').read_text())

def verify(item):
    url = host + '/ma-resources/' + item['slug']
    r = subprocess.run(['curl', '-fsSL', '--max-time', '30', url], capture_output=True, text=True)
    try:
        schemas = [json.loads(raw) for raw in re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', r.stdout, re.S)]
        nodes = [n for s in schemas for n in s.get('@graph', [s])]
        node = next(n for n in nodes if n.get('@id', '').endswith('/'+item['slug']+'#resource'))
        media = node.get('encoding', {})
        f = item['fieldData']
        valid = r.returncode == 0 and media == {
            '@type': 'MediaObject', 'contentUrl': f['schema-media-url'],
            'name': f['schema-media-name'], 'encodingFormat': f['schema-media-format']}
        return {'url': url, 'passed': valid, 'media': media}
    except (ValueError, StopIteration, AttributeError) as e:
        return {'url': url, 'passed': False, 'error': str(e) or r.stderr or 'Resource schema missing'}

with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    results = list(pool.map(verify, config['items']))
audit = {'verifiedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
         'host': host, 'checks': results, 'passed': sum(r['passed'] for r in results),
         'failed': sum(not r['passed'] for r in results)}
suffix = 'staging' if 'webflow.io' in host else 'production'
(ROOT / ('site-foundation/loi-release/media-audit-'+suffix+'.json')).write_text(json.dumps(audit, indent=2)+'\n')
print(json.dumps({k: audit[k] for k in ['host', 'passed', 'failed']}))
for result in results:
    if not result['passed']: print(json.dumps(result))
raise SystemExit(bool(audit['failed']))
