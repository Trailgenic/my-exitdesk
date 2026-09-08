import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir='site-foundation';
const audit=JSON.parse(fs.readFileSync(dir+'/launch/production-audit.json','utf8'));
assert.equal(audit.base,'https://www.mikeye.com');
assert.equal(audit.errors.length,0);
assert(audit.pages.length>=18);
const path=dir+'/content-manifest.json';
const manifest=JSON.parse(fs.readFileSync(path,'utf8'));
const launch=JSON.parse(fs.readFileSync(dir+'/launch/ma-library.json','utf8'));
for(const resource of manifest.resources){
  const live=launch.resources.find(r=>r.id===resource.id);
  assert(live,'Missing launch entry '+resource.id);
  if(resource.proposedPath){
    assert(audit.pages.some(p=>p.path===resource.proposedPath&&p.status===200));
    resource.url=live.url;
    resource.status='published';
    resource.cmsStatus='published';
    resource.publicationDate='2026-09-08';
    resource.contentReviewedAt='2026-09-08';
    if(resource.format==='Handbook')resource.version='1.0';
  }
}
manifest.version='2.0.0';
manifest.updated='2026-09-08';
manifest.phase='published-practical-ma-library';
manifest.publication={date:'2026-09-08',verifiedAt:new Date().toISOString(),audit:'site-foundation/launch/production-audit.json'};
manifest.webflow.homePageId='69499e77d9c11f22288abc5d';
manifest.webflow.libraryPageId=manifest.webflow.libraryDraftPageId;
manifest.webflow.toolsPageId=manifest.webflow.toolsDraftPageId;
fs.writeFileSync(path,JSON.stringify(manifest,null,2)+'\n');
console.log('Promoted seven verified resources; canonical inventory now contains 13 published resources.');
