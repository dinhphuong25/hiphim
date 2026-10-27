import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
});

const nextConfig: NextConfig = {
  devIndicators: false,
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  images: {
    unoptimized: true,
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1440, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "phimimg.com", pathname: "/**" },
      { protocol: "https", hostname: "*.phimimg.com", pathname: "/**" },
      { protocol: "https", hostname: "img.ophim.live", pathname: "/**" },
      { protocol: "https", hostname: "*.ophim.live", pathname: "/**" },
      { protocol: "https", hostname: "img.ophim1.com", pathname: "/**" },
      { protocol: "https", hostname: "img.ophim.cc", pathname: "/**" },
      { protocol: "https", hostname: "*.ophim.cc", pathname: "/**" },
      { protocol: "https", hostname: "img.ophim5.com", pathname: "/**" },
      { protocol: "https", hostname: "*.phimapi.com", pathname: "/**" },
      { protocol: "https", hostname: "img.phimapi.com", pathname: "/**" },
      { protocol: "https", hostname: "*.wp.com", pathname: "/**" },
      { protocol: "https", hostname: "i0.wp.com", pathname: "/**" },
      { protocol: "https", hostname: "i1.wp.com", pathname: "/**" },
      { protocol: "https", hostname: "i2.wp.com", pathname: "/**" },
      { protocol: "https", hostname: "phim.nguonc.com", pathname: "/**" },
      { protocol: "https", hostname: "*.nguonc.com", pathname: "/**" },
    ],
    formats: ["image/avif", "image/webp"],
    qualities: [50, 70, 75, 80, 85],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  compress: true,
  poweredByHeader: false,
  reactStrictMode: false,

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-slider",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-popover",
      "@radix-ui/react-tabs",
      "clsx",
      "tailwind-merge",
      "sonner",
      "date-fns",
    ],
    staticGenerationRetryCount: 3,
    staleTimes: {
      dynamic: 300,
      static: 1800,
    },
  },

  turbopack: {},

  // Webpack chunk splitting for production (từ phimanh-pro2-main)
  webpack: (config: any, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
    if (dev && process.env.ANALYZE === "true") {
      const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
      config.plugins.push(new BundleAnalyzerPlugin({ analyzerMode: "server", openAnalyzer: true }));
    }
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            hlsjs: {
              test: /[\\/]node_modules[\\/]hls\.js[\\/]/,
              name: "hls",
              chunks: "all",
              priority: 20,
            },
            framer: {
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              name: "framer",
              chunks: "all",
              priority: 15,
            },
            radix: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: "radix",
              chunks: "all",
              priority: 10,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
              priority: 5,
            },
          },
        },
      };
    }
    return config;
  },

  async headers() {
    return [
      {
        source: "/(favicon.*|icon.*|apple-icon.*|manifest.json)",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
      {
        source: "/api/admin/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate, private, max-age=0" }],
      },
      {
        source: "/api/auth/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate, private, max-age=0" }],
      },
      {
        source: "/api/announcement",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=60, max-age=30, stale-while-revalidate=300" }],
      },
      {
        source: "/api/system/maintenance",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=30, max-age=10, stale-while-revalidate=120" }],
      },
      {
        source: "/api/cron/:path*",
        headers: [{ key: "Cache-Control", value: "no-store, no-cache, must-revalidate, private, max-age=0" }],
      },
      {
        source: "/api/phim",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=1800, max-age=300, stale-while-revalidate=86400" }],
      },
      {
        source: "/api/phim/:path*",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=1800, max-age=300, stale-while-revalidate=86400" }],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://player.phimapi.com https://images.dmca.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https: blob:; media-src 'self' https: blob: *; connect-src 'self' https: *; frame-src 'self' https: *; object-src 'none'; base-uri 'self'; form-action 'self';",
          },
          { key: "Accept-CH", value: "DPR, Viewport-Width, Width" },
        ],
      },
    ];
  },

  async redirects() {
    return [
      { source: "/home", destination: "/", permanent: true },
      { source: "/yeu-thich", destination: "/favorites", permanent: true },
      { source: "/app", destination: "/tai-app", permanent: false },
      { source: "/download", destination: "/tai-app", permanent: false },
    ];
  },
};

export default withPWA(nextConfig);
