import fs from "node:fs";

const root = "site-foundation";
const commit = "052f5c09a8033eff17025f08615c4a6f27c1a59a";
const raw = (name) => `https://raw.githubusercontent.com/Trailgenic/my-exitdesk/${commit}/public/resources/${name}`;

const files = {
  diligence: {
    filename: "MikeYe-MA-Due-Diligence-Checklist-v1.0.xlsx",
    sha256: "d227c49a9757f8864f2694ef3ef79fd3080ad364ab3dac3ed86fc6525cd2779d",
    bytes: 37249,
    sheets: ["Dashboard", "Checklist", "Workflow Map", "Issue Log"]
  },
  integration: {
    filename: "MikeYe-Post-Deal-Integration-Checklist-v1.0.xlsx",
    sha256: "3cafb39141059a656d5145f5b23875f9eb8700490eafc199d42056e38d8da608",
    bytes: 36674,
    sheets: ["Dashboard", "Integration Plan", "Day 1 Readiness", "Workflow Decisions", "Synergies", "Risks & Decisions"]
  },
  workflow: {
    filename: "MikeYe-MA-Deal-Workflow-Checklist-v1.0.xlsx",
    sha256: "5a0dd8cb5462ad202c7206fee97fa28cd6918af7545a54b1c49a57f8f7c96c4c",
    bytes: 43228,
    sheets: ["Dashboard", "Deal Workflow", "Stage Gates", "Deal Team", "Decision Log"]
  }
};

for (const value of Object.values(files)) {
  value.repositoryPath = `public/resources/${value.filename}`;
  value.url = raw(value.filename);
  value.version = "1.0";
  value.downloadVerified = true;
}

const manifestPath = `${root}/content-manifest.json`;
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
manifest.updated = "2026-09-09";

const diligence = manifest.resources.find((r) => r.id === "workflow-diligence");
diligence.version = "1.2";
diligence.download = files.diligence;

const integration = manifest.resources.find((r) => r.id === "integration-continuity");
integration.version = "1.2";
integration.download = files.integration;

const workflow = {
  id: "deal-workflow",
  name: "The M&A Deal Workflow: From Mandate to Value",
  format: "Checklist",
  topic: "corporate-development",
  summary: "A 156-action, 13-gate buyer-side checklist from acquisition mandate through post-close review.",
  decision: "What must happen—and who must decide—before the buyer commits more capital, time, or operating risk?",
  status: "published",
  version: "1.0",
  contentReviewedAt: "2026-09-09",
  publicationDate: "2026-09-09",
  cmsStatus: "ready-for-publication",
  url: "https://www.mikeye.com/ma-resources/ma-deal-workflow-checklist",
  proposedPath: "/ma-resources/ma-deal-workflow-checklist",
  sourceFile: "editorial/deal-workflow.json",
  sourcePrinciples: [
    "frame-before-detail",
    "decision-not-description",
    "control-and-alignment",
    "replicate-the-financials",
    "buyer-keeps-synergy",
    "ceiling-and-patience",
    "survive-the-downside",
    "unknowns-are-findings",
    "protect-revenue-integrate-cost",
    "transferability"
  ],
  relatedResources: ["workflow-diligence", "integration-continuity"],
  download: files.workflow
};

const existing = manifest.resources.findIndex((r) => r.id === workflow.id);
if (existing >= 0) manifest.resources[existing] = {...manifest.resources[existing], ...workflow};
else manifest.resources.splice(manifest.resources.findIndex((r) => r.id === "workflow-diligence"), 0, workflow);

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

for (const [name, file] of [["workflow-diligence", files.diligence], ["integration-continuity", files.integration]]) {
  const path = `${root}/editorial/${name}.json`;
  const book = JSON.parse(fs.readFileSync(path, "utf8"));
  book.version = "1.2";
  book.download = file;
  book.sourceNotes = "";
  const section = book.sections.find((s) => s.heading === "Put the guide to work");
  section.html = section.html
    .replace(/https:\/\/raw\.githubusercontent\.com\/Trailgenic\/my-exitdesk\/[a-f0-9]+\/public\/resources\/[^\"]+/, file.url)
    .replace("live status fields, and a source register", "live status fields, and a decision-ready working table");
  fs.writeFileSync(path, JSON.stringify(book, null, 2) + "\n");
}

const dealBook = {
  ...workflow,
  slug: "ma-deal-workflow-checklist",
  sections: [
    {
      heading: "Start with the commitment in front of you",
      html: "<p>Open the workflow at the phase you are actually in. Do not complete every row before acting. Identify the next commitment of money, time, access, exclusivity, reputation, or operating control—and the evidence required before making it.</p><p><strong>Your first useful output:</strong> the current decision gate, the few actions that can change the answer, and one accountable owner for each.</p>"
    },
    {
      heading: "Put the workflow to work",
      html: `<p><a href="${files.workflow.url}">Download the comprehensive M&amp;A deal workflow checklist</a> · XLSX · Version 1.0</p><p>The workbook contains 156 actions across 14 phases, 13 decision gates, a deal-team ownership map, and a decision log. Filter the workflow by phase, gate, workstream, priority, or unresolved consequence.</p><p>Your entries stay in your copy of the workbook. The file contains no macros or external workbook links.</p>`
    },
    {
      heading: "1. Frame the deal before studying the target",
      html: "<p>State why acquisition is better than building, partnering, or doing nothing. Define what the buyer needs, what must be true, what cannot be accepted, and who has authority to advance the work.</p><p>Mike’s rule is simple: frame before detail. A target should be tested against the buyer’s mandate; the seller’s story should not become the mandate by default.</p>"
    },
    {
      heading: "2. Use gates to stop momentum from becoming approval",
      html: "<p>Each gate asks whether the evidence supports the next commitment. The answer can be advance, hold and rework, or walk. Holding a gate is not indecision when a named fact can resolve the issue.</p><p>Do not let prior spending, a competitive process, or executive enthusiasm lower the evidence standard. Update the private price ceiling and walk conditions before the next bid or approval.</p>"
    },
    {
      heading: "3. Give every material issue a consequence",
      html: "<p>Classify unresolved matters as <strong>Investigate, Price, Protect, or Walk</strong>. The label is useful only when it changes the work:</p><ul><li><strong>Investigate:</strong> name the missing evidence and the owner obtaining it.</li><li><strong>Price:</strong> change standalone value, required investment, financing, or return assumptions.</li><li><strong>Protect:</strong> address the issue through structure, contract, consent, retention, control, or integration.</li><li><strong>Walk:</strong> stop when the downside, transfer failure, ceiling breach, or integrity issue breaks the thesis.</li></ul>"
    },
    {
      heading: "4. Keep standalone value separate from buyer-created upside",
      html: "<p>Rebuild historical economics, bridge earnings to cash, and test combined revenue decline and margin pressure. Keep buyer-created synergy in the buyer’s affordability case—not in the seller’s standalone value.</p><p>A strategic buyer may focus on payback; a financial buyer may focus on IRR. The return measure should match who commits the capital, while the downside must remain financeable and survivable.</p>"
    },
    {
      heading: "5. Carry evidence forward instead of restarting at each phase",
      html: "<p>A finding is not complete when it appears in a diligence memo. Send it to price, the agreement, a closing condition, Day 1 readiness, or the integration plan. Name the receiving owner and the evidence that closes it.</p><p>The decision log preserves what the team believed, which limits it accepted, and what should trigger a new decision.</p>"
    },
    {
      heading: "6. Protect the work that produces the value",
      html: "<p>Before changing systems, roles, vendors, or processes, identify the workflows that produce revenue, margin, compliance, and customer trust. Decide what to preserve, protect, combine, standardize, or retire.</p><p>Protect revenue while integrating cost. Test changes and exceptions before making the new process the only way the business can operate.</p>"
    },
    {
      heading: "7. Review the acquisition against the original thesis",
      html: "<p>After close, compare actual revenue, margin, cash, investment, synergies, and dis-synergies with what was underwritten. Record which diligence findings were predictive, missed, or overstated.</p><p>Do not close the deal program until residual actions have operating owners. Use the lessons to change the next target screen, LOI, valuation, diligence plan, and integration sequence.</p>"
    },
    {
      heading: "Use the deeper workbooks when the workflow points there",
      html: "<p>The deal workflow is the spine. Use <a href=\"/ma-resources/before-you-buy-follow-the-work\">Before You Buy: Follow the Work</a> for the detailed diligence questions and workflow-transferability map. Use <a href=\"/ma-resources/after-the-deal-keep-the-business-working\">After the Deal: Keep the Business Working</a> for Day 1, workflow decisions, synergies, and integration risks.</p>"
    }
  ],
  sourceNotes: ""
};
fs.writeFileSync(`${root}/editorial/deal-workflow.json`, JSON.stringify(dealBook, null, 2) + "\n");

console.log("Prepared the source-free checklist release and end-to-end deal workflow resource.");
