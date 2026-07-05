/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "https://couture-document-api.onrender.com/api/v1/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
