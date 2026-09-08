# Native Exit Desk pages

The overview, diagnostic and checkout now use editable Webflow elements. The legacy sections remain hidden as rollback copies; they are omitted from published HTML.

`scripts/build-native-funnel.py` produces the source layouts, editable single-class CSS, and shared versioned browser assets. Scoring and checkout preserve the reviewed production behavior. `scripts/verify-native-funnel.mjs` checks 67 scoring combinations against that baseline, plus control activation, pricing, checkout payloads and error recovery.

Webflow import details:
- Import `overview.html` as written and attach portrait asset `69f3b1e478b59e8cddef4d9f` to its native Image.
- For score and checkout, import the source button tags as `div` blocks. Webflow's WHTML adapter converts button tags into links and drops disabled attributes. The hosted runtime upgrades these editable blocks to real buttons before binding events, and explicitly restores initial disabled states.
- The generated forms keep email inputs in native Form elements. Submission is intercepted in capture phase for the existing Exit Desk subscription endpoint.
- Main layout styles live in Webflow. The shared stylesheet preserves descendant selectors, active/selected states, focus and responsive details that its style importer cannot represent.
- Global head contains the stylesheet link. The score and checkout pages each apply one registered hosted script with an integrity hash. Register a new version when bytes change.

Page and root IDs:

| Page | Page ID | Native root | Hidden legacy section |
|---|---|---|---|
| `/exit` | `69de6ace18d3213207024cd4` | `d7516f12-f889-89b7-6a23-8612996e78c7` | `9e518863-3582-902f-5cf7-91b083111c88` |
| `/exit/score` | `69dd52862a901d4c7806e841` | `916e91b0-0cc8-e34d-163f-71bdc92b95d8` | `b398cefd-61b3-efa1-71d0-a0b422241bfd` |
| `/exit/checkout` | `69dd8d6c2d638a0ee1ffc8f7` | `3b4943c2-f4d6-e785-d9c8-12527ae19bae` | `f1b53f39-7fba-d0a1-d18d-da5fbf034fff` |

Rollback: first restore the matching saved `launch/exit-production-embed.html`, `launch/exit-score-production-embed.html`, or `launch/exit-checkout-production-embed.html` into the legacy HtmlEmbed through its code setting. The retained draft embeds can contain unrelated campaign work. Then hide the new root, show the legacy section, remove the page's native runtime registration and republish. Keep the separate Cashflow Routes bridge on `/exit`.
