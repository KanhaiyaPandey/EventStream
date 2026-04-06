import type { Config } from "tailwindcss";
const base = require("../../packages/config/tailwind.base.js");

const config: Config = {
  ...base,
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    ...base.theme,
    extend: {
      ...base.theme.extend,
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
};

export default config;
