/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@eventstream/ui", "@eventstream/config"],
  experimental: {},
};

module.exports = nextConfig;
