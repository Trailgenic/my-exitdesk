import fs from 'node:fs';
import crypto from 'node:crypto';
import { libraryGuide } from '../../mikeye-workers/lib/library-guide.js';

const ROOT='site-foundation', OUT=ROOT+'/loi-release', WORKER='../mikeye-workers', SITE='https://www.mikeye.com';
const ID='loi-economics-risk-allocator';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,d)=>fs.writeFileSync(p,JSON.stringify(d,null,2)+'\n');
const commit=process.argv[2];
if(!/^[a-f0-9]{40}$/.test(commit||''))throw Error('Pass the verified workbook asset commit.');
const published=process.argv.includes('--published');
const book=read(`${ROOT}/editorial/${ID}.json`);
const filename='MikeYe-LOI-Economics-Risk-Allocator-v1.0.xlsx';
const repositoryPath='public/resources/'+filename;
const bytes=fs.readFileSync(repositoryPath);
book.download={filename,repositoryPath,url:`https://raw.githubusercontent.com/Trailgenic/my-exitdesk/${commit}/${repositoryPath}`,version:'1.0',bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),sheets:['Dashboard','Assumptions','Economics','Contingencies','Conditions','Guide'],downloadVerified:true,verifiedAt:'2026-09-10'};
book.status=published?'published':'ready-for-publication';book.cmsStatus=book.status;
book.contentReviewedAt='2026-09-10';book.publicationDate='2026-09-10';
const intro=book.sections[0];
intro.html=`<p><a href="${book.download.url}">Download the LOI Economics &amp; Risk Allocator workbook</a> · Excel · Version 1.0 · USD thousands</p>`+intro.html.replace(/^<p><a href="[^"]+">Download the LOI[\s\S]*?<\/p>/,'');
write(`${ROOT}/editorial/${ID}.json`,book);

const addition={heading:'Make the structure visible before committing',html:`<p>Use the <a href="${book.proposedPath}">LOI Economics &amp; Risk Allocator</a> to separate seller consideration from closing funding, test stock and contingent payments, and give unresolved financing, approval, consent, and exclusivity conditions an owner.</p>`};
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
manifest.version='2.2.0';manifest.updated='2026-09-10';manifest.phase='loi-economics-risk-allocator';
const stages=read(ROOT+'/transaction-path.json');
const loiStage=stages.stages.find(s=>s.id==='loi-diligence');loiStage.resource=book.name;loiStage.url=book.proposedPath;
write(ROOT+'/transaction-path.json',stages);manifest.transactionPath=stages;
for(const r of manifest.resourceRoadmap){if(r.topic==='deal-structure')r.status=book.status;if(r.topic==='industry-comps')r.status='next';}
manifest.buildPriority=manifest.buildPriority.filter(x=>x!==ID);
manifest.publication={date:'2026-09-10',status:published?'published-live-verification-in-progress':'ready-for-publication',domains:['www.mikeye.com','mikeye.com'],audit:OUT+'/production-audit.json'};
write(ROOT+'/content-manifest.json',manifest);write(ROOT+'/launch/publication-resources.json',manifest.resources);

const inventory=read('public/datasets/ma-library.json');
inventory.version='2.2.0';inventory.updated='2026-09-10';inventory.transactionPath=stages;
const inventoryRecord={id:ID,name:book.name,type:book.format,topic:book.topic,url:book.url,summary:book.summary,decision:book.decision,version:book.version,publicationDate:book.publicationDate,status:book.status,relatedResources:book.relatedResources,sourcePrinciples:book.sourcePrinciples,download:book.download,contentReviewedAt:book.contentReviewedAt};
const ix=inventory.resources.findIndex(r=>r.id===ID);
if(ix<0)inventory.resources.push(inventoryRecord);else inventory.resources[ix]=inventoryRecord;
for(const related of book.relatedResources){const r=inventory.resources.find(x=>x.id===related);r.relatedResources=[...new Set([...(r.relatedResources||[]),ID])];}
const resource={'@type':['CreativeWork','LearningResource'],'@id':book.url+'#resource',url:book.url,name:book.name,description:book.summary,author:{'@id':SITE+'/#person'},publisher:{'@id':SITE+'/#person'},inLanguage:'en-US',isAccessibleForFree:true,isPartOf:{'@id':SITE+'/m-and-a#library'},about:{'@id':SITE+'/m-and-a#'+book.topic},learningResourceType:'LOI economics and risk allocation tool with Excel workbook',teaches:book.decision,version:book.version,datePublished:book.publicationDate,dateModified:book.contentReviewedAt,mainEntityOfPage:{'@id':book.url+'#webpage'},encoding:{'@type':'MediaObject','@id':book.url+'#workbook',name:filename,contentUrl:book.download.url,encodingFormat:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',contentSize:book.download.bytes+' bytes'},keywords:['LOI economics','M&A deal structure','enterprise to equity value','seller rollover','earnout','closing funding','risk allocation'],citation:book.relatedResources.map(id=>({'@id':inventory.resources.find(r=>r.id===id).url+'#resource'}))};
const updateRelations=g=>{
  for(const r of inventory.resources.filter(r=>r.relatedResources?.length)){
    const n=g.find(n=>n['@id']===r.url+'#resource');if(n)n.citation=r.relatedResources.map(id=>({'@id':inventory.resources.find(x=>x.id===id).url+'#resource'}));
  }
};
const ontology=read('public/ontology.json');
ontology['@graph']=ontology['@graph'].filter(n=>n['@id']!==resource['@id']);ontology['@graph'].push(resource);updateRelations(ontology['@graph']);
const path=ontology['@graph'].find(n=>n['@id']===SITE+'/m-and-a#transaction-path');
path.itemListElement.find(x=>x.position===4).item.hasPart={'@id':resource['@id']};
for(const n of ontology['@graph']){if(n['@id']===SITE+'/m-and-a#library'&&Array.isArray(n.hasPart)&&!n.hasPart.some(x=>x['@id']===resource['@id']))n.hasPart.push({'@id':resource['@id']});}
const pages=read(OUT+'/native-schema-before.json');
for(const page of pages){
  const g=page.jsonLdSchema['@graph'];
  for(const n of g){
    if(n['@type']==='CollectionPage'){n.dateModified='2026-09-10';n.description=page.publishedPath==='/m-and-a'?'Seven transaction stages and ten M&A knowledge pillars with practical tools for LOI economics, synergies, diligence, integration, and valuation.':'Excel tools for deal workflow, LOI economics, synergy underwriting, due diligence, and integration, plus five company valuation models.';}
    if(n['@type']==='ItemList'&&(n['@id'].endsWith('#resources')||n['@id'].endsWith('#tools'))){n.itemListElement=n.itemListElement.filter(x=>x.item?.['@id']!==resource['@id']);n.itemListElement.push({'@type':'ListItem',position:n.itemListElement.length+1,item:{'@id':resource['@id'],url:book.url,name:book.name}});n.numberOfItems=n.itemListElement.length;}
    if(n['@type']==='Collection'){n.hasPart=[...(n.hasPart||[]).filter(x=>x['@id']!==resource['@id']),{'@id':resource['@id']}];}
    if(n['@id']===SITE+'/m-and-a#transaction-path')n.itemListElement.find(x=>x.position===4).item.citation={'@id':resource['@id']};
  }
  page.jsonLdSchema['@graph']=[...g.filter(n=>n['@id']!==resource['@id']),resource];updateRelations(page.jsonLdSchema['@graph']);
}
write(OUT+'/page-schema-updates.json',pages.map(p=>({id:p.id,jsonLdSchema:p.jsonLdSchema})));
const schema={'@context':'https://schema.org','@graph':[{'@type':'WebPage','@id':book.url+'#webpage',url:book.url,name:book.name,description:book.summary,inLanguage:'en-US',isPartOf:{'@id':SITE+'/#website'},mainEntity:{'@id':resource['@id']}},resource,{'@type':'BreadcrumbList','@id':book.url+'#breadcrumbs',itemListElement:[['Home',SITE+'/'],['M&A Library',SITE+'/m-and-a'],[book.name,book.url]].map(([name,item],i)=>({'@type':'ListItem',position:i+1,name,item}))}]};
write(OUT+'/resource-schema.json',schema);fs.writeFileSync(OUT+'/methodology.html',book.sections.map(s=>`<h2>${s.heading}</h2>${s.html}`).join('\n'));
for(const p of ['public/datasets/ma-library.json',ROOT+'/launch/ma-library.json',WORKER+'/datasets/ma-library.json'])write(p,inventory);
for(const p of ['public/ontology.json',ROOT+'/launch/ontology.json',WORKER+'/datasets/ontology.json'])write(p,ontology);
let guide=libraryGuide;
if(!guide.includes(`[${book.name}](${book.url})`))guide=guide.replace('\n## Transaction path',`\n- [${book.name}](${book.url}): ${book.summary} Includes a formula-driven Excel download.\n\n## Transaction path`);
guide=guide.replace('a Synergy Underwriting & Value Bridge tool, and the existing valuation calculator.','a Synergy Underwriting & Value Bridge tool, an LOI Economics & Risk Allocator, and the existing valuation calculator.');
guide=guide.replace(/^4\. LOI & Diligence:.*$/m,`4. LOI & Diligence: Are core terms clear, and can the team test the conditions behind the thesis? Resource: [${book.name}](${book.url}).`);
for(const p of ['public/llms.txt',ROOT+'/launch/llms.txt'])fs.writeFileSync(p,guide);
fs.writeFileSync(WORKER+'/lib/library-guide.js','export const libraryGuide = '+JSON.stringify(guide)+';\n');
console.log(JSON.stringify({resourceCount:inventory.resources.length,download:book.download,status:book.status}));
