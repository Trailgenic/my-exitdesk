import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 48,
    backgroundColor: '#FFFFFF',
    color: '#1A1A18',
    fontFamily: 'Helvetica',
    fontSize: 11,
  },
  headerBlock: {
    backgroundColor: '#1A1A18',
    padding: 32,
    marginBottom: 24,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 6,
  },
  headerSubtitle: {
    color: '#888880',
    fontSize: 9,
    fontFamily: 'Courier',
  },
  sectionWrap: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 9,
    color: '#1A1A18',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  rule: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#C8C4BA',
  },
  bodyText: {
    fontSize: 11,
    color: '#2A2A26',
    lineHeight: 1.6,
    marginBottom: 8,
  },
  listItem: {
    fontSize: 11,
    color: '#2A2A26',
    lineHeight: 1.6,
    marginLeft: 12,
    marginBottom: 6,
  },
  authority: {
    marginTop: 16,
    fontSize: 8,
    color: '#AAAAAA',
    fontStyle: 'italic',
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#AAAAAA',
  },
  footerPage: {
    fontSize: 8,
    color: '#AAAAAA',
  },
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

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBlock}>
          <Text style={styles.headerTitle}>Exit Desk</Text>
          <Text style={styles.headerSubtitle}>
            {`CONFIDENTIAL — ${companyName.toUpperCase()}`}
          </Text>
        </View>

        {lines.map((rawLine, index) => {
          const trimmed = rawLine.trim();

          if (!trimmed || /^---+$/.test(trimmed)) {
            return null;
          }

          if (trimmed.startsWith('#')) {
            const title = sanitizeLine(trimmed);
            if (!title) return null;
            previousRenderableType = 'section';

            return (
              <View key={`section-${index}`} style={styles.sectionWrap}>
                <Text style={styles.sectionHeader}>{title}</Text>
                <View style={styles.rule} />
              </View>
            );
          }

          if (trimmed.startsWith('—')) {
            const item = sanitizeLine(trimmed.replace(/^—\s*/, ''));
            if (!item) return null;
            previousRenderableType = 'list';
            return (
              <Text key={`item-${index}`} style={styles.listItem}>
                {item}
              </Text>
            );
          }

          const content = sanitizeLine(trimmed);
          if (!content) return null;

          const bodyFollowsBody = previousRenderableType === 'body';
          const isKeyValueLead =
            /Archetype:/i.test(content) || /:\s*[^:]{1,40}$/.test(content);
          previousRenderableType = 'body';

          const bodyStyle = {
            ...styles.bodyText,
            ...(bodyFollowsBody ? { marginTop: 8 } : null),
            ...(isKeyValueLead
              ? {
                  fontFamily: 'Helvetica-Bold',
                  marginBottom: 6,
                }
              : null),
          };

          return (
            <Text key={`body-${index}`} style={bodyStyle}>
              {content}
            </Text>
          );
        })}

        <Text style={styles.authority}>
          This output reflects the M&A and portfolio-operations judgment framework
          {' '}of Mike Ye. Not legal, tax, or investment advice.
        </Text>

        <View
          style={styles.footer}
          fixed
          render={({ pageNumber }: { pageNumber: number }) => (
            <>
              <Text style={styles.footerText}>
                Exit Desk · Confidential · mikeye.com
              </Text>
              <Text style={styles.footerPage}>
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
