export default function SuccessPage() {
  return (
    <main
      style={{
        fontFamily: "Georgia, serif",
        maxWidth: "600px",
        margin: "80px auto",
        padding: "0 24px",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "28px",
          fontWeight: "600",
          marginBottom: "16px",
          color: "#111111",
        }}
      >
        Your report is on its way.
      </h1>
      <p
        style={{
          fontSize: "16px",
          lineHeight: "1.8",
          color: "#444444",
          marginBottom: "24px",
        }}
      >
        Your Exit Desk report has been generated and sent to your
        inbox. Delivery is typically within a few minutes.
      </p>
      <p
        style={{
          fontSize: "14px",
          color: "#888888",
          lineHeight: "1.7",
        }}
      >
        If you don't see it within 5 minutes, check your spam folder.
        The email will arrive from mike@mikeye.com.
      </p>
    </main>
  );
}
