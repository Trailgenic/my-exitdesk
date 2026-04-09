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
  Text
} from "@react-email/components";

type ExitDeskReportProps = {
  report: string;
  companyName: string;
};

export function ExitDeskReport({ report, companyName }: ExitDeskReportProps) {
  return (
    <Html>
      <Head />
      <Preview>Exit Desk report for {companyName}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Heading as="h1" style={styles.wordmark}>
            Exit Desk
          </Heading>
          <Text style={styles.subheader}>Confidential — {companyName}</Text>
          <Section style={styles.reportSection}>
            <Text style={styles.reportText}>{report}</Text>
          </Section>
          <Hr style={styles.divider} />
          <Section>
            <Text style={styles.upsellTitle}>Want to discuss this directly?</Text>
            <Text style={styles.upsellBody}>
              Book a 90-minute advisory session with Mike Ye — $1,999
            </Text>
            <Link href="[CALENDLY_LINK_PLACEHOLDER]" style={styles.link}>
              Schedule advisory session
            </Link>
          </Section>
          <Hr style={styles.divider} />
          <Text style={styles.footer}>Mike Ye · mikeye.com</Text>
          <Text style={styles.footerMuted}>
            This report reflects institutional M&A judgment, not legal, tax, or
            investment advice.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles: Record<string, React.CSSProperties> = {
  body: {
    margin: 0,
    padding: "24px 12px",
    backgroundColor: "#ffffff",
    color: "#111111",
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
  },
  container: {
    maxWidth: "640px",
    margin: "0 auto"
  },
  wordmark: {
    fontSize: "24px",
    margin: "0 0 8px",
    textAlign: "left"
  },
  subheader: {
    margin: "0 0 20px",
    fontSize: "14px"
  },
  reportSection: {
    marginBottom: "20px"
  },
  reportText: {
    whiteSpace: "pre-wrap",
    lineHeight: "1.55",
    fontSize: "14px",
    margin: 0
  },
  divider: {
    borderColor: "#e5e5e5",
    margin: "24px 0"
  },
  upsellTitle: {
    fontWeight: 600,
    margin: "0 0 8px"
  },
  upsellBody: {
    margin: "0 0 10px"
  },
  link: {
    color: "#111111",
    textDecoration: "underline"
  },
  footer: {
    fontSize: "13px",
    margin: "0 0 8px"
  },
  footerMuted: {
    fontSize: "12px",
    color: "#555555",
    margin: 0
  }
};

export default ExitDeskReport;
