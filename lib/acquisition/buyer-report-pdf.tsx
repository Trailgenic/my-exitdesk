import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, renderToBuffer } from '@react-pdf/renderer';
import type { BuyerDiagnosticReport } from './buyer-diagnostic';
import { buyerReportSections } from './buyer-report-view';
Font.register({ family: 'BuyerSerif', fonts: [
  { src: process.cwd() + '/public/fonts/acquisition/DejaVuSerif.ttf' },
  { src: process.cwd() + '/public/fonts/acquisition/DejaVuSerif-Bold.ttf', fontWeight: 700 },
] });
const styles = StyleSheet.create({ page: { padding: '44pt 48pt 58pt', backgroundColor: '#F7F5EF', fontFamily: 'BuyerSerif', color: '#18221F', fontSize: 10.5 }, brand: { fontFamily: 'Courier', fontSize: 9, color: '#173D34', marginBottom: 10 }, title: { fontSize: 25, marginBottom: 10 }, meta: { fontSize: 9, color: '#59675F', marginBottom: 20 }, heading: { fontFamily: 'BuyerSerif', fontWeight: 700, fontSize: 15, color: '#173D34', marginTop: 17, marginBottom: 9 }, paragraph: { lineHeight: 1.45, marginBottom: 7 }, footer: { position: 'absolute', bottom: 25, left: 48, right: 48, fontFamily: 'Courier', fontSize: 7, color: '#59675F' } });
export async function renderBuyerReportPDF(report: BuyerDiagnosticReport) {
  const clean = (text: string) => text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/[\u2011\u2013\u2014]/g, '-');
  return renderToBuffer(<Document title={'Acquisition Lens — ' + report.companyName}><Page size="A4" style={styles.page}>
    <Text style={styles.brand}>ACQUISITION LENS | ELLA x MIKE YE</Text><Text style={styles.title}>{clean(report.companyName)}</Text><Text style={styles.meta}>Confidential buyer assessment | {report.generatedAt.slice(0,10)} | {report.reportId}</Text>
    {buyerReportSections(report).map((section, i) => <View key={i}><View wrap={false}><Text style={styles.heading}>{i + 1}. {clean(section.title)}</Text><Text style={styles.paragraph}>{clean(section.paragraphs[0] || 'No additional item identified from the supplied evidence.')}</Text></View>{section.paragraphs.slice(1).map((p,j) => <Text key={j} style={styles.paragraph} orphans={3} widows={3}>{clean(p)}</Text>)}</View>)}
    <Text fixed style={styles.footer} render={({pageNumber,totalPages}) => 'Acquisition Lens · Confidential · mikeye.com | ' + pageNumber + ' / ' + totalPages} />
  </Page></Document>);
}
