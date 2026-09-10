import fs from 'node:fs';
const base='site-foundation',dir=base+'/public-comps-release',id='public-company-comps-workbench';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8')),write=(p,x)=>fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');
const b=read(base+'/editorial/'+id+'.json'),old=b.download.url;
b.version='1.1';b.summary="Review 254 public companies across 12 sectors, with Capital IQ financials, trading multiples, peer-group summary statistics and comparability notes.";
b.sections=read(dir+'/populated-sections.json');b.download={filename:'CapitalIQ-Public-Comps-12-Sectors.xlsx',url:'https://cdn.prod.website-files.com/69499e76d9c11f22288abc28/6aa237da499a6768b19b5e74_CapitalIQ-Public-Comps-12-Sectors.xlsx',version:'1.1',bytes:158149,sha256:'f328be5a962ef87a4ed52d3d08f25016e7b17f239cb4175e8f2e9debc8b92cd6',sheets:['Read_Me','Trading_Comps','Peer_Group_Summary','Exclusions_Review','Sources'],downloadVerified:true,verifiedAt:'2026-09-10',pricingDate:'2026-09-08',extractionDate:'2026-09-10',companyCount:254,sectorCount:12};
write(base+'/editorial/'+id+'.json',b);
const desc=b.summary;const update=r=>{r.summary=desc;r.version='1.1';r.download=b.download;return r;};
for(const path of ['public/datasets/ma-library.json',base+'/launch/ma-library.json','../mikeye-workers/datasets/ma-library.json']){const x=read(path);update(x.resources.find(r=>r.id===id));x.version='2.6.1';write(path,x);}
const man=read(base+'/content-manifest.json');update(man.resources.find(r=>r.id===id));man.version='2.6.1';man.publication.status='published-correction-verification-in-progress';write(base+'/content-manifest.json',man);
const resources=read(base+'/launch/publication-resources.json');update(resources.find(r=>r.id===id));write(base+'/launch/publication-resources.json',resources);
function graph(x){for(const n of x['@graph']||[]){if(n['@id']===b.url+'#resource'){n.description=desc;n.version='1.1';if(n.learningResourceType)n.learningResourceType='Populated public-company trading comps workbook';n.encoding={...n.encoding,name:b.download.filename,contentUrl:b.download.url,contentSize:b.download.bytes+' bytes'};}if(n['@id']===b.url+'#webpage')n.description=desc;}return x;}
for(const path of ['public/ontology.json',base+'/launch/ontology.json','../mikeye-workers/datasets/ontology.json',dir+'/resource-schema.json'])write(path,graph(read(path)));
const pages=read(dir+'/populated-schema-before.json');for(const p of pages)graph(p.jsonLdSchema);write(dir+'/page-schema-updates.json',pages.map(p=>({id:p.id,jsonLdSchema:p.jsonLdSchema})));
fs.writeFileSync(dir+'/methodology.html',b.sections.map(s=>`<h2>${s.heading}</h2>${s.html}`).join('\n'));
for(const path of ['public/llms.txt',base+'/launch/llms.txt','../mikeye-workers/lib/library-guide.js']){let s=fs.readFileSync(path,'utf8');s=s.replace('Build public-company peer groups across 12 sectors, normalize EBITDA, review exclusions and outliers, and translate selected trading multiples into an implied valuation range. Includes a formula-driven Excel download.',desc+' Includes the populated, dated Excel snapshot.');fs.writeFileSync(path,s);}
console.log(JSON.stringify({id,download:b.download,oldUrl:old}));
