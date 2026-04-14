import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";

interface ExitDeskReportProps {
  report: string;
  companyName: string;
}

export function ExitDeskReport({
  report,
  companyName,
}: ExitDeskReportProps) {
  const calendlyUrl =
    process.env.CALENDLY_ADVISORY_URL ??
    "[CALENDLY_LINK_PLACEHOLDER]";

  return (
    <Html>
      <Head />
      <Preview>Your Exit Desk Report — {companyName}</Preview>
      <Body style={{ backgroundColor: "#ffffff", 
                     fontFamily: "Georgia, serif" }}>
        <Container style={{ maxWidth: "640px", margin: "0 auto",
                            padding: "40px 24px" }}>
          <Heading style={{ fontSize: "22px", fontWeight: "600",
                            color: "#111111", marginBottom: "4px" }}>
            Exit Desk
          </Heading>
          <Text style={{ fontSize: "13px", color: "#666666",
                         marginTop: "0", marginBottom: "32px" }}>
            Confidential — {companyName}
          </Text>
          <Text
            style={{
              fontSize: "15px",
              lineHeight: "1.8",
              color: "#222222",
              whiteSpace: "pre-wrap",
            }}
          >
            {report}
          </Text>
          <Hr style={{ borderColor: "#eeeeee", margin: "40px 0" }} />
          <Text style={{ fontSize: "14px", color: "#333333",
                         marginBottom: "8px" }}>
            Want to discuss this directly?
          </Text>
          <Text style={{ fontSize: "14px", color: "#333333",
                         marginBottom: "4px" }}>
            Book a 90-minute advisory session with Mike Ye —
            $1,999
          </Text>
          <Link
            href={calendlyUrl}
            style={{ fontSize: "14px", color: "#000000",
                     fontWeight: "600" }}
          >
            Book Advisory Session →
          </Link>
          <Hr style={{ borderColor: "#eeeeee", margin: "40px 0" }} />
          <Text style={{ fontSize: "12px", color: "#999999" }}>
            Mike Ye · mikeye.com
          </Text>
          <Text style={{ fontSize: "12px", color: "#999999" }}>
            This report reflects institutional M&A judgment, not
            legal, tax, or investment advice.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default ExitDeskReport;
