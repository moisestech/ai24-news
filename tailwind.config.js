/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'fk-raster': ['var(--font-fk-raster)', 'sans-serif'],
      },
      perspective: {
        '1000': '1000px',
      },
    },
  },
} 