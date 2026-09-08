import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { handbooks } from "./handbook-content.mjs";
import { models, modelBody, toolsHub } from "./model-content.mjs";
const read = (path) => readFileSync(resolve("site-foundation", path), "utf8");
const home = read("generated/MikeYe-Phase1-Preview.html");
const html = read("generated/MikeYe-Library-Preview.html");
assert.match(home, /The Deal Is Only the Beginning\./);
assert.ok(!home.includes("Made usable."));
for (const page of [home, html]) {
  assert.equal((page.match(/<h1\b/g) || []).length, 1);
  assert.equal((page.match(/<main\b/g) || []).length, 1);
  assert.match(page, /noindex,nofollow/);
  const ids = [...page.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(ids.length, new Set(ids).size);
  for (const [, id] of page.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(id), "Missing anchor " + id);
}
const manifest = JSON.parse(read("content-manifest.json"));
const released = Boolean(manifest.publication);
for (const item of manifest.resources.filter((r) => r.status === "published")) assert.ok(html.includes('href="' + item.url + '"'));
assert.equal((html.match(/<article class="my1-card">/g) || []).length, released ? 13 : 6);
assert.ok(html.includes("coverage is not yet complete"));
assert.ok(!html.includes("Resource title"));
assert.ok(!html.includes("/acquisition-lens"));
assert.match(home, /href="https:\/\/www\.mikeye\.com\/about">View Mike’s deal list/);
for (const page of [home, html]) {
  for (const match of page.matchAll(/<a\b[^>]*href="https:\/\/www\.mikeye\.com\/about\/record"[^>]*>([\s\S]*?)<\/a>/g)) {
    assert.match(match[1], /PMC masthead/);
    assert.ok(!/deal|transaction/i.test(match[1]), "Mastheads must not be labelled as deal evidence");
  }
}
const doctrine = readFileSync(resolve("lib/acquisition/doctrine.ts"), "utf8");
for (const book of handbooks) {
  assert.ok(book.sourcePrinciples.every((id) => doctrine.includes('id: "' + id + '"')), "Unknown source principle");
  assert.ok(html.includes('id="' + book.id + '"') && html.includes(book.name));
  assert.ok(html.includes("Illustrative example, not a Mike Ye transaction."));
  const entry = manifest.resources.find((r) => r.id === book.id);
  assert.equal(entry.status, released ? "published" : "draft");
  assert.equal(entry.contentReviewedAt, released ? "2026-09-08" : null);
  assert.equal(entry.url, released ? manifest.canonicalOrigin+entry.proposedPath : null);
  if (book.download) {
    const download = book.download;
    assert.equal(download.downloadVerified, true);
    assert.match(download.url, /^https:\/\/raw\.githubusercontent\.com\/Trailgenic\/my-exitdesk\/[a-f0-9]{40}\/public\/resources\/.+\.xlsx$/);
    assert.ok(html.includes('href="' + download.url + '"'), "Missing workbook download link");
    const bytes = readFileSync(resolve(download.repositoryPath));
    assert.equal(bytes.length, download.bytes);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), download.sha256, "Workbook changed without a version update");
    assert.ok(html.includes("Put the guide to work"));
  }
  for (const name of ["generated/resource-index.json", "generated/resource-index.schema.json", "generated/llms-resources.txt"]) {
    assert.equal(read(name).includes(book.name), released, "Handbook inventory does not match publication state");
  }
}
console.log("Library checks passed: approved headline, resource links, semantic structure, anchors, publication boundaries, and truthful availability.");
console.log("Editorial checks passed: deal/masthead distinction, documented judgment, complete guides, and matching publication metadata.");
assert.equal(models.length, 5);
assert.equal(new Set(models.map(m => m.id)).size, 5);
const tools = toolsHub();
assert.equal((tools.match(/class="my5-model-card"/g) || []).length, 5);
assert.equal((tools.match(/class="my5-method"/g) || []).length, 5);
assert.match(html, /href="#tools-and-models">Tools &amp; Models/);
for (const model of models) {
  const entry = manifest.resources.find(r => r.id === model.id);
  assert.ok(entry, "Model missing from canonical draft manifest");
  assert.equal(entry.workbookStatus, "available");
  assert.equal(entry.status, released ? "published" : "draft");
  assert.deepEqual(entry.download, model.download);
  assert.equal(entry.url, released ? manifest.canonicalOrigin+entry.proposedPath : null);
  assert.equal(entry.valuationDate, model.valuationDate);
  assert.equal(entry.contentReviewedAt, released ? "2026-09-08" : null);
  assert.ok(model.sourcePrinciples.every(id => doctrine.includes('id: "' + id + '"')));
  assert.ok(html.includes('id="' + model.id + '"'));
  const body = modelBody(model);
  assert.match(body, /Download Excel model/);
  assert.equal(model.download.downloadVerified, true);
  assert.match(model.download.url, /^https:\/\/raw\.githubusercontent\.com\/Trailgenic\/my-exitdesk\/[a-f0-9]{40}\/public\/resources\/.+\.xlsx$/);
  const bytes = readFileSync(resolve(model.download.repositoryPath));
  assert.equal(bytes.length, model.download.bytes);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), model.download.sha256);
  assert.ok(body.includes(model.download.url) && tools.includes(model.download.url));
  assert.ok(!body.includes("coming soon") && !tools.includes("coming soon"));
  assert.ok(model.workbookSheets.includes("Checks") && model.workbookSheets.includes("Start Here"));
  assert.ok(tools.includes('/ma-resources/' + model.slug), "Hub omits model starting guide");
  for (const name of ["generated/resource-index.json", "generated/resource-index.schema.json", "generated/llms-resources.txt"]) {
    assert.equal(read(name).includes(model.name), released, "Model inventory does not match publication state");
  }
}
console.log("Model checks passed: five verified downloads, matching hashes, dated assumptions, source principles, navigation, and matching publication metadata.");
