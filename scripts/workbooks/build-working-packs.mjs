import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { Workbook, SpreadsheetFile } from "@oai/artifact-tool";

// Run a copy in an OS temporary directory using the Codex primary runtime.
// Keep node_modules links out of this Git repository. See README.md beside this file.
const outputDir = path.resolve(process.argv[2] || "outputs/mikeye-working-packs");
await fs.mkdir(outputDir, { recursive: true });
const C = { paper: "#F7F5F0", ink: "#1A1A18", muted: "#5C5C54", line: "#CEC9BC", gold: "#79602E", input: "#154F8A", light: "#EDF4FA", green: "#173D34", amber: "#F7E8C9", red: "#9B2929" };
const money = '#,##0;[Red](#,##0);"–"';
const sourceURL = "https://github.com/Trailgenic/my-exitdesk/blob/a6435b0f80cf603b762a6d0a4f14100bb93459bd/lib/acquisition/doctrine.ts";
const summaries = [];
const col = (n) => String.fromCharCode(65 + n);
function base(w, name, widths, last = 30) {
  const s = w.worksheets.add(name);
  s.showGridLines = false;
  s.getRange(`A1:${col(widths.length - 1)}${last}`).format = { fill: C.paper, font: { name: "Calibri", size: 11, color: C.ink }, verticalAlignment: "top", wrapText: true, rowHeight: 30 };
  widths.forEach((width, i) => { s.getRange(`${col(i)}1:${col(i)}${last}`).format.columnWidth = width; });
  s.freezePanes.freezeRows(8);
  return s;
}
function merged(s, range, value, format = {}) {
  const r = s.getRange(range); r.merge(); r.values = [[value]]; r.format = format;
}
function title(s, end, heading, sub) {
  merged(s, `A1:${end}2`, heading, { fill: C.ink, font: { name: "Georgia", size: 24, color: "#FFFFFF" }, verticalAlignment: "center" });
  merged(s, `A3:${end}4`, sub, { font: { size: 11, color: C.muted }, verticalAlignment: "center" });
}
function input(s, range) { s.getRange(range).format = { fill: C.light, font: { color: C.input } }; }
function table(s, headers, rows, name, widths, start = 8) {
  const end = col(headers.length - 1), last = start + rows.length;
  s.getRange(`A${start}:${end}${last}`).values = [headers, ...rows];
  const t = s.tables.add(`A${start}:${end}${last}`, true, name); t.style = "TableStyleLight1"; t.showFilterButton = true;
  s.getRange(`A${start}:${end}${start}`).format = { fill: C.ink, font: { bold: true, color: "#FFFFFF" }, rowHeight: 43, verticalAlignment: "center" };
  s.getRange(`A${start + 1}:${end}${last}`).format = { rowHeight: 67, borders: { insideHorizontal: { style: "thin", color: C.line } } };
  if (widths) widths.forEach((v, i) => { s.getRange(`${col(i)}1:${col(i)}${last}`).format.columnWidth = v; });
  return last;
}
function choices(s, range, values, good, attention) {
  const r = s.getRange(range); r.dataValidation = { rule: { type: "list", values } };
  if (good) r.conditionalFormats.add("containsText", { text: good, format: { fill: "#E1EBE2", font: { color: C.green } } });
  if (attention) r.conditionalFormats.add("containsText", { text: attention, format: { fill: C.amber, font: { color: C.ink } } });
}
function cover(w, kind) {
  const d = kind === "diligence", s = base(w, "Start Here", [22, 22, 22, 22, 22, 22], 39);
  s.freezePanes.unfreeze();
  title(s, "F", d ? "Before you buy. Follow the work." : "After the deal. Keep it working.", "MIKE YE  /  PRACTICAL M&A WORKING PACK  /  DRAFT 0.1");
  merged(s, "A6:D6", "Business / transaction"); merged(s, "E6:F6", "Review date — update this");
  merged(s, "A7:D7", ""); input(s, "A7:D7"); merged(s, "E7:F7", new Date("2026-09-07T00:00:00Z")); input(s, "E7:F7"); s.getRange("E7:F7").setNumberFormat("mmm d, yyyy");
  merged(s, "A9:F9", "START WITH ONE TASK", { fill: C.gold, font: { color: "#FFFFFF", bold: true } });
  const steps = d ? [
    "1  Open Diligence Checklist. Choose the questions that matter to this business. Assign an owner and keep the evidence location beside the status.",
    "2  Open Follow One Sale. Walk through a real customer sale and an exception. Write what you saw, not only what management described.",
    "3  Open Issue Log. Give each important finding an action: investigate, price, protect or walk. Close it only when the evidence supports the decision."
  ] : [
    "1  Open Day 1. Name the person responsible for each activity the business cannot interrupt. Record temporary arrangements where needed.",
    "2  Open Change Tracker. Define the test, the person who can pause, and the fallback before switching a process or system.",
    "3  Open Savings Tracker when you have a specific cost change. Keep expected savings separate from verified results and one-time costs."
  ];
  steps.forEach((v, i) => merged(s, `A${10 + i * 2}:F${11 + i * 2}`, v, { verticalAlignment: "center" }));
  merged(s, "A17:F18", "Blue cells are for your entries. Dark text contains prompts or calculations. Use the status dropdowns and filters. Twenty working rows are provided; copy the pack for another workstream when needed. No macros or external workbook links.", { font: { size: 10, color: C.muted } });
  merged(s, "A20:C20", d ? "Open findings" : "Planned net monthly saving (USD)");
  merged(s, "D20:F20", d ? "Overdue open findings" : "Verified net monthly saving (USD)");
  merged(s, "A21:C22", "", { font: { size: 24, color: C.green }, verticalAlignment: "center" });
  merged(s, "D21:F22", "", { font: { size: 24, color: C.green }, verticalAlignment: "center" });
  merged(s, "A24:F25", d ? "A checklist status is not approval to buy. A mismatch needs investigation; an unanswered question remains unknown. Scarcity does not override a private price ceiling or an unsurvivable downside." : "Protect customer work while combining cost functions. Do not call a planned saving achieved. The verified total requires a Verified status, a named owner and an evidence entry; those entries still require human review.", { fill: C.amber, font: { size: 11 } });
  merged(s, "A27:F27", "EXAMPLE — FICTIONAL, NOT A MIKE YE TRANSACTION", { font: { bold: true, color: C.gold } });
  merged(s, "A28:F30", d ? "The founder approves every unusual customer request. The backup can follow routine steps but cannot approve an exception. Record the approval dependency, request examples, test a backup, then decide what transition support or price change is justified." : "Combining billing platforms could reduce cost, but some customers need unusual approvals. Test a normal invoice, an exception and a correction. Keep the old process available until the team accepts the handover. Count savings after costs actually stop.");
  merged(s, "A32:F33", "Source: Mike Ye’s saved acquisition doctrine, adapted into working prompts and templates with Ella. Draft for editorial review. This starting pack is not an exhaustive diligence programme or transaction-specific professional advice.", { font: { size: 10, color: C.muted } });
  merged(s, "A34:F35", sourceURL, { font: { size: 10, color: C.muted } });
  merged(s, "A36:F37", "Related reading: https://www.mikeye.com/intelligence\nSelected deals: https://www.mikeye.com/about\nPMC mastheads document title and tenure: https://www.mikeye.com/about/record", { font: { size: 10, color: C.muted } });
  return s;
}

const d = Workbook.create();
const dc = cover(d, "diligence");
const checklist = base(d, "Diligence Checklist", [39, 38, 18, 19, 37], 26);
title(checklist, "E", "Ask. Check. Decide.", "Use the questions that matter to this business. Received means a document arrived; Verified means the relevant claim was tested.");
merged(checklist, "A6:E7", "Keep unanswered questions visible. Use Not applicable only with a reason in the evidence column. The wider legal, tax, commercial and technical review depends on the transaction.");
const checks = [
  ["What are we actually buying? Ask for a business overview and revenue mix.", "State the capability or cash flow being acquired and the defining uncertainty."],
  ["Who can deliver the company? Request ownership and approval information.", "Missing control is an early concern; a scarce asset still needs a credible consent path."],
  ["Can the financials be rebuilt? Request statements, ledger and supporting records.", "Follow material items to contracts, invoices, cash and tax records; explain differences."],
  ["What profit will repeat? Examine add-backs and replacement costs.", "A cost does not disappear just because the seller adds it back."],
  ["Who buys, and why do they stay? Review top customers and revenue concentration.", "Test contract continuity, relationships, retention and dependence on one account."],
  ["How does one sale get delivered and paid? Use Follow One Sale.", "Watch the work and an exception; connect the operating evidence to the numbers."],
  ["What stops if the owner leaves? Review roles, backup coverage and decisions.", "Test who can take over; owner dependence means different things for different buyers."],
  ["Which suppliers, systems and licences keep the business operating?", "Record dependencies, permissions, transition support and realistic alternatives."],
  ["Whose data and know-how does the workflow use? Request supporting agreements.", "Documentation does not establish permission to share, reuse or license the material."],
  ["Can the deal survive lower sales and lower margins together?", "Include financing, operating cash and required investment; stop if downside is not survivable."],
  ["Are buyer-created improvements inside the seller’s value?", "Keep standalone economics separate from buyer-specific synergy and the private ceiling."],
  ["Do the seller’s answers stay consistent as diligence develops?", "Investigate severity, materiality, explanation and intent; do not apply automatic fraud labels."],
  ["Which findings must pass to the integration team?", "Give each material issue a receiving owner, action, evidence requirement and due date."]
];
table(checklist, ["Question / evidence to request", "What the answer changes", "Owner", "Status", "Evidence location / explanation"], checks.map(([a,b]) => [a,b,null,"Not started",null]), "DiligenceQuestions");
input(checklist, "C9:E21"); choices(checklist, "D9:D21", ["Not started","Requested","Received","Verified","Not applicable"], "Verified", "Requested");
const flow = base(d, "Follow One Sale", [37, 48, 42], 27);
title(flow, "C", "Show how the work gets done.", "Duplicate this sheet for another important workflow. Start with one real sale, then one case that went wrong.");
merged(flow, "A6:C7", "Use authorised records. Record an evidence location rather than pasting confidential customer information into a widely shared copy.");
const prompts = ["Sale / service selected and date", "What promise did the customer receive?", "What starts the work? What inputs are needed?", "Who does the work, and who is the backup?", "Which decisions need experience or approval?", "Which systems, suppliers and licences are essential?", "What happened in a recent exception? Who fixed it?", "Show the agreement, invoice and delivery evidence.", "Show the ledger entry and payment; explain timing differences.", "What quality or performance record supports the result?", "What changes when the owner leaves?", "Can the backup complete the work and handle an exception?", "Whose data, tools or content are used? What permissions need review?", "What remains unknown, and who will resolve it?", "What action follows, and who receives it in integration?"];
table(flow, ["Walkthrough prompt", "What you observed", "Evidence / next question"], prompts.map(p => [p,null,null]), "WorkflowWalkthrough"); input(flow, "B9:C23");
const issues = base(d, "Issue Log", [31, 30, 16, 17, 15, 17, 37], 30);
title(issues, "G", "Make the finding change the decision.", "One material finding per row. A closed issue needs evidence and a recorded decision. The review date on Start Here controls overdue highlighting.");
merged(issues, "A6:E7", "Investigate = obtain evidence. Price = revise supported economics. Protect = arrange a credible remedy. Walk = stop when critical conditions cannot be made acceptable.");
merged(issues, "F6:G6", "Review date from Start Here"); merged(issues, "F7:G7", ""); issues.getRange("F7").formulas = [["='Start Here'!E7"]]; issues.getRange("F7:G7").setNumberFormat("mmm d, yyyy"); issues.getRange("F7:G7").format.font = { color: C.green };
table(issues, ["Finding", "Why it matters", "Action", "Owner", "Due date", "Status", "Evidence / next step / decision"], Array.from({length:20},()=>Array(7).fill(null)), "DiligenceIssues"); input(issues, "A9:G28");
choices(issues,"C9:C28",["Investigate","Price","Protect","Walk"]); choices(issues,"F9:F28",["Open","In progress","Closed"],"Closed","Open"); issues.getRange("E9:E28").setNumberFormat("mmm d, yyyy");
issues.getRange("A9:G28").conditionalFormats.addCustom('AND($A9<>"",$F9<>"Closed",ISNUMBER($E9),$E9<$F$7)',{fill:C.amber});
issues.getRange("G9:G28").conditionalFormats.addCustom('AND($A9<>"",$F9="Closed",$G9="")',{fill:"#F7DAD6",font:{color:C.red}});
dc.getRange("A21").formulas = [['=COUNTIFS(\'Issue Log\'!$A$9:$A$28,"<>",\'Issue Log\'!$F$9:$F$28,"<>Closed")']];
dc.getRange("D21").formulas = [['=COUNTIFS(\'Issue Log\'!$A$9:$A$28,"<>",\'Issue Log\'!$F$9:$F$28,"<>Closed",\'Issue Log\'!$E$9:$E$28,">0",\'Issue Log\'!$E$9:$E$28,"<"&$E$7)']];
dc.getRange("A21:F22").setNumberFormat("0");

const i = Workbook.create();
const ic = cover(i,"integration");
const day = base(i,"Day 1",[27,46,19,18,39],25);
title(day,"E","Keep ordinary work working.","Agree who owns each activity on the first operating day. Ready requires evidence. A temporary arrangement needs an owner and an expiry date.");
merged(day,"A6:E7","Plan within agreed access and approval arrangements before close. A planning checklist does not give the buyer operating control.");
const dayChecks = [
 ["Customer commitments","Who handles orders, delivery, renewals, service problems and unusual requests?"],
 ["Key relationships","Who introduces the receiving owner to important customers and partners?"],
 ["People and decisions","Do employees know their manager, immediate tasks and escalation contact?"],
 ["Payroll and suppliers","Are payment timing, approvals and accountable owners covered?"],
 ["Invoices and collections","Can normal invoices, exceptions and corrections still be processed?"],
 ["Essential system access","Are permissions, support contacts and recovery arrangements available?"],
 ["Contracts and permissions","Who confirms required consents, licences and transition obligations?"],
 ["Backup coverage","Can another person perform critical work if the usual owner is absent?"],
 ["Diligence handoff","Does every material open issue have a receiving owner and next action?"],
 ["Reporting and earnouts","Can the team distinguish operating results, accounting changes and integration costs?"],
 ["Data and workflow rights","What must be cleared before data or know-how reaches new teams or AI providers?"],
 ["Stop and recover","Who can pause a risky change, and how will the business continue operating?"]
];
table(day,["Activity","Readiness question","Owner","Status","Evidence / temporary arrangement"],dayChecks.map(([a,b])=>[a,b,null,"Not started",null]),"DayOneChecks"); input(day,"C9:E20"); choices(day,"D9:D20",["Not started","In progress","Ready","Temporary cover","Not applicable"],"Ready","Temporary cover");
const changes=base(i,"Change Tracker",[30,18,15,35,22,35,19],30);
title(changes,"G","Test the handover before the switch.","Protect customer work. Move support functions after checking dependencies. Keep a standalone operating view when useful; six months is an option, not a mandatory delay.");
merged(changes,"A6:G7","A cutover is the move to a new system or process. Mark a change Accepted when the receiving owner accepts the work and the result can be checked.");
table(changes,["Change / business activity","Receiving owner","Target date","Evidence required before switch","Person who can pause","Fallback / customer impact","Status"],Array.from({length:20},()=>Array(7).fill(null)),"IntegrationChanges"); input(changes,"A9:G28"); changes.getRange("C9:C28").setNumberFormat("mmm d, yyyy"); choices(changes,"G9:G28",["Planned","Testing","Paused","Accepted"],"Accepted","Paused");
const savings=base(i,"Savings Tracker",[30,18,18,18,19,18,19,40],30);
title(savings,"H","Make the saving earn its place.","Amounts are whole USD per month unless marked one-time. Track cost changes only here; revenue synergies need a separate margin and cash analysis.");
merged(savings,"A6:H7","Enter both cost inputs, including a zero when appropriate. Net monthly saving = monthly cost removed minus new monthly cost. Keep one-time costs separate; this is not a valuation or payback model.");
table(savings,["Cost change","Owner","Monthly cost\nremoved","Monthly\nnew costs","Net monthly\nsaving","One-time cost","Status","Evidence location / basis"],Array.from({length:20},()=>Array(8).fill(null)),"CostSynergies"); input(savings,"A9:D28"); input(savings,"F9:H28");
for(let r=9;r<=28;r++)savings.getRange(`E${r}`).formulas=[[`=IF(OR(A${r}="",COUNT(C${r}:D${r})<2),"",C${r}-D${r})`]];
savings.getRange("C9:F28").setNumberFormat(money); savings.getRange("C9:F28").format.horizontalAlignment="right"; savings.getRange("E9:E28").format.font={color:C.ink};
choices(savings,"G9:G28",["Planned","In progress","Verified","Stopped"],"Verified","In progress");
savings.getRange("E9:E28").conditionalFormats.add("cellIs",{operator:"lessThan",formula:0,format:{font:{color:C.red},fill:"#F7DAD6"}});
savings.getRange("H9:H28").conditionalFormats.addCustom('AND($A9<>"",$G9="Verified",OR($B9="",$H9="",COUNT($C9:$D9)<2))',{fill:C.amber});
ic.getRange("A21").formulas=[['=IF(COUNT(\'Savings Tracker\'!$E$9:$E$28)=0,"",SUMIFS(\'Savings Tracker\'!$E$9:$E$28,\'Savings Tracker\'!$G$9:$G$28,"<>Stopped"))']];
ic.getRange("D21").formulas=[['=IF(COUNT(\'Savings Tracker\'!$E$9:$E$28)=0,"",SUMIFS(\'Savings Tracker\'!$E$9:$E$28,\'Savings Tracker\'!$G$9:$G$28,"Verified",\'Savings Tracker\'!$B$9:$B$28,"<>",\'Savings Tracker\'!$H$9:$H$28,"<>"))']]; ic.getRange("A21:F22").setNumberFormat(money);
i.comments.setSelf({displayName:"Mike Ye"}); i.comments.addThread({cell:savings.getRange("E8")},"Formula subtracts ongoing monthly replacement costs from monthly costs removed. One-time costs are recorded separately. Figures are user inputs, not a forecast supplied by Mike Ye.");

// Meaningful edit checks: blanks, late dates, zero/negative savings and verification evidence.
const val=(s,a)=>s.getRange(a).values[0][0];
issues.getRange("A9:G9").values=[["Formula test","Test", "Investigate","Reviewer",new Date("2026-09-06T00:00:00Z"),"Open",null]];
assert.equal(val(dc,"A21"),1); assert.equal(val(dc,"D21"),1);
issues.getRange("E9").values=[[new Date("2026-09-07T00:00:00Z")]]; assert.equal(val(dc,"D21"),0);
issues.getRange("F9").values=[["Closed"]]; assert.equal(val(dc,"A21"),0); assert.equal(val(dc,"D21"),0); issues.getRange("A9:G9").clear({applyTo:"contents"});
savings.getRange("A9:D9").values=[["Formula test","Reviewer",100,120]]; savings.getRange("G9").values=[["Planned"]]; assert.equal(val(savings,"E9"),-20);
savings.getRange("D9").clear({applyTo:"contents"}); assert.equal(val(savings,"E9"),"");
savings.getRange("D9").values=[[0]]; assert.equal(val(savings,"E9"),100); savings.getRange("G9").values=[["Verified"]]; assert.equal(val(ic,"D21"),0);
savings.getRange("H9").values=[["Reviewed evidence"]]; assert.equal(val(ic,"D21"),100);
savings.getRange("G9").values=[["Stopped"]]; assert.equal(val(ic,"A21"),0);
savings.getRange("A9:D9").clear({applyTo:"contents"}); savings.getRange("F9:H9").clear({applyTo:"contents"}); assert.equal(val(ic,"A21"),"");

for(const [w,stem,ranges] of [[d,"MikeYe-Diligence-Working-Pack",["A1:F37","A1:E21","A1:C23","A1:G12"]],[i,"MikeYe-Integration-Working-Pack",["A1:F37","A1:E20","A1:G12","A1:H12"]]]) {
  const errors=await w.inspect({kind:"match",searchTerm:"#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!",options:{useRegex:true,maxResults:50},summary:"Final formula error scan"});
  assert.match(errors.ndjson, /Cell search matched 0 entries/, "Unexpected formula error scan result: " + errors.ndjson);
  console.log(JSON.stringify({file:stem,errorScan:errors.ndjson}));
  const sheetNames=[];
  for(let n=0;n<ranges.length;n++) {
    const sheet=w.worksheets.getItemAt(n);sheetNames.push(sheet.name);
    const preview=await w.render({sheetName:sheet.name,range:ranges[n],scale:1,format:"png"});
    await fs.writeFile(path.join(outputDir,`${stem}-${n+1}.png`),new Uint8Array(await preview.arrayBuffer()));
  }
  const check=await w.inspect({kind:"table",range:"'Start Here'!A20:F22",include:"values,formulas",tableMaxRows:3,tableMaxCols:6,maxChars:1600});console.log(check.ndjson);
  const file=await SpreadsheetFile.exportXlsx(w);await file.save(path.join(outputDir,stem+".xlsx"));
  summaries.push({file:stem+".xlsx",sheets:sheetNames,formulaBehaviorChecks:"passed",rowsPerWorkingTracker:20,examples:"Fictional; cover only",version:"0.1-draft"});
}
await fs.writeFile(path.join(outputDir,"verification.json"),JSON.stringify(summaries,null,2)+"\n");
console.log("Built two editable working packs; 8 sheet previews and behavior checks completed.");
