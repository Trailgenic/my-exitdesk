import { NextResponse } from "next/server";

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
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const body = await request.json() as {
    email: string;
    score: number;
    weakestDimension: string;
    scoreBand: string;
    exitPath: string;
  };

  const { email, score, weakestDimension, scoreBand, exitPath } = body;

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Valid email required" },
      { status: 400, headers: corsHeaders(origin) }
    );
  }

  const apiKey = process.env.CONVERTKIT_API_KEY;
  const formId = process.env.CONVERTKIT_FORM_ID;

  if (!apiKey || !formId) {
    return NextResponse.json(
      { error: "ConvertKit not configured" },
      { status: 500, headers: corsHeaders(origin) }
    );
  }

  const payload = {
    api_key: apiKey,
    email,
    confirmed: true,
    tags: [exitPath === "low" ? 18944002 : 18944001],
    fields: {
      exit_score: String(score),
      weakest_dimension: weakestDimension,
      score_band: scoreBand,
      exit_path: exitPath,
    },
  };

  const res = await fetch(
    `https://api.convertkit.com/v3/forms/${formId}/subscribe`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: `ConvertKit error: ${text}` },
      { status: 500, headers: corsHeaders(origin) }
    );
  }

  return NextResponse.json(
    { success: true },
    { headers: corsHeaders(origin) }
  );
}
