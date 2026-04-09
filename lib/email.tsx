import { Resend } from "resend";
import ExitDeskReport from "../emails/ExitDeskReport";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReport(
  to: string,
  report: string,
  companyName: string
): Promise<void> {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "",
    to,
    subject: `${process.env.REPORT_SUBJECT_PREFIX ?? ""} — ${companyName}`,
    react: <ExitDeskReport report={report} companyName={companyName} />
  });
}
