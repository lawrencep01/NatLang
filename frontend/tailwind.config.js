/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"], // Adjust paths as needed
  theme: {
    extend: {
      fontFamily: {
        sans: ['Roboto', 'sans-serif'], // Set Roboto as default sans-serif
      },
    },
  },
  plugins: [],
};

