/** @type {import('tailwindcss').Config} */


module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        crumb: {
          DEFAULT: 'hsl(228, 9.09%, 10.78%)',
          light: 'hsl(230, 17.65%, 13.33%)',
          dark: 'hsl(225, 10%, 7.84%)',
          bright: 'hsl(214.29, 31.82%, 91.37%)',
          accent: 'hsl(255.14, 91.74%, 76.27%)',

        },
      },
      transitionProperty: {
        'size-and-border': 'border, height, width',
        'transform': 'transform',
      }
    },
  },
  plugins: [],
}

