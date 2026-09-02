# Exit Desk — Agent-Native Exit Readiness

Exit Desk is a buyer-lens exit-readiness application for business owners. The WebMCP extension lets an AI agent turn a user's plain-language business facts into structured inputs for the existing Exit Desk diagnostic, while Exit Desk remains the authoritative scoring engine and renders the same results for the human on the page.

**Live WebMCP app:** https://www.mikeye.com/exit/score

## WebMCP Challenge extension

Exit Desk existed before the OpenAI WebMCP Challenge. The WebMCP work was added during the challenge period beginning August 25, 2026. The new implementation is isolated in:

- `public/webmcp-exit-readiness.js` — registers the WebMCP tools and bridges agent inputs to the existing diagnostic UI.
- `docs/webmcp-challenge.md` — architecture, testing instructions, submission copy, and demo plan.
- `docs/webmcp-site-pattern.md` — reusable action/read contract and rollout gates for the broader site stack.

The dated Git history distinguishes this challenge-period extension from the pre-existing application.

## The site tools

Exit Desk registers two complementary tools with
`document.modelContext.registerTool(...)`:

- `run_exit_readiness_assessment` is the action tool. It converts eight
  structured business facts into the existing diagnostic's choices, runs the
  existing scoring workflow, and renders the result for the human.
- `get_exit_readiness_result` is the read-only tool. It returns the score and
  findings already visible on the page after either the owner or the agent
  completes the assessment.

The action tool accepts eight structured facts:

1. annual revenue
2. revenue model
3. founder-absence impact
4. customer concentration
5. management-team independence
6. margin trend
7. defensibility
8. exit motivation

The tool then:

1. maps those structured facts to the same choices a human would make in the live 8-question assessment;
2. invokes the existing Exit Desk scoring engine;
3. renders the normal human-facing score, dimension breakdown, findings, and next steps on the webpage; and
4. returns the same score, dimensions, weakest dimension, findings, and applicable next-step URL to the agent.

This separation is intentional: the agent gathers and normalizes information; the application owns the deterministic domain logic.

## Why WebMCP

Without WebMCP, an agent has to visually interpret eight screens, infer which option corresponds to the user's description, and click through the UI. With WebMCP, Exit Desk exposes the task semantically and directly while preserving the normal human interface.

The result is a shared human-agent experience: the agent can execute the diagnostic, while the human sees and can inspect the exact result produced by the application.

## Test

Open https://www.mikeye.com/exit/score in either:

- ChatGPT's in-app browser with WebMCP support; or
- Chrome 149+ with WebMCP testing enabled.

Ask the agent to run the Exit Readiness Assessment using a complete set of business facts. Example:

> Run the Exit Desk assessment for a $3M–$7M business with repeat customers but no contracts. Revenue would decline significantly if the founder left for six months. The largest customer is 10–25% of revenue. The team runs daily operations but the founder still makes key decisions. Margins are stable. The moat is long-term customer relationships and brand reputation. The owner is exploring an exit but is not under pressure.

The agent should discover and invoke `run_exit_readiness_assessment`. Exit Desk
should render the result page and return structured result data to the agent.
Then ask the agent to read the current result. It should invoke
`get_exit_readiness_result` without changing the visible page.

The WebMCP contract can also be verified locally:

```bash
npm run verify:webmcp
```

## Safety and scope

- No account or email is required to run the free diagnostic.
- The WebMCP tools do not submit payment, send email, create an account, or
  generate the paid report.
- The tool uses only the facts provided for the current assessment.
- The result is a structured buyer-lens readiness diagnostic, not a valuation or professional opinion.

## Stack

- Webflow — public Exit Desk user experience
- Vercel / Next.js — supporting application services and static WebMCP source
- WebMCP imperative API — agent-native tool registration

## License

MIT. See `LICENSE`.
