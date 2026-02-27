/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f8f3e1",
          100: "#efe7cf",
          200: "#e3dbbb",
          300: "#d1c89f",
          400: "#beb387",
          500: "#aeb784",
          600: "#8d965d",
          700: "#6f7642",
          800: "#565c31",
          900: "#41431b",
        },
        accent: {
          300: "#f8f3e1",
          400: "#e3dbbb",
          500: "#aeb784",
          600: "#8d965d",
        },
        jewel: {
          300: "#e3dbbb",
          400: "#cfc79f",
          500: "#aeb784",
          600: "#8d965d",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
      backgroundImage: {
        "hero-pattern": "linear-gradient(135deg, #41431b 0%, #6f7642 48%, #aeb784 100%)",
      },
    },
  },
  plugins: [],
};
