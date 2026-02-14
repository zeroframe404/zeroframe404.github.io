/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecf7ff',
          100: '#d8eeff',
          200: '#b7e0ff',
          300: '#82cbff',
          400: '#44adff',
          500: '#1f8dff',
          600: '#0f6fe0',
          700: '#1059b4',
          800: '#154a8f',
          900: '#183f75',
          950: '#0e254a'
        }
      },
      boxShadow: {
        soft: '0 8px 30px rgba(15, 23, 42, 0.08)'
      }
    }
  },
  plugins: []
}
