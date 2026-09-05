import type { BuyerDiagnosticReport } from './buyer-diagnostic';
export interface BuyerReportSection { title: string; paragraphs: string[] }
export function buyerReportSections(report: BuyerDiagnosticReport): BuyerReportSection[] {
  const d = report.draft;
  const assessed = (title: string, a: { conclusion: string; analysis: string; implications: string; evidenceIds: string[] }) => ({ title, paragraphs: [a.conclusion, a.analysis, 'Buyer implication: ' + a.implications, 'Evidence: ' + a.evidenceIds.join(', ')] });
  const actions = (items: { item: string; rationale: string; evidenceIds: string[] }[]) => items.map(x => x.item + ' — ' + x.rationale + ' [' + x.evidenceIds.join(', ') + ']');
  return [
    { title: 'Investment committee snapshot', paragraphs: [d.investmentCommitteeSnapshot.headline, d.investmentCommitteeSnapshot.transactionFrame, 'Opportunity: ' + d.investmentCommitteeSnapshot.definingOpportunity, 'Defining uncertainty: ' + d.investmentCommitteeSnapshot.definingUncertainty] },
    { title: 'Provisional buyer assessment: ' + d.provisionalPosture, paragraphs: [d.decisionInterpretation, 'Intake-based assessment. No purchase, financing, or LOI approval is issued.'] },
    assessed('The company and what is being acquired', d.companyAssessment), assessed('Competitive landscape and alternatives', d.competitiveLandscape), assessed('Industry, consolidation, and structural change', d.industryAssessment),
    assessed('Acquisition thesis', d.thesisAssessment), assessed('Buyer fit and operating capability', d.buyerFitAssessment), assessed('Deal economics and price discipline', d.economicsInterpretation),
    assessed('Revenue quality', d.revenueQuality), assessed('Earnings quality and financial reconstruction', d.earningsQuality), assessed('Cash conversion', d.cashConversion), assessed('Customer concentration', d.customerConcentration),
    assessed('Owner dependence and transferability', d.ownerDependence), assessed('Management depth', d.managementDepth), assessed('Working capital', d.workingCapital), assessed('Capital expenditure', d.capitalExpenditure),
    assessed('Defensibility and AI exposure', d.aiExposure), assessed('Financing and downside resilience', d.financing), assessed('Integration: protect revenue, integrate cost', d.integration), assessed('Seller motivation, leverage, and timing', d.sellerMotivation),
    { title: 'Material findings', paragraphs: d.findings.map(x => x.title + ' | ' + x.rating + ' risk | ' + x.disposition + '\n' + x.implication + '\nRequired action: ' + x.requiredAction + ' [' + x.evidenceIds.join(', ') + ']') },
    { title: 'Ranked diligence pressure map', paragraphs: d.diligencePressureMap.map(x => x.rank + '. ' + x.area + '\n' + x.whyItMatters + '\nEvidence required: ' + x.evidenceRequired + '\nDecision affected: ' + x.decisionAffected + ' [' + x.evidenceIds.join(', ') + ']') },
    { title: 'Investigate', paragraphs: actions(d.actionMap.investigate) }, { title: 'Price', paragraphs: actions(d.actionMap.price) }, { title: 'Protect', paragraphs: actions(d.actionMap.protect) }, { title: 'Walk-away conditions', paragraphs: actions(d.walkAwayConditions) },
    { title: 'What this report cannot establish', paragraphs: d.uncertaintySurface.map(x => x.unknown + '\nWhy it matters: ' + x.decisionConsequence + '\nResolve with: ' + x.evidenceRequired + ' [' + x.evidenceIds.join(', ') + ']') },
    { title: 'Questions for the seller', paragraphs: d.rankedSellerQuestions.map(x => x.rank + '. ' + x.question + '\n' + x.reason + '\nDecision affected: ' + x.decisionAffected + ' [' + x.evidenceIds.join(', ') + ']') },
    { title: 'The next commitment', paragraphs: [d.nextDecision.commitment, 'Evidence gate: ' + d.nextDecision.evidenceGate, 'Stop condition: ' + d.nextDecision.stopCondition] },
    { title: 'Source register', paragraphs: report.sourceRegister.map(s => s.id + ': ' + s.label + '\n' + s.basis + (s.url ? '\n' + s.url : '')) },
    { title: 'Scope and authority', paragraphs: [...d.limitations, 'Research: ' + report.research.status.replaceAll('_',' '), 'Framework: ' + report.doctrineIds.length + ' existing Mike Ye acquisition principles.', report.authorityNote] },
  ];
}
