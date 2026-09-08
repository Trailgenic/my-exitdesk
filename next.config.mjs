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
    }))];
  },
  async redirects() {
    return [
      {
        source: "/exit/run",
        destination: "/exit/score",
        permanent: true,
      },
    ];
  },
};
export default nextConfig;
