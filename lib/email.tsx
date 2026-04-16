import { Resend } from "resend";
import { ExitDeskReport } from "@/emails/ExitDeskReport";
import { generateReportPDF } from './pdf';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReport(
  to: string,
  report: string,
  companyName: string
): Promise<void> {
  const pdfBuffer = await generateReportPDF(report, companyName)

  const subject = `${process.env.REPORT_SUBJECT_PREFIX ?? 
    "Your Exit Desk Report"} — ${companyName}`;

  await resend.emails.send({
    from: `Mike Ye <${process.env.RESEND_FROM_EMAIL ?? "mike@mikeye.com"}>`,
    to,
    subject,
    react: ExitDeskReport({ report, companyName }),
    attachments: [
      {
        filename: `Exit-Desk-Report-${companyName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`,
        content: pdfBuffer.toString('base64'),
      }
    ]
  });
}
