"""Record exact public download bytes, hashes and workbook tabs from the CMS export."""
import concurrent.futures, hashlib, io, json, re, urllib.request, zipfile
from pathlib import Path
from urllib.parse import unquote, urlparse
from xml.etree import ElementTree as ET

ROOT=Path(__file__).resolve().parents[1]
source=json.loads((ROOT/'site-foundation/catalogue/cms.json').read_text())
def inspect(item):
    f=item['fieldData'];url=f.get('download-url')
    if not url:return None
    req=urllib.request.Request(url,headers={'User-Agent':'MikeYe-Catalogue-Verification/1.0'})
    with urllib.request.urlopen(req,timeout=45) as response:
        data=response.read();status=response.status
    name=re.sub(r'^[a-f0-9]{24}_','',unquote(urlparse(url).path.rsplit('/',1)[-1]))
    entry={'url':url,'filename':name,'version':f.get('version'),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'downloadVerified':status==200,'verifiedAt':'2026-09-10'}
    if name.endswith('.xlsx'):
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            assert z.testzip() is None
            doc=ET.fromstring(z.read('xl/workbook.xml'))
            entry['sheets']=[s.attrib['name'] for s in doc.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}sheet')]
    return url,entry
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    entries=[e for e in pool.map(inspect,source['resources']) if e]
(ROOT/'site-foundation/catalogue/downloads.json').write_text(json.dumps(dict(entries),indent=2)+'\n')
print(json.dumps({'downloads':len(entries),'workbooks':sum('sheets' in e for _,e in entries)}))
