import fs from 'node:fs';
import crypto from 'node:crypto';
import { libraryGuide } from '../../mikeye-workers/lib/library-guide.js';

const ROOT='site-foundation', OUT=ROOT+'/public-comps-release', WORKER='../mikeye-workers', SITE='https://www.mikeye.com';
const ID='public-company-comps-workbench';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');
const commit=process.argv[2];
if(!/^[a-f0-9]{40}$/.test(commit||''))throw Error('Pass the verified workbook asset commit.');
const published=process.argv.includes('--published');
const book=read(`${ROOT}/editorial/${ID}.json`);
if(book.version!=='1.0')throw Error('The blank-template release is superseded. Use the populated-comps publication workflow.');
const filename='MikeYe-Public-Company-Comps-Workbench-v1.0.xlsx';
const repositoryPath='public/resources/'+filename;
const bytes=fs.readFileSync(repositoryPath);
book.download={filename,repositoryPath,url:`https://raw.githubusercontent.com/Trailgenic/my-exitdesk/${commit}/${repositoryPath}`,version:'1.0',bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),sheets:['Dashboard','Controls','Peer data','Guide'],downloadVerified:true,verifiedAt:'2026-09-10'};
book.status=published?'published':'ready-for-publication';book.cmsStatus=book.status;
book.contentReviewedAt='2026-09-10';book.publicationDate='2026-09-10';
const intro=book.sections[0];
intro.html=`<p><a href="${book.download.url}">Download the Public Company Comps Workbench template</a> · Excel · Version 1.0 · common currency, millions</p>`+intro.html.replace(/^<p><a href="[^"]+">Download the Public Company[\s\S]*?<\/p>/,'');
write(`${ROOT}/editorial/${ID}.json`,book);

const addition={heading:'Review the public-company valuation reference',html:`<p>Use the <a href="${book.proposedPath}">Public Company Comps Workbench</a> to select comparable public companies, review financial definitions and exclusions, and support a trading-multiple range across 12 sectors.</p>`};
const manifest=read(ROOT+'/content-manifest.json');
for(const related of book.relatedResources){
  const p=`${ROOT}/editorial/${related}.json`,r=read(p);
  r.relatedResources=[...new Set([...(r.relatedResources||[]),ID])];
  r.sections=[...r.sections.filter(s=>s.heading!==addition.heading),addition];
  write(p,r);
  const mr=manifest.resources.find(x=>x.id===related);mr.relatedResources=r.relatedResources;
}
const record={...book};delete record.sections;delete record.sourceNotes;
const index=manifest.resources.findIndex(r=>r.id===ID);
if(index<0)manifest.resources.push(record);else manifest.resources[index]=record;
manifest.version='2.6.0';manifest.updated='2026-09-10';manifest.phase=ID;
const stages=read(ROOT+'/transaction-path.json');
write(ROOT+'/transaction-path.json',stages);manifest.transactionPath=stages;
for(const r of manifest.resourceRoadmap){if(r.topic==='industry-comps'){r.status=book.status;r.resource=book.name;}}
manifest.buildPriority=manifest.buildPriority.filter(x=>x!==ID&&x!=='capital-iq-comps-workbench');
manifest.publication={date:'2026-09-10',status:published?'published-live-verification-in-progress':'ready-for-publication',domains:['www.mikeye.com','mikeye.com'],audit:OUT+'/production-audit.json'};
write(ROOT+'/content-manifest.json',manifest);write(ROOT+'/launch/publication-resources.json',manifest.resources);

const inventory=read('public/datasets/ma-library.json');
inventory.version='2.6.0';inventory.updated='2026-09-10';inventory.transactionPath=stages;
const inventoryRecord={id:ID,name:book.name,type:book.format,topic:book.topic,url:book.url,summary:book.summary,decision:book.decision,version:book.version,publicationDate:book.publicationDate,status:book.status,relatedResources:book.relatedResources,sourcePrinciples:book.sourcePrinciples,download:book.download,contentReviewedAt:book.contentReviewedAt};
const ix=inventory.resources.findIndex(r=>r.id===ID);
if(ix<0)inventory.resources.push(inventoryRecord);else inventory.resources[ix]=inventoryRecord;
for(const related of book.relatedResources){const r=inventory.resources.find(x=>x.id===related);r.relatedResources=[...new Set([...(r.relatedResources||[]),ID])];}
const resource={'@type':['CreativeWork','LearningResource'],'@id':book.url+'#resource',url:book.url,name:book.name,description:book.summary,author:{'@id':SITE+'/#person'},publisher:{'@id':SITE+'/#person'},inLanguage:'en-US',isAccessibleForFree:true,isPartOf:{'@id':SITE+'/m-and-a#library'},about:{'@id':SITE+'/m-and-a#'+book.topic},learningResourceType:'Public-company trading comps template with Excel workbook',teaches:book.decision,version:book.version,datePublished:book.publicationDate,dateModified:book.contentReviewedAt,mainEntityOfPage:{'@id':book.url+'#webpage'},encoding:{'@type':'MediaObject','@id':book.url+'#workbook',name:filename,contentUrl:book.download.url,encodingFormat:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',contentSize:book.download.bytes+' bytes'},keywords:['public company comps','trading comparables','peer selection','EBITDA normalization','valuation multiples','12 sectors'],citation:book.relatedResources.map(id=>({'@id':inventory.resources.find(r=>r.id===id).url+'#resource'}))};
const updateRelations=g=>{
  for(const r of inventory.resources.filter(r=>r.relatedResources?.length)){
    const n=g.find(n=>n['@id']===r.url+'#resource');if(n)n.citation=r.relatedResources.map(id=>({'@id':inventory.resources.find(x=>x.id===id).url+'#resource'}));
  }
};
const ontology=read('public/ontology.json');
ontology['@graph']=ontology['@graph'].filter(n=>n['@id']!==resource['@id']);ontology['@graph'].push(resource);updateRelations(ontology['@graph']);
for(const n of ontology['@graph']){if(n['@id']===SITE+'/m-and-a#library'&&Array.isArray(n.hasPart)&&!n.hasPart.some(x=>x['@id']===resource['@id']))n.hasPart.push({'@id':resource['@id']});}
const pages=read(OUT+'/native-schema-before.json');
for(const page of pages){
  const g=page.jsonLdSchema['@graph'];
  for(const n of g){
    if(n['@type']==='CollectionPage'){n.dateModified='2026-09-10';n.description=page.publishedPath==='/m-and-a'?'Seven transaction stages and ten M&A knowledge pillars with practical tools for public-company comps, capital allocation, acquisition mandates, carve-outs, deal economics, diligence, integration, and valuation.':'Excel tools for public-company comps, capital allocation, acquisition affordability, carve-outs, mandates, deal workflow, diligence, and integration, plus five company valuation models.';}
    if(n['@type']==='ItemList'&&(n['@id'].endsWith('#resources')||n['@id'].endsWith('#tools'))){n.itemListElement=n.itemListElement.filter(x=>x.item?.['@id']!==resource['@id']);n.itemListElement.push({'@type':'ListItem',position:n.itemListElement.length+1,item:{'@id':resource['@id'],url:book.url,name:book.name}});n.numberOfItems=n.itemListElement.length;}
    if(n['@type']==='Collection'){n.hasPart=[...(n.hasPart||[]).filter(x=>x['@id']!==resource['@id']),{'@id':resource['@id']}];}
  }
  page.jsonLdSchema['@graph']=[...g.filter(n=>n['@id']!==resource['@id']),structuredClone(resource)];updateRelations(page.jsonLdSchema['@graph']);
  // List entries reference the full resource nodes already in this graph.
  // Avoid duplicating titles and URLs as the native page schema grows.
  for(const n of page.jsonLdSchema['@graph']){
    if(n['@type']==='ItemList'&&(n['@id'].endsWith('#resources')||n['@id'].endsWith('#tools'))){
      n.itemListElement=n.itemListElement.map(x=>({...x,item:{'@id':x.item['@id']}}));
    }
  }
  // Index graphs retain identity, learning-resource types, description, author,
  // subject, version, and complete download metadata. Detailed teaching fields
  // and citations remain in the full ontology and per-resource schema records.
  for(const n of page.jsonLdSchema['@graph']){
    if(n['@id']?.endsWith('#resource')){
      for(const key of ['citation','keywords','teaches','mainEntityOfPage','publisher','learningResourceType'])delete n[key];
    }
  }
  if(JSON.stringify(page.jsonLdSchema).length>36000)throw Error('Native schema needs deliberate compaction before publication');
}
write(OUT+'/page-schema-updates.json',pages.map(p=>({id:p.id,jsonLdSchema:p.jsonLdSchema})));
const schema={'@context':'https://schema.org','@graph':[{'@type':'WebPage','@id':book.url+'#webpage',url:book.url,name:book.name,description:book.summary,inLanguage:'en-US',isPartOf:{'@id':SITE+'/#website'},mainEntity:{'@id':resource['@id']}},resource,{'@type':'BreadcrumbList','@id':book.url+'#breadcrumbs',itemListElement:[['Home',SITE+'/'],['M&A Library',SITE+'/m-and-a'],[book.name,book.url]].map(([name,item],i)=>({'@type':'ListItem',position:i+1,name,item}))}]};
write(OUT+'/resource-schema.json',schema);fs.writeFileSync(OUT+'/methodology.html',book.sections.map(s=>`<h2>${s.heading}</h2>${s.html}`).join('\n'));
for(const p of ['public/datasets/ma-library.json',ROOT+'/launch/ma-library.json',WORKER+'/datasets/ma-library.json'])write(p,inventory);
for(const p of ['public/ontology.json',ROOT+'/launch/ontology.json',WORKER+'/datasets/ontology.json'])write(p,ontology);
let guide=libraryGuide;
if(!guide.includes(`[${book.name}](${book.url})`))guide=guide.replace('\n## Transaction path',`\n- [${book.name}](${book.url}): ${book.summary} Includes a formula-driven Excel download.\n\n## Transaction path`);
guide=guide.replace('a Carve-Out Perimeter & TSA Planner, and the existing valuation calculator.','a Carve-Out Perimeter & TSA Planner, a Capital Allocation & Deal Affordability Tool, and the existing valuation calculator.');
for(const p of ['public/llms.txt',ROOT+'/launch/llms.txt'])fs.writeFileSync(p,guide);
fs.writeFileSync(WORKER+'/lib/library-guide.js','export const libraryGuide = '+JSON.stringify(guide)+';\n');
console.log(JSON.stringify({resourceCount:inventory.resources.length,download:book.download,status:book.status}));
