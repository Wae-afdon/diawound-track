/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Noto Sans Thai", "Sarabun", "system-ui", "sans-serif"],
      },
      boxShadow: {
        phone: "0 28px 70px rgba(15, 23, 42, 0.22)",
      },
    },
  },
  plugins: [],
};
