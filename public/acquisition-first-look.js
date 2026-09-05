/* Acquisition Lens: preliminary triage only. Shared by the Webflow embed and Node tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.AcquisitionFirstLook = api;
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';
  const VERSION = '1.0.0';
  const choices = {
    scope: ['operating', 'special', 'unknown'],
    fit: ['yes', 'no', 'unknown'],
    metric: ['ebitda', 'sde', 'unknown'],
    priceBasis: ['enterprise', 'equity', 'unknown'],
    evidence: ['teaser', 'financials', 'reconciled', 'unknown'],
    earningsQuality: ['explained', 'unresolved', 'unknown'],
    customers: ['reviewed', 'exposed', 'unknown'],
    owner: ['covered', 'dependent', 'unknown'],
    consent: ['identified', 'unresolved', 'unknown']
  };
  const text = value => typeof value === 'string' ? value.trim().slice(0, 500) : '';
  function amount(value, label, allowNegative = false) {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value !== 'string' && typeof value !== 'number') throw new Error(label + ': enter a number or leave it blank.');
    const raw = String(value).trim();
    if (!raw) return null;
    if (!/^-?\d+(\.\d{1,2})?$/.test(raw)) throw new Error(label + ': use plain numbers, with at most two decimals.');
    const number = Number(raw);
    if (!Number.isFinite(number) || Math.abs(number) > 1000000000000 || (!allowNegative && number < 0)) {
      throw new Error(label + ': enter a valid amount within the screen’s range.');
    }
    return number;
  }
  function normalize(raw = {}) {
    const input = { name: text(raw.name) || 'Unnamed opportunity', thesis: text(raw.thesis), source: text(raw.source) };
    Object.entries(choices).forEach(([key, values]) => {
      input[key] = raw[key] === undefined || raw[key] === '' ? 'unknown' : raw[key];
      if (!values.includes(input[key])) throw new Error('Please select a valid answer for ' + key + '.');
    });
    input.revenue = amount(raw.revenue, 'Revenue');
    input.earnings = amount(raw.earnings, 'Reported earnings', true);
    input.price = amount(raw.price, 'Asking price');
    return input;
  }
  function evaluate(raw) {
    const input = normalize(raw);
    const gaps = [], risks = [], questions = [], positives = [];
    const add = (list, code, detail, question) => {
      list.push({ code, detail });
      if (question) questions.push({ code, detail: question });
    };
    if (input.scope === 'unknown') add(gaps, 'scope', 'The business type is not established.', 'Is this an established operating business, or a startup, distressed situation, or minority investment?');
    if (input.fit === 'unknown' || !input.thesis) add(gaps, 'fit', 'The buyer’s acquisition rationale is incomplete.', 'What capability, customer access, or operating opportunity would this acquisition add, and what would rule it out?');
    if (input.fit === 'yes' && input.thesis) positives.push({ code: 'fit', detail: 'The buyer reports mandate fit and has stated an acquisition rationale.' });
    if (input.revenue === null || input.earnings === null || input.metric === 'unknown') add(gaps, 'economics', 'Annual revenue and a defined earnings measure are not all available.', 'Request revenue and reported EBITDA or SDE for the same completed financial year, with definitions and source documents.');
    if (input.price === null || input.priceBasis === 'unknown') add(gaps, 'price', 'Asking price or its enterprise/equity basis is missing.', 'What does the asking price include: cash, debt, working capital, real estate, and transaction expenses?');
    if (input.revenue === 0) add(risks, 'zero_revenue', 'Reported revenue is zero; the operating-business screen may not fit.', 'Confirm the reporting period and whether this is an asset purchase or pre-revenue business.');
    if (input.revenue !== null && input.earnings !== null && input.earnings > input.revenue) add(risks, 'unusual_earnings', 'Reported earnings exceed revenue and need reconciliation.', 'Do the revenue and earnings figures cover the same period, currency, and business perimeter? Explain non-operating items.');
    if (input.evidence === 'unknown' || input.evidence === 'teaser') add(gaps, 'financial_evidence', input.evidence === 'teaser' ? 'Financial figures are supported only by a teaser or listing, according to the buyer.' : 'The supporting financial evidence is unknown.', 'Request historical financial statements and a bridge from reported earnings to the seller’s adjusted earnings.');
    else positives.push({ code: 'financial_evidence', detail: input.evidence === 'reconciled' ? 'The buyer reports reconciling financial figures to underlying records; this tool has not verified that work.' : 'The buyer reports having seller financial statements; the figures remain unverified here.' });
    if (!input.source) add(gaps, 'source', 'No source or reporting-period note was recorded.', 'Record the document name, date, financial period, and any caveats so another reviewer can trace the figures.');
    if (input.earningsQuality === 'unresolved') add(risks, 'earnings_quality', 'Add-backs, unusual items, or earnings inconsistencies remain unresolved.', 'Which adjustments have documentary support, recur after closing, or require replacement spending?');
    else if (input.earningsQuality === 'unknown') add(gaps, 'earnings_quality', 'The quality of reported earnings has not been reviewed.', 'Reconcile reported and adjusted earnings, including owner compensation and nonrecurring items.');
    else positives.push({ code: 'earnings_quality', detail: 'The buyer reports reviewing earnings adjustments and their explanations.' });
    if (input.customers === 'exposed') add(risks, 'customers', 'The buyer identified customer concentration or retention exposure.', 'Which customer losses would change the case, and what evidence supports retention and contract transfer?');
    else if (input.customers === 'unknown') add(gaps, 'customers', 'Customer concentration and retention have not been assessed.', 'Request revenue by customer, retention history, and material contract assignment or change-of-control provisions.');
    if (input.owner === 'dependent') add(risks, 'owner', 'Operations or relationships depend on the departing owner.', 'Who will own the seller’s duties and customer relationships after closing, at what cost, and with what transition support?');
    else if (input.owner === 'unknown') add(gaps, 'owner', 'The post-close operating and transition plan is unknown.', 'Map the owner’s responsibilities, management coverage, and replacement costs before treating earnings as transferable.');
    if (input.consent !== 'identified') add(input.consent === 'unresolved' ? risks : gaps, 'consent', 'The required approval and consent path is unresolved.', 'Who can authorize the transaction, and which shareholder, board, lender, or contract consents are needed?');

    let posture, rationale;
    if (input.fit === 'no') {
      posture = 'Set aside for this mandate';
      rationale = 'The buyer reports that the opportunity does not fit the mandate. Revisit only if the mandate or facts change.';
    } else if (input.scope === 'special' || (input.earnings !== null && input.earnings <= 0) || input.revenue === 0) {
      posture = 'Use a specialist review';
      rationale = 'This first-look workflow is designed for established businesses with positive reported earnings. A different acquisition case needs a tailored analysis.';
    } else if (input.scope === 'unknown' || input.fit === 'unknown' || !input.thesis || input.revenue === null || input.earnings === null || input.metric === 'unknown') {
      posture = 'Gather the basic facts';
      rationale = 'The current inputs do not establish buyer fit and basic operating economics. Close those gaps before drawing a deal conclusion.';
    } else if (gaps.length || risks.length) {
      posture = 'Investigate before advancing';
      rationale = 'The opportunity has enough context for a targeted follow-up, but unresolved evidence or operating risks prevent a clean first-pass handoff.';
    } else {
      posture = 'Advance to initial diligence';
      rationale = 'The supplied answers support spending time on initial diligence. They do not establish value, financing capacity, an LOI decision, or approval to buy.';
    }
    const comparable = input.price !== null && input.priceBasis === 'enterprise' && input.metric === 'ebitda' && input.earnings !== null && input.earnings > 0;
    const multiple = comparable ? input.price / input.earnings : null;
    return { version: VERSION, input, posture, rationale, gaps, risks, questions, positives, multiple,
      multipleNote: comparable ? 'Asking enterprise value ÷ reported EBITDA. A descriptive ratio only; earnings are not normalized and no market valuation range is implied.' : 'No comparable EV / EBITDA ratio: a stated enterprise-value price and positive reported EBITDA are both required. Equity price and SDE are not substituted.',
      nextStage: ['Reconstruct sustainable earnings and replacement costs.', 'Assess working capital, capital expenditure, liabilities, and cash conversion.', 'Underwrite standalone value, financing, and downside before any commitment.'] };
  }
  function brief(result, createdAt) {
    const money = value => value === null ? 'Unknown' : 'USD ' + value.toLocaleString('en-US', { maximumFractionDigits: 2 });
    const list = items => items.length ? items.map(x => '- ' + x.detail).join('\n') : '- None identified from supplied answers.';
    const i = result.input;
    return ['ACQUISITION LENS — FIRST-LOOK BRIEF', 'Method v' + result.version + (createdAt ? ' | ' + createdAt : ''), i.name,
      '\nNEXT STEP: ' + result.posture, result.rationale, '\nBUYER RATIONALE', i.thesis || 'Not supplied', '\nSOURCE NOTE (BUYER-SUPPLIED)', i.source || 'Not supplied',
      '\nREPORTED ECONOMICS — same completed financial year; USD', 'Revenue: ' + money(i.revenue), 'Earnings (' + i.metric.toUpperCase() + '): ' + money(i.earnings), 'Asking price (' + i.priceBasis + '): ' + money(i.price),
      result.multiple === null ? result.multipleNote : 'Asking EV / reported EBITDA: ' + result.multiple.toFixed(2) + 'x. ' + result.multipleNote,
      '\nBUYER-REPORTED ANSWERS', ...Object.keys(choices).map(key => key + ': ' + i[key]),
      '\nSUPPORTING INPUTS', list(result.positives), '\nRISKS TO INVESTIGATE', list(result.risks), '\nEVIDENCE GAPS', list(result.gaps), '\nNEXT QUESTIONS', list(result.questions),
      '\nREQUIRED IN THE NEXT STAGE', ...result.nextStage.map(x => '- ' + x),
      '\nPreliminary triage based solely on user inputs. No documents have been uploaded or independently verified. This is not a valuation, financing decision, completed diligence, or investment recommendation.'].join('\n');
  }
  const sample = { name: 'Sample: Harbor Field Services (fictional)', thesis: 'An adjacent operator wants to expand regional service coverage and add a trained field team.', source: 'Fictional seller teaser, illustrative FY2025 figures in USD. No real company or transaction.', scope: 'operating', fit: 'yes', revenue: '4000000', earnings: '600000', metric: 'ebitda', price: '3000000', priceBasis: 'enterprise', evidence: 'teaser', earningsQuality: 'unresolved', customers: 'exposed', owner: 'dependent', consent: 'unknown' };
  return { VERSION, normalize, evaluate, brief, sample };
});
