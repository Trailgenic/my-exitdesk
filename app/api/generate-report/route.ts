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

  function resolveFormValue(field: string, value: string | undefined): string | null {
    if (!value || value === "Not provided") return null;
    const maps: Record<string, Record<string, string>> = {
      founderRole: { operator: "I run it day-to-day — primary operator", involved: "Actively involved, team handles daily operations", removed: "Largely removed — business runs without me", advisory: "Board or advisory level only" },
      exitMotivation: { strategic: "Selling from strength — timing feels right strategically", personal: "Personal readiness — lifestyle, retirement, or new venture", pressure: "Facing pressure — health, partner conflict, or burnout", exploring: "Exploring options before deciding", inbound: "Received inbound interest, want to understand position" },
      revenueRange: { under_1m: "Under $1M", "1m_3m": "$1M–$3M", "3m_7m": "$3M–$7M", "7m_15m": "$7M–$15M", "15m_25m": "$15M–$25M", "25m_plus": "$25M+" },
      yearsInBusiness: { under_3: "Under 3 years", "3_7": "3–7 years", "7_15": "7–15 years", "15_25": "15–25 years", "25_plus": "25+ years" },
      revenueModel: { recurring_contracts: "Recurring contracts or retainers", repeat_no_contract: "Repeat customers without formal contracts", project_based: "Project-based or job-based engagements", product_sales: "Product sales", mixed: "Mixed revenue model" },
      recurringPercent: { "75_plus": "75% or more recurring", "50_74": "50–74% recurring", "25_49": "25–49% recurring", under_25: "Under 25% recurring", none: "None — fully transactional" },
      customerConcentration: { under_10: "No single customer exceeds 10% of revenue", "10_20": "Top customer is 10–20% of revenue", "20_35": "Top customer is 20–35% of revenue", over_35: "Top customer exceeds 35% of revenue" },
      customerTenure: { "5_plus": "Most customers 5+ years", mixed: "Mix of long-term and newer customers", mostly_new: "Mostly newer — under 3 years", high_turnover: "High customer turnover" },
      newBusinessSource: { referrals: "Referrals from existing customers or network", inbound: "Inbound — customers find us", outbound: "Outbound sales effort", repeat: "Repeat business from existing customers", mixed: "Mix of sources" },
      steppedAway: { runs_normally: "Business runs normally without founder", continues_quality_suffers: "Revenue continues but quality suffers", declines_significantly: "Revenue declines significantly", effectively_stops: "Business effectively stops" },
      managementTeam: { strong_independent: "Strong team that operates independently", capable_relies_on_me: "Capable team but relies on founder for key decisions", staff_no_management: "Staff but no real management layer", i_am_the_team: "Founder is the management team" },
      documentedSystems: { fully_documented: "Fully documented — someone could run this without institutional knowledge", well_documented: "Well documented — most things written down", partially_documented: "Partially documented — relies on experience", mostly_undocumented: "Mostly undocumented" },
      employeeCount: { "1_2": "Just founder or 1–2 people", "3_10": "3–10 employees", "11_25": "11–25 employees", "26_50": "26–50 employees", "50_plus": "50+ employees" },
      ebitdaRange: { under_200k: "Under $200K", "200k_500k": "$200K–$500K", "500k_1m": "$500K–$1M", "1m_2m": "$1M–$2M", "2m_5m": "$2M–$5M", "5m_plus": "$5M+", not_sure: "Not sure", prefer_not: "Prefer not to disclose" },
      marginTrajectory: { improving: "Improving year over year", stable: "Stable and consistent", compressing: "Compressing — costs rising faster than revenue", volatile: "Volatile — swings significantly year to year", dont_track: "Not tracked closely" },
      financialClean: { clean: "Clean — professionally prepared, no personal expenses mixed in", mostly_clean: "Mostly clean — some owner perks needing normalization", needs_cleanup: "Cash basis or minimal accounting — needs significant cleanup", havent_thought: "Not considered" },
      facility: { own_real_estate: "Owns real estate", long_term_lease: "Long-term lease — 5+ years remaining", short_term_lease: "Short-term lease — under 2 years remaining", remote: "Home-based or fully remote" },
      industryDynamics: { growing: "Growing — market expanding", stable: "Stable — steady demand, limited disruption", consolidating: "Consolidating — larger players acquiring smaller ones", disrupted: "Disrupted — technology reshaping the landscape", declining: "Declining — structural headwinds" },
      inboundInterest: { serious_inbound: "Yes — serious inbound from strategic or financial buyer", casual_inbound: "Yes — casual or exploratory inbound", no_but_know_buyers: "No inbound but know who natural buyers would be", no_inbound: "No inbound" },
      keyEmployeeRisk: { no_depth_exists: "No — team is solid and depth exists", yes_1_2: "Yes — 1–2 people whose departure would be serious", yes_including_me: "Yes — including founder as most critical person", havent_thought: "Not considered carefully" },
      diligenceDisclosure: { no_issues: "No material issues", litigation: "Yes — pending litigation or legal issues", concentration_risk: "Yes — customer concentration or contract risk", key_person: "Yes — key person dependency beyond what indicated", financial_issues: "Yes — financial irregularities or cleanup needed", other: "Yes — other issues (see additional context)", discuss_separately: "Prefer to discuss separately" },
    };
    return maps[field]?.[value] ?? value;
  }

  const intake: IntakePayload = {
    email: body.email,
    companyName: body.companyName,
    companyDescription: body.companyDescription,
    founderRole: resolveFormValue("founderRole", body.founderRole) ?? "Not provided",
    exitMotivation: resolveFormValue("exitMotivation", body.exitMotivation) ?? "Not provided",
    postTransactionIntent: "Not specified",
    yearsInBusiness: resolveFormValue("yearsInBusiness", body.yearsInBusiness) || null,
    industry: body.industry || null,
    impliedRevenueRange: resolveFormValue("revenueRange", body.revenueRange) || null,
    revenueModel: resolveFormValue("revenueModel", body.revenueModel) || null,
    recurringPercent: resolveFormValue("recurringPercent", body.recurringPercent) || null,
    customerConcentration: resolveFormValue("customerConcentration", body.customerConcentration) || null,
    customerTenure: resolveFormValue("customerTenure", body.customerTenure) || null,
    newBusinessSource: resolveFormValue("newBusinessSource", body.newBusinessSource) || null,
    stepAwayBreaks: resolveFormValue("steppedAway", body.steppedAway) || null,
    managementDepth: resolveFormValue("managementTeam", body.managementTeam) || null,
    documentedSystems: resolveFormValue("documentedSystems", body.documentedSystems) || null,
    employeeCount: resolveFormValue("employeeCount", body.employeeCount) || null,
    brandTiedToFounder: null,
    ebitdaRange: resolveFormValue("ebitdaRange", body.ebitdaRange) || null,
    marginTrajectory: resolveFormValue("marginTrajectory", body.marginTrajectory) || null,
    financialClean: resolveFormValue("financialClean", body.financialClean) || null,
    leaseAndFacilities: resolveFormValue("facility", body.facility) ?? null,
    hardToReplicate: body.hardToReplicate.join(", "),
    legalExposure: resolveFormValue("diligenceDisclosure", body.diligenceDisclosure) || null,
    industryDynamics: resolveFormValue("industryDynamics", body.industryDynamics) || null,
    inboundInterest: resolveFormValue("inboundInterest", body.inboundInterest) || null,
    keyEmployeeRisk: resolveFormValue("keyEmployeeRisk", body.keyEmployeeRisk) || null,
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
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : "";
    console.error("Report generation failed:", errorMessage);
    console.error("Stack:", errorStack);
    return NextResponse.json(
      { error: `Report generation failed: ${errorMessage}` },
      { status: 500, headers: corsHeaders(origin) }
    );
  }
}
