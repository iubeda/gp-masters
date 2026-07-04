/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Premium MotoGP themed colors: dark grays, vibrant reds/oranges, carbon-like accents
        dark: {
          bg: '#0F0F12',
          card: '#16161C',
          border: '#23232F',
          text: '#F3F4F6'
        },
        motogp: {
          red: '#E01E26',
          orange: '#FF5722',
          gold: '#FFB300'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
