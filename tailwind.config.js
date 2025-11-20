/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        firebase: {
          orange: '#FF9800',
          yellow: '#FFC107',
          amber: '#FFA000',
          blue: '#2196F3',
          navy: '#1A237E',
        },
      },
    },
  },
  plugins: [],
}
