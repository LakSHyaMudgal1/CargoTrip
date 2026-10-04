/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // shadcn semantic tokens (HSL, driven from :root)
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Modern Charcoal / Slate SaaS Palette
        void: "#0B0F17", // Deep charcoal/slate
        slate: {
          850: "#131C2E",
          900: "#0F172A",
          950: "#080C14",
        },
        panel: {
          DEFAULT: "#0F172A",
          raised: "#162032",
          elevated: "#1E293B",
          glass: "rgba(15, 23, 42, 0.72)",
        },
        hairline: "rgba(255, 255, 255, 0.08)",
        "hairline-subtle": "rgba(255, 255, 255, 0.05)",
        "hairline-bright": "rgba(255, 255, 255, 0.16)",
        // Electric Blue & Violet Core Accents
        electric: {
          blue: "#3B82F6",
          cyan: "#06B6D4",
          violet: "#8B5CF6",
          indigo: "#6366F1",
          purple: "#A855F7",
        },
        // Legacy alias mapped cleanly into the new electric spectrum
        green: {
          DEFAULT: "#3B82F6", // maps to Electric Blue
          bright: "#60A5FA",
          dim: "#2563EB",
        },
        ink: "#38BDF8", // electric highlight
        gray: {
          DEFAULT: "#94A3B8",
          dim: "#64748B",
          light: "#E2E8F0",
        },
        danger: "#F43F5E",
        warn: "#F59E0B",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
        "3xl": "1.5rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        glow: "0 0 25px -4px rgba(59, 130, 246, 0.35)",
        "glow-sm": "0 0 16px -4px rgba(59, 130, 246, 0.4)",
        "glow-lg": "0 0 50px -10px rgba(99, 102, 241, 0.45)",
        "glow-violet": "0 0 25px -4px rgba(139, 92, 246, 0.35)",
        "glow-combo": "0 0 35px -5px rgba(59, 130, 246, 0.25), 0 0 35px -5px rgba(139, 92, 246, 0.25)",
        panel: "0 10px 30px -10px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08)",
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.45)",
      },
      backgroundImage: {
        "dot-matrix":
          "radial-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px)",
        "radial-glow":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.25), transparent)",
        "radial-blue":
          "radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.2) 0%, transparent 65%)",
        "gradient-electric":
          "linear-gradient(135deg, #3B82F6 0%, #6366F1 50%, #8B5CF6 100%)",
        "gradient-card":
          "linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)",
      },
      backgroundSize: {
        dots: "24px 24px",
      },
      transitionTimingFunction: {
        haul: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "gps-pulse": {
          "0%": { transform: "scale(0.9)", opacity: "0.8" },
          "70%": { transform: "scale(2.2)", opacity: "0" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "shimmer": {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "pulse-subtle": "pulse-subtle 3s ease-in-out infinite",
        "gps-pulse": "gps-pulse 2.2s cubic-bezier(0.16, 1, 0.3, 1) infinite",
        "float": "float 4s ease-in-out infinite",
        "shimmer": "shimmer 2s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
