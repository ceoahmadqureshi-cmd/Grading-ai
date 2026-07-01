import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1F2A44", // deep indigo — headers, nav, primary text
        paper: "#FAF7F2", // warm paper background
        seal: "#C1443C", // seal-red — the teacher's red pen, incorrect marks
        jade: "#4C7A6D", // muted jade — correct marks
        gold: "#C9A227", // muted gold — highlights, active states
        line: "#E4DED2", // hairline dividers on paper
      },
      fontFamily: {
        display: ["'Noto Serif TC'", "serif"],
        body: ["'Noto Sans TC'", "sans-serif"],
      },
      borderRadius: {
        card: "0.625rem",
      },
    },
  },
  plugins: [],
};
export default config;
