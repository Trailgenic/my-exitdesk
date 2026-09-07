import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "site-foundation");
const read = (name) => readFileSync(resolve(root, name), "utf8");
const manifest = JSON.parse(read("content-manifest.json"));
const html = read("generated/MikeYe-Phase1-Preview.html");
const css = read("foundation.css");
assert.equal((html.match(/<main\b/g) || []).length, 1);
assert.equal((html.match(/<h1\b/g) || []).length, 1);
assert.ok(html.includes('aria-label="Primary"'));
assert.ok(html.includes('name="robots" content="noindex,nofollow"'));
assert.ok(!/<iframe\b|type="module"|<script\b/i.test(html), "The preview must have no executable scripts or embedded app dependencies.");
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(ids.length, new Set(ids).size, "Duplicate HTML ids");
for (const [, anchor] of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(anchor), "Missing anchor: " + anchor);
for (const [, references] of html.matchAll(/aria-labelledby="([^"]+)"/g)) {
  for (const id of references.split(/\s+/)) assert.ok(ids.includes(id), "Missing accessible label: " + id);
}
for (const tag of html.match(/<img\b[^>]*>/g) || []) assert.match(tag, /alt="[^"]+"/);
for (const breakpoint of [991, 767, 479]) assert.ok(css.includes("max-width:" + breakpoint + "px"));
assert.ok(css.includes(":focus"));
assert.ok(!css.includes("position:fixed"));
assert.equal(manifest.preservedPages.length, 50);
for (const path of ["/", "/exit", "/exit/score", "/exit/valuation", "/exit/checkout", "/exit/desk", "/exit/partners", "/intelligence", "/glossary", "/podcast"]) {
  assert.ok(manifest.preservedPages.some((page) => page.publishedPath === path && !page.draft), "Missing preservation route " + path);
}
assert.ok(manifest.preservedPages.filter((page) => ["/acquisition-lens", "/screen", "/checkout", "/intake", "/success"].includes(page.publishedPath)).every((page) => page.draft));
assert.equal(new Set(manifest.topics.map((topic) => topic.slug)).size, 10);
const publicResources = JSON.parse(read("generated/resource-index.json")).resources;
assert.equal(publicResources.length, 6);
for (const resource of publicResources) {
  assert.ok(manifest.topics.some((topic) => topic.slug === resource.topic));
  assert.equal(new URL(resource.url).origin, manifest.canonicalOrigin);
  assert.ok(html.includes('href="' + resource.url + '"'));
}
for (const name of ["generated/resource-index.json", "generated/resource-index.schema.json", "generated/llms-resources.txt"]) {
  assert.ok(!read(name).includes("/acquisition-lens"), "Unlaunched product leaked into index");
  assert.ok(!read(name).includes("/m-and-a/"), "Planned topic leaked into index");
}
const colors = JSON.parse(read("design-tokens.json")).colors;
const luminance = (hex) => {
  const rgb = hex.slice(1).match(/../g).map((value) => parseInt(value, 16) / 255)
    .map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
};
for (const [foreground, background] of [[colors.ink, colors.paper], [colors.muted, colors.paper], [colors.gold, colors.paper], [colors.gold, colors.white], ["#DAD6CB", colors.ink]]) {
  const a = luminance(foreground), b = luminance(background);
  assert.ok((Math.max(a, b) + .05) / (Math.min(a, b) + .05) >= 4.5, "Insufficient text contrast");
}
console.log("Foundation checks passed: semantics, anchor integrity, draft boundaries, 50 preserved page records, 10 topics, 6 resource links, responsive rules, and text contrast.");
