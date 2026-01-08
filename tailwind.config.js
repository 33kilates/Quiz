/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./script.js"],
  theme: {
    extend: {
      colors: {
        primary: '#08418e', // Azul escuro
        accent: '#2cc6b6', // Verde água
        darkbg: '#0f172a',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      }
    }
  },
  plugins: [],
}
