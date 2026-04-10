import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import type { IntakePayload } from "../../lib/ella";
import { intakeStore } from "../../lib/store";

function norm(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  return value;
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<IntakePayload>;

  const required = [
    "companyName",
    "companyDescription",
    "founderRole",
    "exitMotivation",
    "postTransactionIntent",
    "email",
  ] as const;

  for (const field of required) {
    if (typeof body[field] !== "string" ||
        (body[field] as string).trim() === "") {
      return NextResponse.json(
        { error: `Missing required field: ${field}` },
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
    revenueModel: norm(body.revenueModel),
    impliedRevenueRange: norm(body.impliedRevenueRange),
    revenueTrend: norm(body.revenueTrend),
    marginProfile: norm(body.marginProfile),
    marginTrajectory: norm(body.marginTrajectory),
    customerConcentration: norm(body.customerConcentration),
    pricingPower: norm(body.pricingPower),
    stepAwayBreaks: norm(body.stepAwayBreaks),
    relationshipDependency: norm(body.relationshipDependency),
    brandTiedToFounder: norm(body.brandTiedToFounder),
    documentedSystems: norm(body.documentedSystems),
    managementDepth: norm(body.managementDepth),
    hardToReplicate: norm(body.hardToReplicate),
    leaseAndFacilities: norm(body.leaseAndFacilities),
    legalExposure: norm(body.legalExposure),
    aiImpact: norm(body.aiImpact),
    internalAiCapability: norm(body.internalAiCapability),
    techStackComplexity: norm(body.techStackComplexity),
    targetTimeline: norm(body.targetTimeline),
    bankerEngaged: norm(body.bankerEngaged),
    priorOffers: norm(body.priorOffers),
  };

  const intake_id = randomUUID();
  intakeStore.set(intake_id, intake);

  return NextResponse.json({ intake_id, next_step: "checkout" });
}
