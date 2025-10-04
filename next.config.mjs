/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  experimental: {
    // Evita reinicios innecesarios y activa imports más rápidos
    optimizePackageImports: ['lucide-react'],
    turbo: {
      rules: {}, // fuerza que Turbopack no reanalice config constantemente
    },
  },
  reactStrictMode: true,
}

export default nextConfig
