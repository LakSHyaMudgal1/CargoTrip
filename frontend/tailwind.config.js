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
        "2xl": "1600px",
      },
    },
    extend: {
      colors: {
        // Workspace Canvas (Off-white / light slate)
        workspace: {
          bg: "#F8FAFC",
          card: "#FFFFFF",
          subtle: "#F1F5F9",
          border: "#E2E8F0",
          "border-strong": "#CBD5E1",
          muted: "#64748B",
          heading: "#0F172A",
          body: "#334155",
        },
        // Dark Navy Sidebar
        navy: {
          DEFAULT: "#0F172A",
          dark: "#0A0F1D",
          surface: "#1E293B",
          hover: "#28354D",
          border: "rgba(255, 255, 255, 0.08)",
          text: "#F8FAFC",
          muted: "#94A3B8",
        },
        // Primary Blue Accent
        brand: {
          blue: "#2563EB",
          "blue-hover": "#1D4ED8",
          "blue-light": "#EFF6FF",
          "blue-border": "#BFDBFE",
        },
        // Strict Status Indicators (Green / Orange / Red only)
        status: {
          green: "#10B981",
          "green-bg": "#ECFDF5",
          "green-border": "#A7F3D0",
          orange: "#F59E0B",
          "orange-bg": "#FFFBEB",
          "orange-border": "#FDE68A",
          red: "#EF4444",
          "red-bg": "#FEF2F2",
          "red-border": "#FECACA",
          slate: "#64748B",
          "slate-bg": "#F1F5F9",
        },
        // Standard semantic mapping
        border: "#E2E8F0",
        input: "#E2E8F0",
        ring: "#2563EB",
        background: "#F8FAFC",
        foreground: "#0F172A",
        primary: {
          DEFAULT: "#2563EB",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F1F5F9",
          foreground: "#0F172A",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F1F5F9",
          foreground: "#64748B",
        },
        accent: {
          DEFAULT: "#EFF6FF",
          foreground: "#2563EB",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F172A",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F172A",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
        lg: "10px",
        md: "8px",
        sm: "6px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        elevated: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.04)",
        dropdown: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.03)",
        focus: "0 0 0 3px rgba(37, 99, 235, 0.15)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
