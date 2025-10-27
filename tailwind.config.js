
/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "rgb(29,40,45)",
          dark: "rgb(1,14,19)",
          accent: "rgb(218,164,66)"
        }
      },
      boxShadow: {
        soft: "0 10px 25px rgba(0,0,0,0.15)"
      }
    },
  },
  plugins: [],
};

export default config;
