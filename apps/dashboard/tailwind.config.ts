import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cfx: {
          primary: "#6366f1",
          secondary: "#8b5cf6",
          dark: "#0f172a",
          darker: "#020617",
        },
      },
    },
  },
  plugins: [],
};

export default config;
