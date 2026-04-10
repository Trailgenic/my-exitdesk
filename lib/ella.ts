export interface IntakePayload {
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
}

function formatIntake(intake: IntakePayload): string {
  const f = (v: string | null) => v ?? "Not provided";
  return `COMPANY: ${intake.companyName}
DESCRIPTION: ${intake.companyDescription}
FOUNDER ROLE: ${intake.founderRole}
EXIT MOTIVATION: ${intake.exitMotivation}
POST-TRANSACTION INTENT: ${intake.postTransactionIntent}
---
REVENUE MODEL: ${f(intake.revenueModel)}
IMPLIED REVENUE: ${f(intake.impliedRevenueRange)}
REVENUE TREND: ${f(intake.revenueTrend)}
MARGIN PROFILE: ${f(intake.marginProfile)}
MARGIN TRAJECTORY: ${f(intake.marginTrajectory)}
CUSTOMER CONCENTRATION: ${f(intake.customerConcentration)}
PRICING POWER: ${f(intake.pricingPower)}
IF STEPPED AWAY BREAKS: ${f(intake.stepAwayBreaks)}
RELATIONSHIP DEPENDENCY: ${f(intake.relationshipDependency)}
BRAND TIED TO FOUNDER: ${f(intake.brandTiedToFounder)}
DOCUMENTED SYSTEMS: ${f(intake.documentedSystems)}
MANAGEMENT DEPTH: ${f(intake.managementDepth)}
HARD TO REPLICATE: ${f(intake.hardToReplicate)}
LEASE AND FACILITIES: ${f(intake.leaseAndFacilities)}
LEGAL EXPOSURE: ${f(intake.legalExposure)}
AI IMPACT: ${f(intake.aiImpact)}
INTERNAL AI CAPABILITY: ${f(intake.internalAiCapability)}
TECH STACK COMPLEXITY: ${f(intake.techStackComplexity)}
TARGET TIMELINE: ${f(intake.targetTimeline)}
BANKER ENGAGED: ${f(intake.bankerEngaged)}
PRIOR OFFERS: ${f(intake.priorOffers)}`;
}

export async function generateReport(
  intake: IntakePayload
): Promise<string> {
  const systemPrompt = process.env.ELLA_SYSTEM_PROMPT;
  if (!systemPrompt) {
    throw new Error("ELLA_SYSTEM_PROMPT is not set.");
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const res = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        temperature: 0.2,
        max_tokens: 3000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: formatIntake(intake) },
        ],
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error: ${res.status} — ${text}`);
  }

  const json = await res.json() as {
    choices: Array<{ message: { content: string } }>;
  };
  return json.choices[0].message.content;
}
