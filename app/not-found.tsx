// Mirrors the 404 page mikeye.com served from Webflow.
export const metadata = {
  title: "Not Found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <>
      <link href="/assets/webflow/css/mike-ye.webflow.shared.675a2fff6.css" rel="stylesheet" />
      <div className="utility-wrapper">
        <div className="utility-container">
          <div className="text-mono">404</div>
          <div className="utility-content">
            <h1>Page not found</h1>
            <p>The page you are looking for doesn&apos;t exist or has been moved.</p>
            <p>
              <a href="/">Go to the home page</a>
            </p>
          </div>
          <div></div>
        </div>
      </div>
    </>
  );
}
