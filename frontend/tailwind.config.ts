import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FFF9F3",
        linen: "#F8EFE8",
        blush: "#F4C8C9",
        rosewood: "#D94777",
        thread: "#B98975",
        sage: "#8C9B7A",
        ink: "#3E3432",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(125, 70, 64, 0.08)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
