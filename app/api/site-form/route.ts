import { NextResponse } from "next/server";
import { Resend } from "resend";

// Native site forms that Webflow used to collect. Each submission is emailed
// to mike@mikeye.com (override with SITE_FORM_NOTIFY_TO) with the visitor's
// address as the reply-to.
const FORMS = new Set(["Acquisition Lens Request", "Library Updates"]);
const HONEYPOT = "company_website";
const MAX_FIELDS = 20;
const MAX_VALUE = 5000;

type Body = {
  form?: unknown;
  page?: unknown;
  fields?: unknown;
};

function clean(value: unknown, max = MAX_VALUE): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const form = clean(body.form, 100);
  if (!FORMS.has(form)) {
    return NextResponse.json({ error: "Unknown form" }, { status: 400 });
  }

  const raw =
    body.fields && typeof body.fields === "object" ? (body.fields as Record<string, unknown>) : {};
  const entries = Object.entries(raw).slice(0, MAX_FIELDS);

  // Bots fill the hidden field; accept quietly and drop the submission.
  if (clean(raw[HONEYPOT])) {
    return NextResponse.json({ success: true });
  }

  const email = clean(raw.email, 320);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const to = process.env.SITE_FORM_NOTIFY_TO || "mike@mikeye.com";
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("site-form: RESEND_API_KEY is not set");
    return NextResponse.json({ error: "Form temporarily unavailable" }, { status: 503 });
  }

  const page = clean(body.page, 300);
  const lines = entries
    .filter(([key]) => key !== HONEYPOT)
    .map(([key, value]) => `${key}: ${clean(value)}`);
  const text = [
    `New "${form}" submission on mikeye.com${page ? ` (${page})` : ""}`,
    "",
    ...lines,
    "",
    `Received ${new Date().toISOString()}`,
  ].join("\n");

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: `mikeye.com <${process.env.RESEND_FROM_EMAIL ?? "mike@mikeye.com"}>`,
      to: to.split(",").map((s) => s.trim()).filter(Boolean),
      reply_to: email,
      subject: `${form}: ${email}`,
      text,
    });
    if (result.error) throw new Error(result.error.message);
  } catch (error) {
    console.error("site-form: email failed", error);
    return NextResponse.json({ error: "Could not send" }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
