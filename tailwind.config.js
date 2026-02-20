/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          600: '#800000', // Standard maroon
          800: '#4a0404', // Dark maroon (for "Dark Maroon" request)
          900: '#2b0202', // Very dark/blackish maroon
          50: '#fff5f5',
        },
        black: '#1a1a1a', // Softer black
        white: '#ffffff',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      }
    },
  },
  plugins: [],
}
