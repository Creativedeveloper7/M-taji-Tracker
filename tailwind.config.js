/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mtaji-primary': '#1B4332',
        'mtaji-primary-light': '#2D6A4F',
        'mtaji-accent': '#52B788',
        'mtaji-secondary': '#95D5B2',
        'agriculture': '#52B788',
        'water': '#4ECDC4',
        'health': '#FF6B6B',
        'education': '#4DABF7',
        'infrastructure': '#FFD93D',
        'economic': '#FFA94D',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'heading': ['Poppins', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        'mtaji': '1rem',
      }
    },
  },
  plugins: [],
}




