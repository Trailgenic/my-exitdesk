import { Resend } from "resend";
import { ExitDeskReport } from "@/emails/ExitDeskReport";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReport(
  to: string,
  report: string,
  companyName: string
): Promise<void> {
  const subject = `${process.env.REPORT_SUBJECT_PREFIX ?? 
    "Your Exit Desk Report"} — ${companyName}`;

  await resend.emails.send({
    from: `Mike Ye <${process.env.RESEND_FROM_EMAIL ?? "mike@mikeye.com"}>`,
    to,
    subject,
    react: ExitDeskReport({ report, companyName }),
  });
}
