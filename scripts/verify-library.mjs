import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { handbooks } from "./handbook-content.mjs";
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
for (const item of manifest.resources.filter((r) => r.status === "published")) assert.ok(html.includes('href="' + item.url + '"'));
assert.equal((html.match(/<article class="my1-card">/g) || []).length, 6);
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
  assert.equal(entry.status, "draft");
  assert.equal(entry.contentReviewedAt, null);
  assert.equal(entry.url, null);
  for (const name of ["generated/resource-index.json", "generated/resource-index.schema.json", "generated/llms-resources.txt"]) {
    assert.ok(!read(name).includes(book.slug) && !read(name).includes(book.name), "Unpublished handbook leaked into public inventory");
  }
}
console.log("Library checks passed: approved headline, six original publication links, semantic structure, anchors, draft boundaries, and truthful availability.");
console.log("Editorial checks passed: deal/masthead distinction, documented judgment references, two complete draft guides, and exclusion from public resource inventories.");
