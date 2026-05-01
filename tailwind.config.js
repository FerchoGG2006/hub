/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        amber: {
          50: '#FDFCF7',
          100: '#FBF9EF',
          200: '#F6F1D6',
          300: '#EFE7B0',
          400: '#E4D87B',
          500: '#C5A059', // New Gold
          600: '#A68648',
          700: '#876D3A',
          800: '#68542D',
          900: '#493B1F',
        },
        gold: '#C5A059',
        bone: '#F7F3E9',
        dark: '#1A1A1A',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
