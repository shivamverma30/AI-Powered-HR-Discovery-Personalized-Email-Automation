/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Simple professional palette: neutral surfaces, slate text, muted blue accent
        surface: '#f5f6f8',
        card: '#fbfbfc',
        brand: {
          DEFAULT: '#2f5d8a',
          dark: '#264b6f',
        },
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
