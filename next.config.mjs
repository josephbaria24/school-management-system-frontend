/** @type {import('next').NextConfig} */
const devDistDir = process.env.NEXT_DEV_DIST_DIR;
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["*.replit.dev", "*.repl.co", "*.kirk.replit.dev"],
  ...(devDistDir ? { distDir: devDistDir } : {}),
};

export default nextConfig;
