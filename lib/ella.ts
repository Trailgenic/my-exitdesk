import Anthropic from '@anthropic-ai/sdk';
import ELLA_SYSTEM_PROMPT from './ella-prompt';
import ELLA_MAINSTREET_SYSTEM_PROMPT from './ella-mainstreet-prompt';

export interface IntakePayload {
  companyName: string;
  companyDescription: string;
  founderRole: string;
  exitMotivation: string;
  postTransactionIntent: string;
  email: string;
  yearsInBusiness: string | null;
  industry: string | null;
  revenueModel: string | null;
  impliedRevenueRange: string | null;
  recurringPercent: string | null;
  ebitdaRange: string | null;
  marginTrajectory: string | null;
  financialClean: string | null;
  customerConcentration: string | null;
  customerTenure: string | null;
  newBusinessSource: string | null;
  stepAwayBreaks: string | null;
  employeeCount: string | null;
  brandTiedToFounder: string | null;
  documentedSystems: string | null;
  managementDepth: string | null;
  hardToReplicate: string | null;
  leaseAndFacilities: string | null;
  legalExposure: string | null;
  industryDynamics: string | null;
  inboundInterest: string | null;
  keyEmployeeRisk: string | null;
  additionalContext: string | null;
}

function formatIntake(intake: IntakePayload): string {
  const f = (v: string | null) => v ?? "Not provided";
return `COMPANY: ${intake.companyName}
DESCRIPTION: ${intake.companyDescription}
FOUNDER ROLE: ${intake.founderRole}
EXIT MOTIVATION: ${intake.exitMotivation}
POST-TRANSACTION INTENT: ${intake.postTransactionIntent}
YEARS IN BUSINESS: ${f(intake.yearsInBusiness)}
INDUSTRY: ${f(intake.industry)}
---
REVENUE MODEL: ${f(intake.revenueModel)}
RECURRING PERCENTAGE: ${f(intake.recurringPercent)}
IMPLIED REVENUE RANGE: ${f(intake.impliedRevenueRange)}
EBITDA/SDE RANGE: ${f(intake.ebitdaRange)}
MARGIN TRAJECTORY: ${f(intake.marginTrajectory)}
FINANCIAL CLEANLINESS: ${f(intake.financialClean)}
CUSTOMER CONCENTRATION: ${f(intake.customerConcentration)}
CUSTOMER TENURE: ${f(intake.customerTenure)}
NEW BUSINESS SOURCE: ${f(intake.newBusinessSource)}
STEP AWAY IMPACT: ${f(intake.stepAwayBreaks)}
MANAGEMENT DEPTH: ${f(intake.managementDepth)}
DOCUMENTED SYSTEMS: ${f(intake.documentedSystems)}
EMPLOYEE COUNT: ${f(intake.employeeCount)}
BRAND TIED TO FOUNDER: ${f(intake.brandTiedToFounder)}
HARD TO REPLICATE: ${f(intake.hardToReplicate)}
LEASE AND FACILITIES: ${f(intake.leaseAndFacilities)}
LEGAL EXPOSURE: ${f(intake.legalExposure)}
INDUSTRY DYNAMICS: ${f(intake.industryDynamics)}
INBOUND INTEREST: ${f(intake.inboundInterest)}
KEY EMPLOYEE RISK: ${f(intake.keyEmployeeRisk)}
ADDITIONAL CONTEXT: ${f(intake.additionalContext)}`;
}

function selectPrompt(impliedRevenueRange: string | null): string {
  if (impliedRevenueRange === "Under $1M") {
    return ELLA_MAINSTREET_SYSTEM_PROMPT;
  }
  return ELLA_SYSTEM_PROMPT;
}

export async function generateReport(
  intake: IntakePayload
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set.");
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, maxRetries: 3 });
  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 8000,
    system: selectPrompt(intake.impliedRevenueRange),
    messages: [{ role: 'user', content: formatIntake(intake) }]
  });
  return (response.content[0] as { type: 'text'; text: string }).text;
}
