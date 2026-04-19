import {
  Body,
  Container,
  Head,
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
  calendlyUrl: string;
}

function parseReport(report: string): Array<{ heading: string; body: string }> {
  const lines = report.split("\n");
  const sections: Array<{ heading: string; body: string }> = [];
  let currentHeading = "";
  let currentBody: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const sanitized = trimmed
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/^#+\s*/, "")
      .replace(/^>\s*/, "");

    if (/^---+$/.test(trimmed)) continue;

    const isHeading =
      trimmed.startsWith("#") ||
      /^[A-Z][A-Z\s\-&—:]{8,}$/.test(sanitized) ||
      /^\d+[\.\)]\s+[A-Z]/.test(sanitized) ||
      /^(EXECUTIVE SUMMARY|EXIT READINESS|BUYER-LENS|REVENUE QUALITY|FOUNDER DEPENDENCE|FINANCIAL PROFILE|DILIGENCE PRESSURE|COMPETITIVE POSITION|TIMING|PRE-MARKET|UNCERTAINTY|STRUCTURAL RISK|PROCESS LEVERAGE|SELLER ARCHETYPE|FRAMING BY)/i.test(
        sanitized,
      );

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

function splitHeading(heading: string): { number: string; label: string } {
  const match = heading.match(/^(\d{1,2})[\.\)\-\s]+(.+)$/);
  if (!match) {
    return { number: "00", label: heading.toUpperCase() };
  }
  return { number: match[1].padStart(2, "0"), label: match[2].toUpperCase() };
}

export function ExitDeskReport({
  report,
  companyName,
  calendlyUrl,
}: ExitDeskReportProps) {
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
            padding: "32px 40px 40px 40px",
          }}
        >
          <Section>
            <Text
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "#888880",
                fontWeight: "700",
                margin: "0",
                textAlign: "right",
              }}
            >
              EXIT DESK — BY MIKE YE
            </Text>
            <Text
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "32px",
                fontWeight: "400",
                color: "#1A1A18",
                margin: "8px 0 12px 0",
                lineHeight: "1.2",
              }}
            >
              {companyName}
            </Text>
            <div
              style={{
                borderBottom: "0.5px solid #C8C4BA",
                marginBottom: "32px",
                width: "100%",
              }}
            />
          </Section>

          <Section>
            {sections.length > 0
              ? sections.map((section, sectionIndex) => {
                  const heading = splitHeading(section.heading);
                  const isReadinessSection =
                    /^(EXIT READINESS SIGNAL|YOUR EXIT READINESS SIGNAL)$/i.test(
                      section.heading.trim(),
                    );
                  const isRiskSection =
                    heading.number === "05" || /STRUCTURAL RISK/i.test(heading.label);
                  const isLedgerSection = heading.number === "04" || heading.number === "08";
                  const isActionSection = heading.number === "09";

                  const paragraphs = section.body
                    ? section.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
                    : [];

                  const pullQuoteAwareParagraphs = paragraphs.map((p, i) => {
                    const prev = paragraphs[i - 1] || "";
                    const isShortAfterLong = p.length < 200 && prev.length >= 200;
                    const isLeadQuote =
                      p.startsWith("The founder should expect") ||
                      p.startsWith("The correct response");
                    return {
                      text: p,
                      isPullQuote: isShortAfterLong || isLeadQuote,
                    };
                  });

                  const lines = section.body
                    ? section.body.split("\n").map((line) => line.trim()).filter(Boolean)
                    : [];

                  const riskItems: Array<{ dimension: string; rating: string; explanation: string }> = [];
                  for (let i = 0; i < lines.length; i++) {
                    const current = lines[i];
                    const riskMatch = current.match(/^(.*?)\s+—\s+(High|Moderate|Low|Unknown)$/i);
                    if (riskMatch) {
                      riskItems.push({
                        dimension: riskMatch[1],
                        rating: riskMatch[2].toUpperCase(),
                        explanation: lines[i + 1] || "",
                      });
                      i += 1;
                    }
                  }

                  const lastRiskLineIndex = lines.reduce((acc, line, i) => {
                    if (/\s+—\s+(High|Moderate|Low|Unknown)$/i.test(line)) return Math.max(acc, i + 1);
                    return acc;
                  }, -1);

                  const postRiskText =
                    lastRiskLineIndex >= 0 ? lines.slice(lastRiskLineIndex + 1).join(" ").trim() : "";

                  const ledgerItems = lines.filter((line) => line.startsWith("—"));

                  const actionCards: Array<{ num: string; title: string; body: string[]; timeline?: string }> = [];
                  if (isActionSection) {
                    let currentCard: { num: string; title: string; body: string[]; timeline?: string } | null = null;
                    for (const line of lines) {
                      const numMatch = line.match(/^(\d+)\.\s*(.+)$/);
                      if (numMatch) {
                        if (currentCard) actionCards.push(currentCard);
                        currentCard = {
                          num: numMatch[1].padStart(2, "0"),
                          title: numMatch[2],
                          body: [],
                        };
                      } else if (currentCard) {
                        if (/^Timeline:/i.test(line)) {
                          currentCard.timeline = line;
                        } else {
                          currentCard.body.push(line);
                        }
                      }
                    }
                    if (currentCard) actionCards.push(currentCard);
                  }

                  return (
                    <Section key={sectionIndex} style={{ marginBottom: "32px" }}>
                      {section.heading ? (
                        <table
                          role="presentation"
                          width="100%"
                          cellPadding={0}
                          cellSpacing={0}
                          style={{ marginTop: "40px", marginBottom: "20px", borderCollapse: "collapse" }}
                        >
                          <tbody>
                            <tr>
                              <td
                                style={{
                                  fontFamily: "'Courier New', monospace",
                                  fontSize: "10px",
                                  color: "#c8a96e",
                                  letterSpacing: "0.1em",
                                  paddingRight: "12px",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {heading.number}
                              </td>
                              <td
                                style={{
                                  fontFamily: "'Courier New', monospace",
                                  fontSize: "10px",
                                  color: "#888880",
                                  letterSpacing: "0.12em",
                                  textTransform: "uppercase",
                                  paddingRight: "16px",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {heading.label}
                              </td>
                              <td style={{ width: "100%", borderBottom: "0.5px solid #C8C4BA" }} />
                            </tr>
                          </tbody>
                        </table>
                      ) : null}

                      {isReadinessSection && lines.length > 0 ? (
                        <div
                          style={{
                            backgroundColor: "#1A1A18",
                            padding: "24px 28px",
                            margin: "16px 0 24px 0",
                          }}
                        >
                          {lines.map((line, i) => {
                            const isLabel = /^(POSITION|READY|PREPARE|BUILD)\b/i.test(line);
                            if (i === 0 && isLabel) {
                              return (
                                <Text
                                  key={`signal-${i}`}
                                  style={{
                                    fontFamily: "'Courier New', monospace",
                                    fontSize: "9px",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.14em",
                                    color: "#c8a96e",
                                    margin: "0 0 8px 0",
                                  }}
                                >
                                  {line}
                                </Text>
                              );
                            }
                            return (
                              <Text
                                key={`signal-body-${i}`}
                                style={{
                                  fontFamily: "Georgia, 'Times New Roman', serif",
                                  fontSize: "15px",
                                  fontStyle: "italic",
                                  color: "#C8C4BA",
                                  lineHeight: "1.65",
                                  margin: i === 0 ? "0" : "0 0 12px 0",
                                }}
                              >
                                {line}
                              </Text>
                            );
                          })}
                        </div>
                      ) : isRiskSection && riskItems.length > 0 ? (
                        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse: "collapse" }}>
                          <tbody>
                            {riskItems.map((item, i) => {
                              const isLast = i === riskItems.length - 1;
                              const riskColor =
                                item.rating === "HIGH"
                                  ? "#A32D2D"
                                  : item.rating === "MODERATE"
                                    ? "#BA7517"
                                    : item.rating === "LOW"
                                      ? "#3B6D11"
                                      : "#888880";

                              return (
                                <tr key={`risk-${i}`} style={{ borderBottom: isLast ? "none" : "0.5px solid #E0DDD6" }}>
                                  <td style={{ width: "180px", fontFamily: "'Courier New', monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.06em", color: "#555550", verticalAlign: "top", padding: "12px 16px 12px 0" }}>
                                    {item.dimension}
                                  </td>
                                  <td style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "13px", lineHeight: "1.6", color: "#2A2A26", verticalAlign: "top", padding: "12px 16px 12px 0" }}>
                                    {item.explanation}
                                  </td>
                                  <td style={{ width: "80px", fontFamily: "'Courier New', monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em", color: riskColor, textAlign: "right", verticalAlign: "top", padding: "12px 0" }}>
                                    {item.rating}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : isActionSection && actionCards.length > 0 ? (
                        <>
                          {actionCards.map((card, i) => (
                            <div key={`action-${i}`} style={{ backgroundColor: "#F2F0EB", borderLeft: "1.5px solid #C8C4BA", padding: "20px 24px", marginBottom: "16px" }}>
                              <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse: "collapse" }}>
                                <tbody>
                                  <tr>
                                    <td style={{ fontFamily: "'Courier New', monospace", fontSize: "10px", color: "#c8a96e", whiteSpace: "nowrap", paddingRight: "12px", verticalAlign: "top" }}>{card.num}</td>
                                    <td style={{ fontFamily: "'Courier New', monospace", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#555550", verticalAlign: "top" }}>{card.title}</td>
                                  </tr>
                                </tbody>
                              </table>
                              {card.body.map((line, bodyIndex) => (
                                <Text key={`action-body-${bodyIndex}`} style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "14px", lineHeight: "1.72", color: "#2A2A26", margin: "10px 0 0 0" }}>{line}</Text>
                              ))}
                              {card.timeline ? (
                                <Text style={{ fontFamily: "'Courier New', monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em", color: "#c8a96e", margin: "10px 0 0 0", display: "block" }}>{card.timeline}</Text>
                              ) : null}
                            </div>
                          ))}
                        </>
                      ) : isLedgerSection && ledgerItems.length > 0 ? (
                        <div
                          style={
                            heading.number === "08"
                              ? {
                                  backgroundColor: "#F2F0EB",
                                  borderLeft: "1.5px solid #C8C4BA",
                                  padding: "20px 24px",
                                  margin: "16px 0",
                                }
                              : undefined
                          }
                        >
                          {heading.number === "08" ? (
                            <Text style={{ fontFamily: "'Courier New', monospace", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.12em", color: "#888880", margin: "0 0 14px 0" }}>
                              GAPS IN DISCLOSURE — REFLECTED AS UNCERTAINTIES
                            </Text>
                          ) : null}
                          <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse: "collapse" }}>
                            <tbody>
                              {ledgerItems.map((item, i) => {
                                const isLast = i === ledgerItems.length - 1;
                                return (
                                  <tr key={`ledger-${i}`} style={{ borderBottom: isLast ? "none" : "0.5px solid #E0DDD6" }}>
                                    <td style={{ color: "#C8C4BA", padding: "10px 10px 10px 0", verticalAlign: "top" }}>—</td>
                                    <td style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "14px", lineHeight: "1.65", color: "#2A2A26", padding: "10px 0", verticalAlign: "top" }}>
                                      {item.replace(/^—\s*/, "")}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <>
                          {pullQuoteAwareParagraphs.map((paragraph, pIndex) => (
                            <Text
                              key={`paragraph-${pIndex}`}
                              style={
                                paragraph.isPullQuote
                                  ? {
                                      borderLeft: "2px solid #c8a96e",
                                      paddingLeft: "20px",
                                      margin: "24px 0",
                                      fontFamily: "Georgia, 'Times New Roman', serif",
                                      fontSize: "16px",
                                      fontStyle: "italic",
                                      color: "#1A1A18",
                                      lineHeight: "1.65",
                                    }
                                  : {
                                      fontFamily: "Georgia, 'Times New Roman', serif",
                                      fontSize: "15px",
                                      lineHeight: "1.8",
                                      color: "#2A2A26",
                                      margin: "0 0 16px 0",
                                      whiteSpace: "pre-wrap",
                                    }
                              }
                            >
                              {paragraph.text}
                            </Text>
                          ))}
                        </>
                      )}

                      {isRiskSection && postRiskText ? (
                        <Text
                          style={{
                            fontFamily: "Georgia, 'Times New Roman', serif",
                            fontSize: "15px",
                            lineHeight: "1.8",
                            color: "#2A2A26",
                            margin: "16px 0 0 0",
                          }}
                        >
                          {postRiskText}
                        </Text>
                      ) : null}
                    </Section>
                  );
                })
              : (
                <Text
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "15px",
                    lineHeight: "1.8",
                    color: "#2A2A26",
                    whiteSpace: "pre-wrap",
                    margin: "0 0 16px 0",
                  }}
                >
                  {report}
                </Text>
              )}
          </Section>

          <Section
            style={{
              backgroundColor: "#1A1A18",
              padding: "32px 40px",
              textAlign: "center",
              marginTop: "24px",
            }}
          >
            <Text
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "15px",
                fontStyle: "italic",
                color: "#C8C4BA",
                lineHeight: "1.65",
                margin: "0 0 20px 0",
              }}
            >
              Want to discuss this report directly with Mike Ye? Book a 90-minute advisory session — $1,999.
            </Text>
            <Link
              href={calendlyUrl}
              style={{
                backgroundColor: "#c8a96e",
                color: "#1A1A18",
                fontFamily: "'Courier New', monospace",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                padding: "12px 28px",
                textDecoration: "none",
                fontWeight: "500",
                display: "inline-block",
              }}
            >
              Book Advisory Session
            </Link>
            <Text
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: "10px",
                color: "#555550",
                margin: "12px 0 0 0",
              }}
            >
              {calendlyUrl}
            </Text>
          </Section>

          <Section style={{ paddingTop: "24px" }}>
            <div style={{ borderTop: "0.5px solid #C8C4BA", marginBottom: "16px" }} />
            <Text
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: "9px",
                color: "#AAAAAA",
                margin: "0 0 8px 0",
              }}
            >
              Exit Desk · Confidential · mikeye.com
            </Text>
            <Text
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: "9px",
                color: "#AAAAAA",
                margin: "0",
                lineHeight: "1.8",
              }}
            >
              This report reflects institutional M&A judgment. Not legal, tax, or investment advice.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default ExitDeskReport;
