// Add the reviewed Anthropic release without rebuilding older site content.
import fs from 'node:fs';
const dir='site-foundation/anthropic-release-2026-10-26';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const record=read(dir+'/cms-record.json'),f=record.fieldData;
const node=read(dir+'/resource-schema.json');
const id='anthropic-hybrid-valuation-model';
const download={filename:'Anthropic_ANT_Hybrid_Model_v1.3.1.xlsx',repositoryPath:'public/resources/Anthropic_ANT_Hybrid_Model_v1.3.1.xlsx',url:f['download-url'],version:'1.3.1',bytes:231890,sha256:node.encoding.sha256,downloadVerified:true,verifiedAt:'2026-10-26',sheets:['Read Me','Summary','Change Log','Historicals','Inputs','Bear','Base','Bull','S1','S2','S3','S4','S5','S6','T21','T25','T28','S7','Stress Tests']};
const resource={id,cmsId:record.id,slug:f.slug,name:f.name,type:'Model',topic:'valuation',relatedTopics:['financial-modeling'],url:f['canonical-url'],summary:f.summary,decision:f['decision-answered'],version:'1.3.1',contentReviewedAt:'2026-10-26',status:'published',download,relatedResources:['nvidia-valuation-model','public-company-comps-workbench'],sourceNotes:f['source-notes'],evidenceType:'independent illustrative scenario model'};
for(const p of ['public/datasets/ma-library.json','site-foundation/launch/ma-library.json','../mikeye-workers/datasets/ma-library.json']){
 const d=read(p);d.resources=[resource,...d.resources.filter(r=>r.id!==id)];d.version='3.1.0';d.updated='2026-10-26';write(p,d);
}
for(const p of ['public/ontology.json','site-foundation/launch/ontology.json','../mikeye-workers/datasets/ontology.json']){
 const d=read(p);d['@graph']=d['@graph'].filter(n=>n['@id']!==node['@id']);d['@graph'].push(node);
 for(const n of d['@graph'])if(n['@id']==='https://www.mikeye.com/m-and-a#library'&&n.hasPart&&!n.hasPart.some(x=>x['@id']===node['@id']))n.hasPart.push({'@id':node['@id']});
 write(p,d);
}
const cms=read('site-foundation/catalogue/cms.json');cms.resources=cms.resources.filter(r=>r.id!==record.id);cms.resources.unshift({...record,isDraft:false,isArchived:false});cms.capturedAt='2026-10-26';write('site-foundation/catalogue/cms.json',cms);
const ids=read('site-foundation/catalogue/resource-identities.json');ids[record.id]=id;write('site-foundation/catalogue/resource-identities.json',ids);
const downloads=read('site-foundation/catalogue/downloads.json');downloads[download.url]=download;write('site-foundation/catalogue/downloads.json',downloads);
const note=`\n\n## Anthropic illustrative model — v1.3.1, October 26, 2026\n\n- [Anthropic: Tokens, Value Share & the Path to $2T](${f['canonical-url']}): independent scenario workbook; hypothetical value share, taxes, compute stresses, cash and dilution. Read its limitations. Not company guidance or offering terms.\n- [Versioned Excel download](${download.url})\n`;
for(const p of ['public/llms.txt','site-foundation/launch/llms.txt'])if(fs.existsSync(p)&&!fs.readFileSync(p,'utf8').includes(f['canonical-url']))fs.appendFileSync(p,note);
const guide='../mikeye-workers/lib/library-guide.js';let s=fs.readFileSync(guide,'utf8');if(!s.includes(f['canonical-url'])){s=s.replace(/;\s*$/, ' + '+JSON.stringify(note)+';\n');fs.writeFileSync(guide,s);}
console.log('Added Anthropic release to source catalogue, inventories, ontology and machine guide.');
