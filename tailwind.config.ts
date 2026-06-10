import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      maxWidth: {
        site: "1700px"
      },
      colors: {
        ink: {
          950: "#05070b",
          900: "#080d14",
          850: "#0b111b",
          800: "#101722"
        },
        steel: {
          500: "#6f8fb0",
          400: "#94abc0",
          300: "#b7c5d0"
        },
        signal: {
          blue: "#4f86a8",
          cyan: "#7bc8d8",
          amber: "#c8a35c"
        }
      },
      fontFamily: {
        sans: ["Inter", "IBM Plex Sans", "system-ui", "sans-serif"],
        plex: ["IBM Plex Sans", "Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        line: "inset 0 0 0 1px rgba(255,255,255,0.08)",
        panel: "0 24px 80px rgba(0,0,0,0.35)"
      },
      backgroundImage: {
        "fine-grid":
          "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
} satisfies Config;
