import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import type { IntakePayload } from "../../../lib/ella";

const globalStore = globalThis as typeof globalThis & {
  __exitdeskIntakeStore?: Map<string, IntakePayload>;
};

export const intakeStore =
  globalStore.__exitdeskIntakeStore ?? (globalStore.__exitdeskIntakeStore = new Map());

function normalizeOptional(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== "string") {
    return null;
  }
  return value;
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<IntakePayload>;

  const requiredFields: Array<keyof Pick<
    IntakePayload,
    | "companyName"
    | "companyDescription"
    | "founderRole"
    | "exitMotivation"
    | "postTransactionIntent"
    | "email"
  >> = [
    "companyName",
    "companyDescription",
    "founderRole",
    "exitMotivation",
    "postTransactionIntent",
    "email"
  ];

  for (const field of requiredFields) {
    if (typeof body[field] !== "string" || (body[field] as string).trim() === "") {
      return NextResponse.json(
        { error: `Invalid required field: ${field}` },
        { status: 400 }
      );
    }
  }

  const intake: IntakePayload = {
    companyName: body.companyName as string,
    companyDescription: body.companyDescription as string,
    founderRole: body.founderRole as string,
    exitMotivation: body.exitMotivation as string,
    postTransactionIntent: body.postTransactionIntent as string,
    email: body.email as string,
    revenueModel: normalizeOptional(body.revenueModel),
    impliedRevenueRange: normalizeOptional(body.impliedRevenueRange),
    revenueTrend: normalizeOptional(body.revenueTrend),
    marginProfile: normalizeOptional(body.marginProfile),
    marginTrajectory: normalizeOptional(body.marginTrajectory),
    customerConcentration: normalizeOptional(body.customerConcentration),
    pricingPower: normalizeOptional(body.pricingPower),
    stepAwayBreaks: normalizeOptional(body.stepAwayBreaks),
    relationshipDependency: normalizeOptional(body.relationshipDependency),
    brandTiedToFounder: normalizeOptional(body.brandTiedToFounder),
    documentedSystems: normalizeOptional(body.documentedSystems),
    managementDepth: normalizeOptional(body.managementDepth),
    hardToReplicate: normalizeOptional(body.hardToReplicate),
    leaseAndFacilities: normalizeOptional(body.leaseAndFacilities),
    legalExposure: normalizeOptional(body.legalExposure),
    aiImpact: normalizeOptional(body.aiImpact),
    internalAiCapability: normalizeOptional(body.internalAiCapability),
    techStackComplexity: normalizeOptional(body.techStackComplexity),
    targetTimeline: normalizeOptional(body.targetTimeline),
    bankerEngaged: normalizeOptional(body.bankerEngaged),
    priorOffers: normalizeOptional(body.priorOffers)
  };

  const intake_id = randomUUID();
  intakeStore.set(intake_id, intake);

  return NextResponse.json({ intake_id, next_step: "checkout" });
}
