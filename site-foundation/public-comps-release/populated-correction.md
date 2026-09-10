# Populated comps correction

September 10, 2026. Mike explicitly requested that Claude's populated workbook replace the mistaken blank template. This supersedes the blank-template publication described in the original release README.

The active download is CapitalIQ-Public-Comps-12-Sectors.xlsx, a dated snapshot of 254 public companies across 12 sectors and 36 distinct peer-group labels. Prices are labeled September 8, Quick Comps as-of September 9, extraction September 10. Five original tabs remain. Precedent_MA is removed. Read_Me B8 corrects the group count, and B16 describes the removal. Original source and usage notes remain intact. Company figures and summary statistics are unchanged.

All cell values in retained sheets were compared against the original upload. Only those two Read_Me cells differ. Original cell fonts, fills, borders, number formats, wrapping, widths, heights and trading freeze panes are retained. Each retained tab was visually inspected. This is a stored-value snapshot, not the earlier formula-driven template; the guide explicitly explains that edits do not recalculate its stored statistics.

Webflow asset: 6aa237da499a6768b19b5e74. Size 158149 bytes. SHA-256 f328be5a962ef87a4ed52d3d08f25016e7b17f239cb4175e8f2e9debc8b92cd6. Hosted download hash matched the prepared workbook. CMS resource 6aa23404a5b0f1fce8b86f53, guide URL unchanged. Native Tools card and both index schemas now reference the populated download. Stored library file libfile_87183b28a5588191a91f2b4b362fee7a is version 1.

The workbook is hosted as a Webflow asset. Source company figures were not copied into the website's Git repositories or metadata datasets. The previous template builder and release audit are historical. Its release script now refuses to overwrite version 1.1. The populated metadata updater is scripts/publish-populated-comps.mjs.
