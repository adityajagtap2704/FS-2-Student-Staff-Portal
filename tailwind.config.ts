import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      colors: {
        border: "#e5e7eb",
        primary: {
          DEFAULT: "#1D9E75",
          50:  "#edfaf4",
          100: "#d0f4e5",
          200: "#a3e8cc",
          300: "#6dd5ae",
          400: "#38bc8e",
          500: "#1D9E75",
          600: "#167d5d",
          700: "#115f47",
          800: "#0c4232",
          900: "#07261d",
          950: "#031410",
        },
        kalnet: {
          bg:      "#ffffff",
          text:    "#444444",
          sidebar: "#fafbfc",
          border:  "#e5e7eb",
          muted:   "#6b7280",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft:  "0 2px 15px -3px rgba(0,0,0,0.07), 0 10px 20px -2px rgba(0,0,0,0.04)",
        card:  "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        glow:  "0 0 0 1px rgba(29,158,117,0.1), 0 4px 24px rgba(29,158,117,0.15)",
        "glow-lg": "0 0 0 1px rgba(29,158,117,0.15), 0 8px 40px rgba(29,158,117,0.2)",
        "inner-sm": "inset 0 1px 2px rgba(0,0,0,0.05)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-primary": "linear-gradient(135deg, #1D9E75 0%, #38bc8e 100%)",
        "gradient-subtle":  "linear-gradient(135deg, #edfaf4 0%, #d0f4e5 100%)",
        "mesh-pattern": "radial-gradient(at 40% 20%, hsla(160,60%,74%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(160,60%,74%,0.1) 0px, transparent 50%)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      keyframes: {
        shimmer: {
          "0%":   { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        bounceIn: {
          "0%":   { transform: "scale(0.3)", opacity: "0" },
          "50%":  { transform: "scale(1.05)" },
          "70%":  { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        shimmer:   "shimmer 1.5s infinite",
        "fade-in": "fadeIn 0.4s ease both",
        "scale-in":"scaleIn 0.3s ease both",
        "slide-up":"slideUp 0.4s ease both",
        "bounce-in":"bounceIn 0.5s ease both",
      },
    },
  },
  plugins: [],
};

export default config;
