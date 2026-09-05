const { test } = require('node:test');
const assert = require('node:assert/strict');
const api = require('../public/acquisition-first-look.js');
const clean = { ...api.sample, name: 'Fictional complete case', evidence: 'financials', earningsQuality: 'explained', customers: 'reviewed', owner: 'covered', consent: 'identified' };
test('unknown amounts stay unknown; empty input cannot advance', () => {
  const r = api.evaluate({});
  assert.equal(r.input.revenue, null);
  assert.equal(r.multiple, null);
  assert.equal(r.posture, 'Gather the basic facts');
  assert.ok(r.gaps.length >= 8);
});
test('the sample produces concrete risks and a descriptive ratio', () => {
  const r = api.evaluate(api.sample);
  assert.equal(r.posture, 'Investigate before advancing');
  assert.equal(r.multiple, 5);
  assert.deepEqual(r.risks.map(x => x.code), ['earnings_quality', 'customers', 'owner']);
  assert.ok(r.questions.some(x => x.code === 'consent'));
});
test('complete supplied answers advance only to initial diligence', () => {
  const r = api.evaluate(clean);
  assert.equal(r.posture, 'Advance to initial diligence');
  assert.match(r.rationale, /do not establish value/);
  assert.match(api.brief(r), /No documents have been uploaded or independently verified/);
});
test('unknown source or missing price basis blocks clean advancement', () => {
  for (const changes of [{ evidence: 'unknown' }, { source: '' }, { priceBasis: 'unknown' }]) {
    assert.equal(api.evaluate({ ...clean, ...changes }).posture, 'Investigate before advancing');
  }
});
test('consent uncertainty triggers diligence rather than a categorical pass', () => {
  const r = api.evaluate({ ...clean, consent: 'unresolved' });
  assert.equal(r.posture, 'Investigate before advancing');
  assert.ok(r.questions.some(x => /authorize the transaction/.test(x.detail)));
});
test('equity price, SDE, unknown measure and nonpositive earnings never become EV/EBITDA', () => {
  for (const changes of [{ priceBasis: 'equity' }, { metric: 'sde' }, { metric: 'unknown' }, { earnings: 0 }, { earnings: -20 }]) {
    assert.equal(api.evaluate({ ...clean, ...changes }).multiple, null);
  }
});
test('zero remains a disclosed zero; nonpositive earnings and special situations exit the normal screen', () => {
  for (const changes of [{ revenue: 0 }, { earnings: 0 }, { earnings: -20 }, { scope: 'special' }]) {
    assert.equal(api.evaluate({ ...clean, ...changes }).posture, 'Use a specialist review');
  }
  assert.equal(api.evaluate({ ...clean, price: 0 }).input.price, 0);
});
test('known mandate mismatch does not become a verdict on company quality', () => {
  assert.equal(api.evaluate({ ...clean, fit: 'no' }).posture, 'Set aside for this mandate');
});
test('malformed or unreasonable numeric values are rejected', () => {
  for (const value of ['NaN', Infinity, '3m', '-1', '1,000', '1e9', '0x10', true, {}, '123.456', '1000000000001']) {
    assert.throws(() => api.evaluate({ ...clean, price: value }));
  }
  assert.throws(() => api.evaluate({ ...clean, fit: 'invented' }));
});
test('inconsistent financial perimeter is flagged', () => {
  const r = api.evaluate({ ...clean, revenue: 100000, earnings: 200000 });
  assert.equal(r.posture, 'Investigate before advancing');
  assert.ok(r.questions.some(x => x.code === 'unusual_earnings'));
});
test('export retains all questions, source context and user-reported evidence status', () => {
  const r = api.evaluate(api.sample);
  const brief = api.brief(r, '2026-09-05');
  for (const q of r.questions) assert.ok(brief.includes(q.detail));
  assert.ok(brief.includes(api.sample.source));
  assert.ok(brief.includes('evidence: teaser'));
  assert.match(brief, /same completed financial year/);
});
