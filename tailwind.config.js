/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Dummy Brand Colors for Testing
        brand: {
          50: "#f5fbff",
          500: "#0ea5e9",
          900: "#003049"
        }
      }
    }
  },
  plugins: [],
}