/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        duneDark: "#4A2B1C",
        duneBrown: "#98521F",
        duneGold: "#E59B48",
        duneRose: "#ABB7B3",
        duneClay: "#AC8B78",
      },
    },
  },
  plugins: [],
};