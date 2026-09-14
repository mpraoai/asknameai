/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4ff',
          100: '#d9e2ff',
          200: '#b3c5ff',
          300: '#8ca8ff',
          400: '#668bff',
          500: '#406eff',
          600: '#1f4fe0',
          700: '#1a3fb8',
          800: '#142f8f',
          900: '#0a1845',
          950: '#050c2e',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
