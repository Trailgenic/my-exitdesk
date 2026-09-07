import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "site-foundation");
const output = resolve(source, "generated");
mkdirSync(output, { recursive: true });
const read = (name) => readFileSync(resolve(source, name), "utf8");
const manifest = JSON.parse(read("content-manifest.json"));
const css = read("foundation.css");
const fragments = ["header.html", "main.html", "footer.html"].map(read).join("\n");
const safeJSON = (value) => JSON.stringify(value, null, 2).replaceAll("<", "\\u003c");
const published = manifest.resources.filter((resource) => resource.status === "published" && resource.url);
const schema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Selected published Mike Ye M&A resources",
  itemListElement: published.map((resource, index) => ({
    "@type": "ListItem", position: index + 1,
    item: { "@type": resource.format === "Tool" ? "WebPage" : "CreativeWork",
      "@id": resource.url, url: resource.url, name: resource.name, description: resource.summary }
  }))
};
const preview = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>MikeYe Rebuild — Phase 1 Foundation Preview</title>
<meta name="description" content="Unpublished preview of the MikeYe M&A authority-site foundation.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&amp;family=DM+Mono:wght@400;500&amp;display=swap" rel="stylesheet">
<style>*{box-sizing:border-box}body{margin:0}${css}</style></head>
<body><div class="my1-root"><a class="my1-skip" href="#main-content">Skip to content</a><p class="my1-preview-note">Phase 1 foundation preview · Not the published MikeYe.com homepage</p>${fragments}</div></body></html>`;
writeFileSync(resolve(output, "MikeYe-Phase1-Preview.html"), preview);
writeFileSync(resolve(output, "resource-index.schema.json"), safeJSON(schema) + "\n");
writeFileSync(resolve(output, "resource-index.json"), safeJSON({
  version: manifest.version, scope: "selected-existing-resources",
  replacesExistingRegistry: false,
  resources: published.map(({ id, name, format, topic, url, summary }) => ({ id, name, format, topic, url, summary }))
}) + "\n");
writeFileSync(resolve(output, "llms-resources.txt"), [
  "# Mike Ye — Selected M&A Resources",
  "",
  "> Staged supplemental resource inventory. Not a replacement for the deployed llms.txt or full MCP registry.",
  "> Entries refer to existing published resources; planned topics and unlaunched products are excluded.",
  "",
  ...published.map((resource) => `- [${resource.name}](${resource.url}): ${resource.summary}`),
  "",
].join("\n"));
console.log("Built foundation preview and three supplemental machine-readable artifacts.");
