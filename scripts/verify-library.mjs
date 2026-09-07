import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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
console.log("Library checks passed: approved headline, six original publication links, semantic structure, anchors, draft boundaries, and truthful availability.");
