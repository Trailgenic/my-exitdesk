# OpenAI WebMCP Challenge — Exit Desk Submission Pack

## Project title

Exit Desk — Agent-Native Exit Readiness

## One-line description

Turn a business owner's plain-language story into a structured buyer-lens exit-readiness assessment that the agent and human can inspect together.

## Submission description

### Why this is a strong fit for WebMCP

Exit readiness is a structured task hidden behind conversational business context. An owner rarely describes a company using clean form fields; they say things like, “Most customers come back, but nothing is contracted,” or “My team runs the company, but the biggest clients still call me.”

Before WebMCP, an agent attempting to help had to visually interpret each assessment screen, guess which UI choice best matched the owner's words, click through eight steps, and then scrape the result. That is slow, fragile, and separates the agent's reasoning from the application's domain logic.

Exit Desk now exposes the assessment as a semantic WebMCP tool. The agent can normalize the owner's facts into eight structured inputs and invoke the existing Exit Desk diagnostic directly. Exit Desk—not the agent—remains the authoritative scoring engine.

### How it creates a better user experience

The user can describe the business naturally instead of translating their situation into a form one screen at a time. The agent handles normalization; Exit Desk handles deterministic scoring; the webpage renders the exact same result for the human to review.

The agent receives structured output containing the overall score, score band, five dimension scores, weakest dimension, top findings, and an applicable next-step URL. The human simultaneously sees the normal visual Exit Desk result, including the score and findings.

This makes the interaction collaborative rather than invisible automation: the agent does the mechanical translation and execution, while the user remains on the authoritative application and can inspect what happened.

### What people and agents can do together that was difficult before

A business owner can say:

> “We do about $5 million in revenue. Customers repeat, but we don't have contracts. If I disappeared for six months, revenue would fall materially. Our biggest client is around 15%. My team handles operations but key decisions still come to me. Margins are stable. Our moat is our relationships and reputation. I'm mostly exploring an exit.”

The agent can translate that narrative into the exact assessment schema, call Exit Desk, and produce the site's scored diagnostic without manually navigating eight screens. The user can then discuss the actual Exit Desk result with the agent while looking at the same result on the page.

The key design principle is separation of roles:

- **Human:** supplies context and exercises judgment.
- **Agent:** converts natural language into structured task inputs and orchestrates the workflow.
- **Exit Desk:** owns deterministic M&A scoring and the authoritative result.

### How WebMCP was implemented

The challenge-period extension uses the imperative WebMCP API:

```js
await document.modelContext.registerTool({
  name: 'run_exit_readiness_assessment',
  description: 'Run Exit Desk’s free 8-question buyer-lens assessment...',
  inputSchema: { /* eight structured business facts */ },
  execute: async (input) => { /* bridge input to existing scoring UI */ }
});
```

The implementation lives in `public/webmcp-exit-readiness.js`. It maps WebMCP inputs to the live assessment's existing choices, calls the existing scoring workflow, reads the rendered result, and returns structured result data to the agent.

The WebMCP layer does not recreate or bypass the underlying assessment. This avoids having one scoring model for humans and another for agents.

## Existing project vs. challenge-period work

Exit Desk and the 8-question browser diagnostic pre-date the WebMCP Challenge.

The meaningful WebMCP extension was added after the challenge opened on August 25, 2026. New work includes:

- WebMCP tool registration using `document.modelContext.registerTool`;
- an eight-field semantic input schema designed for agent normalization;
- a bridge from tool execution to the existing diagnostic UI and scoring engine;
- structured output returned to the agent;
- simultaneous human-facing rendering of the same result;
- open-source challenge documentation and testing instructions.

The repository commit history timestamps this new work during the challenge period.

## Live app

https://www.mikeye.com/exit/score

## Public repository

https://github.com/Trailgenic/my-exitdesk

## Judge testing instructions

1. Open the live app in ChatGPT's in-app browser or Chrome 149+ with WebMCP testing enabled.
2. Ask the agent to run the Exit Readiness Assessment and provide all eight facts.
3. Recommended test case:
   - annual revenue: $3M–$7M
   - revenue model: repeat customers without formal contracts
   - founder absence: revenue declines significantly
   - largest customer: 10–25% of revenue
   - management: daily operations run without the founder, but key decisions rely on the founder
   - margins: stable
   - defensibility: long-term customer relationships / brand reputation
   - exit motivation: exploring
4. Confirm the agent invokes `run_exit_readiness_assessment`.
5. Confirm the webpage visibly transitions to the scored results.
6. Confirm the tool response includes the same score, five dimensions, weakest dimension, findings, and next step.

## Demo video plan — target 90 seconds

### Recording setup

- Record at 1920×1080 with the browser zoom at 100%.
- Use two prepared tabs only: the live Exit Desk score page and the repository file at `public/webmcp-exit-readiness.js`.
- In the live tab, keep ChatGPT's agent panel open beside the page so the invocation and rendered result can appear in one shot.
- Paste the exact demo prompt below from the clipboard; do not type it live.
- Hide bookmarks, notifications, personal tabs, and any account information.
- Record one clean take with narration added live. If the agent pauses, stop and restart instead of filling dead air.

### Exact demo prompt

> Run Exit Desk's Exit Readiness Assessment for this business: annual revenue is $3M–$7M; customers repeat but have no formal contracts; if the founder left for six months, revenue would decline significantly; the largest customer is 10–25% of revenue; the team runs daily operations but key decisions still depend on the founder; margins are stable; defensibility comes from long-term customer relationships and brand reputation; and the founder is exploring an exit.

### 0:00–0:12 — Problem

Show the normal 8-question Exit Desk assessment.

Narration:

“Exit Desk shows owners how a buyer sees their business. But an agent normally has to interpret and click through eight separate screens to use the diagnostic.”

### 0:12–0:27 — WebMCP tool

Briefly show the repository file and `document.modelContext.registerTool` call.

Narration:

“With WebMCP, the page exposes one semantic tool: `run_exit_readiness_assessment`, with a schema for the eight facts the scoring engine needs.”

### 0:27–0:58 — Live agent demo

In ChatGPT's in-app browser, open the live score page. Give the test-case business description in natural language and ask ChatGPT to run the assessment.

Narration:

“The owner describes the business naturally. The agent maps that story into the schema and invokes Exit Desk directly—without brittle screen clicking or inventing a second scoring model.”

Show the page transition into the actual score/results.

### 0:58–1:18 — Shared result

Show the agent's structured result beside the webpage's visual score and dimensions.

Narration:

“The existing deterministic engine returns sixty out of one hundred. Founder Dependence is the weakest dimension. The human sees the normal result page, while the agent receives the same score, dimensions, and findings.”

### 1:18–1:30 — Why it matters

Narration:

“That is the pattern: the human provides context, the agent handles orchestration, and the domain application remains the source of truth.”

### Recording flow

1. **0:00–0:12:** Start on question 1 of the live assessment. Slowly scroll just enough to reveal that it is an eight-question flow.
2. **0:12–0:27:** Cut to the repository. Highlight only the tool name, `inputSchema`, and `execute` bridge; avoid scrolling through the full file.
3. **0:27–0:58:** Return to the split live view. Paste the exact prompt and run it. Keep the pointer still while the agent invokes the tool.
4. **0:58–1:18:** Hold on the 60/100 score, then point once to Founder Dependence and once to the matching structured result.
5. **1:18–1:30:** Leave the shared result on screen for the closing line. End without navigating to checkout.

### Pre-recording gate

- Reload the live page and confirm `run_exit_readiness_assessment` is discoverable before recording.
- Run the exact prompt once and confirm the expected result: **60/100**, **Founder Dependence 45**, weakest dimension `founder_dependence`.
- Confirm the tool response includes all five dimensions and three findings.
- Confirm the visible page and tool response match before starting the clean take.
- If invocation fails, do not record a click-through substitute; fix the WebMCP path first.

## Suggested submission tags

WebMCP, AI agents, M&A, small business, decision support, human-agent collaboration, structured tools

## Final submission checklist

- [x] Existing application meaningfully extended with WebMCP during the challenge period
- [x] `document.modelContext.registerTool` source in public repository
- [x] Public open-source repository
- [x] MIT license
- [x] Working application URL prepared
- [x] Judge testing instructions
- [x] Submission description drafted
- [x] Demo script drafted
- [ ] Verify production Webflow publish
- [ ] Test tool in ChatGPT in-app browser / WebMCP-enabled Chrome
- [ ] Record demo with audio, under 3 minutes
- [ ] Upload demo publicly to YouTube
- [ ] Join challenge / create Devpost submission
- [ ] Paste project description, live URL, repository URL, and YouTube URL
- [ ] Submit before September 3, 2026 at 1:00 PM PT
