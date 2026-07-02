/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Pin the workspace root so Next ignores unrelated lockfiles higher up the tree.
  outputFileTracingRoot: import.meta.dirname,
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

export default nextConfig;
