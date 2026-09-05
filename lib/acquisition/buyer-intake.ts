import type { AcquisitionSegment } from './contracts';

export const BUYER_INTAKE_FIELDS = [
  ['companyName', 'Target company or private alias', 'Buyer and target', true],
  ['companyDescription', 'What does the company do, and for whom?', 'Buyer and target', true],
  ['industry', 'Industry and core products or services', 'Buyer and target', true],
  ['geography', 'Operating geography', 'Buyer and target', true],
  ['buyerType', 'Who is buying, and what experience do they bring?', 'Buyer and target', true],
  ['buyerThesis', 'Why acquire this business? What would ownership achieve?', 'Buyer and target', true],
  ['operatingIntent', 'Your role after closing and capacity to integrate', 'Buyer and target', false],
  ['revenue', 'Annual revenue, currency, and reporting period', 'Economics and evidence', false],
  ['earnings', 'Reported EBITDA or SDE, with definition and period', 'Economics and evidence', false],
  ['financialTrajectory', 'Revenue and margin trends over the last three years', 'Economics and evidence', false],
  ['addBacks', 'Seller adjustments, owner compensation, and unusual items', 'Economics and evidence', false],
  ['cashRequirements', 'Cash conversion, working capital, capex, and deferred maintenance', 'Economics and evidence', false],
  ['askingPrice', 'Asking price and whether it is enterprise or equity value', 'Economics and evidence', false],
  ['financing', 'Available buyer equity and proposed financing or debt service', 'Economics and evidence', false],
  ['financialEvidence', 'Records available and what has been reconciled or verified', 'Economics and evidence', false],
  ['revenueModel', 'Revenue model, recurring revenue, and customer tenure', 'Customers and operations', false],
  ['customerConcentration', 'Largest customers, concentration, and retention risks', 'Customers and operations', false],
  ['ownerDependence', 'Owner responsibilities and what breaks when they leave', 'Customers and operations', false],
  ['management', 'Management depth, key employees, and retention risks', 'Customers and operations', false],
  ['systems', 'Systems, documentation, and operational transferability', 'Customers and operations', false],
  ['competitors', 'Known competitors and alternatives customers can choose', 'Position and transaction', false],
  ['defensibility', 'Claimed moat, scarcity, and the evidence supporting it', 'Position and transaction', false],
  ['industryDynamics', 'Industry changes, consolidation, and AI exposure', 'Position and transaction', false],
  ['sellerMotivation', 'Why sell now? What does the seller want after closing?', 'Position and transaction', false],
  ['controlAndStructure', 'Ownership, consent path, structure, earnout, and transition terms', 'Position and transaction', false],
  ['legalAndFacilities', 'Licenses, leases, facilities, liabilities, and known diligence issues', 'Position and transaction', false],
  ['questions', 'The acquisition questions you most need answered', 'Position and transaction', false],
  ['additionalContext', 'Additional source notes or relevant context', 'Position and transaction', false],
] as const;
export type BuyerField = typeof BUYER_INTAKE_FIELDS[number][0];
export interface PublicResearchIdentity {
  companyName: string; website: string; industry: string; geography: string;
}
export interface BuyerIntake {
  version: '1.0.0'; segment: AcquisitionSegment;
  answers: Record<BuyerField, string | null>;
  publicResearch: PublicResearchIdentity | null;
}
export function parseBuyerIntake(value: unknown): BuyerIntake {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('An intake is required.');
  const raw = value as Record<string, unknown>;
  if (Object.keys(raw).some(k => !['segment', 'answers', 'publicResearch'].includes(k))) throw new Error('Unexpected intake field.');
  if (!['main_street', 'lower_middle_market', 'strategic'].includes(String(raw.segment))) throw new Error('Select an acquisition segment.');
  if (!raw.answers || typeof raw.answers !== 'object' || Array.isArray(raw.answers)) throw new Error('Provide the buyer intake answers.');
  const supplied = raw.answers as Record<string, unknown>;
  const fields = new Set<string>(BUYER_INTAKE_FIELDS.map(f => f[0]));
  if (Object.keys(supplied).some(k => !fields.has(k))) throw new Error('Unexpected answer field.');
  const answers = {} as BuyerIntake['answers'];
  for (const [key, label, , required] of BUYER_INTAKE_FIELDS) {
    const v = supplied[key];
    if (v != null && typeof v !== 'string') throw new Error(label + ' must be text.');
    const text = typeof v === 'string' ? v.trim() : '';
    if (text.length > 2500) throw new Error(label + ' must be 2,500 characters or fewer.');
    if (required && text.length < 3) throw new Error('Complete: ' + label + '.');
    answers[key] = text || null;
  }
  let publicResearch: PublicResearchIdentity | null = null;
  if (raw.publicResearch != null) {
    if (typeof raw.publicResearch !== 'object' || Array.isArray(raw.publicResearch)) throw new Error('Invalid public research identity.');
    const p = raw.publicResearch as Record<string, unknown>;
    if (Object.keys(p).some(k => !['companyName','website','industry','geography'].includes(k))) throw new Error('Unexpected research field.');
    for (const key of ['companyName', 'industry', 'geography']) if (typeof p[key] !== 'string' || !(p[key] as string).trim() || (p[key] as string).length > 200) throw new Error('Complete the public research ' + key + '.');
    if (typeof p.website !== 'string') throw new Error('Provide the public company website.');
    let url: URL;
    try { url = new URL(p.website); } catch { throw new Error('Use a full public company website URL.'); }
    if (url.protocol !== 'https:' || url.username || url.password || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname) || /(^|\.)(localhost|local|internal|test|example|invalid)$/.test(url.hostname)) throw new Error('Use a public HTTPS company website.');
    // Search identity excludes URL paths, query strings and all private deal fields.
    publicResearch = { companyName: (p.companyName as string).trim(), website: url.origin, industry: (p.industry as string).trim(), geography: (p.geography as string).trim() };
  }
  return { version: '1.0.0', segment: raw.segment as AcquisitionSegment, answers, publicResearch };
}
