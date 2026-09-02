import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";

const source = await fs.readFile(
  new URL("../public/webmcp-exit-readiness.js", import.meta.url),
  "utf8",
);

const registeredTools = [];
const selectedOptions = [];
let resultVisible = false;
const plain = (value) => JSON.parse(JSON.stringify(value));

const resultText = {
  "es-score-display": "60",
  "es-score-band": "Developing",
  "es-score-band-label": "Buyer interest is possible, but material gaps remain.",
  "score-rq": "65",
  "score-fd": "45",
  "score-fh": "70",
  "score-cp": "60",
  "score-ta": "60",
};

const findings = [
  {
    querySelector(selector) {
      return {
        textContent:
          selector === ".es-finding-label"
            ? "Founder Dependence"
            : "Key decisions still depend on the founder.",
      };
    },
  },
];

const document = {
  modelContext: {
    async registerTool(tool) {
      registeredTools.push(tool);
    },
  },
  querySelector(selector) {
    if (!selector.startsWith(".es-option")) return null;
    return { selector };
  },
  querySelectorAll(selector) {
    if (selector !== "#es-findings .es-finding" || !resultVisible) return [];
    return findings;
  },
  getElementById(id) {
    if (id === "es-checkout-link") {
      return resultVisible
        ? {
            href: "https://www.mikeye.com/exit/desk",
            offsetParent: {},
          }
        : null;
    }
    return {
      textContent: resultVisible ? resultText[id] ?? "" : "",
    };
  },
};

const window = {
  selectOption(option) {
    selectedOptions.push(option.selector);
  },
  showResults() {
    resultVisible = true;
  },
};

await vm.runInNewContext(source, {
  console,
  document,
  window,
  Set,
  TypeError,
  Error,
  Object,
  Array,
  Number,
  Boolean,
  JSON,
  Promise,
  setTimeout(callback) {
    callback();
  },
});

assert.deepEqual(
  registeredTools.map((tool) => tool.name),
  ["run_exit_readiness_assessment", "get_exit_readiness_result"],
);
assert.equal(
  registeredTools[0].annotations.readOnlyHint,
  false,
  "The run tool changes visible page state.",
);
assert.equal(
  registeredTools[1].annotations.readOnlyHint,
  true,
  "The result tool must remain read-only.",
);
assert.deepEqual(plain(window.__exitDeskWebMCP), {
  version: "1.1",
  tools: ["run_exit_readiness_assessment", "get_exit_readiness_result"],
});

const readTool = registeredTools[1];
const emptyResult = await readTool.execute({});
assert.equal(emptyResult.structuredContent.completed, false);

const runTool = registeredTools[0];
await assert.rejects(
  () => runTool.execute({ annual_revenue: "3m_7m" }),
  /Invalid or missing assessment field: revenue_model/,
);

const completedResult = await runTool.execute({
  annual_revenue: "3m_7m",
  revenue_model: "repeat_no_contracts",
  founder_absence_impact: "significant_decline",
  customer_concentration: "top_10_25",
  management_team: "daily_ops_founder_key_decisions",
  margin_trend: "stable",
  defensibility: "relationships_brand",
  exit_motivation: "exploring",
});

assert.equal(selectedOptions.length, 8);
assert.equal(completedResult.structuredContent.completed, true);
assert.equal(completedResult.structuredContent.score, 60);
assert.equal(
  completedResult.structuredContent.weakest_dimension,
  "founder_dependence",
);
assert.equal(completedResult.structuredContent.findings.length, 1);

const rereadResult = await readTool.execute({});
assert.deepEqual(
  plain(rereadResult.structuredContent),
  plain(completedResult.structuredContent),
);

console.log("Exit Desk WebMCP verification passed.");
