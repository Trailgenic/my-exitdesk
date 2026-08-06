import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import React from "react";

import type { ConfidenceLevel, DecisionPosture } from "@/lib/acquisition/contracts";
import type { ReportReliancePosture } from "@/lib/acquisition/reasoning-contract";

interface AcquisitionLensReportEmailProps {
  targetName: string;
  headline: string;
  posture: DecisionPosture;
  confidence: ConfidenceLevel;
  reliancePosture: ReportReliancePosture;
  reportId: string;
}

function titleCase(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function AcquisitionLensReportEmail({
  targetName,
  headline,
  posture,
  confidence,
  reliancePosture,
  reportId,
}: AcquisitionLensReportEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your confidential Acquisition Lens memo for {targetName}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={masthead}>
            <Text style={brand}>ACQUISITION LENS · BY MIKE YE</Text>
            <Text style={confidential}>CONFIDENTIAL</Text>
          </Section>
          <Section style={content}>
            <Text style={eyebrow}>BUYER-SIDE INVESTMENT COMMITTEE MEMORANDUM</Text>
            <Text style={title}>{targetName}</Text>
            <Text style={lead}>{headline}</Text>
            <Section style={decisionBox}>
              <Text style={decisionLabel}>DECISION POSTURE</Text>
              <Text style={decisionValue}>{titleCase(posture)}</Text>
              <Text style={decisionMeta}>
                {titleCase(confidence)} confidence · {titleCase(reliancePosture)}
              </Text>
            </Section>
            <Text style={copy}>
              Your full Acquisition Lens memorandum is attached as a PDF. It preserves the deterministic underwriting, evidence labels, diligence priorities, buyer actions, and the next evidence-gated decision in one confidential document.
            </Text>
            <Text style={copy}>
              Please treat the attachment as confidential buyer-side work product and share it only with authorized deal-team members and advisors.
            </Text>
            <Text style={reference}>REPORT REFERENCE · {reportId}</Text>
          </Section>
          <Section style={footer}>
            <Text style={footerText}>
              This preliminary acquisition screen is not a fairness opinion, valuation opinion, legal opinion, or commitment to transact. Independent diligence remains required.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#EEF1EE",
  fontFamily: "Arial, Helvetica, sans-serif",
  margin: "0",
  padding: "24px 12px",
};

const container = {
  backgroundColor: "#F7F5EF",
  border: "1px solid #D5DDD8",
  margin: "0 auto",
  maxWidth: "620px",
};

const masthead = { backgroundColor: "#173D34", padding: "22px 30px" };
const brand = { color: "#FFFFFF", fontSize: "11px", fontWeight: "700", letterSpacing: "1.4px", margin: "0" };
const confidential = { color: "#AFC6BE", fontSize: "9px", letterSpacing: "1.2px", margin: "7px 0 0" };
const content = { padding: "32px 30px 26px" };
const eyebrow = { color: "#2B6757", fontSize: "9px", fontWeight: "700", letterSpacing: "1.1px", margin: "0 0 12px" };
const title = { color: "#173D34", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "30px", lineHeight: "1.15", margin: "0 0 13px" };
const lead = { color: "#26332F", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "18px", lineHeight: "1.45", margin: "0 0 24px" };
const decisionBox = { backgroundColor: "#DDE9E4", borderLeft: "3px solid #2B6757", padding: "16px 18px" };
const decisionLabel = { color: "#2B6757", fontSize: "8px", fontWeight: "700", letterSpacing: "1.2px", margin: "0 0 5px" };
const decisionValue = { color: "#173D34", fontSize: "20px", fontWeight: "700", margin: "0 0 3px" };
const decisionMeta = { color: "#52605B", fontSize: "11px", margin: "0" };
const copy = { color: "#34413D", fontSize: "14px", lineHeight: "1.65", margin: "22px 0 0" };
const reference = { borderTop: "1px solid #CBD4CF", color: "#66726D", fontSize: "9px", letterSpacing: "0.8px", margin: "26px 0 0", paddingTop: "14px" };
const footer = { backgroundColor: "#EDF0EC", padding: "18px 30px" };
const footerText = { color: "#6B7671", fontSize: "10px", lineHeight: "1.5", margin: "0" };
