import OpenAI from "openai";

export type IntakePayload = {
  companyName: string;
  companyDescription: string;
  founderRole: string;
  exitMotivation: string;
  postTransactionIntent: string;
  email: string;
  revenueModel: string | null;
  impliedRevenueRange: string | null;
  revenueTrend: string | null;
  marginProfile: string | null;
  marginTrajectory: string | null;
  customerConcentration: string | null;
  pricingPower: string | null;
  stepAwayBreaks: string | null;
  relationshipDependency: string | null;
  brandTiedToFounder: string | null;
  documentedSystems: string | null;
  managementDepth: string | null;
  hardToReplicate: string | null;
  leaseAndFacilities: string | null;
  legalExposure: string | null;
  aiImpact: string | null;
  internalAiCapability: string | null;
  techStackComplexity: string | null;
  targetTimeline: string | null;
  bankerEngaged: string | null;
  priorOffers: string | null;
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function valueOrNotProvided(value: string | null): string {
  return value && value.trim().length > 0 ? value : "Not provided";
}

export async function generateReport(intake: IntakePayload): Promise<string> {
  const prompt = [
    `COMPANY: ${intake.companyName}`,
    `DESCRIPTION: ${intake.companyDescription}`,
    `FOUNDER ROLE: ${intake.founderRole}`,
    `EXIT MOTIVATION: ${intake.exitMotivation}`,
    `POST-TRANSACTION INTENT: ${intake.postTransactionIntent}`,
    "---",
    `REVENUE MODEL: ${valueOrNotProvided(intake.revenueModel)}`,
    `IMPLIED REVENUE: ${valueOrNotProvided(intake.impliedRevenueRange)}`,
    `REVENUE TREND: ${valueOrNotProvided(intake.revenueTrend)}`,
    `MARGIN PROFILE: ${valueOrNotProvided(intake.marginProfile)}`,
    `MARGIN TRAJECTORY: ${valueOrNotProvided(intake.marginTrajectory)}`,
    `CUSTOMER CONCENTRATION: ${valueOrNotProvided(intake.customerConcentration)}`,
    `PRICING POWER: ${valueOrNotProvided(intake.pricingPower)}`,
    `STEP AWAY BREAKS: ${valueOrNotProvided(intake.stepAwayBreaks)}`,
    `RELATIONSHIP DEPENDENCY: ${valueOrNotProvided(intake.relationshipDependency)}`,
    `BRAND TIED TO FOUNDER: ${valueOrNotProvided(intake.brandTiedToFounder)}`,
    `DOCUMENTED SYSTEMS: ${valueOrNotProvided(intake.documentedSystems)}`,
    `MANAGEMENT DEPTH: ${valueOrNotProvided(intake.managementDepth)}`,
    `HARD TO REPLICATE: ${valueOrNotProvided(intake.hardToReplicate)}`,
    `LEASE AND FACILITIES: ${valueOrNotProvided(intake.leaseAndFacilities)}`,
    `LEGAL EXPOSURE: ${valueOrNotProvided(intake.legalExposure)}`,
    `AI IMPACT: ${valueOrNotProvided(intake.aiImpact)}`,
    `INTERNAL AI CAPABILITY: ${valueOrNotProvided(intake.internalAiCapability)}`,
    `TECH STACK COMPLEXITY: ${valueOrNotProvided(intake.techStackComplexity)}`,
    `TARGET TIMELINE: ${valueOrNotProvided(intake.targetTimeline)}`,
    `BANKER ENGAGED: ${valueOrNotProvided(intake.bankerEngaged)}`,
    `PRIOR OFFERS: ${valueOrNotProvided(intake.priorOffers)}`
  ].join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1",
    temperature: 0.2,
    max_tokens: 3000,
    messages: [
      {
        role: "system",
        content: process.env.ELLA_SYSTEM_PROMPT ?? ""
      },
      {
        role: "user",
        content: prompt
      }
    ]
  });

  return completion.choices[0]?.message?.content ?? "";
}
