# Acquisition Lens — Step 4 Reasoning Engine

## Purpose

Step 4 converts the deterministic Deal Screen and underwriting outputs into an
evidence-controlled investment committee report. It applies Mike Ye's buyer-side
judgment to the deal packet without allowing the language model to invent facts,
change the decision, or recalculate deal economics.

It does not change any Exit Desk route, prompt, checkout, report, email, or
Webflow integration.

## Governing principle

**Code decides and calculates. Mike Ye's acquisition judgment guides the interpretation.**

The deterministic layers remain authoritative for:

- Recommendation and confidence.
- Hard vetoes, conditions to advance, and compounding concerns.
- Normalized earnings and value ranges.
- Enterprise-to-equity bridge and capital stack.
- Buyer returns and scenario survivability.
- Hard-ceiling and worst-case decision triggers.

The reasoning model supplies only the evidence-grounded narrative. The final
report embeds the unchanged Deal Screen and underwriting objects so downstream
consumers never need to extract numbers from prose.

## Processing sequence

1. Validate the request version, report identity, target identity, evidence IDs,
   and underwriting-to-screen bridge.
2. Resolve the governing decision from deterministic outputs. A hard-ceiling
   breach or non-survivable worst case forces `pass`.
3. Build the segment-calibrated system prompt from Mike's acquisition doctrine
   and the report constraints.
4. Send the intake, Deal Screen, underwriting, source evidence, and governing
   decision to the configured model.
5. Require the model to return the narrative draft through a strict tool schema.
6. Validate every field and evidence citation. Unknown citations, unsupported
   fields, duplicate ranks, or model-supplied decision fields fail closed.
7. Compose the final report with deterministic results, source evidence, and
   narrative assessments kept structurally separate.

## Report contract

`AcquisitionReasoningReport` contains:

- Investment Committee Snapshot.
- Governing decision posture and deterministic core reason, followed by a
  separate narrative interpretation.
- Acquisition thesis and buyer fit.
- Deterministic deal economics plus narrative interpretation.
- Revenue quality, earnings quality, cash conversion, owner dependence,
  management depth, concentration, working capital, capital expenditure, AI
  exposure, financing, integration, and seller-motivation assessments.
- Material findings and a ranked diligence pressure map.
- Investigate, price, and protect actions.
- Walk-away conditions and the uncertainty surface.
- Ranked seller questions and the next evidence-gated decision.
- The complete deterministic Deal Screen and underwriting result.
- An evidence register, authority note, and limitations.

## Evidence control

Every assessment, finding, diligence priority, buyer action, uncertainty, and
seller question cites one or more allowed evidence IDs. Three reserved IDs are
created by the engine:

- `buyer-intake` — buyer-provided intake and deal context.
- `deal-screen` — calculated Deal Screen output.
- `underwriting` — calculated underwriting output.

Additional evidence records identify the statement, source type, confidence,
verification status, date, and location. The model cannot create a new evidence
ID, and user-supplied evidence cannot replace a reserved ID.

## Model configuration

The engine never hard-codes a model call inside the report composer. The
Anthropic adapter reads:

- `ACQUISITION_REASONING_MODEL` — defaults to `claude-opus-4-6`.
- `ACQUISITION_REASONING_MAX_TOKENS` — defaults to `8000`.
- `ACQUISITION_REASONING_TEMPERATURE` — defaults to `0` and must be between 0
  and 1.
- `ANTHROPIC_API_KEY` — required only when constructing the live Anthropic
  adapter.

The adapter requires the `submit_acquisition_reasoning` tool and returns only
its structured input to the validator. Tests use an injected model, so the
reasoning engine can be verified without network access or an API key.

## Explicit non-goals

Step 4 does not:

- Add an API route or public endpoint.
- Add a database, file upload, report persistence, or email delivery.
- Add Stripe products, prices, checkout, or routing.
- Add or change a Webflow page.
- Merge Acquisition Lens into the Exit Desk runtime.
- Change any existing Exit Desk behavior.

Those integration concerns remain for later steps after the reasoning contract
is approved.
