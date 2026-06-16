/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  'var(--p50)',
          100: 'var(--p100)',
          200: 'var(--p200)',
          300: 'var(--p300)',
          400: 'var(--p400)',
          500: 'var(--p500)',
          600: 'var(--p600)',
          700: 'var(--p700)',
          800: 'var(--p800)',
          900: 'var(--p900)',
        },
        gold: {
          100: '#F5EDD9', 200: '#EBDBB3', 300: '#DFC98D',
          400: '#D4B76A', 500: '#C8A96B', 600: '#A8893A', 700: '#7D6628',
        },
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
    },
  },
  plugins: [],
};
