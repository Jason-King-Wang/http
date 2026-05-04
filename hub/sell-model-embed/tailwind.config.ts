import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B1F4D",
        primary: "#1266E3",
        bright: "#2F80ED",
        mist: "#EEF6FF",
        line: "#D9EAFE",
        muted: "#64748B",
        stroke: "#DCE8F8",
        success: "#22C55E"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(18, 102, 227, 0.12)",
        card: "0 12px 36px rgba(11, 31, 77, 0.08)"
      },
      fontFamily: {
        sans: [
          "Inter",
          "Noto Sans TC",
          "PingFang TC",
          "Microsoft JhengHei",
          "system-ui",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
};

export default config;
