/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"], // Adjust paths as needed
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      },
      keyframes: {
        glow: {
          '0%, 100%': {
            filter: 'drop-shadow(0 0 5px #33ff33)',
          },
          '50%': {
            filter: 'drop-shadow(0 0 10px #33ff33)',
          },
        },
      },
      animation: {
        glow: 'glow 1s infinite alternate',
      },
      colors: {
        'offwhite': 'rgb(250, 250, 252)',
      },
    },
  },
  plugins: [],
};

