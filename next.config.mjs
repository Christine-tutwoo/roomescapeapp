/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // 減少像 lucide-react 這類套件的匯入成本（有助縮小首包）
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
