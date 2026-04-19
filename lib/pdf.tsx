import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
} from '@react-pdf/renderer';

Font.register({
  family: 'EBGaramond',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/ebgaramond/v27/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-6_RUA4V-e6yHgQ.woff', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/ebgaramond/v27/SlGFmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-6_RkAIh2.woff', fontWeight: 400, fontStyle: 'italic' },
  ],
});

Font.register({
  family: 'DMMono',
  src: 'https://fonts.gstatic.com/s/dmmono/v14/aFTR7PB1QTsUX8KYvrGyIYSnbKX9Rlk.woff',
});

const styles = StyleSheet.create({
  page: { padding: '48pt 52pt 64pt 52pt', backgroundColor: '#F7F5F0', color: '#2A2A26', fontFamily: 'EBGaramond', fontSize: 11 },
  mastheadBrand: { fontFamily: 'DMMono', fontSize: 8, letterSpacing: 1.2, color: '#888880', textAlign: 'right', marginBottom: 6 },
  mastheadCompany: { fontSize: 24, fontWeight: 400, color: '#1A1A18', marginBottom: 8, lineHeight: 1.1 },
  mastheadRule: { borderBottomWidth: 0.5, borderBottomColor: '#C8C4BA', marginBottom: 28, marginTop: 8 },
  sectionRuleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 32, marginBottom: 16 },
  sectionNumber: { fontFamily: 'DMMono', fontSize: 8, color: '#c8a96e', letterSpacing: 1, marginRight: 10 },
  sectionLabel: { fontFamily: 'DMMono', fontSize: 8, letterSpacing: 1.2, color: '#888880', marginRight: 14 },
  sectionRuleLine: { flex: 1, borderBottomWidth: 0.5, borderBottomColor: '#C8C4BA' },
  bodyText: { fontSize: 11, lineHeight: 1.75, color: '#2A2A26', marginBottom: 10 },
  pullQuote: { borderLeftWidth: 1.5, borderLeftColor: '#c8a96e', paddingLeft: 14, marginTop: 14, marginBottom: 14 },
  pullQuoteText: { fontSize: 11, fontStyle: 'italic', color: '#1A1A18', lineHeight: 1.65 },
  signalBlock: { backgroundColor: '#1A1A18', padding: '16pt 20pt', marginTop: 10, marginBottom: 16 },
  signalLabel: { fontFamily: 'DMMono', fontSize: 7, letterSpacing: 1.4, color: '#c8a96e', marginBottom: 6 },
  signalText: { fontSize: 11, fontStyle: 'italic', color: '#C8C4BA', lineHeight: 1.65 },
  riskRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#E0DDD6', paddingTop: 10, paddingBottom: 10, alignItems: 'flex-start' },
  riskDimension: { fontFamily: 'DMMono', fontSize: 7.5, letterSpacing: 0.6, color: '#555550', width: 130, paddingRight: 10 },
  riskDesc: { fontSize: 10, color: '#2A2A26', lineHeight: 1.55, flex: 1, paddingRight: 10 },
  riskHigh: { fontFamily: 'DMMono', fontSize: 7.5, letterSpacing: 1, color: '#A32D2D', width: 60, textAlign: 'right' },
  riskModerate: { fontFamily: 'DMMono', fontSize: 7.5, letterSpacing: 1, color: '#BA7517', width: 60, textAlign: 'right' },
  riskLow: { fontFamily: 'DMMono', fontSize: 7.5, letterSpacing: 1, color: '#3B6D11', width: 60, textAlign: 'right' },
  riskUnknown: { fontFamily: 'DMMono', fontSize: 7.5, letterSpacing: 1, color: '#888880', width: 60, textAlign: 'right' },
  ledgerItem: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#E0DDD6', paddingTop: 8, paddingBottom: 8 },
  ledgerDash: { fontSize: 10, color: '#C8C4BA', width: 14 },
  ledgerText: { fontSize: 10, color: '#2A2A26', lineHeight: 1.6, flex: 1 },
  uncertaintyBox: { backgroundColor: '#F2F0EB', borderLeftWidth: 1.5, borderLeftColor: '#C8C4BA', padding: '14pt 18pt', marginTop: 10, marginBottom: 10 },
  uncertaintyLabel: { fontFamily: 'DMMono', fontSize: 7.5, letterSpacing: 1.2, color: '#888880', marginBottom: 10 },
  actionBlock: { backgroundColor: '#F2F0EB', borderLeftWidth: 1.5, borderLeftColor: '#C8C4BA', padding: '14pt 18pt', marginBottom: 12 },
  actionHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  actionNumber: { fontFamily: 'DMMono', fontSize: 8, color: '#c8a96e', marginRight: 10 },
  actionTitle: { fontFamily: 'DMMono', fontSize: 8, letterSpacing: 0.8, color: '#555550', flex: 1 },
  actionBody: { fontSize: 10, lineHeight: 1.7, color: '#2A2A26', marginBottom: 6 },
  actionTimeline: { fontFamily: 'DMMono', fontSize: 7.5, letterSpacing: 0.8, color: '#c8a96e', marginTop: 6 },
  disclaimer: { fontFamily: 'DMMono', fontSize: 7.5, color: '#AAAAAA', lineHeight: 1.7, letterSpacing: 0.3, marginTop: 20, borderTopWidth: 0.5, borderTopColor: '#C8C4BA', paddingTop: 14 },
  footer: { position: 'absolute', bottom: 24, left: 52, right: 52, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 0.5, borderTopColor: '#C8C4BA', paddingTop: 8 },
  footerText: { fontFamily: 'DMMono', fontSize: 7, color: '#AAAAAA', letterSpacing: 0.4 },
});

function sanitizeLine(line: string): string {
  return line
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^#+\s*/, '')
    .replace(/^---+\s*$/, '')
    .trim();
}

export async function generateReportPDF(
  report: string,
  companyName: string
): Promise<Buffer> {
  const lines = report.split(/\r?\n/);
  let previousRenderableType: 'section' | 'list' | 'body' | null = null;
  let currentSection = '00';
  let previousBodyLength = 0;

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.mastheadBrand}>EXIT DESK — BY MIKE YE</Text>
        <Text style={styles.mastheadCompany}>{companyName}</Text>
        <View style={styles.mastheadRule} />

        {lines.map((rawLine, index) => {
          const trimmed = rawLine.trim();

          if (!trimmed || /^---+$/.test(trimmed)) {
            return null;
          }

          if (trimmed.startsWith('#')) {
            const title = sanitizeLine(trimmed);
            if (!title) return null;
            previousRenderableType = 'section';
            const headingMatch = title.match(/^(\d{1,2})[\.\)\-\s]+(.+)$/);
            const number = headingMatch ? headingMatch[1].padStart(2, '0') : '00';
            const label = (headingMatch ? headingMatch[2] : title).toUpperCase();
            currentSection = number;

            return (
              <View key={`section-${index}`} style={styles.sectionRuleRow}>
                <Text style={styles.sectionNumber}>{number}</Text>
                <Text style={styles.sectionLabel}>{label}</Text>
                <View style={styles.sectionRuleLine} />
              </View>
            );
          }

          if (trimmed.startsWith('—')) {
            const item = sanitizeLine(trimmed.replace(/^—\s*/, ''));
            if (!item) return null;
            previousRenderableType = 'list';
            const ledgerRow = (
              <View key={`item-${index}`} style={styles.ledgerItem}>
                <Text style={styles.ledgerDash}>—</Text>
                <Text style={styles.ledgerText}>{item}</Text>
              </View>
            );

            if (currentSection === '08') {
              return (
                <View key={`uncertainty-${index}`} style={styles.uncertaintyBox}>
                  <Text style={styles.uncertaintyLabel}>GAPS IN DISCLOSURE — REFLECTED AS UNCERTAINTIES</Text>
                  {ledgerRow}
                </View>
              );
            }

            return ledgerRow;
          }

          const content = sanitizeLine(trimmed);
          if (!content) return null;

          const bodyFollowsBody = previousRenderableType === 'body';
          const isKeyValueLead =
            /Archetype:/i.test(content) || /:\s*[^:]{1,40}$/.test(content);
          const isSignalLabel =
            currentSection === '02' && /^(POSITION|READY|PREPARE|BUILD)\b/i.test(content);
          const riskMatch = currentSection === '05' ? content.match(/^(.*?)\s+—\s+(High|Moderate|Low|Unknown)$/i) : null;
          const actionMatch = currentSection === '09' ? content.match(/^(\d+)\.\s*(.+)$/) : null;
          const isTimeline = currentSection === '09' && /^Timeline:/i.test(content);
          const isPullQuote =
            (content.length < 200 && previousBodyLength > 200) ||
            content.startsWith('The founder should expect') ||
            content.startsWith('The correct response');
          previousRenderableType = 'body';
          previousBodyLength = content.length;

          if (riskMatch) {
            const rating = riskMatch[2].toUpperCase();
            const riskStyle =
              rating === 'HIGH'
                ? styles.riskHigh
                : rating === 'MODERATE'
                  ? styles.riskModerate
                  : rating === 'LOW'
                    ? styles.riskLow
                    : styles.riskUnknown;

            return (
              <View key={`risk-${index}`} style={styles.riskRow}>
                <Text style={styles.riskDimension}>{riskMatch[1]}</Text>
                <Text style={styles.riskDesc}>{''}</Text>
                <Text style={riskStyle}>{rating}</Text>
              </View>
            );
          }

          if (actionMatch) {
            return (
              <View key={`action-${index}`} style={styles.actionBlock}>
                <View style={styles.actionHeaderRow}>
                  <Text style={styles.actionNumber}>{actionMatch[1].padStart(2, '0')}</Text>
                  <Text style={styles.actionTitle}>{actionMatch[2].toUpperCase()}</Text>
                </View>
              </View>
            );
          }

          if (isTimeline) {
            return (
              <Text key={`timeline-${index}`} style={styles.actionTimeline}>
                {content}
              </Text>
            );
          }

          if (isSignalLabel) {
            return (
              <View key={`signal-${index}`} style={styles.signalBlock}>
                <Text style={styles.signalLabel}>{content}</Text>
              </View>
            );
          }

          if (currentSection === '02') {
            return (
              <View key={`signal-text-${index}`} style={styles.signalBlock}>
                <Text style={styles.signalText}>{content}</Text>
              </View>
            );
          }

          if (isPullQuote) {
            return (
              <View key={`pull-${index}`} style={styles.pullQuote}>
                <Text style={styles.pullQuoteText}>{content}</Text>
              </View>
            );
          }

          const bodyStyle = {
            ...styles.bodyText,
            ...(bodyFollowsBody ? { marginTop: 8 } : null),
            ...(isKeyValueLead
              ? {
                  fontFamily: 'DMMono',
                  marginBottom: 6,
                }
              : null),
          };

          return (
            <Text key={`body-${index}`} style={currentSection === '09' ? styles.actionBody : bodyStyle}>
              {content}
            </Text>
          );
        })}

        <Text style={styles.disclaimer}>
          This output reflects the M&A and portfolio-operations judgment framework of Mike Ye. Not legal, tax, or investment advice.
        </Text>

        <View
          style={styles.footer}
          fixed
          render={({ pageNumber }: { pageNumber: number }) => (
            <>
              <Text style={styles.footerText}>
                Exit Desk · Confidential · mikeye.com
              </Text>
              <Text style={styles.footerText}>
                {pageNumber}
              </Text>
            </>
          )}
        />
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
