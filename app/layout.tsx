import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Oswald } from "next/font/google";
import "./globals.css";
import GTM from "@/components/ui/GTM";
import { LoadingProvider } from "@/components/ui/loading-context";
import { WebsiteStructuredData, OrganizationStructuredData } from "@/components/seo/structured-data";
import EnhancedGTMTracking from "@/components/seo/enhanced-gtm";
import HydrationFix from "@/components/ui/hydration-fix";
import { SplashScreen } from "@/components/ui/splash-screen";
import { PWAInstaller, PerformanceMonitor } from "@/components/pwa-init";
import SecurityGuard from "@/components/ui/security-guard";
import NotificationBanner from "@/components/ui/notification-banner";
import SpeculationRules from "@/components/seo/speculation-rules";
import { Toaster } from "sonner";
import AnnouncementBanner from "@/components/announcement-banner";
import { getSiteConfig } from "@/lib/site-config";
import AppShell from "@/components/layout/app-shell";
import { UserAuthProvider } from "@/context/user-auth-context";
import { NavigationTabProvider } from "@/context/navigation-tab-context";
import AuthModal from "@/components/auth/auth-modal";
import AdFloatingSystem from "@/components/ads/ad-floating-system";
import PipWrapper from "@/components/player/pip-wrapper";

// Be Vietnam Pro — font hỗ trợ tiếng Việt tốt nhất, sans-serif hiện đại
const beVietnam = Be_Vietnam_Pro({
  weight: ["400", "600", "700", "900"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-be-vietnam",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

// Oswald — Condensed cinematic headline font for brand logo
const oswald = Oswald({
  weight: ["600", "700"],
  subsets: ["latin", "vietnamese"],
  variable: "--font-oswald",
  display: "swap",
  preload: false,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050807",
};

export const metadata: Metadata = {
  title: {
    default: "Hi Phim - Xem Phim Online HD Miễn Phí Mới Nhất 2026",
    template: "%s | Hi Phim",
  },
  description:
    "Hi Phim - Trang xem phim online HD miễn phí tốc độ cao tại Việt Nam. Kho 50,000+ phim bộ, phim lẻ, anime vietsub mới nhất 2026. Cập nhật hàng ngày, không quảng cáo.",
  keywords: [
    "hi phim",
    "hiphim",
    "xem phim online",
    "phim HD miễn phí",
    "phim mới nhất 2026",
    "phim bộ hay",
    "phim lẻ chiếu rạp",
    "anime vietsub",
    "phim Hàn Quốc",
    "phim Trung Quốc",
    "phim Thái Lan",
    "phim hành động",
    "phim tình cảm",
    "phim kinh dị",
    "xem phim HD",
    "phim hay",
    "phim chất lượng cao",
    "phim vietsub",
    "phim thuyết minh",
  ],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://hiphim.one"),
  openGraph: {
    title: "Hi Phim - Xem Phim Online HD Vietsub Miễn Phí",
    description:
      "Kho 50,000+ phim bộ, phim lẻ chiếu rạp, anime vietsub mới nhất 2026. Tốc độ cao, chuẩn Full HD/4K, cập nhật liên tục hàng ngày.",
    url: "https://hiphim.one",
    siteName: "Hi Phim",
    type: "website",
    locale: "vi_VN",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Hi Phim - Xem Phim Online HD Vietsub Miễn Phí",
        type: "image/jpeg",
      },
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Hi Phim - Xem Phim Online HD Vietsub Miễn Phí",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@hiphim",
    title: "Hi Phim - Xem Phim Online HD Vietsub Miễn Phí",
    description: "Kho 50,000+ phim HD. Phim bộ, phim lẻ chiếu rạp, anime vietsub mới nhất 2026.",
    images: ["/og-image.jpg"],
  },
  applicationName: "Hi Phim",
  referrer: "origin-when-cross-origin",
  creator: "Hi Phim Team",
  publisher: "Hi Phim",
  category: "Entertainment",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: { canonical: "https://hiphim.one" },
  verification: {
    google: "oOs1HYmXd-muliYGGR8v91joJyTEVTbr-mRtnIpXrPY",
    other: {
      "dmca-site-verification": "dVFRZm1kcE1rS1Evak9vaU9jVHBOdz090",
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const siteConfig = getSiteConfig();
  return (
    <html lang="vi" suppressHydrationWarning className="dark">
      <head>
        {/* Google tag (gtag.js) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-RZVHT1Y5B4"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'G-RZVHT1Y5B4');
            `,
          }}
        />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#22c55e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Hi Phim" />
        <link rel="apple-touch-icon" href="/favicon.png" />

        {/* DNS Preconnect & Prefetch — Tối ưu cho ảnh CDN Edge và API */}
        <link rel="preconnect" href="https://i0.wp.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://i0.wp.com" />
        <link rel="preconnect" href="https://phimimg.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://phimimg.com" />
        <link rel="dns-prefetch" href="https://phimapi.com" />
        <link rel="dns-prefetch" href="https://img.ophim.live" />

        {/* Facebook App ID */}
        <meta property="fb:app_id" content={process.env.NEXT_PUBLIC_FB_APP_ID || "10000000000000"} />

        {/* Critical inline CSS — show body ngay lập tức */}
        <style
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              *,*::before,*::after{box-sizing:border-box}
              html{line-height:1.5;-webkit-text-size-adjust:100%}
              body{min-height:100dvh;background:#050a0f;color:#f7f8f9;margin:0;overflow-x:hidden}
            `,
          }}
        />

        {/* Theme init — blocking để tránh flash */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try{
                  var t=localStorage.getItem('rpc_theme')||'dark';
                  document.documentElement.classList.toggle('dark',t==='dark');
                  window.__INITIAL_THEME__=t;
                }catch(e){
                  document.documentElement.classList.add('dark');
                  window.__INITIAL_THEME__='dark';
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${beVietnam.variable} ${oswald.variable} font-sans antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <SplashScreen />

        {/* Google Tag Manager */}
        <GTM />
        <EnhancedGTMTracking />
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WP2MWVB8"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {/* Frontend Security */}
        <SecurityGuard />

        {/* Structured Data SEO */}
        <WebsiteStructuredData url="https://hiphim.one" />
        <OrganizationStructuredData url="https://hiphim.one" />

        <HydrationFix />

        {/* Global Admin Announcement Banner */}
        <AnnouncementBanner initialAnnouncement={siteConfig.announcement} />

        {/* Main App with User Auth & Instant Loading */}
        <UserAuthProvider>
          <LoadingProvider>
            <NavigationTabProvider>
              <AppShell>{children}</AppShell>
            </NavigationTabProvider>
          </LoadingProvider>
          <AuthModal />
          <PipWrapper />
          <AdFloatingSystem />
        </UserAuthProvider>

        {/* Lazy-init sau khi page load */}
        <PWAInstaller />
        <PerformanceMonitor />

        {/* PWA Notification prompt */}
        <NotificationBanner />

        {/* Speculation Rules cho instant navigation */}
        <SpeculationRules />

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          richColors
          expand={false}
          closeButton
          theme="dark"
          toastOptions={{
            style: {
              background: "hsl(217 19% 10%)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#fff",
            },
          }}
        />
      </body>
    </html>
  );
}
