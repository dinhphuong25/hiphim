import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "400px",
      },
      fontFamily: {
        sans: ["var(--font-be-vietnam)", "var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        display: ["var(--font-be-vietnam)", "system-ui", "sans-serif"],
      },
      colors: {
        background: "var(--cinema-bg)",
        foreground: "var(--cinema-text)",
        
        // CINEMATIC EDITORIAL PALETTE (#050807)
        cinema: {
          bg: "#050807",
          sub: "#0B100E",
          surface: "#111714",
          hover: "#151D19",
          border: "rgba(255,255,255,0.10)",
          "border-strong": "rgba(255,255,255,0.18)",
          text: "#F4F5F2",
          muted: "rgba(244,245,242,0.68)",
          dim: "rgba(244,245,242,0.45)",
          gold: "#D7C7A0",
        },

        // HI PHIM BRAND ACCENT (#20D66B)
        brand: {
          green: "#20D66B",
          "green-hover": "#2AE376",
          "green-glow": "rgba(32,214,107,0.20)",
          gold: "#D7C7A0",
        },

        // Shadcn UI compat
        card: { DEFAULT: "#111714", foreground: "#F4F5F2" },
        popover: { DEFAULT: "#0B100E", foreground: "#F4F5F2" },
        primary: { DEFAULT: "#20D66B", foreground: "#050807" },
        secondary: { DEFAULT: "#151D19", foreground: "#F4F5F2" },
        muted: { DEFAULT: "#111714", foreground: "rgba(244,245,242,0.68)" },
        accent: { DEFAULT: "#D7C7A0", foreground: "#050807" },
        border: "rgba(255,255,255,0.10)",
        input: "rgba(255,255,255,0.08)",
        ring: "#20D66B",
      },
      borderRadius: {
        xl: "1rem",
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      spacing: {
        sidebar: "72px",
        "sidebar-expanded": "240px",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-up": { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "hero-zoom": { from: { transform: "scale(1.04)" }, to: { transform: "scale(1)" } },
        "pulse-glow": { "0%, 100%": { opacity: "0.4" }, "50%": { opacity: "0.8" } },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        "progress-scale": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "fade-up": "fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "hero-zoom": "hero-zoom 7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        marquee: 'marquee 35s linear infinite',
        "progress-scale": "progress-scale linear forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
