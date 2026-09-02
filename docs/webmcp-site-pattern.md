# Mike Ye WebMCP Site Pattern

Exit Desk is the reference implementation for adding browser-native agent
capabilities across the Mike Ye site stack.

## Canonical contract

Expose the smallest pair of tools that supports a shared human-agent workflow:

1. **Action tool** — performs one existing product operation and updates the
   visible page.
2. **Read tool** — returns the authoritative result currently visible on the
   page without changing state.

For Exit Desk, those tools are:

| Role | Tool | Source of truth |
| --- | --- | --- |
| Action | `run_exit_readiness_assessment` | Existing 8-question scoring workflow |
| Read | `get_exit_readiness_result` | Existing rendered score and findings |

## Design rules

- Reuse existing application logic; do not create separate scoring or analysis
  logic for the agent.
- Keep inputs narrow, typed, required where necessary, and closed to unexpected
  properties.
- Describe visible and external side effects in the tool description.
- Mark a tool read-only only when it does not change page or external state.
- Return enough structured detail for the agent and human to verify the same
  result.
- Preserve the normal interface when WebMCP is unavailable.
- Keep payment, email, account creation, deletion, publishing, and professional
  opinions outside the initial tool surface.
- Register tools only in the top-level page, never inside an iframe.

## Verification gate

Before a site tool is published:

1. Confirm every tool registers independently.
2. Reject missing, invalid, and unexpected inputs.
3. Confirm the action updates the normal visible interface.
4. Confirm action and read tools return the same structured result.
5. Confirm annotations match actual side effects.
6. Confirm the page still works without WebMCP.
7. Run the production build and the site-specific contract check.

Exit Desk uses:

```bash
npm run verify:webmcp
```

## Rollout sequence

Apply this pattern selectively rather than exposing every page function:

1. Exit Desk — diagnostic action plus result inspection.
2. exmxc — research comparison plus current-result inspection.
3. TrailGenic — protocol/session action plus interpretation inspection.
4. Sleepgenic — deterministic assessment scoring plus result inspection.
5. Ye Guozhi — archive retrieval plus current-entry context inspection.

Each property should begin with one action tool and one read tool. Add another
tool only when it represents a distinct user task that the application already
supports.
