/** Stalled Exit v0. Evidence priority, never a probability of failure to sell. */
export const VERSION = 'stalled-exit-v0.1';
export type Audience = 'seller' | 'broker';
export interface Source {
  id: string; domain: string; terms_url: string; reviewed_at: string;
  research: 'allowed' | 'blocked' | 'pending';
  outreach: 'allowed' | 'blocked' | 'pending';
  automated_fetch: boolean; basis: string;
}
export interface Evidence {
  id: string; source_id: string; url: string; observed_at: string;
  kind: 'original_published_at' | 'active' | 'price' | 'price_reduced' |
    'seller_financing_added' | 'terms_improved' | 'relisted' | 'manual_refresh' |
    'broker_changed' | 'urgency';
  value: string | number | boolean;
  excerpt: string; verified: boolean;
  /** Same business, assets, real estate and currency. Required for comparisons. */
  comparable_basis?: string;
  /** Changes require a prior observation or explicit dated announcement. */
  prior_evidence_id?: string;
  explicit_change_statement?: boolean;
}
export interface Candidate {
  id: string; entity_key: string; listing_url: string; source_id: string;
  business_name: string | null; public_listing_label: string;
  country: string; state: string; sector: string;
  asking_price: number | null; currency: string;
  revenue: number | null; cash_flow: number | null;
  operating_company: boolean | null; owner_operated: boolean | null;
  representation: 'owner_direct' | 'broker' | 'unknown';
  status: 'active' | 'under_offer' | 'sold' | 'withdrawn' | 'unknown';
  original_published_at: string | null;
  first_seen_at: string; last_updated_at: string | null;
  active_verified_at: string | null;
  evidence: Evidence[];
  resolution: {
    confidence: 'high' | 'medium' | 'low';
    evidence_urls: string[]; notes: string;
    /** Never guess a confidential business identity from location/financials. */
    confidential: boolean;
  };
  contact?: {
    id: string; first_name?: string; email: string; audience: Audience;
    entity_key: string; source_id: string; source_url: string;
    verified_at: string; role_verified: boolean; us_verified: boolean;
    business_email: boolean; provider_verified: boolean;
  };
}
const day = 86400000;
const time = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}(T.*)?$/.test(v) ? Date.parse(v) : NaN;
export function ageDays(v: string | null, now: string): number | null {
  const n = (time(now) - time(v)) / day;
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}
export function validUrl(value: string) {
  try { return new URL(value).protocol === 'https:'; } catch { return false; }
}
function withinDomain(url: string, domain: string) {
  try { const h = new URL(url).hostname; return h === domain || h.endsWith('.' + domain); } catch { return false; }
}
export function assess(c: Candidate, sources: Source[], now = new Date().toISOString()) {
  const reasons: string[] = [];
  const source = (id: string) => sources.find(s => s.id === id);
  const permitted = (e: Evidence) => {
    const s = source(e.source_id);
    return e.verified && !!e.excerpt.trim() && validUrl(e.url) && !!s &&
      s.research === 'allowed' && !!s.basis.trim() && withinDomain(e.url, s.domain) &&
      ageDays(s.reviewed_at, now) !== null && ageDays(s.reviewed_at, now)! <= 30 && ageDays(e.observed_at, now) !== null;
  };
  const ev = c.evidence.filter(permitted);
  if (new Set(c.evidence.map(e => e.id)).size !== c.evidence.length) reasons.push('duplicate_evidence_ids');
  const changed = (e: Evidence) => e.explicit_change_statement === true || !!ev.find(p => p.id === e.prior_evidence_id && time(p.observed_at) < time(e.observed_at));
  const original = ev.find(e => e.kind === 'original_published_at' && e.value === c.original_published_at);
  const originalAge = original ? ageDays(c.original_published_at, now) : null;
  const firstSeenAge = ageDays(c.first_seen_at, now);
  // First seen is only a lower bound, never substituted into original publication.
  const activeHistory = ev.filter(e => e.kind === 'active' && e.value === true).sort((a,b)=>time(a.observed_at)-time(b.observed_at));
  const observedAge = activeHistory.length ? ageDays(activeHistory[0].observed_at, now) : null;
  const age = originalAge ?? observedAge;
  const duration = age === null ? 0 : age > 365 ? 35 : age > 180 ? 22 : age > 90 ? 10 : 0;
  const prices = ev.filter(e => e.kind === 'price' && typeof e.value === 'number' && e.value > 0 && e.comparable_basis).sort((a,b)=>time(a.observed_at)-time(b.observed_at));
  const drops: { before: Evidence; after: Evidence }[] = [];
  const lastByBasis = new Map<string, Evidence>();
  for (const p of prices) {
    const prior = lastByBasis.get(p.comparable_basis!);
    if (prior && time(p.observed_at) > time(prior.observed_at) && Number(p.value) < Number(prior.value)) drops.push({before:prior,after:p});
    lastByBasis.set(p.comparable_basis!, p);
  }
  const explicitReduction = ev.some(e => e.kind === 'price_reduced' && e.value === true);
  // Count actual observed drops; explicit copy proves at least one, not an extra one.
  const dropCount = Math.max(drops.length, explicitReduction ? 1 : 0);
  let reductionPct: number | null = null;
  if (drops.length) {
    const latest = drops[drops.length-1].after;
    const same = prices.filter(p=>p.comparable_basis === latest.comparable_basis);
    const initial = same[0]; const current = same[same.length-1];
    reductionPct = Math.max(0, (Number(initial.value)-Number(current.value))/Number(initial.value)*100);
  }
  const repricing = dropCount ? Math.min(30, 15 + Math.min(10,(dropCount-1)*5) + ((reductionPct??0)>=20 ? 5 : (reductionPct??0)>=10 ? 3 : 0)) : 0;
  const financing = ev.some(e=>e.kind === 'seller_financing_added' && e.value === true && changed(e));
  const termsChange = ev.some(e=>e.kind === 'terms_improved' && e.value === true && changed(e));
  const terms = (financing ? 8 : 0) + (termsChange ? 7 : 0);
  const relist = ev.some(e=>e.kind === 'relisted' && e.value === true && changed(e));
  const refreshes = new Set(ev.filter(e=>e.kind === 'manual_refresh' && changed(e)).map(e=>e.observed_at)).size;
  const brokerChange = ev.some(e=>e.kind === 'broker_changed' && e.value === true && changed(e));
  const process = (relist ? 6 : 0) + (refreshes >= 2 ? 2 : 0) + (brokerChange ? 2 : 0);
  const language: Record<string,number> = {motivated_seller:4,quick_sale:6,must_sell:8,distressed:10};
  const urgency = Math.max(0,...ev.filter(e=>e.kind==='urgency').map(e=>language[String(e.value)]??0));
  const score = duration + repricing + terms + process + urgency;
  const strong = (age??0)>180 || dropCount>0 || (terms>0 && (relist || urgency>0));
  if (c.country !== 'US' || c.currency !== 'USD') reasons.push('outside_us_usd');
  if (!c.state) reasons.push('state_unverified');
  if (c.status !== 'active') reasons.push('not_active');
  const activeAge = ageDays(c.active_verified_at,now);
  if (activeAge === null || activeAge > 7 || !activeHistory.some(e=>e.observed_at===c.active_verified_at)) reasons.push('active_status_unverified_or_stale');
  if (c.operating_company !== true) reasons.push('operating_company_unverified');
  if (c.owner_operated !== true) reasons.push('owner_operation_unverified');
  if (c.asking_price === null || !Number.isFinite(c.asking_price) || c.asking_price < 250000 || c.asking_price > 3000000) reasons.push('asking_price_outside_test_range');
  if ((c.revenue !== null && (!Number.isFinite(c.revenue)||c.revenue<=0)) || (c.cash_flow !== null && (!Number.isFinite(c.cash_flow)||c.cash_flow<=0))) reasons.push('nonpositive_reported_financials');
  if (c.representation === 'unknown') reasons.push('representation_unverified');
  if (score < 20 || !strong) reasons.push('insufficient_friction');
  if (firstSeenAge === null) reasons.push('invalid_first_seen');
  if (c.original_published_at && (!original || originalAge === null)) reasons.push('original_date_not_evidenced');
  if (c.last_updated_at && ageDays(c.last_updated_at,now) === null) reasons.push('invalid_updated_at');
  const listingSource = source(c.source_id);
  if (!listingSource || listingSource.research !== 'allowed' || !withinDomain(c.listing_url,listingSource.domain)) reasons.push('listing_source_not_permitted');
  const qualificationReasons = [...reasons];
  if (!listingSource || listingSource.outreach !== 'allowed') reasons.push('listing_use_for_outreach_not_cleared');
  const contact = c.contact;
  if (!contact) reasons.push('no_verified_contact');
  else {
    const contactSource=source(contact.source_id);
    if (!contactSource || contactSource.outreach !== 'allowed' || !contactSource.basis.trim() || !withinDomain(contact.source_url,contactSource.domain) || ageDays(contactSource.reviewed_at,now) === null || ageDays(contactSource.reviewed_at,now)!>30) reasons.push('contact_source_not_cleared');
    if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(contact.email)) reasons.push('invalid_email');
    if (!contact.business_email || !contact.provider_verified || !contact.role_verified || !contact.us_verified) reasons.push('contact_unverified');
    if (ageDays(contact.verified_at,now) === null || ageDays(contact.verified_at,now)! > 30) reasons.push('contact_stale');
    if (c.resolution.confidence !== 'high' || c.resolution.evidence_urls.length < 2 || c.resolution.evidence_urls.some(u=>!validUrl(u))) reasons.push('identity_not_resolved');
    if (contact.audience === 'seller' && (c.representation !== 'owner_direct' || c.resolution.confidential || !c.business_name)) reasons.push('seller_route_not_permitted');
    if (contact.audience === 'broker' && c.representation !== 'broker') reasons.push('broker_route_not_permitted');
  }
  return {version:VERSION,as_of:now,id:c.id,score,components:{duration,repricing,terms,process,urgency},
    original_listing_age_days:originalAge,first_seen_age_days:firstSeenAge,observed_active_age_days:observedAge,
    age_basis:originalAge!==null?'verified_original':observedAge!==null?'observed_lower_bound':'unknown',
    reduction_count:dropCount,reduction_pct:reductionPct,evidence_ids:ev.map(e=>e.id),
    confidence:original && prices.length>=2?'high':ev.length>=2?'medium':'low',
    priority:score>=50?'high':score>=20&&strong?'pilot':'watch',
    qualified:qualificationReasons.length===0,qualification_reasons:qualificationReasons,
    outreach_ready:reasons.length===0,hold_reasons:[...new Set(reasons)],
    interpretation:'Evidence of an extended or increasingly flexible sale process; not evidence that the business cannot sell.'};
}

/** Resolve duplicates before cohort assignment. Never infer identity from similar financials. */
export function selectPilot(candidates: Candidate[], sources: Source[], now: string) {
  const ranked = candidates.map(c=>({candidate:c,assessment:assess(c,sources,now)}))
    .filter(r=>r.assessment.outreach_ready).sort((a,b)=>b.assessment.score-a.assessment.score || a.candidate.id.localeCompare(b.candidate.id));
  const selected: typeof ranked=[]; const entities=new Set<string>(); const contacts=new Set<string>(); const contactEntities=new Set<string>();
  const counts={seller:0,broker:0};
  for(const r of ranked){ const c=r.candidate; const p=c.contact!; const email=p.email.trim().toLowerCase();
    if(entities.has(c.entity_key)||contacts.has(email)||contactEntities.has(p.entity_key)||counts[p.audience]>=25) continue;
    selected.push(r);entities.add(c.entity_key);contacts.add(email);contactEntities.add(p.entity_key);counts[p.audience]++;
  }
  return {selected,counts,shortfall:{seller:25-counts.seller,broker:25-counts.broker}};
}
