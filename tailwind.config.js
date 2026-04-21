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
          purple: '#7A2267',
          grey:   '#9B9D9F',
          dark:   '#1a1a1a',
          light:  '#fcfcfc',
        },
      },
      fontFamily: {
        lora:    ['var(--font-lora)',    'Georgia', 'serif'],
        josefin: ['var(--font-josefin)', 'Helvetica', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
