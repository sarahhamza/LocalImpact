import type { Config } from "tailwindcss";

/** Preset Tailwind partagé (apps/web et packages/ui). */
const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef9f3",
          100: "#d6f1e1",
          500: "#1f9d62",
          600: "#17814f",
          700: "#146842",
        },
      },
    },
  },
};

export default preset;
