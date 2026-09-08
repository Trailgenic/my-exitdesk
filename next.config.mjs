/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{
      source: "/exit-:kind-native-v1.js",
      headers: [
        { key: "Access-Control-Allow-Origin", value: "*" },
        { key: "Cache-Control", value: "public, max-age=3600" },
      ],
    }];
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
