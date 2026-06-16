/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EEF4F6',
          100: '#D5E6EB',
          200: '#ABCDD7',
          300: '#7AAFC0',
          400: '#4F91A9',
          500: '#2E7390',
          600: '#1F4E5F',
          700: '#183D4A',
          800: '#112C36',
          900: '#0A1B21',
        },
        gold: {
          100: '#F5EDD9',
          200: '#EBDBB3',
          300: '#DFC98D',
          400: '#D4B76A',
          500: '#C8A96B',
          600: '#A8893A',
          700: '#7D6628',
        },
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
    },
  },
  plugins: [],
};
