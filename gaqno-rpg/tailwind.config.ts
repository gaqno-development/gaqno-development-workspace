import type { Config } from "tailwindcss";
import sharedConfig from "@gaqno-dev/frontcore/config/tailwind";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  presets: [sharedConfig],
  plugins: [require('tailwindcss-animate'), require('tailwind-scrollbar')],
};

export default config;

