import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';

const dir = 'site-foundation/launch';
const read = name => JSON.parse(fs.readFileSync(`${dir}/${name}`, 'utf8'));
const inventory = read('ma-library.json');
const ontology = read('ontology.json');
assert.equal(inventory.resources.length, 14);
assert.equal(inventory.topics.length, 10);
const topicIds = new Set(inventory.topics.map(t => t['@id']));
assert.equal(topicIds.size, 10);
assert(!JSON.stringify(ontology).includes('#undefined'));
assert.equal(ontology['@graph'].filter(n => n['@type'] === 'Person').length, 1);
assert(!ontology['@graph'].some(n => n['@type'] === 'SoftwareApplication'));
assert.equal(inventory.resources.filter(r => r.download).length, 8);
for (const resource of inventory.resources) {
  assert(resource.url.startsWith('https://www.mikeye.com/'));
  assert(topicIds.has(`https://www.mikeye.com/m-and-a#${resource.topic}`));
  if (!resource.download) continue;
  const d = resource.download;
  assert.match(d.url, /raw\.githubusercontent\.com\/Trailgenic\/my-exitdesk\/[a-f0-9]{40}\/public\/resources\//);
  const file = fs.readFileSync(d.repositoryPath);
  assert.equal(file.length, d.bytes, resource.id);
  assert.equal(createHash('sha256').update(file).digest('hex'), d.sha256, resource.id);
  const schema = ontology['@graph'].find(n => n['@id'] === resource.url + '#resource');
  assert.equal(schema.encoding.contentUrl, d.url);
  assert.equal(schema.author['@id'], 'https://www.mikeye.com/#person');
}
for (const filename of ['home-head.html', 'library-head.html', 'tools-head.html', 'global-head-final.html']) {
  const html = fs.readFileSync(`${dir}/${filename}`, 'utf8');
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    JSON.parse(match[1]);
    assert(!match[1].includes('{{wf'));
  }
  assert(!/name="robots"[^>]*noindex/i.test(html));
}
assert(!fs.readFileSync(`${dir}/global-footer.html`, 'utf8').trim());
assert(inventory.products.find(p => p.name === 'Acquisition Lens').status.includes('not accepting'));
assert.deepEqual(JSON.parse(fs.readFileSync('public/ontology.json','utf8')),ontology);
assert.deepEqual(JSON.parse(fs.readFileSync('public/datasets/ma-library.json','utf8')),inventory);
assert(fs.readFileSync('public/llms.txt','utf8').includes('https://my-exitdesk.vercel.app/ontology.json'));
console.log('Launch inventory verified: 14 resources, 10 topics, eight pinned workbook hashes, author identity, global/hub JSON-LD, and product availability.');
