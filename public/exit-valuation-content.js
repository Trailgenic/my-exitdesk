function getTier(revenue) {
  return revenue < 1000000 ? 'sde' : 'ebitda';
}

const industryMultiples = {
  'hvac-plumbing-electrical': {
    sde: { low: 2.5, high: 3.5 },
    ebitda: { low: 4.0, high: 6.0 },
    name: 'HVAC / Plumbing / Electrical',
    notes: 'High demand from PE roll-ups. Recurring service contracts add significant premium.'
  },
  landscaping: {
    sde: { low: 2.0, high: 3.0 },
    ebitda: { low: 3.5, high: 5.0 },
    name: 'Landscaping / Lawn Care',
    notes: 'Commercial contracts price 30-50% higher than residential.'
  },
  roofing: {
    sde: { low: 2.3, high: 3.3 },
    ebitda: { low: 3.8, high: 5.5 },
    name: 'Roofing / General Contracting'
  },
  cleaning: {
    sde: { low: 1.8, high: 2.8 },
    ebitda: { low: 3.0, high: 4.5 },
    name: 'Cleaning / Janitorial'
  },
  'auto-repair': {
    sde: { low: 2.0, high: 3.0 },
    ebitda: { low: 3.0, high: 4.5 },
    name: 'Auto Repair / Service'
  },
  dental: {
    sde: { low: 3.5, high: 4.5 },
    ebitda: { low: 5.5, high: 8.0 },
    name: 'Dental Practice',
    notes: 'DSO consolidation drives premium multiples. Multi-location commands 6-8x EBITDA.'
  },
  veterinary: {
    sde: { low: 3.5, high: 5.0 },
    ebitda: { low: 6.0, high: 9.0 },
    name: 'Veterinary Practice',
    notes: 'Heavy PE consolidation. Premium multiples for multi-doctor practices.'
  },
  'medical-practice': {
    sde: { low: 2.5, high: 4.0 },
    ebitda: { low: 4.5, high: 7.0 },
    name: 'Medical Practice'
  },
  'physical-therapy': {
    sde: { low: 2.5, high: 3.5 },
    ebitda: { low: 4.5, high: 6.5 },
    name: 'Physical Therapy / Wellness'
  },
  'med-spa': {
    sde: { low: 2.5, high: 3.5 },
    ebitda: { low: 4.0, high: 6.0 },
    name: 'Med Spa / Aesthetics'
  },
  accounting: {
    sde: { low: 1.0, high: 1.5 },
    ebitda: { low: 4.0, high: 6.0 },
    name: 'Accounting / CPA Firm',
    notes: 'Often valued at 1.0-1.3x revenue. Retention agreements common.'
  },
  'law-firm': {
    sde: { low: 1.5, high: 2.5 },
    ebitda: { low: 3.0, high: 5.0 },
    name: 'Law Firm'
  },
  consulting: {
    sde: { low: 2.0, high: 3.0 },
    ebitda: { low: 3.5, high: 5.5 },
    name: 'Consulting Firm',
    notes: 'People-and-relationships sale. Key person risk drives heavy adjustments.'
  },
  'marketing-agency': {
    sde: { low: 2.5, high: 3.5 },
    ebitda: { low: 4.0, high: 6.0 },
    name: 'Marketing / Creative Agency'
  },
  staffing: {
    sde: { low: 2.0, high: 3.0 },
    ebitda: { low: 3.5, high: 5.0 },
    name: 'Staffing / Recruiting'
  },
  restaurant: {
    sde: { low: 1.8, high: 2.8 },
    ebitda: { low: 3.0, high: 4.5 },
    name: 'Restaurant',
    notes: 'Lease terms and location heavily affect multiples.'
  },
  'cafe-coffee': {
    sde: { low: 2.0, high: 3.0 },
    ebitda: { low: 3.5, high: 5.0 },
    name: 'Café / Coffee Shop'
  },
  'specialty-retail': {
    sde: { low: 1.8, high: 2.8 },
    ebitda: { low: 3.0, high: 4.5 },
    name: 'Specialty Retail'
  },
  ecommerce: {
    sde: { low: 2.5, high: 4.0 },
    ebitda: { low: 4.0, high: 7.0 },
    name: 'E-commerce / DTC'
  },
  'salon-spa': {
    sde: { low: 1.5, high: 2.5 },
    ebitda: { low: 2.5, high: 4.0 },
    name: 'Salon / Spa'
  },
  fitness: {
    sde: { low: 2.0, high: 3.0 },
    ebitda: { low: 3.5, high: 5.0 },
    name: 'Fitness / Gym'
  },
  manufacturing: {
    sde: { low: 2.5, high: 3.5 },
    ebitda: { low: 4.0, high: 6.5 },
    name: 'Manufacturing',
    notes: 'Working capital and equipment value affect price beyond multiple.'
  },
  distribution: {
    sde: { low: 2.5, high: 3.5 },
    ebitda: { low: 4.0, high: 5.5 },
    name: 'Distribution / Wholesale'
  },
  'technology-saas': {
    sde: { low: 3.0, high: 5.0 },
    ebitda: { low: 5.0, high: 10.0 },
    name: 'Technology / SaaS',
    notes: 'Recurring revenue businesses often valued on revenue multiples (2-6x ARR).'
  },
  'digital-media': {
    sde: { low: 2.0, high: 3.5 },
    ebitda: { low: 3.0, high: 5.0 },
    name: 'Digital Media / Publishing',
    notes: 'Traffic concentration and ad-revenue dependence are primary risk factors.'
  },
  'other-service': {
    sde: { low: 2.0, high: 3.0 },
    ebitda: { low: 3.5, high: 5.0 },
    name: 'Other Service Business'
  }
};

function getRecurringRevenueAdjustment(percent) {
  if (percent >= 75) return { factor: 1.2, label: 'Strong recurring revenue (+20%)' };
  if (percent >= 50) return { factor: 1.1, label: 'Solid recurring revenue (+10%)' };
  if (percent >= 25) return { factor: 1.0, label: 'Mixed revenue mix (neutral)' };
  if (percent >= 10) return { factor: 0.92, label: 'Mostly transactional (-8%)' };
  return { factor: 0.85, label: 'Fully transactional (-15%)' };
}

function getConcentrationAdjustment(percent) {
  if (percent <= 10) return { factor: 1.05, label: 'Diversified customer base (+5%)' };
  if (percent <= 20) return { factor: 1.0, label: 'Healthy concentration (neutral)' };
  if (percent <= 35) return { factor: 0.85, label: 'Moderate concentration risk (-15%)' };
  if (percent <= 50) return { factor: 0.7, label: 'High concentration risk (-30%)' };
  return { factor: 0.5, label: 'Severe concentration risk (-50%)' };
}

function getOwnerInvolvementAdjustment(level) {
  const map = {
    removed: { factor: 1.15, label: 'Owner-removed operations (+15%)' },
    'part-time': { factor: 1.0, label: 'Owner-involved but not critical (neutral)' },
    'full-time': { factor: 0.75, label: 'Owner-operator dependency (-25%)' }
  };
  return map[level] || map['full-time'];
}

function getManagementAdjustment(level) {
  const map = {
    strong: { factor: 1.1, label: 'Strong management team (+10%)' },
    team: { factor: 1.0, label: 'Capable team (neutral)' },
    solo: { factor: 0.8, label: 'No management layer (-20%)' }
  };
  return map[level] || map.solo;
}

function calculateScenarios(inputs) {
  const tier = getTier(inputs.revenue);
  const industry = industryMultiples[inputs.industry];
  if (!industry) return null;
  const baseMultiple = tier === 'sde' ? industry.sde : industry.ebitda;

  const recurring = getRecurringRevenueAdjustment(inputs.recurring);
  const concentration = getConcentrationAdjustment(inputs.concentration);
  const owner = getOwnerInvolvementAdjustment(inputs.owner);
  const management = getManagementAdjustment(inputs.management);

  const todayFactor = recurring.factor * concentration.factor * owner.factor * management.factor;

  const ownerOptimized =
    inputs.owner === 'full-time'
      ? getOwnerInvolvementAdjustment('part-time')
      : inputs.owner === 'part-time'
        ? getOwnerInvolvementAdjustment('removed')
        : owner;
  const mgmtOptimized =
    inputs.management === 'solo'
      ? getManagementAdjustment('team')
      : inputs.management === 'team'
        ? getManagementAdjustment('strong')
        : management;
  const optimizedFactor = recurring.factor * concentration.factor * ownerOptimized.factor * mgmtOptimized.factor;

  const premarketRecurring = inputs.recurring < 50 ? getRecurringRevenueAdjustment(50) : recurring;
  const premarketFactor = premarketRecurring.factor * concentration.factor * 1.15 * 1.1;

  return {
    tier,
    today: {
      multipleLow: baseMultiple.low * todayFactor,
      multipleHigh: baseMultiple.high * todayFactor,
      valueLow: baseMultiple.low * todayFactor * inputs.earnings,
      valueHigh: baseMultiple.high * todayFactor * inputs.earnings
    },
    optimized: {
      multipleLow: baseMultiple.low * optimizedFactor,
      multipleHigh: baseMultiple.high * optimizedFactor,
      valueLow: baseMultiple.low * optimizedFactor * inputs.earnings,
      valueHigh: baseMultiple.high * optimizedFactor * inputs.earnings
    },
    premarket: {
      multipleLow: baseMultiple.low * premarketFactor,
      multipleHigh: baseMultiple.high * premarketFactor,
      valueLow: baseMultiple.low * premarketFactor * inputs.earnings,
      valueHigh: baseMultiple.high * premarketFactor * inputs.earnings
    },
    adjustments: { recurring, concentration, owner, management },
    industryNotes: industry.notes || null
  };
}

function generateNarratives(scenarios, inputs) {
  const tier = scenarios.tier.toUpperCase();
  const drags = [];
  const lifts = [];

  if (scenarios.adjustments.recurring.factor < 1.0) drags.push('low recurring revenue');
  if (scenarios.adjustments.recurring.factor > 1.0) lifts.push('strong recurring revenue');
  if (scenarios.adjustments.concentration.factor < 1.0) drags.push('customer concentration risk');
  if (scenarios.adjustments.concentration.factor > 1.0) lifts.push('diversified customer base');
  if (scenarios.adjustments.owner.factor < 1.0) drags.push('owner-operator dependency');
  if (scenarios.adjustments.owner.factor > 1.0) lifts.push('owner-removed operations');
  if (scenarios.adjustments.management.factor < 1.0) drags.push('no management layer');
  if (scenarios.adjustments.management.factor > 1.0) lifts.push('strong management team');

  let todayNarrative = `Based on your inputs, a buyer today would value this business at a multiple of ${formatMultiple(scenarios.today.multipleLow)} to ${formatMultiple(scenarios.today.multipleHigh)} ${tier}. `;
  if (drags.length > 0) todayNarrative += `What's pulling this down: ${drags.join(', ')}. `;
  if (lifts.length > 0) todayNarrative += `What's working in your favor: ${lifts.join(', ')}. `;

  let optimizedNarrative = '';
  const ownerOptimizable = inputs.owner === 'full-time' || inputs.owner === 'part-time';
  const mgmtOptimizable = inputs.management === 'solo' || inputs.management === 'team';
  if (ownerOptimizable || mgmtOptimizable) {
    optimizedNarrative = `If you reduced owner-operator dependency and built a stronger management layer over 6-12 months, buyers would re-rate this business to ${formatMultiple(scenarios.optimized.multipleLow)} to ${formatMultiple(scenarios.optimized.multipleHigh)} ${tier}. That's the difference between a key-person discount and a transferable asset.`;
  } else {
    optimizedNarrative = 'Your operational structure is already favorable. The optimized scenario reflects modest gains achievable in the next 6-12 months.';
  }

  const premarketNarrative = `A focused 90-180 day pre-market preparation — formalizing recurring contracts, documenting systems, demonstrating owner-removed operations, strengthening management — typically lifts the multiple to ${formatMultiple(scenarios.premarket.multipleLow)} to ${formatMultiple(scenarios.premarket.multipleHigh)} ${tier}. This is what professional sellers do before they go to market.`;

  const todayMid = (scenarios.today.valueLow + scenarios.today.valueHigh) / 2;
  const premarketMid = (scenarios.premarket.valueLow + scenarios.premarket.valueHigh) / 2;
  const upliftPercent = Math.round(((premarketMid - todayMid) / todayMid) * 100);

  return {
    today: todayNarrative,
    optimized: optimizedNarrative,
    premarket: premarketNarrative,
    upliftPercent: `Pre-market positioning could lift this business by ${upliftPercent}% — without changing the underlying numbers.`
  };
}

function formatMultiple(num) {
  return num.toFixed(1) + 'x';
}

function formatCurrency(num) {
  if (num >= 1000000) return '$' + (num / 1000000).toFixed(1) + 'M';
  return '$' + Math.round(num / 1000) + 'K';
}

function calculateAndDisplay() {
  const inputs = {
    revenue: parseFloat(document.getElementById('input-revenue').value) || 0,
    earnings: parseFloat(document.getElementById('input-earnings').value) || 0,
    industry: document.getElementById('input-industry').value,
    recurring: parseFloat(document.getElementById('input-recurring').value) || 0,
    concentration: parseFloat(document.getElementById('input-concentration').value) || 20,
    owner: document.getElementById('input-owner').value,
    management: document.getElementById('input-management').value
  };

  if (!inputs.revenue || !inputs.earnings || !inputs.industry || !inputs.owner || !inputs.management) {
    const container = document.getElementById('output-container');
    if (container) container.style.display = 'none';
    return;
  }

  const scenarios = calculateScenarios(inputs);
  if (!scenarios) return;
  const narratives = generateNarratives(scenarios, inputs);

  document.getElementById('output-tier').textContent = scenarios.tier.toUpperCase() + '-based valuation';
  document.getElementById('output-today-low').textContent = formatCurrency(scenarios.today.valueLow);
  document.getElementById('output-today-high').textContent = formatCurrency(scenarios.today.valueHigh);
  document.getElementById('output-today-multiple').textContent =
    formatMultiple(scenarios.today.multipleLow) + ' – ' + formatMultiple(scenarios.today.multipleHigh) + ' ' + scenarios.tier.toUpperCase();
  document.getElementById('output-narrative-today').textContent = narratives.today;
  document.getElementById('output-optimized-low').textContent = formatCurrency(scenarios.optimized.valueLow);
  document.getElementById('output-optimized-high').textContent = formatCurrency(scenarios.optimized.valueHigh);
  document.getElementById('output-optimized-multiple').textContent =
    formatMultiple(scenarios.optimized.multipleLow) + ' – ' + formatMultiple(scenarios.optimized.multipleHigh) + ' ' + scenarios.tier.toUpperCase();
  document.getElementById('output-narrative-optimized').textContent = narratives.optimized;
  document.getElementById('output-premarket-low').textContent = formatCurrency(scenarios.premarket.valueLow);
  document.getElementById('output-premarket-high').textContent = formatCurrency(scenarios.premarket.valueHigh);
  document.getElementById('output-premarket-multiple').textContent =
    formatMultiple(scenarios.premarket.multipleLow) + ' – ' + formatMultiple(scenarios.premarket.multipleHigh) + ' ' + scenarios.tier.toUpperCase();
  document.getElementById('output-narrative-premarket').textContent = narratives.premarket;
  document.getElementById('output-uplift-percent').textContent = narratives.upliftPercent;

  const container = document.getElementById('output-container');
  if (container) container.style.display = 'block';

  if (typeof gtag === 'function') {
    gtag('event', 'valuation_calculated', {
      industry: inputs.industry,
      tier: scenarios.tier,
      today_mid: (scenarios.today.valueLow + scenarios.today.valueHigh) / 2
    });
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const inputIds = [
    'input-revenue',
    'input-earnings',
    'input-industry',
    'input-recurring',
    'input-concentration',
    'input-owner',
    'input-management'
  ];
  inputIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', calculateAndDisplay);
      el.addEventListener('input', calculateAndDisplay);
    }
  });

  const calcBtn = document.getElementById('calculate-button');
  if (calcBtn) calcBtn.addEventListener('click', calculateAndDisplay);
});
