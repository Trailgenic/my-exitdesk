import { NextResponse } from "next/server";
import { generateReport } from "@/lib/ella";
import { sendReport } from "@/lib/email";
import type { IntakePayload } from "@/lib/ella";

export const maxDuration = 300;

const ALLOWED_ORIGINS = [
  "https://www.mikeye.com",
  "https://mikeye.com",
  "https://mikeye.webflow.io",
];

function corsHeaders(origin: string | null) {
  const allowed = ALLOWED_ORIGINS.includes(origin ?? "")
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed ?? ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  const body = await request.json() as {
    email: string;
    sessionId: string;
    companyName: string;
    companyDescription: string;
    founderRole: string;
    exitMotivation: string;
    revenueRange: string;
    yearsInBusiness: string;
    industry: string;
    revenueModel: string;
    recurringPercent: string;
    customerConcentration: string;
    customerTenure: string;
    newBusinessSource?: string;
    steppedAway: string;
    managementTeam: string;
    documentedSystems: string;
    employeeCount: string;
    ebitdaRange: string;
    marginTrajectory: string;
    financialClean: string;
    facility?: string;
    hardToReplicate: string[];
    industryDynamics: string;
    inboundInterest: string;
    keyEmployeeRisk: string;
    diligenceDisclosure: string;
    openText?: string;
  };

  if (!body.email || !body.sessionId) {
    return NextResponse.json(
      { error: "email and sessionId required" },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  const intake: IntakePayload = {
    email: body.email,
    companyName: body.companyName,
    companyDescription: body.companyDescription,
    founderRole: body.founderRole,
    exitMotivation: body.exitMotivation,
    postTransactionIntent: "Not specified",
    impliedRevenueRange: body.revenueRange,
    revenueModel: body.revenueModel,
    revenueTrend: body.recurringPercent,
    customerConcentration: body.customerConcentration,
    pricingPower: body.customerTenure,
    stepAwayBreaks: body.steppedAway,
    managementDepth: body.managementTeam,
    documentedSystems: body.documentedSystems,
    relationshipDependency: body.employeeCount,
    brandTiedToFounder: null,
    marginProfile: body.ebitdaRange,
    marginTrajectory: body.marginTrajectory,
    leaseAndFacilities: body.facility ?? null,
    hardToReplicate: body.hardToReplicate.join(", "),
    legalExposure: body.diligenceDisclosure,
    aiImpact: body.industryDynamics,
    internalAiCapability: null,
    techStackComplexity: null,
    targetTimeline: body.inboundInterest,
    bankerEngaged: null,
    priorOffers: body.keyEmployeeRisk,
    additionalContext: body.openText ?? null,
  };

  try {
    const report = await generateReport(intake);
    await sendReport(body.email, report, body.companyName);

    return NextResponse.json(
      { success: true },
      { headers: corsHeaders(origin) }
    );
  } catch (err) {
    console.error("Report generation failed:", err);
    return NextResponse.json(
      { error: `Report generation failed: ${err}` },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
