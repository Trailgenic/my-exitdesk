/** @type {import('next').NextConfig} */
const nextConfig = {
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
