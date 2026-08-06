import React from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

import type { MoneyAmount } from "./contracts";
import type {
  AcquisitionReasoningReport,
  BuyerActionDraft,
  ReasonedAssessment,
} from "./reasoning-contract";

const COLORS = {
  ink: "#17201D",
  forest: "#173D34",
  jade: "#2B6757",
  mint: "#DDE9E4",
  paper: "#F7F5EF",
  white: "#FFFFFF",
  line: "#C8D1CC",
  muted: "#66726D",
  amber: "#A86D16",
  red: "#9F3F3F",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.paper,
    color: COLORS.ink,
    fontFamily: "Helvetica",
    fontSize: 9.2,
    lineHeight: 1.45,
    padding: "46pt 46pt 54pt",
  },
  cover: {
    backgroundColor: COLORS.forest,
    color: COLORS.white,
    padding: "52pt 52pt 48pt",
  },
  brand: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    letterSpacing: 2.1,
    textTransform: "uppercase",
  },
  coverEyebrow: {
    color: "#B8CDC5",
    fontSize: 8,
    letterSpacing: 1.8,
    marginTop: 98,
    textTransform: "uppercase",
  },
  coverTitle: {
    fontFamily: "Times-Bold",
    fontSize: 35,
    lineHeight: 1.08,
    marginTop: 12,
  },
  coverHeadline: {
    color: "#DDE9E4",
    fontFamily: "Times-Roman",
    fontSize: 17,
    lineHeight: 1.35,
    marginTop: 18,
    maxWidth: 440,
  },
  coverRule: { borderTopColor: "#64877C", borderTopWidth: 0.7, marginTop: 30 },
  coverGrid: { flexDirection: "row", gap: 12, marginTop: 22 },
  coverCard: {
    backgroundColor: "#214C41",
    borderColor: "#64877C",
    borderWidth: 0.5,
    flex: 1,
    minHeight: 76,
    padding: 12,
  },
  labelLight: {
    color: "#AFC6BE",
    fontFamily: "Helvetica-Bold",
    fontSize: 6.6,
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  coverCardValue: { color: COLORS.white, fontSize: 10.5, lineHeight: 1.35 },
  coverMeta: { color: "#B8CDC5", fontSize: 7.5, lineHeight: 1.55, marginTop: 26 },
  confidential: {
    borderColor: "#7A9B90",
    borderWidth: 0.6,
    color: "#DDE9E4",
    fontFamily: "Helvetica-Bold",
    fontSize: 6.6,
    letterSpacing: 1.4,
    padding: "5pt 8pt",
    position: "absolute",
    right: 52,
    textTransform: "uppercase",
    top: 48,
  },
  sectionHeader: { marginBottom: 14, marginTop: 8 },
  sectionNumber: {
    color: COLORS.jade,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: COLORS.forest,
    fontFamily: "Times-Bold",
    fontSize: 21,
    lineHeight: 1.15,
    marginTop: 4,
  },
  sectionRule: { borderTopColor: COLORS.jade, borderTopWidth: 1.2, marginTop: 8 },
  subsection: {
    color: COLORS.forest,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    letterSpacing: 0.35,
    marginBottom: 6,
    marginTop: 13,
  },
  body: { color: COLORS.ink, fontSize: 9.2, lineHeight: 1.5, marginBottom: 7 },
  muted: { color: COLORS.muted, fontSize: 8, lineHeight: 1.45 },
  evidence: {
    color: COLORS.jade,
    fontFamily: "Helvetica-Bold",
    fontSize: 6.7,
    letterSpacing: 0.45,
    marginTop: 4,
    textTransform: "uppercase",
  },
  callout: {
    backgroundColor: COLORS.mint,
    borderLeftColor: COLORS.jade,
    borderLeftWidth: 2,
    marginBottom: 10,
    padding: "11pt 13pt",
  },
  calloutTitle: {
    color: COLORS.forest,
    fontFamily: "Helvetica-Bold",
    fontSize: 7,
    letterSpacing: 1,
    marginBottom: 5,
    textTransform: "uppercase",
  },
  calloutText: { color: COLORS.ink, fontFamily: "Times-Roman", fontSize: 11.5, lineHeight: 1.35 },
  assessment: {
    borderBottomColor: COLORS.line,
    borderBottomWidth: 0.6,
    marginBottom: 8,
    paddingBottom: 9,
  },
  assessmentConclusion: { color: COLORS.forest, fontFamily: "Helvetica-Bold", fontSize: 9.5, marginBottom: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginBottom: 10 },
  chip: {
    backgroundColor: COLORS.mint,
    color: COLORS.forest,
    fontFamily: "Helvetica-Bold",
    fontSize: 6.8,
    letterSpacing: 0.7,
    padding: "5pt 7pt",
    textTransform: "uppercase",
  },
  warningChip: { backgroundColor: "#F0E2D1", color: COLORS.amber },
  stopChip: { backgroundColor: "#EEDADA", color: COLORS.red },
  twoColumn: { flexDirection: "row", gap: 12 },
  column: { flex: 1 },
  table: { borderColor: COLORS.line, borderWidth: 0.6, marginBottom: 10 },
  tableRow: { borderBottomColor: COLORS.line, borderBottomWidth: 0.4, flexDirection: "row", minHeight: 22 },
  tableRowLast: { borderBottomWidth: 0 },
  tableLabel: { color: COLORS.muted, flex: 1.35, fontSize: 7.7, padding: "6pt 7pt" },
  tableValue: { color: COLORS.ink, flex: 1, fontFamily: "Helvetica-Bold", fontSize: 7.7, padding: "6pt 7pt", textAlign: "right" },
  tableHeader: { backgroundColor: COLORS.forest, color: COLORS.white, fontFamily: "Helvetica-Bold", fontSize: 7, letterSpacing: 0.5, padding: "6pt 7pt", textTransform: "uppercase" },
  listItem: { flexDirection: "row", marginBottom: 6 },
  bullet: { color: COLORS.jade, fontFamily: "Helvetica-Bold", width: 14 },
  listText: { flex: 1, fontSize: 8.7, lineHeight: 1.45 },
  rankedCard: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.line,
    borderWidth: 0.5,
    marginBottom: 8,
    padding: 10,
  },
  rank: { color: COLORS.jade, fontFamily: "Helvetica-Bold", fontSize: 7, letterSpacing: 0.7, marginBottom: 4 },
  cardTitle: { color: COLORS.forest, fontFamily: "Helvetica-Bold", fontSize: 9.2, marginBottom: 4 },
  cardMeta: { color: COLORS.muted, fontSize: 7.6, lineHeight: 1.4, marginTop: 3 },
  evidenceRow: { borderBottomColor: COLORS.line, borderBottomWidth: 0.45, paddingBottom: 8, paddingTop: 8 },
  evidenceId: { color: COLORS.jade, fontFamily: "Helvetica-Bold", fontSize: 7, letterSpacing: 0.6 },
  footerRule: { borderTopColor: COLORS.line, borderTopWidth: 0.5, bottom: 36, left: 46, position: "absolute", right: 46 },
  footerLeft: { bottom: 24, left: 46, position: "absolute" },
  footerRight: { bottom: 24, position: "absolute", right: 46, textAlign: "right" },
  footerText: { color: COLORS.muted, fontSize: 6.5, letterSpacing: 0.45 },
  pageBreak: { breakBefore: "page" },
});

function titleCase(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatMoney(value: MoneyAmount | null) {
  if (!value) return "Not provided";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: value.currency,
    maximumFractionDigits: 0,
  }).format(value.amount);
}

function formatPercent(value: number | null) {
  return value === null ? "Not calculated" : `${value.toFixed(1)}%`;
}

function evidenceLabel(ids: string[]) {
  return ids.length > 0 ? `Evidence: ${ids.join(", ")}` : "Evidence: none cited";
}

function SectionHeader({ number, title }: { number: string; title: string }) {
  return (
    <View style={styles.sectionHeader} minPresenceAhead={80} wrap={false}>
      <Text style={styles.sectionNumber}>{number}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionRule} />
    </View>
  );
}

function Assessment({ label, value }: { label: string; value: ReasonedAssessment }) {
  return (
    <View style={styles.assessment} wrap={false}>
      <Text style={styles.subsection}>{label}</Text>
      <Text style={styles.assessmentConclusion}>{value.conclusion}</Text>
      <Text style={styles.body}>{value.analysis}</Text>
      <Text style={styles.muted}>Buyer implication: {value.implications}</Text>
      <Text style={styles.evidence}>{evidenceLabel(value.evidenceIds)}</Text>
    </View>
  );
}

function BulletList({ items, empty = "None identified." }: { items: string[]; empty?: string }) {
  if (items.length === 0) return <Text style={styles.muted}>{empty}</Text>;
  return (
    <View>
      {items.map((item, index) => (
        <View key={`${item}-${index}`} style={styles.listItem} wrap={false}>
          <Text style={styles.bullet}>—</Text>
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function ActionList({ items }: { items: BuyerActionDraft[] }) {
  if (items.length === 0) return <Text style={styles.muted}>None identified.</Text>;
  return (
    <View>
      {items.map((item, index) => (
        <View key={`${item.item}-${index}`} style={styles.rankedCard} wrap={false}>
          <Text style={styles.cardTitle}>{item.item}</Text>
          <Text style={styles.body}>{item.rationale}</Text>
          <Text style={styles.evidence}>{evidenceLabel(item.evidenceIds)}</Text>
        </View>
      ))}
    </View>
  );
}

function MetricTable({ rows }: { rows: Array<[string, string]> }) {
  return (
    <View style={styles.table} wrap={false}>
      {rows.map(([label, value], index) => (
        <View
          key={label}
          style={[styles.tableRow, index === rows.length - 1 ? styles.tableRowLast : {}]}
        >
          <Text style={styles.tableLabel}>{label}</Text>
          <Text style={styles.tableValue}>{value}</Text>
        </View>
      ))}
    </View>
  );
}

function Footer({ reportId }: { reportId: string }) {
  return (
    <>
      <View style={styles.footerRule} fixed />
      <Text style={[styles.footerText, styles.footerLeft]} fixed>
        ACQUISITION LENS · CONFIDENTIAL BUYER-SIDE MEMO
      </Text>
      <Text style={[styles.footerText, styles.footerRight]} fixed>
        {reportId}
      </Text>
    </>
  );
}

export function AcquisitionLensReportDocument({ report }: { report: AcquisitionReasoningReport }) {
  const underwriting = report.dealEconomics.deterministicUnderwriting;
  const earnings = underwriting.normalizedEarnings;
  const capital = underwriting.capitalStack;
  const dealScreen = report.deterministicDealScreen;

  return (
    <Document
      author="Acquisition Lens by Mike Ye"
      subject="Confidential buyer-side acquisition committee memorandum"
      title={`Acquisition Lens — ${report.targetName}`}
    >
      <Page size="LETTER" style={[styles.page, styles.cover]}>
        <Text style={styles.brand}>Acquisition Lens · By Mike Ye</Text>
        <Text style={styles.confidential}>Confidential</Text>
        <Text style={styles.coverEyebrow}>Buyer-side investment committee memorandum</Text>
        <Text style={styles.coverTitle}>{report.targetName}</Text>
        <Text style={styles.coverHeadline}>{report.investmentCommitteeSnapshot.headline}</Text>
        <View style={styles.coverRule} />
        <View style={styles.coverGrid}>
          <View style={styles.coverCard}>
            <Text style={styles.labelLight}>Recommendation</Text>
            <Text style={styles.coverCardValue}>{titleCase(report.decision.posture)}</Text>
          </View>
          <View style={styles.coverCard}>
            <Text style={styles.labelLight}>Confidence</Text>
            <Text style={styles.coverCardValue}>{titleCase(report.decision.confidence)}</Text>
          </View>
          <View style={styles.coverCard}>
            <Text style={styles.labelLight}>Reliance posture</Text>
            <Text style={styles.coverCardValue}>{titleCase(report.investmentCommitteeSnapshot.reliancePosture)}</Text>
          </View>
        </View>
        <View style={styles.coverGrid}>
          <View style={styles.coverCard}>
            <Text style={styles.labelLight}>Defining opportunity</Text>
            <Text style={styles.coverCardValue}>{report.investmentCommitteeSnapshot.definingOpportunity}</Text>
          </View>
          <View style={styles.coverCard}>
            <Text style={styles.labelLight}>Defining uncertainty</Text>
            <Text style={styles.coverCardValue}>{report.investmentCommitteeSnapshot.definingUncertainty}</Text>
          </View>
        </View>
        <Text style={styles.coverMeta}>
          {titleCase(report.segment)} · {titleCase(report.stage)} stage{"\n"}
          Generated {new Date(report.generatedAt).toISOString().slice(0, 10)} · Report {report.reportId}{"\n"}
          This memo is an evidence-bounded acquisition screen, not a fairness opinion, valuation opinion, legal opinion, or commitment to transact.
        </Text>
      </Page>

      <Page size="LETTER" style={styles.page} wrap>
        <Footer reportId={report.reportId} />
        <SectionHeader number="00" title="Investment Committee Snapshot" />
        <View style={styles.callout} wrap={false}>
          <Text style={styles.calloutTitle}>Transaction frame</Text>
          <Text style={styles.calloutText}>{report.investmentCommitteeSnapshot.transactionFrame}</Text>
        </View>
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Text style={styles.subsection}>Opportunity</Text>
            <Text style={styles.body}>{report.investmentCommitteeSnapshot.definingOpportunity}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.subsection}>Uncertainty</Text>
            <Text style={styles.body}>{report.investmentCommitteeSnapshot.definingUncertainty}</Text>
          </View>
        </View>
        <View style={styles.chips}>
          <Text style={styles.chip}>{titleCase(report.decision.posture)}</Text>
          <Text style={styles.chip}>{titleCase(report.decision.confidence)} confidence</Text>
          <Text style={styles.chip}>{titleCase(report.investmentCommitteeSnapshot.reliancePosture)}</Text>
        </View>

        <SectionHeader number="01" title="Decision Posture" />
        <View style={styles.callout} wrap={false}>
          <Text style={styles.calloutTitle}>Governing decision</Text>
          <Text style={styles.calloutText}>{report.decision.coreReason}</Text>
        </View>
        <Text style={styles.body}>{report.decisionInterpretation}</Text>
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Text style={styles.subsection}>Conditions to advance</Text>
            <BulletList items={report.decision.conditionsToAdvance} />
          </View>
          <View style={styles.column}>
            <Text style={styles.subsection}>Hard vetoes</Text>
            <BulletList items={report.decision.hardVetoes} empty="No hard veto recorded at this evidence level." />
          </View>
        </View>
        <Text style={styles.subsection}>Compounding risks</Text>
        <BulletList items={report.decision.compoundingRisks} empty="No compounding risk recorded." />

        <SectionHeader number="02" title="Acquisition Thesis and Buyer Fit" />
        <Assessment label="Acquisition thesis" value={report.thesisAssessment} />
        <Assessment label="Buyer fit" value={report.buyerFitAssessment} />

        <SectionHeader number="03" title="Deal Economics" />
        <Assessment label="Economics interpretation" value={report.dealEconomics.interpretation} />
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Text style={styles.subsection}>Earnings normalization</Text>
            <MetricTable
              rows={[
                ["Reported EBITDA", formatMoney(earnings.reportedEbitda)],
                ["Normalized EBITDA", formatMoney(earnings.normalizedEbitda)],
                ["Reported SDE", formatMoney(earnings.reportedSde)],
                ["Normalized SDE", formatMoney(earnings.normalizedSde)],
                ["Reported unlevered FCF", formatMoney(earnings.reportedUnleveredFreeCashFlow)],
                ["Normalized unlevered FCF", formatMoney(earnings.normalizedUnleveredFreeCashFlow)],
              ]}
            />
          </View>
          <View style={styles.column}>
            <Text style={styles.subsection}>Value and price discipline</Text>
            <MetricTable
              rows={[
                ["Valuation basis", titleCase(underwriting.valuationBasis)],
                ["Standalone EV — low", formatMoney(underwriting.standaloneEnterpriseValueRange.low)],
                ["Standalone EV — high", formatMoney(underwriting.standaloneEnterpriseValueRange.high)],
                ["Offer enterprise value", formatMoney(underwriting.dealScreenBridge.offerEnterpriseValue)],
                ["Hard ceiling", formatMoney(underwriting.dealScreenBridge.hardCeiling)],
                ["Range strategy", titleCase(dealScreen.rangeStrategy)],
              ]}
            />
          </View>
        </View>
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Text style={styles.subsection}>Sources and uses</Text>
            <MetricTable
              rows={[
                ["Equity purchase price", formatMoney(capital.equityPurchasePrice)],
                ["Total uses at close", formatMoney(capital.totalUsesAtClose)],
                ["Senior debt", formatMoney(capital.seniorDebt)],
                ["Seller financing", formatMoney(capital.sellerFinancing)],
                ["Deferred earnout", formatMoney(capital.deferredEarnout)],
                ["Buyer cash required", formatMoney(capital.buyerCashRequired)],
              ]}
            />
          </View>
          <View style={styles.column}>
            <Text style={styles.subsection}>Return frame</Text>
            <MetricTable
              rows={[
                ["Primary metric", titleCase(underwriting.primaryReturnMetric)],
                ["Annual cash flow to buyer", formatMoney(underwriting.returns.annualCashFlowToBuyer)],
                ["Cash-on-cash return", formatPercent(underwriting.returns.cashOnCashReturnPercent)],
                ["Payback period", underwriting.returns.paybackPeriodYears === null ? "Not calculated" : `${underwriting.returns.paybackPeriodYears.toFixed(1)} years`],
                ["IRR", formatPercent(underwriting.returns.irrPercent)],
                ["Worst case survivable", underwriting.worstCaseSurvivable === null ? "Not determined" : underwriting.worstCaseSurvivable ? "Yes" : "No"],
              ]}
            />
          </View>
        </View>
        <Text style={styles.subsection}>Downside scenarios</Text>
        {underwriting.scenarios.map((scenario) => (
          <View key={scenario.name} style={styles.rankedCard} wrap={false}>
            <Text style={styles.cardTitle}>{titleCase(scenario.name)}</Text>
            <Text style={styles.body}>
              Revenue {formatMoney(scenario.projectedRevenue)} · EBITDA {formatMoney(scenario.projectedEbitda)} · FCF {formatMoney(scenario.projectedUnleveredFreeCashFlow)} · DSCR {scenario.debtServiceCoverageRatio === null ? "not calculated" : `${scenario.debtServiceCoverageRatio.toFixed(2)}x`} · Payback {scenario.paybackPeriodYears === null ? "not calculated" : `${scenario.paybackPeriodYears.toFixed(1)} years`} · Survivable {scenario.survivable === null ? "not determined" : scenario.survivable ? "yes" : "no"}
            </Text>
          </View>
        ))}
        <View style={styles.callout} wrap={false}>
          <Text style={styles.calloutTitle}>Buyer-owned synergy treatment</Text>
          <Text style={styles.body}>{underwriting.buyerSpecificSynergyTreatment}</Text>
          <Text style={styles.muted}>Excluded buyer-specific synergies: {formatMoney(underwriting.excludedBuyerSpecificSynergies)}</Text>
        </View>
        {underwriting.calculationChecks.length > 0 && (
          <>
            <Text style={styles.subsection}>Calculation checks</Text>
            <BulletList items={underwriting.calculationChecks.map((signal) => `${signal.code}: ${signal.message}`)} />
          </>
        )}
        {underwriting.decisionTriggers.length > 0 && (
          <>
            <Text style={styles.subsection}>Decision triggers</Text>
            <BulletList items={underwriting.decisionTriggers.map((signal) => `${signal.code}: ${signal.message}`)} />
          </>
        )}

        <SectionHeader number="04" title="What Is Actually Being Underwritten" />
        {Object.entries(report.underwritingAssessment).map(([key, assessment]) => (
          <Assessment key={key} label={titleCase(key)} value={assessment} />
        ))}
        <Text style={styles.subsection}>Material findings</Text>
        {report.findings.map((finding) => (
          <View key={finding.id} style={styles.rankedCard} wrap={false}>
            <View style={styles.chips}>
              <Text style={styles.chip}>{titleCase(finding.dimension)}</Text>
              <Text style={[styles.chip, finding.rating === "high" ? styles.stopChip : styles.warningChip]}>{titleCase(finding.rating)}</Text>
              <Text style={styles.chip}>{titleCase(finding.disposition)}</Text>
            </View>
            <Text style={styles.cardTitle}>{finding.title}</Text>
            <Text style={styles.body}>{finding.implication}</Text>
            <Text style={styles.muted}>Required action: {finding.requiredAction}</Text>
            <Text style={styles.evidence}>{evidenceLabel(finding.evidenceIds)}</Text>
          </View>
        ))}

        <SectionHeader number="05" title="Diligence Pressure Map" />
        {report.diligencePressureMap.map((item) => (
          <View key={`${item.rank}-${item.area}`} style={styles.rankedCard} wrap={false}>
            <Text style={styles.rank}>PRIORITY {String(item.rank).padStart(2, "0")}</Text>
            <Text style={styles.cardTitle}>{item.area}</Text>
            <Text style={styles.body}>{item.whyItMatters}</Text>
            <Text style={styles.cardMeta}>Evidence required: {item.evidenceRequired}</Text>
            <Text style={styles.cardMeta}>Decision affected: {item.decisionAffected}</Text>
            <Text style={styles.evidence}>{evidenceLabel(item.evidenceIds)}</Text>
          </View>
        ))}

        <SectionHeader number="06" title="Investigate, Price, Protect, Walk" />
        <Text style={styles.subsection}>Investigate</Text>
        <ActionList items={report.actionMap.investigate} />
        <Text style={styles.subsection}>Price</Text>
        <ActionList items={report.actionMap.price} />
        <Text style={styles.subsection}>Protect</Text>
        <ActionList items={report.actionMap.protect} />
        <Text style={styles.subsection}>Walk-away conditions</Text>
        <ActionList items={report.walkAwayConditions} />

        <SectionHeader number="07" title="Uncertainty Surface" />
        {report.uncertaintySurface.map((item, index) => (
          <View key={`${item.unknown}-${index}`} style={styles.rankedCard} wrap={false}>
            <Text style={styles.cardTitle}>{item.unknown}</Text>
            <Text style={styles.body}>Decision consequence: {item.decisionConsequence}</Text>
            <Text style={styles.cardMeta}>Evidence required: {item.evidenceRequired}</Text>
            <Text style={styles.evidence}>{evidenceLabel(item.evidenceIds)}</Text>
          </View>
        ))}

        <SectionHeader number="08" title="Questions for the Seller" />
        {report.rankedSellerQuestions.map((item) => (
          <View key={`${item.rank}-${item.question}`} style={styles.rankedCard} wrap={false}>
            <Text style={styles.rank}>QUESTION {String(item.rank).padStart(2, "0")}</Text>
            <Text style={styles.cardTitle}>{item.question}</Text>
            <Text style={styles.body}>{item.reason}</Text>
            <Text style={styles.cardMeta}>Decision affected: {item.decisionAffected}</Text>
            <Text style={styles.evidence}>{evidenceLabel(item.evidenceIds)}</Text>
          </View>
        ))}

        <SectionHeader number="09" title="Next Decision" />
        <View style={styles.callout} wrap={false}>
          <Text style={styles.calloutTitle}>Next commitment</Text>
          <Text style={styles.calloutText}>{report.nextDecision.commitment}</Text>
        </View>
        <MetricTable
          rows={[
            ["Evidence gate", report.nextDecision.evidenceGate],
            ["Stop condition", report.nextDecision.stopCondition],
          ]}
        />

        <SectionHeader number="A" title="Evidence Register" />
        {report.evidenceRegister.map((evidence) => (
          <View key={evidence.id} style={styles.evidenceRow} wrap={false}>
            <Text style={styles.evidenceId}>{evidence.id}</Text>
            <Text style={styles.body}>{evidence.statement}</Text>
            <Text style={styles.muted}>
              {titleCase(evidence.source)} · {titleCase(evidence.status)} · {titleCase(evidence.confidence)} confidence
              {evidence.asOfDate ? ` · as of ${evidence.asOfDate}` : ""}
              {evidence.location ? ` · ${evidence.location}` : ""}
            </Text>
          </View>
        ))}

        <SectionHeader number="B" title="Authority and Limitations" />
        <Text style={styles.subsection}>Authority note</Text>
        <Text style={styles.body}>{report.authorityNote}</Text>
        <Text style={styles.subsection}>Limitations</Text>
        <BulletList items={report.limitations} />
        <Text style={styles.muted}>
          Acquisition Lens preserves deterministic calculations as authoritative. Narrative interpretation cannot override the supplied underwriting, Deal Screen, or source classifications. Independent financial, tax, legal, commercial, insurance, technology, and operational diligence remains required before any transaction commitment.
        </Text>
      </Page>
    </Document>
  );
}

export async function generateAcquisitionLensPDF(report: AcquisitionReasoningReport) {
  return renderToBuffer(<AcquisitionLensReportDocument report={report} />);
}

export function acquisitionLensFilename(targetName: string) {
  const safeTarget = targetName
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "Target";
  return `Acquisition-Lens-${safeTarget}.pdf`;
}
