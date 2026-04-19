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

  // Pre-process risk items (section 05): collect dimension, rating, explanation
  const riskItems: Array<{ indices: number[]; dimension: string; rating: string; explanation: string }> = [];
  for (let i = 0; i < lines.length; i++) {
    const s = sanitizeLine(lines[i].trim());
    const match = s.match(/^(.*?)\s+—\s+(High|Moderate|Low|Unknown)$/i);
    if (match) {
      riskItems.push({
        indices: [i, i + 1],
        dimension: match[1],
        rating: match[2].toUpperCase(),
        explanation: sanitizeLine((lines[i + 1] || '').trim()),
      });
      i += 1;
    }
  }
  const riskLineIndices = new Set(riskItems.flatMap(r => r.indices));

  // Pre-process action cards (section 09): collect num, title, body, timeline
  const actionCards: Array<{ indices: number[]; num: string; title: string; bodyLines: string[]; timeline: string }> = [];
  let inSection09 = false;
  let currentCard: typeof actionCards[0] | null = null;
  for (let i = 0; i < lines.length; i++) {
    const s = sanitizeLine(lines[i].trim());
    const headingMatch = s.match(/^(\d{1,2})[\.\)\-\s]+(.+)$/);
    if (lines[i].trim().startsWith('#') && headingMatch) {
      if (currentCard) { actionCards.push(currentCard); currentCard = null; }
      inSection09 = headingMatch[1].padStart(2, '0') === '09';
      continue;
    }
    if (!inSection09) continue;
    const actionMatch = s.match(/^(\d+)\.\s+(.+)$/);
    if (actionMatch) {
      if (currentCard) actionCards.push(currentCard);
      currentCard = { indices: [i], num: actionMatch[1].padStart(2, '0'), title: actionMatch[2], bodyLines: [], timeline: '' };
    } else if (currentCard) {
      currentCard.indices.push(i);
      if (/^Timeline:/i.test(s)) currentCard.timeline = s;
      else if (s) currentCard.bodyLines.push(s);
    }
  }
  if (currentCard) actionCards.push(currentCard);
  const actionLineIndices = new Set(actionCards.flatMap(c => c.indices));

  // Pre-process section 08 uncertainty items
  const uncertainty08Items: Array<{ index: number; text: string }> = [];
  let inSection08 = false;
  for (let i = 0; i < lines.length; i++) {
    const s = sanitizeLine(lines[i].trim());
    const headingMatch = s.match(/^(\d{1,2})[\.\)\-\s]+(.+)$/);
    if (lines[i].trim().startsWith('#') && headingMatch) {
      inSection08 = headingMatch[1].padStart(2, '0') === '08';
      continue;
    }
    if (inSection08 && s.startsWith('—')) {
      uncertainty08Items.push({ index: i, text: s.replace(/^—\s*/, '') });
    }
  }
  const uncertainty08Indices = new Set(uncertainty08Items.map(u => u.index));

  let previousRenderableType: 'section' | 'list' | 'body' | null = null;
  let currentSection = '00';
  let previousBodyLength = 0;

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Masthead */}
        <Text style={styles.mastheadBrand}>EXIT DESK — BY MIKE YE</Text>
        <Text style={styles.mastheadCompany}>{companyName}</Text>
        <View style={styles.mastheadRule} />

        {/* Risk grid — rendered before main loop, in document order it will appear at section 05 */}
        {riskItems.map((item, i) => {
          const riskStyle =
            item.rating === 'HIGH' ? styles.riskHigh :
            item.rating === 'MODERATE' ? styles.riskModerate :
            item.rating === 'LOW' ? styles.riskLow :
            styles.riskUnknown;
          return (
            <View key={`risk-pre-${i}`} style={styles.riskRow}>
              <Text style={styles.riskDimension}>{item.dimension}</Text>
              <Text style={styles.riskDesc}>{item.explanation}</Text>
              <Text style={riskStyle}>{item.rating}</Text>
            </View>
          );
        })}

        {/* Action cards */}
        {actionCards.map((card, i) => (
          <View key={`action-pre-${i}`} style={styles.actionBlock}>
            <View style={styles.actionHeaderRow}>
              <Text style={styles.actionNumber}>{card.num}</Text>
              <Text style={styles.actionTitle}>{card.title.toUpperCase()}</Text>
            </View>
            {card.bodyLines.map((line, j) => (
              <Text key={`ab-${j}`} style={styles.actionBody}>{line}</Text>
            ))}
            {card.timeline ? <Text style={styles.actionTimeline}>{card.timeline}</Text> : null}
          </View>
        ))}

        {/* Uncertainty box */}
        {uncertainty08Items.length > 0 && (
          <View style={styles.uncertaintyBox}>
            <Text style={styles.uncertaintyLabel}>GAPS IN DISCLOSURE — REFLECTED AS UNCERTAINTIES</Text>
            {uncertainty08Items.map((item, i) => (
              <View key={`u-${i}`} style={styles.ledgerItem}>
                <Text style={styles.ledgerDash}>—</Text>
                <Text style={styles.ledgerText}>{item.text}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Main line-by-line pass */}
        {lines.map((rawLine, index) => {
          const trimmed = rawLine.trim();

          if (!trimmed || /^---+$/.test(trimmed)) return null;

          // Skip lines already rendered by pre-processors
          if (riskLineIndices.has(index) || actionLineIndices.has(index) || uncertainty08Indices.has(index)) return null;

          // Section headings
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

          // Em-dash ledger items (section 04 and others, not 08 which is pre-processed)
          if (trimmed.startsWith('—')) {
            const item = sanitizeLine(trimmed.replace(/^—\s*/, ''));
            if (!item) return null;
            previousRenderableType = 'list';
            return (
              <View key={`item-${index}`} style={styles.ledgerItem}>
                <Text style={styles.ledgerDash}>—</Text>
                <Text style={styles.ledgerText}>{item}</Text>
              </View>
            );
          }

          const content = sanitizeLine(trimmed);
          if (!content) return null;

          const bodyFollowsBody = previousRenderableType === 'body';
          const isKeyValueLead = /Archetype:/i.test(content) || /:\s*[^:]{1,40}$/.test(content);
          const isSignalLabel = currentSection === '02' && /^(POSITION|READY|PREPARE|BUILD)\b/i.test(content);
          const isPullQuote =
            (content.length < 200 && previousBodyLength > 200) ||
            content.startsWith('The founder should expect') ||
            content.startsWith('The correct response');

          previousRenderableType = 'body';
          previousBodyLength = content.length;

          if (isSignalLabel) {
            return (
              <View key={`signal-label-${index}`} style={styles.signalBlock}>
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
            ...(isKeyValueLead ? { fontFamily: 'DMMono', marginBottom: 6 } : null),
          };

          return (
            <Text key={`body-${index}`} style={bodyStyle}>
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
              <Text style={styles.footerText}>Exit Desk · Confidential · mikeye.com</Text>
              <Text style={styles.footerText}>{pageNumber}</Text>
            </>
          )}
        />
      </Page>
    </Document>
  );

  return renderToBuffer(doc);
}
