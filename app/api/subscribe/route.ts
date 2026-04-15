import { NextResponse } from "next/server";

export async function POST(request: Request) {
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
      { status: 400 }
    );
  }

  const apiKey = process.env.CONVERTKIT_API_KEY;
  const formId = process.env.CONVERTKIT_FORM_ID;

  if (!apiKey || !formId) {
    return NextResponse.json(
      { error: "ConvertKit not configured" },
      { status: 500 }
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
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
