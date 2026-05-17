/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './themes/starlit/templates/**/*.html',
    './templates/**/*.html',
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lato', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
