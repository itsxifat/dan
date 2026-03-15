/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#7A2267', // The deep plum/purple from the logo text and diamond
          grey: '#9B9D9F',   // The silver/grey from the chevron accents
          dark: '#1a1a1a',   // For deep contrast text
          light: '#fcfcfc',  // A pristine off-white for the background
        }
      },
    },
  },
  plugins: [],
}