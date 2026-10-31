# November 2026 tools review

Scripts that produced this release's downloads from the previous versions in `public/resources/`.
They were run from a scratch directory, so paths inside point at `/tmp/build`; adjust before rerunning.

| Script | Output |
|---|---|
| `deal_workflow.py`, `dd.py`, `integ.py` (+ `checklist_common.py`) | Deal Workflow, Due Diligence and Post-Deal Integration checklists v1.1: live dashboards with structured references, dropdowns, input shading, print setup, conditional formats rebuilt with formulas, Follow One Sale tab (DD), synergy math (Integration), workstream grouping and Critical re-grade (Deal Workflow: Critical only where If unresolved is Walk or Price) |
| `patch.py` | Mandate Screen, Capital Allocation, LOI Allocator and Synergy Bridge v1.0.1 |
| `fix.py` | Company models v1.2.1: removes empty formula elements that showed #N/A outside Excel, and makes the calculation status count error cells as failures |

Each output was recalculated in LibreOffice with zero formula errors, and dashboards were tested with sample entries (complete, blocked, removed, overdue, approved gates, synergy lines).
Older versions stay published at their original URLs. The two v0.1 working packs were removed: no page, catalogue or llms.txt linked to them.
