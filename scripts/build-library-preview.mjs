import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { draftCatalogue, fullDraftGuides } from "./handbook-content.mjs";
import { toolsHub, fullModelGuides } from "./model-content.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..", "site-foundation");
const read = (path) => readFileSync(resolve(root, path), "utf8");
const manifest = JSON.parse(read("content-manifest.json"));
const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const resources = manifest.resources.filter((item) => item.status === "published" && item.url);
const cards = resources.map((item) => `<article class="my1-card"><p class="my1-eyebrow">${esc(item.format)}</p><h3 class="my1-card-title">${esc(item.name)}</h3><p class="my1-copy">${esc(item.summary)}</p><a class="my1-text-link" href="${esc(item.url)}">Open the original resource</a></article>`).join("\n");
const topics = manifest.topics.map((item) => `<div class="my1-topic"><span class="my1-index">${String(item.order).padStart(2, "0")}</span><h3 class="my1-topic-title">${esc(item.name)}</h3><p class="my1-small">${esc(item.summary)}</p></div>`).join("\n");
const header = read("header.html").replaceAll('href="/m-and-a"', 'href="#main-content"').replaceAll('href="/tools-and-models"', 'href="#tools-and-models"').replaceAll('href="/rebuild-foundation#products"', 'href="https://www.mikeye.com/exit"');
let html = read("library-shell.html")
  .replace('<div id="draft-guide-catalogue"></div>', draftCatalogue(true))
  .replace('href="/tools-and-models"', 'href="#tools-and-models"')
  .replace('<div id="resource-catalogue"></div>', `<div class="my2-list" id="resource-catalogue">${cards}</div>`)
  .replace('<div class="my1-topic-grid" id="topic-catalogue"></div>', `<div class="my1-topic-grid" id="topic-catalogue">${topics}</div>`)
  .replace('<main class="my1-main"', `${header}<main class="my1-main"`)
  .replace("</main></div>", `${toolsHub(true)}${fullModelGuides()}${fullDraftGuides()}</main>${read("footer.html")}</div>`);
const doc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>M&amp;A Library — Mike Ye Rebuild Preview</title><link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500&amp;family=DM+Mono:wght@400;500&amp;display=swap" rel="stylesheet"><style>*{box-sizing:border-box}body{margin:0}${read("foundation.css")}${read("library.css")}</style></head><body>${html}</body></html>`;
writeFileSync(resolve(root, "generated/MikeYe-Library-Preview.html"), doc);
console.log("Built the library design-intent preview from the canonical resource manifest.");
