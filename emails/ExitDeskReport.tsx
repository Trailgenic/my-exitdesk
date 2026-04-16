import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface ExitDeskReportProps {
  report: string;
  companyName: string;
}

function parseReport(report: string): Array<{ heading: string; body: string }> {
  const lines = report.split("\n");
  const sections: Array<{ heading: string; body: string }> = [];
  let currentHeading = "";
  let currentBody: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Strip markdown symbols
    const sanitized = trimmed
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/^#+\s*/, '')
      .replace(/^>\s*/, '');

    // Skip divider lines
    if (/^---+$/.test(trimmed)) continue;

    // Detect section headings — all caps lines or lines starting with numbers
    const isHeading =
      trimmed.startsWith("#") ||
      /^[A-Z][A-Z\s\-&—:]{8,}$/.test(sanitized) ||
      /^\d+[\.\)]\s+[A-Z]/.test(sanitized) ||
      /^(EXECUTIVE SUMMARY|EXIT READINESS|BUYER-LENS|REVENUE QUALITY|FOUNDER DEPENDENCE|FINANCIAL PROFILE|DILIGENCE PRESSURE|COMPETITIVE POSITION|TIMING|PRE-MARKET|UNCERTAINTY|STRUCTURAL RISK|PROCESS LEVERAGE|SELLER ARCHETYPE|FRAMING BY)/i.test(sanitized);

    if (isHeading && sanitized.length > 0) {
      if (currentHeading || currentBody.length > 0) {
        sections.push({
          heading: currentHeading,
          body: currentBody.join("\n").trim(),
        });
      }
      currentHeading = sanitized;
      currentBody = [];
    } else if (sanitized.length > 0) {
      currentBody.push(sanitized);
    } else if (currentBody.length > 0) {
      currentBody.push("");
    }
  }

  if (currentHeading || currentBody.length > 0) {
    sections.push({
      heading: currentHeading,
      body: currentBody.join("\n").trim(),
    });
  }

  return sections.filter((s) => s.heading || s.body);
}

export function ExitDeskReport({
  report,
  companyName,
}: ExitDeskReportProps) {
  const calendlyUrl =
    process.env.CALENDLY_ADVISORY_URL ?? "[CALENDLY_LINK_PLACEHOLDER]";

  const sections = parseReport(report);

  return (
    <Html>
      <Head />
      <Preview>Your Exit Desk Report — {companyName}</Preview>
      <Body
        style={{
          backgroundColor: "#F7F5F0",
          fontFamily: "Georgia, 'Times New Roman', serif",
          margin: "0",
          padding: "0",
        }}
      >
        <Container
          style={{
            maxWidth: "640px",
            margin: "0 auto",
            backgroundColor: "#FFFFFF",
            padding: "0",
          }}
        >
          {/* Header */}
          <Section
            style={{
              backgroundColor: "#1A1A18",
              padding: "32px 40px",
            }}
          >
            <Heading
              style={{
                fontSize: "20px",
                fontWeight: "400",
                color: "#F7F5F0",
                margin: "0 0 4px 0",
                letterSpacing: "0.02em",
              }}
            >
              Exit Desk
            </Heading>
            <Text
              style={{
                fontSize: "11px",
                color: "#888880",
                margin: "0",
                fontFamily: "'Courier New', monospace",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
              }}
            >
              Confidential — {companyName}
            </Text>
          </Section>

          {/* Report sections */}
          <Section style={{ padding: "40px 40px 0 40px" }}>
            {sections.length > 0 ? (
              sections.map((section, index) => (
                <Section key={index} style={{ marginBottom: "32px" }}>
                  {section.heading ? (
                    <Text
                      style={{
                        fontSize: "12px",
                        fontFamily: "'Courier New', monospace",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "#1B3A6B",
                        margin: "0 0 10px 0",
                        borderBottom: "0.5px solid #E0DDD6",
                        paddingBottom: "8px",
                      }}
                    >
                      {section.heading}
                    </Text>
                  ) : null}
                  {section.body ? (
                    <Text
                      style={{
                        fontSize: "15px",
                        lineHeight: "1.8",
                        color: "#2A2A26",
                        margin: "0",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {section.body}
                    </Text>
                  ) : null}
                </Section>
              ))
            ) : (
              <Text
                style={{
                  fontSize: "15px",
                  lineHeight: "1.8",
                  color: "#2A2A26",
                  whiteSpace: "pre-wrap",
                }}
              >
                {report}
              </Text>
            )}
          </Section>

          {/* Advisory upsell */}
          <Section
            style={{
              margin: "40px 40px 0 40px",
              padding: "28px 32px",
              backgroundColor: "#F2F0EB",
              borderLeft: "2px solid #1A1A18",
            }}
          >
            <Text
              style={{
                fontSize: "10px",
                fontFamily: "'Courier New', monospace",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#888880",
                margin: "0 0 8px 0",
              }}
            >
              Advisory Session
            </Text>
            <Text
              style={{
                fontSize: "15px",
                color: "#1A1A18",
                margin: "0 0 12px 0",
                lineHeight: "1.6",
              }}
            >
              Want to discuss this report directly with Mike Ye?
              Book a 90-minute advisory session — $1,999.
            </Text>
            <Link
              href={calendlyUrl}
              style={{
                fontSize: "11px",
                fontFamily: "'Courier New', monospace",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: "#1A1A18",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              Book Advisory Session →
            </Link>
          </Section>

          {/* Footer */}
          <Section style={{ padding: "32px 40px 40px 40px" }}>
            <Hr style={{ borderColor: "#E0DDD6", margin: "0 0 24px 0" }} />
            <Text
              style={{
                fontSize: "11px",
                color: "#AAAAAA",
                margin: "0 0 4px 0",
                fontFamily: "'Courier New', monospace",
              }}
            >
              Mike Ye · mikeye.com
            </Text>
            <Text
              style={{
                fontSize: "11px",
                color: "#AAAAAA",
                margin: "0",
                fontFamily: "'Courier New', monospace",
              }}
            >
              This report reflects institutional M&A judgment.
              Not legal, tax, or investment advice.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ExitDeskReport;
