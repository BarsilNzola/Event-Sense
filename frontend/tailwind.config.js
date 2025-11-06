/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your exact color scheme
        'soft-ivory': '#EFE9E0',
        'tropical-teal': '#0F9E99', 
        'dark-teal': '#0C7F7A',
        'light-teal': '#E0F2F1',
        'dune-dark': '#4A2B1C',
        'dune-brown': '#98521F',
        'dune-gold': '#E59B48',
        'dune-rose': '#ABB7B3',
        'dune-clay': '#AC8B78',
      },
      backgroundColor: {
        'soft-ivory': '#EFE9E0',
        'tropical-teal': '#0F9E99',
      },
      textColor: {
        'dune-dark': '#4A2B1C',
        'tropical-teal': '#0F9E99',
      },
      borderColor: {
        'light-teal': '#E0F2F1',
        'tropical-teal': '#0F9E99',
      }
    },
  },
  plugins: [],
}