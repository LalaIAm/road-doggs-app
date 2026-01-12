/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'moss': '#2C4A3B',
        'moss-light': '#3E614F',
        'sand': '#F4F2EE',
        'sand-dark': '#E6E2DA',
        'charcoal': '#1A1A1A',
        'ochre': '#C27835',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      spacing: {
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2.5rem',
        '5xl': '3rem',
      }
    },
  },
  plugins: [],
}
