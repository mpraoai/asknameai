/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0a0a1a',
          800: '#0d0d2b',
          700: '#111133',
          600: '#1a1a4a',
          500: '#252560',
        },
        gold: {
          400: '#f5c842',
          500: '#e8b800',
          600: '#c99a00',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
