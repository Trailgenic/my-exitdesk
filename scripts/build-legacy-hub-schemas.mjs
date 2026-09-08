import fs from 'node:fs';
import postcss from 'postcss';
const dir='site-foundation/launch', S='https://www.mikeye.com';
const originals=JSON.parse(fs.readFileSync(dir+'/hub-code-before.json'));
const proposed=JSON.parse(fs.readFileSync(dir+'/existing-hub-updates.json'));
const selected=['695c62c51156ff276af84a69','69f3c8d9bc2ec2784c66a42a','69f3a41ed8958d1ce080557c','6a3603d5bbe438f1cb8b1c10','6a35e92cf047454b350e2b95'];
let imports=new Set(),styles=[];let pages=[];
for(const x of originals){const id=x.label.split(' ')[0];if(!selected.includes(id))continue;
 const old=x.result.find(b=>b.location==='head').content;
 const content=proposed.find(x=>x.id===id)?.head||old;
 let graphs=[];for(const m of content.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)){const j=JSON.parse(m[1]);graphs.push(...(j['@graph']||[j]));}
 for(const n of graphs){
  if(['WebPage','CollectionPage'].includes(n['@type'])){n.isPartOf={'@id':S+'/#website'};if(id==='6a3603d5bbe438f1cb8b1c10')n.about=[{'@id':S+'/m-and-a#corporate-development'},{'@id':S+'/m-and-a#due-diligence'}];}
  if(n['@type']==='DefinedTerm'){for(const p of ['inLanguage','isPartOf','creator','publisher','author','additionalProperty','about','mentions'])delete n[p];}
 }
 pages.push({id,jsonLdSchema:{'@context':'https://schema.org','@graph':graphs}});
 for(const m of old.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)){
  const css=postcss.parse(m[1]);css.walkAtRules('import',r=>{imports.add(r.toString());r.remove()});
  css.walkRules(r=>{if(r.parent.type==='atrule'&&r.parent.name.includes('keyframes'))return;const scope=`html[data-wf-page="${id}"]`;r.selectors=r.selectors.map(s=>/^html\b/.test(s)?s.replace(/^html\b/,scope):scope+' '+s);});styles.push(css.toString());
 }
}
fs.writeFileSync(dir+'/legacy-hub-schema-updates.json',JSON.stringify(pages,null,2)+'\n');
fs.writeFileSync(dir+'/legacy-hub-styles.html','<style>\n'+[...imports].join(';\n')+';\n'+styles.join('\n')+'\n</style>\n');
fs.writeFileSync(dir+'/global-head-final.html',fs.readFileSync(dir+'/global-head.html','utf8')+fs.readFileSync(dir+'/legacy-hub-styles.html','utf8')+fs.readFileSync('site-foundation/launch-overrides.html','utf8'));
console.log('Prepared five native hub/template schemas; preserved each page’s styles under its existing page ID.');
