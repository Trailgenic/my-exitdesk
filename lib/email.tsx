import { Resend } from "resend";
import { renderToStaticMarkup } from "react-dom/server";
import { ExitDeskReport } from "@/emails/ExitDeskReport";
import { generateReportPDF } from './pdf';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReport(
  to: string,
  report: string,
  companyName: string
): Promise<void> {
  const calendlyUrl =
    process.env.CALENDLY_ADVISORY_URL ?? "https://calendly.com/mike-mikeye/90min";
  const pdfBuffer = await generateReportPDF(report, companyName)

  const subject = `${process.env.REPORT_SUBJECT_PREFIX ?? 
    "Your Exit Desk Report"} — ${companyName}`;
  const baseEmailHtml = renderToStaticMarkup(
    ExitDeskReport({ report, companyName, calendlyUrl }),
  );
  const closingBlockHtml = `
<div style="border-bottom:0.5px solid #C8C4BA;margin-top:40px;margin-bottom:24px"></div>
<p style="font-family:Georgia,'Times New Roman',serif;font-size:14px;color:#1A1A18;line-height:1.4;margin:0 0 4px 0">Mike Ye</p>
<p style="font-family:'Courier New',monospace;font-size:8px;letter-spacing:1.2px;color:#888880;line-height:1.4;margin:0 0 20px 0">Exit Desk · mikeye.com</p>
<p style="font-family:Georgia,'Times New Roman',serif;font-size:10px;line-height:1.6;color:#555550;margin:0 0 16px 0">25 years and $7.4B in acquisitions, divestitures, and portfolio exits across media, healthcare services, retail, and technology.</p>
<p style="font-family:'Courier New',monospace;font-size:7.5px;letter-spacing:0.8px;color:#AAAAAA;line-height:1.4;margin:0">Not legal, tax, investment, or valuation advice.</p>
`;
  const htmlWithClosing = baseEmailHtml.includes("Exit Desk · Confidential · mikeye.com")
    ? baseEmailHtml.replace("Exit Desk · Confidential · mikeye.com", `${closingBlockHtml}Exit Desk · Confidential · mikeye.com`)
    : `${baseEmailHtml}${closingBlockHtml}`;

  await resend.emails.send({
    from: `Mike Ye <${process.env.RESEND_FROM_EMAIL ?? "mike@mikeye.com"}>`,
    to,
    subject,
    html: htmlWithClosing,
    attachments: [
      {
        filename: `Exit-Desk-Report-${companyName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`,
        content: pdfBuffer.toString('base64'),
      }
    ]
  });
}
