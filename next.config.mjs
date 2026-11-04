/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{
      source: "/exit-:kind-native-v1.js",
      headers: [
        { key: "Access-Control-Allow-Origin", value: "*" },
        { key: "Cache-Control", value: "public, max-age=3600" },
      ],
    }, ...["/ontology.json", "/datasets/ma-library.json", "/llms.txt"].map(source => ({
      source,
      headers: [
        { key: "Access-Control-Allow-Origin", value: "*" },
        ...(source === "/ontology.json" ? [{ key: "Content-Type", value: "application/ld+json; charset=utf-8" }] : []),
      ],
    })), {
      // mikeye.com is the only address search engines and AI models should index;
      // the project's vercel.app address serves the same files.
      source: "/:path*",
      has: [{ type: "host", value: "my-exitdesk.vercel.app" }],
      headers: [{ key: "X-Robots-Tag", value: "noindex" }],
    }];
  },
  async redirects() {
    return [
      {
        source: "/exit/run",
        destination: "/exit/score",
        permanent: true,
      },
      // Carried over from Webflow's 301 list (the /exit/run rule is above).
      {
        source: "/exit/articles/what-buyers-actually-look",
        destination: "/exit/articles/what-buyers-actually-look-for",
        permanent: true,
      },
      // The site's pages live in public/_site; keep that folder out of public addresses.
      { source: "/_site/index.html", destination: "/", permanent: true },
      { source: "/_site/:path*/index.html", destination: "/:path*", permanent: true },
    ];
  },
  // mikeye.com pages (formerly hosted on Webflow) are static HTML in public/_site.
  // Real routes and files (API, /assets, llms.txt, ...) take priority; any other
  // address is served from the matching page, or the 404 page if none exists.
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/_site/index.html" }],
      afterFiles: [],
      fallback: [{ source: "/:path+", destination: "/_site/:path+/index.html" }],
    };
  },
};
export default nextConfig;
