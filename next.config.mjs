/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { outputFileTracingIncludes: { '/api/acquisition/buyer-report*': ['./public/fonts/acquisition/*'] } },
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
