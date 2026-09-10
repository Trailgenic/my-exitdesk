import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root='site-foundation', out=root+'/synergy-release', S='https://www.mikeye.com';
const bookPath=root+'/editorial/synergy-value-bridge.json';
const book=JSON.parse(fs.readFileSync(bookPath));
const manifest=JSON.parse(fs.readFileSync(root+'/content-manifest.json'));
const stages=JSON.parse(fs.readFileSync(root+'/transaction-path.json'));
const commit=process.argv[2];
if(!/^[a-f0-9]{40}$/.test(commit||''))throw Error('A verified workbook commit is required');
const filename='MikeYe-Synergy-Underwriting-Value-Bridge-v1.0.xlsx';
const repositoryPath='public/resources/'+filename;
const data=fs.readFileSync(repositoryPath);
book.download={filename,repositoryPath,url:`https://raw.githubusercontent.com/Trailgenic/my-exitdesk/${commit}/${repositoryPath}`,version:'1.0',bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex'),sheets:['Dashboard','Assumptions','Cash Flow','Initiatives','Delivery','Guide'],downloadVerified:true};
book.status=book.status==='published'?'published':'ready-for-publication';book.webflowItemId='6aa1fa5ccae8df99de4384f1';book.contentReviewedAt='2026-09-10';book.publicationDate='2026-09-10';
const first=book.sections.find(s=>s.heading==='The decision this tool answers');
first.html=`<p><a href="${book.download.url}">Download the Synergy Underwriting &amp; Value Bridge workbook</a> · Excel · Version 1.0 · USD thousands</p>`+first.html.replace(/^<p><a href="[^"]+">Download the Synergy[\s\S]*?<\/p>/,'');
fs.writeFileSync(bookPath,JSON.stringify(book,null,2)+'\n');
const idx=manifest.resources.findIndex(r=>r.id===book.id);
const record={...book};delete record.sections;delete record.sourceNotes;
if(idx<0)manifest.resources.push(record);else manifest.resources[idx]=record;
manifest.updated='2026-09-10';manifest.version='2.1.0';manifest.phase='transaction-path-and-synergy-value-bridge';manifest.transactionPath=stages;
manifest.resourceRoadmap=[
 {topic:'corporate-development',resource:'Acquisition Mandate & Target Screen',status:'planned'},
 {topic:'valuation',resource:'Valuation Triangulation Tool',status:'planned'},
 {topic:'financial-modeling',resource:'Build the Deal Model',status:'planned'},
 {topic:'industry-comps',resource:'Capital IQ Comps Workbench',status:'planned'},
 {topic:'deal-structure',resource:'LOI Economics & Risk Allocator',status:'next'},
 {topic:'due-diligence',resource:'Before You Buy: Follow the Work',status:'published'},
 {topic:'synergies',resource:book.name,status:book.status},
 {topic:'integration',resource:'After the Deal: Keep the Business Working',status:'published'},
 {topic:'divestitures',resource:'Carve-Out Perimeter & TSA Planner',status:'planned'},
 {topic:'strategic-finance',resource:'Capital Allocation & Deal Affordability Tool',status:'planned'}
];
manifest.buildPriority=['loi-economics-risk-allocator','capital-iq-comps-workbench','acquisition-mandate-target-screen','carve-out-perimeter-tsa-planner','capital-allocation-deal-affordability','build-the-deal-model','valuation-triangulation'];
for(const r of manifest.resources.filter(r=>['deal-workflow','workflow-diligence','integration-continuity'].includes(r.id))){r.relatedResources=[...new Set([...(r.relatedResources||[]),book.id])];}
fs.writeFileSync(root+'/content-manifest.json',JSON.stringify(manifest,null,2)+'\n');
const rid=book.url+'#resource';
const resource={'@type':['CreativeWork','LearningResource'],'@id':rid,url:book.url,name:book.name,description:book.summary,author:{'@id':S+'/#person'},publisher:{'@id':S+'/#person'},inLanguage:'en-US',isAccessibleForFree:true,isPartOf:{'@id':S+'/m-and-a#library'},about:{'@id':S+'/m-and-a#synergies'},learningResourceType:'Synergy underwriting tool and Excel workbook',teaches:book.decision,version:book.version,datePublished:'2026-09-10',dateModified:'2026-09-10',mainEntityOfPage:{'@id':book.url+'#webpage'},encoding:{'@type':'MediaObject','@id':book.url+'#workbook',name:filename,contentUrl:book.download.url,encodingFormat:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',contentSize:book.download.bytes+' bytes'},keywords:['M&A synergies','synergy underwriting','buyer-created value','synergy realization','purchase price ceiling']};
const transactionList={'@type':'ItemList','@id':S+'/m-and-a#transaction-path',name:stages.heading,itemListOrder:'https://schema.org/ItemListOrderAscending',numberOfItems:7,itemListElement:stages.stages.map((s,i)=>({'@type':'ListItem',position:i+1,item:{'@type':'LearningResource','@id':S+'/m-and-a#stage-'+s.id,name:s.name,url:S+'/m-and-a#stage-'+s.id,teaches:s.decision,description:`Evidence: ${s.evidence} Mike's judgment: ${s.judgment} ${s.gates}`,isBasedOn:{'@id':S+'/ma-resources/ma-deal-workflow-checklist#resource'},citation:{'@id':S+s.url+(s.url.startsWith('/ma-resources/')?'#resource':'#webpage')}}}))};
const pages=JSON.parse(fs.readFileSync(out+'/native-schema-before.json'));
for(const p of pages){const g=p.jsonLdSchema['@graph'];
 for(const n of g){if(n['@type']==='DefinedTermSet')n.name='Mike Ye M&A knowledge pillars';if(n['@type']==='CollectionPage'){n.dateModified='2026-09-10';if(p.publishedPath==='/m-and-a'){n.description='Seven transaction stages, thirteen decision gates, and ten M&A knowledge pillars with practical working tools.';n.hasPart=[...(n.hasPart||[]),{'@id':transactionList['@id']}];}}
 if(n['@type']==='ItemList'&&(n['@id'].endsWith('#resources')||n['@id'].endsWith('#tools'))){n.itemListElement=n.itemListElement.filter(x=>x.item?.['@id']!==rid);n.itemListElement.push({'@type':'ListItem',position:n.itemListElement.length+1,item:{'@id':rid,url:book.url,name:book.name}});n.numberOfItems=n.itemListElement.length;}
 if(n['@type']==='Collection')n.hasPart=[...(n.hasPart||[]).filter(x=>x['@id']!==rid),{'@id':rid}];}
 p.jsonLdSchema['@graph']=g.filter(n=>n['@id']!==rid&&n['@id']!==transactionList['@id']);p.jsonLdSchema['@graph'].push(resource);if(p.publishedPath==='/m-and-a')p.jsonLdSchema['@graph'].push(transactionList);
}
const schema={'@context':'https://schema.org','@graph':[{'@type':'WebPage','@id':book.url+'#webpage',url:book.url,name:book.name,description:book.summary,inLanguage:'en-US',isPartOf:{'@id':S+'/#website'},mainEntity:{'@id':rid}},resource,{'@type':'BreadcrumbList','@id':book.url+'#breadcrumbs',itemListElement:[['Home',S+'/'],['M&A Library',S+'/m-and-a'],[book.name,book.url]].map(([name,item],i)=>({'@type':'ListItem',position:i+1,name,item}))}]};
fs.writeFileSync(out+'/page-schema-updates.json',JSON.stringify(pages.map(p=>({id:p.id,jsonLdSchema:p.jsonLdSchema})),null,2)+'\n');
fs.writeFileSync(out+'/resource-schema.json',JSON.stringify(schema,null,2)+'\n');
fs.writeFileSync(out+'/methodology.html',book.sections.map(s=>`<h2>${s.heading}</h2>${s.html}`).join('\n'));
console.log(JSON.stringify({download:book.download,resourceId:book.webflowItemId,resourceCount:manifest.resources.length}));
