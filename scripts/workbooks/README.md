# Companion working packs

`build-working-packs.mjs` authors two XLSX companions with `@oai/artifact-tool` in the installed Codex primary runtime. Copy this builder to an OS temporary directory, link that directory's `node_modules` to `$CODEX_PRIMARY_RUNTIME_NODE_MODULES`, and run with `$CODEX_PRIMARY_RUNTIME_NODE`. Pass an absolute output directory. Do not install the authoring library into the application or link modules inside this repository.

The builder produces two workbooks, one render per worksheet and compact verification metadata. Review every rendered worksheet before releasing the XLSX files. The tracked builder is reproducible source; delivered workbook bytes are stored as managed downloads and versioned in the resource manifest.

These are editable starting packs, not a comprehensive diligence programme or a transaction recommendation. Twenty rows are intentionally reserved in each working tracker. Summary formulas use that stated range; copy the pack for a separate workstream. No workbook contains real customer information, a real transaction example, macros, external workbook links or hidden business assumptions.

Formula checks exercise open/closed and overdue findings; blank, zero and negative monthly cost changes; evidence requirements for verified savings; and stopped opportunities. The underlying source is Mike's saved acquisition doctrine, pinned in the workbook's Start Here tab and in `site-foundation/editorial/README.md`.
