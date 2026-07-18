/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1B1035",
        lavender: "#F7F5FF",
        mint: "#2DD4A7",
        amber: "#F5A623",
      },
    },
  },
  plugins: [],
};
