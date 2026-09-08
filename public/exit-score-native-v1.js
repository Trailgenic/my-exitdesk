/* Mike Ye | Native Exit Desk runtime v1.0.2. */
(function(){ function boot(){ var root=document.querySelector('[data-native-funnel="score"]'); if(!root || root.dataset.runtimeReady==='true')return;

root.querySelectorAll('[data-funnel-action]').forEach(function(control) {
  if (control.tagName === 'BUTTON') return;
  var button = document.createElement('button');
  Array.from(control.attributes).forEach(function(attr) {
    if (attr.name !== 'href') button.setAttribute(attr.name, attr.value);
  });
  button.type = 'button';
  while (control.firstChild) button.appendChild(control.firstChild);
  control.replaceWith(button);
});
root.querySelectorAll('[data-funnel-action="nextQ"], [data-funnel-action="showResults"]').forEach(function(button) {
  button.disabled = true;
});
// =============================================================
// Exit Desk Score — Diagnostic Content Layer — v1.0
// Loaded by: mikeye.com/exit/score (Webflow embed)
//
// Supplies dimension narratives, industry framing, and tier-aware
// result copy for the free 8-question Exit Readiness Assessment —
// the self-assessment layer of the Buyer-Lens Audit™ framework.
// The diagnostic scores the 5 owner-self-reportable dimensions;
// the paid audit adds the 3 buyer-judgment dimensions (buyer
// psychology, diligence pressure, AI exposure).
//
// SYNC DISCIPLINE — public claims about the diagnostic live in:
//   1. This file (narratives + tier copy)
//   2. The /exit/score Webflow embed (scoring math + CTA wiring)
//   3. /exit/score page schema (WebApplication node, v1.3)
//   4. Buyer-Lens Audit framework: mcp.mikeye.com/frameworks/buyer-lens-audit.json
// Tier pricing ($199 Main Street under $1M / $499 Full Report at
// $1M+) must match the framework's delivery model. If you change
// tiers or dimensions here, update the embed and schema to match.
// =============================================================

var RQ_A = { narrative: "Recurring contract revenue is the cleanest revenue signal a buyer can underwrite. It tells a serious buyer that future cash flow is not being rebuilt from zero each month, which lowers perceived volatility and increases lender confidence. In most lower-middle-market processes, contracted recurring revenue supports tighter diligence conclusions, broader buyer interest, and a premium versus otherwise similar transactional businesses. The practical effect is not just a higher multiple, but a more durable one, because buyers are willing to believe the revenue base will survive ownership transition.", recommendation: "Prepare a contract revenue schedule showing renewal dates, termination terms, customer tenure, and concentration by account. In a process, the strength of recurring revenue is maximized when it is documented at the contract level rather than described in general terms." };
var RQ_B = { narrative: "Repeat business without formal contracts is valuable, but buyers do not treat it the same as true recurring revenue. They will give some credit for customer behavior and longevity, while still discounting the fact that nothing legally binds that revenue to stay in place after a sale. In practice, that can create a multiple gap of roughly 0.5x to 1.5x EBITDA or SDE (net profit + owner add-backs), which on a $3M business can mean a value gap of a few hundred thousand dollars depending on margins and buyer type. The issue is not whether customers like the business. The issue is whether a buyer can finance and underwrite future revenue with confidence.", recommendation: "Take your 10 most stable repeat customers and convert the top 3 into annual service agreements, retainers, or minimum-volume commitments. A buyer will give disproportionate credit to even a small block of revenue that is formally documented." };
var RQ_C = { narrative: "Buyers see project-based revenue as revenue that has to be rebuilt again and again, not revenue that is already locked in. They focus heavily on backlog, win rates, repeat customer behavior, and whether new work depends on the founder staying involved. Because next year's revenue is less visible, lenders are usually more conservative and buyers discount these businesses versus contract-heavy peers. A project-based business can still sell well, but only if the seller can prove that demand is consistent rather than one-off.", recommendation: "Create one recurring service layer tied to completed jobs, such as maintenance, monitoring, inspections, or ongoing support. The fastest way to improve buyer confidence is to show that at least part of next year's revenue is already built into the model." };
var RQ_D = { narrative: "A mixed revenue model is usually split by buyers into two businesses inside one company: the recurring portion and the transactional portion. The contracted or repeatable component is given higher value because it carries better visibility, while the project or one-time component is weighted more conservatively because it must be continually regenerated. Buyers will model the blended risk rather than giving the whole business the benefit of the stronger segment. The result is that the recurring percentage becomes disproportionately important, because it anchors underwriting and shapes how much leverage a buyer can justify.", recommendation: "Break revenue into clear categories and concentrate on increasing the share that is contracted, subscription-like, or service-based. The most effective near-term move is usually to convert the highest-frequency transactional customer segment into a structured recurring offering." };
var FD_A = { narrative: "If the business continues largely unchanged without the founder, buyers read that as operational independence rather than owner dependence. That is one of the most important signals in a sale process because it expands the buyer universe, supports financing, and reduces the need for heavy post-close transition protections. Businesses with real management depth and process continuity routinely command stronger multiples than otherwise similar businesses where the owner remains the operating center. Just as important, operational independence allows buyers to move faster and compete more aggressively because they are not underwriting a personality transfer.", recommendation: "Document this independence with an operating map that shows decision ownership, customer relationship coverage, and key weekly workflows by team member. In diligence, buyers believe independence more quickly when they can see the system on paper and verify it through manager interviews." };
var FD_B = { narrative: "Moderate founder dependence is common, but buyers still treat it as transition risk. They will usually assume the business can transfer, though not cleanly, and they often structure around that uncertainty through a longer transition period, deferred payments, or an earnout. An earnout means part of the purchase price is paid later only if the business performs as expected after closing. At this stage, the multiple is usually not destroyed, but the seller starts giving up control over how and when the value gets paid.", recommendation: "Pick one function that still routes through you every week — pricing, key customer calls, approvals, or scheduling — and hand it fully to one named team member for the next 90 days. Buyers gain confidence when they can point to a specific responsibility that already moved off the founder's desk." };
var FD_C = { narrative: "When revenue declines significantly if the founder steps away, buyers frame the issue as key person risk. In the $3M to $15M range, that usually compresses valuation materially because the buyer is not acquiring a self-sustaining company; the buyer is acquiring cash flow that may weaken as soon as ownership changes. A founder-dependent business that might otherwise command 4.0x to 5.5x SDE (net profit + owner add-backs) or EBITDA can quickly fall into a 2.5x to 3.5x range, with part of the consideration shifted into earnouts, seller notes, or holdbacks. The deeper problem is not just valuation compression. It is whether the business can generate the same results under new ownership.", recommendation: "Start with customer transfer risk: identify the top five relationships that still depend on you and bring a second operating leader into every meeting, renewal discussion, and service review. Buyers want to see that the relationship is already moving from the founder to the company." };
var FD_D = { narrative: "If the business effectively stops without the founder, most serious buyers will not view it as a traditional platform acquisition. They will usually frame it as an acqui-hire, a book of relationships, or a limited asset purchase rather than a transferable operating business. In that scenario, a conventional lower-middle-market multiple often disappears and value is tied instead to what revenue can survive a transition, whether the founder will stay, and whether any team or process exists beneath the owner. Transactions can still happen, but they are usually smaller, more contingent, and more dependent on the seller remaining involved than sellers initially expect.", recommendation: "Before any process, build a minimum viable transition plan that names who owns customer relationships, who runs daily operations, and what core processes must be documented for the company to function for 90 days without you. Until that exists, the business is not really being sold as a business." };
var FH_A = { narrative: "Improving margins signal positive operating control, better pricing discipline, or favorable mix shift. Buyers do not just look at the latest margin level; they model whether the trajectory is repeatable and whether the improvement came from durable operating changes rather than temporary cuts or one-time events. When margin expansion is credible, it supports a stronger multiple conversation because buyers can underwrite forward earnings with more confidence and sometimes pay on the expectation of continued efficiency. It also changes how a buyer interprets management quality, because sustained expansion usually reflects discipline rather than luck.", recommendation: "Prepare a simple year-by-year bridge showing what drove the margin improvement — pricing, mix, labor efficiency, procurement, or overhead control — and isolate one-time factors. In diligence, trajectory is most persuasive when the drivers are clearly separated from temporary noise." };
var FH_B = { narrative: "Stable margins are a strong underwriting signal because they suggest the business is managed with consistency and has some resilience against day-to-day volatility. Buyers generally view consistency favorably, especially in businesses where growth is moderate and predictability matters more than expansion. Stable margins do not create the same upside narrative as improving margins, but they often support cleaner financing and fewer surprises in diligence. In many sale processes, consistency is worth more than isolated growth if it proves the earnings base is reliable.", recommendation: "Assemble monthly or quarterly financials for at least the last three years and reconcile any anomalies before going to market. The goal is to show that stability is not accidental but visible in clean, repeatable reporting." };
var FH_C = { narrative: "Margin compression is one of the first ways buyers detect that recent earnings may overstate future earnings power. They will usually model the compression forward unless management can prove the issue is temporary, reversible, and already being addressed. That distinction matters because temporary compression may lead to a modest discount or a tighter quality-of-earnings review, while structural compression can materially reduce the multiple and shift a buyer toward a downside-protected structure. Buyers are not reacting only to lower margins; they are reacting to the possibility that the business has less pricing power or less operating control than historical results implied.", recommendation: "Build a short diagnostic on the source of compression — labor, input costs, pricing lag, customer mix, or overhead — and show what actions are already underway. Before a process, buyers need evidence that management understands the problem with specificity, not just that margins are under pressure." };
var FH_D = { narrative: "Not tracking margins closely is a negative signal because it suggests the business may be operating profitably without being managed financially. Buyers usually read that as weak operating visibility, which creates concern around earnings quality, budgeting discipline, and surprise risk in diligence. Even if the business performs well, a lack of margin awareness makes the company harder to underwrite because the seller cannot explain what is driving the economics. That increases the chance of a buyer changing the price or terms after making an initial offer, running deeper diligence, or walking away entirely.", recommendation: "Before any serious process, produce at least three years of basic monthly or quarterly financial reporting showing gross margin, EBITDA or SDE (net profit + owner add-backs), and a clear normalization of owner-specific expenses. Minimum financial preparation is not optional if the goal is a credible buyer conversation." };
var CP_A = { narrative: "Long-term customer relationships and brand reputation are legitimate forms of defensibility, but buyers test them carefully for transferability. The value lies in whether those relationships create repeat demand, pricing resilience, lower churn, and barriers to customer migration after a change of ownership. When those relationships belong to the company rather than to you personally, buyers often reward that with a stronger multiple because the revenue is seen as harder to dislodge. The risk, however, is that what appears to be a relationship moat may actually be founder dependence if the trust sits with one person rather than the business itself.", recommendation: "Document customer tenure, repeat revenue by account, and which relationships are already managed by people other than the founder. In a process, relationship value becomes more credible when a buyer can see that customers are loyal to the business, not just to you." };
var CP_B = { narrative: "Proprietary systems, licenses, and regulatory advantages are among the strongest defensibility signals a business can have. Buyers value them because they create barriers that cannot be quickly replicated through normal competition, which can justify a premium multiple and broaden the buyer universe. In diligence, however, these assets are examined with unusual intensity: ownership, enforceability, renewal status, transferability, compliance history, and operational dependence all matter. A moat only carries value if it is documented, protected, and clearly attached to the company rather than informally embedded in the business.", recommendation: "Create a defensibility file before a process that includes IP ownership records, license summaries, renewal dates, compliance history, and any contracts or approvals tied to the advantage. Buyers pay more confidently when the moat can be verified without interpretation." };
var CP_C = { narrative: "A specialized team can be a real moat because buyers know some businesses are difficult to replicate without accumulated expertise, operating know-how, or trained labor. The value of that moat depends on depth, retention, and whether the capability is spread across the team or concentrated in one or two individuals. When the team is broad and stable, buyers may give credit for that capability and underwrite continuity. When the team moat is concentrated, however, it starts to look like key person risk and can pull the multiple down rather than push it up.", recommendation: "Start with the one most critical non-founder person in the business. Fix that one concentration point first through cross-training, documentation, and customer-facing redundancy." };
var CP_D = { narrative: "If nothing makes the business meaningfully hard to replicate, buyers will usually frame it as a cash-flow acquisition rather than a strategic one. That narrows the buyer universe to operators, SBA-backed buyers, search funds, and small financial buyers who care more about durable earnings than about unique strategic value. In practical terms, commodity businesses often trade in the 2.5x to 3.5x SDE (net profit + owner add-backs) range, while more defensible peers with clear moats, transferability, and stronger revenue quality may reach 4.0x to 6.0x or more depending on scale and sector. The absence of defensibility does not make a business unsellable, but it does limit pricing power and reduce competitive tension in a process.", recommendation: "Over the next 12 to 18 months, build one defensible layer that is realistically achievable: contracted service revenue, documented proprietary workflow, niche specialization, protected territory, or deeper customer integration. Buyers do not need perfection, but they need a reason to believe the business is harder to replace than it first appears." };
var TA_A = { narrative: "Selling from a position of strength gives the seller the one thing most business owners lack in a process: optionality. Buyers generally read this motivation well because it suggests the company is not being marketed under distress, which improves negotiating leverage and reduces the probability of opportunistic behavior. A strong business with no obvious urgency can choose buyer fit, structure, and timing more deliberately, and that usually improves both price and terms. The practical advantage is not only valuation; it is the ability to run a cleaner process without signaling need.", recommendation: "Use this posture to control the process deliberately: prepare thoroughly, engage buyers selectively, and maintain the credible ability to do nothing. Optionality only has value if the process is run in a way that preserves it." };
var TA_B = { narrative: "Personal readiness is a common and legitimate reason to sell, but buyers pay close attention to how it is framed. If positioned carefully, it reads as a normal succession or life-cycle decision; if handled poorly, it can sound like fatigue, burnout, or hidden urgency. Buyers do not object to lifestyle exits, but they become more aggressive when they believe the seller wants out more than the buyer wants in. The discipline here is narrative management: honest motivation without broadcasting time pressure.", recommendation: "Frame the story around planning rather than escape — for example, succession, portfolio simplification, or the next chapter after building value over time. The goal is to be truthful while avoiding language that suggests emotional urgency or exhaustion." };
var TA_C = { narrative: "When health issues, partnership conflict, or market pressure are driving an exit, buyers often detect the urgency quickly even when sellers try to soften it. Once a buyer concludes the sale is forced, negotiating leverage deteriorates because the buyer expects concessions on price, structure, timing, or all three. The real cost of urgency is often greater than the headline multiple change: more holdbacks, deeper diligence, and tougher contractual protections for the buyer. Forced selling does not always destroy value, but it almost always transfers leverage away from the seller.", recommendation: "Control disclosure tightly and narrow the buyer set to credible parties who can move with discipline. If urgency is real, the best defense is process control: clean materials, clear deadlines, and a narrative centered on transition planning rather than pressure." };
var TA_D = { narrative: "Exploration is not indecision; it is the phase where a seller learns how the business would actually be received before committing to a process. Used correctly, this stage creates the highest-return insight because it surfaces transferability issues, diligence weaknesses, and timing considerations before the market is involved. Buyers do not pay for curiosity alone, but sellers benefit materially from understanding how the asset would be framed while there is still time to improve it. The value of the exploration phase is that it converts unknowns into a deliberate action plan rather than a reactive sale process.", recommendation: "Use the exploration phase to identify the single biggest value suppressant in the business and work it down systematically. That is usually more valuable than trying to estimate headline valuation too early." };
var INDUSTRY_SUB1M = { text: "Below $1M of revenue, the buyer universe is usually individual operators, self-funded buyers, very small strategic acquirers, and SBA-oriented purchasers looking for income rather than platform value. These buyers focus heavily on seller dependence, customer concentration, and whether the business can keep running if the owner steps back. Financing is possible in this range, but the business must show that the earnings are clear and that someone else can realistically operate it after closing. Most transactions here are not priced on strategic upside; they are priced on the durability of owner-adjusted cash flow. Sellers in this range should understand that the central question is not how impressive the business is. It is whether someone else can step in and run it safely." };
var INDUSTRY_1M_3M = { text: "In the $1M to $3M revenue range, the most common buyers are SBA-financed individuals, searchers at the lower end of the market, and small strategic acquirers looking for smaller add-on acquisitions or local expansion. Competition can be real if the business has clean financials, low founder dependence, and stable recurring or repeatable revenue. Valuation at this scale is usually driven less by growth story and more by transferability, concentration risk, and the credibility of normalized earnings. Buyers focus intensely on whether the company can run without the owner and whether the customer base will hold through transition. A seller with clean books and a documented operating system often creates more value here than a seller with a loosely managed but growing business." };
var INDUSTRY_3M_7M = { text: "The $3M to $7M revenue band is one of the most active parts of the market because it is large enough to attract serious search funds, independent sponsors, and disciplined small strategics, but still small enough for founder dependence and documentation issues to matter a great deal. Buyer competition can be meaningful in this range, particularly for businesses with recurring revenue, low concentration, and real management depth. Diligence also becomes more professional here than in the lower tier: quality of earnings, customer calls, management interviews, and transition planning are much more central. Buyers at this scale are not just buying income; they are looking for a stable base they can grow or lever responsibly. What matters most is whether the company is truly transferable, because that determines both buyer confidence and the structure of the deal." };
var INDUSTRY_7M_15M = { text: "At $7M to $15M of revenue, the buyer profile shifts upward toward more established private equity platforms, larger independent sponsors, and more capable strategic acquirers. The process becomes less forgiving because these buyers are more systematic, have better comparables, and usually run deeper diligence across finance, operations, management, and market position. They are evaluating not only earnings durability but also scalability, team depth, customer economics, and whether the asset can fit into a broader platform or thesis. Quality of earnings work, management presentations, and cleaner data-room preparation start to matter more in this range than they do below it. Sellers should understand that the business is now being judged less like a good small company and more like an institutional asset that must survive scrutiny from multiple angles." };
var INDUSTRY_15M_PLUS = { text: "Above $15M of revenue, the buyer universe becomes more institutional: established private equity sponsors, larger strategics, and buyers who expect a formal process with banker-quality materials, management presentations, and a well-run diligence track. Sponsor economics matter more here because buyers are thinking in terms of platform fit, leverage capacity, growth pathways, and exit optionality rather than simply current cash flow. The process is usually more structured, more competitive when the asset is strong, and more demanding in terms of reporting quality, management depth, and diligence responsiveness. At this level, sellers are no longer competing only on the quality of the business; they are also competing on how professionally the company can be presented and defended. The practical implication is that preparation matters almost as much as performance, because institutional buyers assume serious assets are run through serious processes." };


// SUB-$1M (LITE TIER) DIMENSION BLOCKS.
var RQ_A_LITE = { narrative: "Recurring contracts at sub-$1M scale are the strongest revenue signal an SBA lender or individual buyer can underwrite. They convert what would otherwise be a job-purchase decision into something closer to a cash-flow purchase, because the buyer can show their banker that the income exists in writing rather than in trust. In a market where roughly 20% of listed sub-$1M businesses actually close, contracted revenue is one of the few attributes that separates listings buyers compete for from listings buyers walk past. The practical effect is shorter time on market, better DSCR (debt service coverage ratio) on the SBA loan, and less pressure on the seller to carry a large seller note.", recommendation: "Pull a clean contract schedule showing customer name, contract length, renewal terms, and monthly recurring amount. SBA lenders ask for this directly during underwriting. Having it ready takes weeks off the closing timeline and gives the buyer ammunition to push back if the lender questions revenue durability." };
var RQ_B_LITE = { narrative: "Repeat customers without contracts is the most common revenue pattern in Main Street businesses, and buyers know it. They will give you partial credit — more than project revenue, less than contracted — and the discount usually shows up in the seller note rather than the headline price. SBA lenders specifically scrutinize this because revenue without contracts cannot be assigned in an asset purchase the way contracted revenue can. The risk is not that buyers walk away. The risk is that buyers offer a structure where you finance 15-25% of the deal yourself for 5-7 years on standby, which dramatically changes what closing day actually puts in your pocket.", recommendation: "Identify your top 5-10 recurring customers and convert at least 2 to written agreements before going to market — even simple annual service agreements or month-to-month written terms. Buyers will price the difference between zero contracts and 2-3 contracts more than the work of getting them." };
var RQ_C_LITE = { narrative: "Project-based revenue is the hardest revenue type to sell at this scale because SBA lenders and individual buyers cannot see the next 12 months on paper. Without visible forward revenue, the lender models risk conservatively, the buyer hesitates on the multiple, and the deal often shifts toward an asset sale with a substantial seller note carrying the risk. This is not unsellable — many service businesses transact this way — but expect the process to take longer, the buyer pool to be smaller (operators who already know the industry, not first-time SBA buyers), and the structure to favor the buyer more than a contract-heavy business would.", recommendation: "Build a backlog document showing signed work, verbal commitments, and historical repeat patterns by customer. Even informal evidence of forward demand changes how a buyer's banker reads the cash flow statement. Without this, the file looks like one-time revenue regardless of how stable it has actually been." };
var RQ_D_LITE = { narrative: "A mixed revenue model at sub-$1M scale gets evaluated as two businesses inside one wrapper, and the recurring portion does most of the work in the buyer's mind. Individual buyers and their SBA lenders focus on the contracted slice because that is what they can underwrite cleanly; the project or transactional slice gets discounted because it must be regenerated under new ownership. The percentage matters more than total revenue. A $700K business that is 60% recurring often presents better to SBA lenders than a $900K business that is 20% recurring, because cash flow predictability outweighs scale at this level.", recommendation: "Break out revenue by category in your tax returns or working financials before going to market — recurring, repeat, project, one-time. Buyers and their lenders will do this work themselves if you do not, and they will be less generous in how they classify ambiguous revenue. Doing it for them keeps you in control of the framing." };
var FD_A_LITE = { narrative: "A business that runs largely unchanged without the founder is the closest thing to gold at sub-$1M scale, because the SBA buyer universe specifically requires it. SBA 7(a) rules require the buyer to actively operate the business, but lenders increasingly favor businesses where the owner-operator dependency can be transferred quickly to a new operator without revenue collapse. Operational independence at this scale also expands the buyer universe meaningfully: it lets the seller talk to absentee-friendly cash buyers, small strategic acquirers, and SBA buyers without industry experience. The rare seller who can credibly demonstrate this should expect the strongest competitive tension Main Street allows.", recommendation: "Document the operating cadence on paper before going to market — who runs daily ops, who handles customers, what the founder actually does each week. SBA underwriters will ask for this, and a buyer's lender will move 2-4 weeks faster when it is already prepared." };
var FD_B_LITE = { narrative: "Moderate founder dependence is the default at sub-$1M scale, and buyers expect it — but their tolerance has limits. SBA 7(a) lenders increasingly require formal training periods of 30-90 days, and buyers will negotiate for a longer transition window or a holdback if they sense the founder's involvement is structurally embedded rather than habitual. The cost shows up less in headline price than in deal structure: longer training requirements, a larger seller note on standby, and tighter non-compete language. None of these kill deals, but they shift the seller's actual cash at closing meaningfully versus a more independent business.", recommendation: "Pick the one or two functions that still route through you weekly — pricing decisions, customer escalations, vendor relationships — and assign each to a specific named team member for a 60-90 day handoff before going to market. Buyers see this in operations records and pay for it." };
var FD_C_LITE = { narrative: "When revenue would decline significantly without the founder, the deal structure changes more than the headline price. SBA lenders read this as transition risk and underwrite to the lower post-close revenue projection rather than current numbers — which can compress the loan size and force the seller to carry a larger seller note. The buyer pool also narrows: cash buyers and operators with industry experience can absorb founder dependence, but first-time SBA buyers (the largest single buyer segment at this scale) will hesitate. The seller note typically grows from a routine 10-15% to 20-30% of the purchase price, often on standby for 24+ months.", recommendation: "Identify the 3-5 customer relationships or operating decisions that hold the business together and start transferring them to named team members or formalized in writing. Even partial transfer in 60-90 days changes the lender's risk model meaningfully and protects the seller's cash at closing." };
var FD_D_LITE = { narrative: "If the business effectively stops without the founder, most realistic buyers will not view it as a transferable business, and SBA lenders will not finance it at all — they cannot underwrite cash flow that depends on a person who is leaving. What gets sold in this scenario is usually the customer list, the equipment, or the brand, in an asset purchase priced well below what the historical income statement would suggest. The seller may still close a transaction, but it will likely require the seller to stay involved for 12+ months, finance most of the deal personally, and accept that the multiple is closer to liquidation value than going-concern value.", recommendation: "Before any sale conversation, build a 90-day operating manual that names who handles which customer, which vendor, which decision. Without this document, the business is not really being sold as a business — it is being sold as a transition project, and priced accordingly." };
var FH_A_LITE = { narrative: "Improving margins at sub-$1M scale are a strong signal precisely because most businesses at this size do not track them carefully enough to demonstrate the trend. When the seller can show two or three years of margin expansion with a clear explanation, SBA lenders will underwrite forward earnings with more confidence and the buyer will pay closer to the asking multiple. The risk is that margin improvement at this scale often comes from owner-specific efficiencies — the founder doing more themselves, deferring hires, or running lean in ways a new owner cannot sustain. Buyers and their lenders look for that and discount accordingly if they find it.", recommendation: "Prepare a one-page bridge showing what drove the margin improvement — pricing, customer mix, labor efficiency, vendor renegotiation — and isolate any owner-specific factors. Lenders review this directly, and a clean explanation accelerates underwriting and protects the multiple." };
var FH_B_LITE = { narrative: "Stable margins are arguably more valuable than improving margins at sub-$1M scale, because SBA underwriting cares more about predictability than growth. Lenders model historical cash flow forward, and three years of stable performance produces a cleaner DSCR calculation than two years of growth followed by uncertainty. Buyers also read consistency as a sign that the business is genuinely managed — at this scale, that is rarer than it sounds. The combination of stable margins and clean books is one of the few ways a Main Street business creates real competitive tension among buyers, because both attributes survive lender scrutiny without intervention.", recommendation: "Pull three years of clean monthly or quarterly P&L and reconcile any anomalies before listing. The goal is a record that shows stability rather than just claiming it — buyers and lenders both verify, and inconsistencies surface in week one of due diligence." };
var FH_C_LITE = { narrative: "Margin compression is one of the most common deal-killers at sub-$1M scale, because SBA lenders see it and immediately assume the trend continues post-close. Their underwriting model takes the most recent year — not the trailing average — and they will reduce the loan size accordingly. Buyers see compression and worry the business has lost pricing power, lost a customer, or absorbed cost increases that cannot be passed through. The seller cannot just hope the issue goes unnoticed — lenders ask for three years of returns and will see it. Without a credible explanation that proves the issue is reversible, expect lower price, larger seller note, or both.", recommendation: "Diagnose the source of compression in writing — labor costs, materials, pricing lag, customer mix — and document any actions already underway. Lenders will accept a credible recovery thesis if it is specific. They will not accept a vague explanation, regardless of how strong the rest of the business looks." };
var FH_D_LITE = { narrative: "Not tracking margins closely is more common at sub-$1M scale than sellers admit, but it is also one of the fastest ways to lose a deal. SBA lenders cannot underwrite a business whose owner cannot explain its economics — DSCR (debt service coverage ratio) is a function of cash flow predictability, and predictability requires visibility. Without three years of basic monthly financial reporting, the lender will either decline the loan or demand the seller pay for an accounting cleanup before underwriting begins. Buyers read this as operational risk and price it in by lowering their offer or extending the diligence timeline.", recommendation: "Hire a CPA experienced in SBA loan underwriting to build three years of clean monthly P&Ls before listing — typically 60-90 days of work. This is not optional preparation. Without it, the business is not financeable, and most of the realistic buyer pool disappears." };
var CP_A_LITE = { narrative: "Long-term customer relationships and brand reputation are the most common defensibility narrative at sub-$1M scale, and they have real value when transferable. The buyer's question is whether those relationships belong to the business or to the founder personally — because at this scale, buyers know the answer is often the latter. Customer loyalty rooted in personal trust transfers poorly to a new owner; loyalty rooted in service quality, location, or convenience transfers well. SBA lenders specifically discount relationship-based defensibility unless the seller can show the customer base is loyal to operations rather than personality, because their model assumes the founder leaves within 6-12 months.", recommendation: "Pull a list of your top 20 customers showing tenure, who at your company they primarily work with, and how they came to you. If most relationships were founded by you and remain held by you, name a 90-day transition plan to move at least the largest accounts to other team members or formalized service relationships." };
var CP_B_LITE = { narrative: "Proprietary systems, licenses, or regulatory advantages are the strongest defensibility a sub-$1M business can have, and SBA buyers will pay for them — provided they transfer. The diligence pressure here is unusually intense for a Main Street deal: the buyer's lender will verify license transferability, regulatory standing, and IP ownership directly, because a non-transferable license is one of the few things that can kill an SBA loan during underwriting. Industries with state-specific licensing requirements (contracting, healthcare, transport, food service) are particularly sensitive — the buyer's industry experience and license eligibility become deal terms, not just buyer attributes.", recommendation: "Verify in writing — before going to market — that your licenses, permits, and any regulatory approvals are transferable to a buyer who meets industry eligibility standards. Many are not, or require buyer credentials the SBA buyer pool cannot meet. Resolving this surprises after listing causes deals to fall apart in week 6 of diligence." };
var CP_C_LITE = { narrative: "A specialized team is real defensibility at sub-$1M scale, but the structure matters more than the size. If the capability is concentrated in one or two key employees, SBA buyers will demand written commitments from those employees to stay through transition — and a refusal often kills the deal. If the capability is distributed across the team, the business reads as more durable and the buyer's underwriting improves. The risk specific to Main Street is that small teams are inherently concentrated, and the seller often does not realize how much of the operating capability sits with one specific person until that person hears the business is being sold and considers their own options.", recommendation: "Identify the one most operationally critical non-founder person and have a stay-through-transition conversation with them privately, before listing. A written commitment — even a 90-day informal one — converts a potential deal-killer into a buyer-comfort point during diligence." };
var CP_D_LITE = { narrative: "When nothing makes the business meaningfully hard to replicate, buyers at sub-$1M scale price it as a cash-flow purchase rather than a strategic one — and that is actually fine. Most Main Street businesses sell exactly this way, at 2-3.5x SDE (seller's discretionary earnings — net profit plus owner compensation plus owner add-backs), priced on what the cash flow can service in SBA loan payments rather than on any unique competitive position. The absence of defensibility does not make the business unsellable; it shapes which buyers show up. Operators looking for income replacement will pay fair multiples for a clean, transferable business with no moat. They will not pay strategic premiums.", recommendation: "Stop trying to build a moat narrative for the listing — buyers see through it at this scale. Instead, document what makes the business operationally clean: customer retention, vendor relationships, repeatable workflows. Income-replacement buyers pay for transferability, not defensibility. That reframe usually adds more value than a forced positioning story." };
var TA_A_LITE = { narrative: "Selling from strength is rare at Main Street scale because most sub-$1M sellers come to market reactively — burnout, health, partnership conflict, or market shift. A seller who genuinely has optionality at this scale has the leverage to choose buyer fit, hold out for a clean SBA buyer rather than the first cash bidder, and structure terms that preserve their walk-away cash. The advantage shows up most in the seller note: confident sellers carry less, demand shorter standby periods, and can afford to push back on contingencies that desperate sellers accept. Buyers can sense the difference within the first conversation, and it shapes every term that follows.", recommendation: "Use the optionality deliberately — prepare the business properly, list when the financials show stability, and be willing to walk from buyers who try to extract concessions early. The biggest mistake confident sellers make is moving too fast and giving up the leverage that took years to build." };
var TA_B_LITE = { narrative: "Personal readiness is the most common honest exit motivation at sub-$1M scale, and buyers do not penalize it — provided the framing is succession rather than fatigue. Individual buyers actually prefer this story: an owner who has built a business over years and is ready to hand it off reads as natural, while urgency or burnout reads as a deal that needs to close fast at any price. The line between the two is finer than sellers think. Talking about lifestyle, family, or the next chapter is different from talking about exhaustion. Buyers and their lenders both pick up on tone, and the second framing costs money in negotiation.", recommendation: "Decide on the exit story before the first buyer conversation and use the same language consistently — succession, planning, the next phase — never burnout or exhaustion. The story shapes the structure: a planned exit gets a clean transition; a burnout exit gets a longer earnout and more seller financing." };
var TA_C_LITE = { narrative: "When health, partnership conflict, or market pressure are forcing an exit at sub-$1M scale, sellers usually believe they have hidden it — and buyers usually have not been fooled. At this scale, transactions are often single-buyer rather than competitive, which means the buyer has unusual leverage to read urgency and price it in. Forced sales at sub-$1M typically close at 75-85% of asking versus the market average of 85-86%, with larger seller notes, longer training periods, and more contingencies. The cost of urgency is rarely a single discount — it is dozens of small concessions across the deal terms that compound into materially less cash at closing.", recommendation: "If urgency is real, control disclosure tightly and avoid signaling timing pressure to buyers or brokers. Set a hard deadline internally but never communicate it externally. If possible, list when there is still six months of operating runway, not three — even modest urgency is read by buyers and converted into discount." };
var TA_D_LITE = { narrative: "Exploration is the right posture for a first-time seller at sub-$1M scale because it converts unknowns into a deliberate plan before market. Roughly 80% of sub-$1M businesses listed for sale do not actually close, and most failures trace to issues that could have been resolved with more lead time — book cleanup, customer transfer, key employee commitments, license verification. The exploration phase is where these issues surface cheaply. Used well, it produces a 12-18 month preparation plan. Used poorly, it leads to listing prematurely, hitting the same obstacles other failed sellers hit, and burning the listing's freshness on a market that remembers stale inventory.", recommendation: "Use the exploration window to identify the single biggest barrier to a clean SBA-financed sale — usually book quality, key employee commitment, or transferability — and resolve it before listing. The seller who arrives at market prepared sells in the top 20%. The seller who arrives reactively often does not sell at all." };

var dimensionBlocksFull = {
  rq: { a: RQ_A, b: RQ_B, c: RQ_C, d: RQ_D },
  fd: { a: FD_A, b: FD_B, c: FD_C, d: FD_D },
  fh: { a: FH_A, b: FH_B, c: FH_C, d: FH_D },
  cp: { a: CP_A, b: CP_B, c: CP_C, d: CP_D },
  ta: { a: TA_A, b: TA_B, c: TA_C, d: TA_D }
};

var dimensionBlocksLite = {
  rq: { a: RQ_A_LITE, b: RQ_B_LITE, c: RQ_C_LITE, d: RQ_D_LITE },
  fd: { a: FD_A_LITE, b: FD_B_LITE, c: FD_C_LITE, d: FD_D_LITE },
  fh: { a: FH_A_LITE, b: FH_B_LITE, c: FH_C_LITE, d: FH_D_LITE },
  cp: { a: CP_A_LITE, b: CP_B_LITE, c: CP_C_LITE, d: CP_D_LITE },
  ta: { a: TA_A_LITE, b: TA_B_LITE, c: TA_C_LITE, d: TA_D_LITE }
};

var dimensionBlocks = dimensionBlocksFull;

var industryBlocks = {
  a: INDUSTRY_SUB1M,
  b: INDUSTRY_1M_3M,
  c: INDUSTRY_3M_7M,
  d: INDUSTRY_7M_15M,
  e: INDUSTRY_15M_PLUS
};


(function() {

var answers = {};
var currentQ = 1;

var weights = { rq: 0.25, fd: 0.25, fh: 0.15, cp: 0.15, ta: 0.20 };

var scoring = {
1: { a: 0,   b: 40,  c: 70,  d: 90,  e: 100 },
2: { a: 100, b: 65,  c: 20,  d: 55 },
3: { a: 100, b: 65,  c: 25,  d: 0  },
4: { a: 100, b: 60,  c: 10,  d: 30 },
5: { a: 100, b: 65,  c: 25,  d: 0  },
6: { a: 100, b: 70,  c: 20,  d: 30 },
7: { a: 80,  b: 100, c: 60,  d: 0  },
8: { a: 100, b: 70,  c: 20,  d: 50 }
};

var caseStudyMap = {
rq: { title: 'Long Beach Surgical — how a hidden revenue gap became the entire acquisition thesis', url: '/exit/articles/long-beach-surgical-case-study' },
fd: { title: 'BuzzAngle Music — when founder relationships and contracts are the real asset', url: '/exit/articles/buzzangle-case-study' },
fh: { title: 'Long Beach Surgical — why clean financials compressed the diligence timeline', url: '/exit/articles/long-beach-surgical-case-study' },
cp: { title: 'Sourcing Journal — how narrow competitive positioning became the buyer\'s thesis', url: '/exit/articles/sourcing-journal-case-study' },
ta: { title: 'Sourcing Journal — a founder who sold from strength at exactly the right moment', url: '/exit/articles/sourcing-journal-case-study' }
};

function calcDimensions() {
var rq = ((scoring[1][answers[1]] || 0) * 0.3 + (scoring[2][answers[2]] || 0) * 0.4 + (scoring[4][answers[4]] || 0) * 0.3);
var fd = ((scoring[3][answers[3]] || 0) * 0.5 + (scoring[5][answers[5]] || 0) * 0.5);
var fh = scoring[6][answers[6]] || 0;
var cp = scoring[7][answers[7]] || 0;
var ta = scoring[8][answers[8]] || 0;
return { rq: rq, fd: fd, fh: fh, cp: cp, ta: ta };
}

function calcTotal(dims) {
return Math.round(dims.rq * weights.rq + dims.fd * weights.fd + dims.fh * weights.fh + dims.cp * weights.cp + dims.ta * weights.ta);
}

function getWeakestDim(dims) {
var list = [
{ key: 'fd', score: dims.fd, weight: weights.fd },
{ key: 'rq', score: dims.rq, weight: weights.rq },
{ key: 'ta', score: dims.ta, weight: weights.ta },
{ key: 'cp', score: dims.cp, weight: weights.cp },
{ key: 'fh', score: dims.fh, weight: weights.fh }
];
list.sort(function(a, b) { if (a.score !== b.score) return a.score - b.score; return b.weight - a.weight; });
return list[0].key;
}

function getFindings(ans, dims) {
var findings = [];
if (ans[2] === 'c') findings.push({ label: 'Revenue Quality', text: 'Your revenue is primarily project-based. Buyers will discount this 30–40% versus recurring revenue of the same size — they can\'t underwrite forward cash flows from one-time engagements.' });
else if (ans[2] === 'b') findings.push({ label: 'Revenue Quality', text: 'You have repeat customers but no formal contracts. A portion of your valuation will be discounted to reflect the risk that customers could leave without notice.' });
else if (ans[2] === 'a') findings.push({ label: 'Revenue Quality', text: 'Recurring contract revenue is the most underwritable structure. Buyers can model it, finance against it, and assign it a premium multiple.' });
if (ans[3] === 'd') findings.push({ label: 'Founder Dependence', text: 'Revenue would effectively stop if you stepped away. This is the single most common deal-killer across the $1M–$15M range — it either kills the deal or compresses price by 2–3x multiple turns.' });
else if (ans[3] === 'c') findings.push({ label: 'Founder Dependence', text: 'Revenue would decline significantly without you. Expect earnout requirements, extended transition periods, and scrutiny on key relationships.' });
if (ans[4] === 'c') findings.push({ label: 'Customer Concentration', text: 'Your top customer exceeds 25% of revenue. Expect demands for a retention agreement, possible escrow holdbacks, and a meaningful discount to your implied multiple.' });
else if (ans[4] === 'b') findings.push({ label: 'Customer Concentration', text: 'Your top customer is 10–25% of revenue. Buyers will probe the relationship depth, contract status, and what happens if that customer leaves post-close.' });
if (ans[5] === 'd') findings.push({ label: 'Operations', text: 'You are the management team. Without a management layer, the acquisition requires the buyer to install one — priced in as integration cost and risk.' });
if (ans[6] === 'c') findings.push({ label: 'Financial Health', text: 'Margins are compressing. Buyers will model this forward. Without a clear explanation, they\'ll assume structural deterioration and price accordingly.' });
else if (ans[6] === 'd') findings.push({ label: 'Financial Health', text: 'You don\'t track margins closely. Serious buyers will request 3 years of financials on the first call. This signals operational gaps that slow the process and compress valuation.' });
if (ans[7] === 'd') findings.push({ label: 'Competitive Position', text: 'Nothing makes this business hard to replicate. Buyers will price this as a cash-flow acquisition — expect 2.5–3.5x SDE versus 4–6x for defensible businesses.' });
if (ans[8] === 'c') findings.push({ label: 'Timing', text: 'You\'re considering an exit under pressure. Buyers sense urgency — it shifts negotiating leverage materially.' });
else if (ans[8] === 'a') findings.push({ label: 'Timing', text: 'Selling from a position of strength is the single best negotiating posture. You have optionality — and sophisticated buyers know it.' });
if (ans[1] === 'a') findings.push({ label: 'Scale', text: 'Businesses under $1M face a limited buyer universe. Individual buyers and micro-PE are the most likely acquirers at this scale.' });
return findings.slice(0, 3);
}

function getDimensionBreakdown(ans, weakestKey) {
var dimOrder = [
{ key: 'rq', label: 'Revenue Quality',      qKey: 2 },
{ key: 'fd', label: 'Founder Dependence',   qKey: 3 },
{ key: 'fh', label: 'Financial Health',     qKey: 6 },
{ key: 'cp', label: 'Competitive Position', qKey: 7 },
{ key: 'ta', label: 'Timing Alignment',     qKey: 8 }
];
var blockSet = (ans[1] === 'a' && typeof dimensionBlocksLite !== 'undefined')
? dimensionBlocksLite
: (typeof dimensionBlocksFull !== 'undefined' ? dimensionBlocksFull
: (typeof dimensionBlocks !== 'undefined' ? dimensionBlocks : null));
var blocks = [];
dimOrder.forEach(function(dim) {
var answerKey = ans[dim.qKey];
if (blockSet && blockSet[dim.key] && blockSet[dim.key][answerKey]) {
var block = blockSet[dim.key][answerKey];
blocks.push({ key: dim.key, label: dim.label, narrative: block.narrative, recommendation: block.recommendation, isWeakest: dim.key === weakestKey });
}
});
return blocks;
}

function getIndustryFraming(ans) {
if (typeof industryBlocks !== 'undefined' && industryBlocks[ans[1]]) return industryBlocks[ans[1]].text;
return null;
}

function getTrustActions(dims) {
return [
{ label: 'Revenue Quality', score: dims.rq, article: '/exit/articles/how-buyers-evaluate-revenue-quality', fix: 'Your revenue structure is the first thing buyers evaluate. Shifting even a portion to recurring contracts or retainers materially improves underwritability and your implied multiple.' },
{ label: 'Founder Dependence', score: dims.fd, article: '/exit/articles/founder-dependence-kills-deals', fix: 'Building a management layer that can operate without you is the highest-value pre-exit investment most owners never make. Start with documentation, then delegation, then a hire.' },
{ label: 'Financial Health', score: dims.fh, article: '/exit/articles/exit-readiness-checklist', fix: 'Buyers will request 3 years of clean financials on day one of diligence. Getting your books in order 18–24 months before a process is the minimum lead time for meaningful cleanup.' },
{ label: 'Competitive Position', score: dims.cp, article: '/exit/articles/what-buyers-actually-look-for', fix: 'Identifying and articulating your defensibility clearly changes how buyers frame the asset internally.' },
{ label: 'Timing Alignment', score: dims.ta, article: '/exit/articles/when-to-sell-your-business', fix: 'The right moment to sell is when you have optionality — not when you need to.' }
].sort(function(a, b) { return a.score - b.score; }).slice(0, 3);
}

function buildCheckoutUrl() {
var dims = calcDimensions();
var total = calcTotal(dims);
var dimList = [
{ label: 'revenue_quality', score: dims.rq },
{ label: 'founder_dependence', score: dims.fd },
{ label: 'financial_health', score: dims.fh },
{ label: 'competitive_position', score: dims.cp },
{ label: 'timing_alignment', score: dims.ta }
].sort(function(a, b) { return a.score - b.score; });
var params = new URLSearchParams();
params.set('score', total);
params.set('weakest', dimList[0].label);
params.set('q1', answers[1] || '');
params.set('q2', answers[2] || '');
params.set('q3', answers[3] || '');
params.set('q4', answers[4] || '');
params.set('q5', answers[5] || '');
params.set('q6', answers[6] || '');
params.set('q7', answers[7] || '');
params.set('q8', answers[8] || '');
return '/exit/checkout?' + params.toString();
}

function applyTierToCTA(q1) {
var isLite = (q1 === 'a');
var price = isLite ? '$199' : '$499';

var priceEl = document.getElementById('es-cta-price');
if (priceEl) priceEl.textContent = price;

var labelEl = document.getElementById('es-cta-label');
if (labelEl) labelEl.textContent = isLite ? 'Buyer-Lens Audit™ · Main Street Edition' : 'Buyer-Lens Audit™ · Full Report';

var subEl = document.getElementById('es-cta-sub');
if (subEl) {
if (isLite) {
subEl.innerHTML = 'Your Buyer-Lens Audit™ — Main Street Edition, calibrated for businesses under $1M in revenue and the individual SBA buyer universe. Grounded in the same framework Mike has applied across 75+ transactions and $500K to $2B+ deals. Delivered within 24 hours as a branded PDF and a browser-viewable version.';
} else {
subEl.innerHTML = 'Your full Buyer-Lens Audit™, calibrated for institutional buyers — PE platforms, strategic acquirers, search funds, family offices. Grounded in the same framework Mike has applied across 75+ transactions and $500K to $2B+ deals. Delivered within 24 hours as a branded PDF and a browser-viewable version.';
}
}

var deltaLabelEl = document.getElementById('es-delta-label');
var deltaHeadlineEl = document.getElementById('es-delta-headline');
var deltaBodyWrap = document.getElementById('es-delta-body-wrap');

if (isLite) {
if (deltaLabelEl) deltaLabelEl.textContent = 'What the Main Street Edition Adds';
if (deltaHeadlineEl) deltaHeadlineEl.textContent = 'The assessment tells you where you stand. The Main Street Edition tells you how an SBA buyer or individual acquirer would act on that information.';
if (deltaBodyWrap) {
deltaBodyWrap.innerHTML = '<p class="es-delta-body">The 8-question diagnostic scores what you can self-report. The Main Street Edition adds the three dimensions that require a buyer\'s judgment — buyer psychology, diligence pressure, and AI exposure — completing the six-dimension Buyer-Lens Audit™ framework. It maps your business against the actual sub-$1M buyer universe — individual SBA-backed buyers, ETA searchers, and micro-acquirers — and shows how each would frame your company differently. It identifies where SBA-buyer diligence will focus first: owner-add-back defensibility, transition risk, customer concentration, and seller-financing posture. It assesses your AI exposure concretely — what gets more valuable, what gets commoditized — because even small-business buyers in 2026 are pricing this in. And it ranks your pre-market action plan by valuation impact, with specific timelines for each action.</p><p class="es-delta-body">The 26-question depth produces analysis the 8-question diagnostic cannot: financial profile quality, documentation readiness, key-person exposure, diligence disclosure. Calibrated to your scale — not the same template watered down. Same buyer-lens framework, applied to the actual buyer universe at your size.</p>';
}
} else {
if (deltaLabelEl) deltaLabelEl.textContent = 'What the Full Report Adds';
if (deltaHeadlineEl) deltaHeadlineEl.textContent = 'The assessment above tells you where you stand. The full report tells you how a serious buyer would act on that information.';
if (deltaBodyWrap) {
deltaBodyWrap.innerHTML = '<p class="es-delta-body">The 8-question diagnostic scores what you can self-report. The Full Report adds the three dimensions that require a buyer\'s judgment — buyer psychology, diligence pressure, and AI exposure — completing the six-dimension Buyer-Lens Audit™ framework. It names the specific buyer types that would consider your business — strategic acquirers, PE platforms, search funds, or SBA-backed individuals — and shows how each would frame your company differently. It maps exactly where diligence pressure will focus first, before any buyer ever sits down with your books. It assesses your AI exposure concretely — what gets more valuable, what gets commoditized, what becomes defensible — because buyers in 2026 are pricing this into every transaction. And it ranks your pre-market action plan by valuation impact, with specific timelines for each action.</p><p class="es-delta-body">The 26-question depth produces analysis the 8-question diagnostic cannot: financial profile quality, documentation readiness, key person exposure beyond the founder, diligence disclosure. You\'ll finish the report knowing what a serious buyer would see, what they would pay, and what you can do in the next 6 to 18 months to change that number.</p>';
}
}
}

window.selectOption = function(el) {
var q = el.getAttribute('data-q');
var v = el.getAttribute('data-v');
document.querySelectorAll('[data-q="' + q + '"]').forEach(function(o) { o.classList.remove('selected'); o.setAttribute('aria-pressed','false'); });
el.classList.add('selected'); el.setAttribute('aria-pressed','true');
answers[parseInt(q)] = v;
var nextBtn = document.getElementById('es-next-' + q);
if (nextBtn) nextBtn.disabled = false;
};

window.nextQ = function(q) {
if (!answers[q]) return;
document.getElementById('es-q' + q).classList.remove('active');
currentQ = q + 1;
document.getElementById('es-q' + currentQ).classList.add('active'); document.getElementById('es-q' + currentQ + '-title').focus();
document.getElementById('es-q-current').textContent = currentQ;
document.getElementById('es-progress').style.width = ((currentQ / 8) * 100) + '%';
window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.prevQ = function(q) {
document.getElementById('es-q' + q).classList.remove('active');
currentQ = q - 1;
document.getElementById('es-q' + currentQ).classList.add('active'); document.getElementById('es-q' + currentQ + '-title').focus();
document.getElementById('es-q-current').textContent = currentQ;
document.getElementById('es-progress').style.width = ((currentQ / 8) * 100) + '%';
window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.showResults = function() {
if (!answers[8]) return;
var dims = calcDimensions();
var total = calcTotal(dims);
var weakestKey = getWeakestDim(dims);

document.getElementById('es-form').style.display = 'none';
document.getElementById('es-results').style.display = 'block';
document.getElementById('es-score-display').textContent = total; document.getElementById('main-content').focus();

var band, bandLabel;
if (total >= 80) { band = '80–100'; bandLabel = 'Strong exit position'; }
else if (total >= 60) { band = '60–79'; bandLabel = 'Solid foundation — specific gaps'; }
else if (total >= 40) { band = '40–59'; bandLabel = 'Material issues to address'; }
else { band = 'Below 40'; bandLabel = 'Foundational work needed first'; }
document.getElementById('es-score-band').textContent = band;
document.getElementById('es-score-band-label').textContent = bandLabel;

setTimeout(function() {
document.getElementById('bar-rq').style.width = dims.rq + '%';
document.getElementById('bar-fd').style.width = dims.fd + '%';
document.getElementById('bar-fh').style.width = dims.fh + '%';
document.getElementById('bar-cp').style.width = dims.cp + '%';
document.getElementById('bar-ta').style.width = dims.ta + '%';
document.getElementById('score-rq').textContent = Math.round(dims.rq);
document.getElementById('score-fd').textContent = Math.round(dims.fd);
document.getElementById('score-fh').textContent = Math.round(dims.fh);
document.getElementById('score-cp').textContent = Math.round(dims.cp);
document.getElementById('score-ta').textContent = Math.round(dims.ta);
}, 100);

var findings = getFindings(answers, dims);
var findingsHtml = '';
findings.forEach(function(f) {
findingsHtml += '<div class="es-finding"><div class="es-finding-label">' + f.label + '</div><div class="es-finding-text">' + f.text + '</div></div>';
});
document.getElementById('es-findings').innerHTML = findingsHtml;

var breakdown = getDimensionBreakdown(answers, weakestKey);
var breakdownHtml = '';
breakdown.forEach(function(b) {
var cls = b.isWeakest ? 'es-dim-block weakest' : 'es-dim-block';
breakdownHtml += '<div class="' + cls + '">';
if (b.isWeakest) breakdownHtml += '<div class="es-dim-block-eyebrow">Your Biggest Gap</div>';
breakdownHtml += '<div class="es-dim-block-label">' + b.label + '</div>';
breakdownHtml += '<div class="es-dim-block-narrative">' + b.narrative + '</div>';
breakdownHtml += '<div class="es-dim-block-rec"><span class="es-dim-block-rec-label">What to do: </span>' + b.recommendation + '</div>';
if (b.isWeakest && caseStudyMap[b.key]) {
breakdownHtml += '<div class="es-dim-block-case">See this pattern in practice: <a href="' + caseStudyMap[b.key].url + '">' + caseStudyMap[b.key].title + ' →</a></div>';
}
breakdownHtml += '</div>';
});
document.getElementById('es-dimension-breakdown').innerHTML = breakdownHtml;

var industryText = getIndustryFraming(answers);
if (industryText) document.getElementById('es-industry-framing').innerHTML = '<div class="es-industry-text">' + industryText + '</div>';

document.getElementById('es-path-high').style.display = 'none'; document.getElementById('es-path-low').style.display = 'none';
if (total >= 40) {
document.getElementById('es-path-high').style.display = 'block';
document.getElementById('es-checkout-link').href = buildCheckoutUrl();
applyTierToCTA(answers[1]);
} else {
document.getElementById('es-path-low').style.display = 'block';
var actions = getTrustActions(dims);
var actionsHtml = '';
actions.forEach(function(a, i) {
actionsHtml += '<div class="es-trust-action"><div class="es-trust-action-label">Priority ' + (i+1) + ' — ' + a.label + '</div>';
actionsHtml += '<div class="es-trust-action-text">' + a.fix + '</div>';
actionsHtml += '<a href="' + a.article + '">Read: ' + a.label + ' →</a></div>';
});
document.getElementById('es-trust-actions').innerHTML = actionsHtml;
}

window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.saveScore = function(path) {
var emailEl = document.getElementById('es-email-' + path);
var confirmEl = document.getElementById('es-email-confirm-' + path);
var email = emailEl ? emailEl.value.trim() : '';
if (!email || !email.includes('@')) { emailEl.style.borderColor = '#9A3B2A'; return; }
var dims = calcDimensions();
var total = calcTotal(dims);
var dimList = [
{ label: 'Revenue Quality', score: dims.rq },
{ label: 'Founder Dependence', score: dims.fd },
{ label: 'Financial Health', score: dims.fh },
{ label: 'Competitive Position', score: dims.cp },
{ label: 'Timing Alignment', score: dims.ta }
];
var weakest = dimList.sort(function(a, b) { return a.score - b.score; })[0].label;
var band = total >= 80 ? '80-100' : total >= 60 ? '60-79' : total >= 40 ? '40-59' : 'Below 40';
fetch('https://my-exitdesk.vercel.app/api/subscribe', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ email: email, score: total, weakestDimension: weakest, scoreBand: band, exitPath: path })
})
.then(function(r) { if (!r.ok) { throw new Error('subscribe failed'); } return r.json(); })
.then(function() { confirmEl.style.display = 'block'; emailEl.disabled = true; })
.catch(function() { confirmEl.style.display = 'block'; confirmEl.textContent = 'Something went wrong — your results weren\'t sent. Please try again.'; });
};

})();


var root = document.querySelector('[data-native-funnel]');
root.addEventListener('submit', function(event) {
  var form = event.target.closest('[data-score-email]');
  if (!form) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  window.saveScore(form.dataset.scoreEmail);
}, true);
root.addEventListener('click', function(event) {
  var button = event.target.closest('[data-funnel-action]');
  if (!button || !root.contains(button) || button.disabled) return;
  var action = button.dataset.funnelAction;
  var arg = button.dataset.funnelArgument;
  if (action === 'selectOption') window.selectOption(button);
  else if (action === 'nextQ') window.nextQ(Number(arg));
  else if (action === 'prevQ') window.prevQ(Number(arg));
  else if (action === 'showResults') window.showResults();
  else if (action === 'saveScore') window.saveScore(arg);
  else if (action === 'startCheckout') window.startCheckout();
});
var notice = document.getElementById('funnel-runtime-notice');
if (notice) notice.remove();
root.dataset.runtimeReady = 'true';

} if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',boot,{once:true});}else{boot();} })();
