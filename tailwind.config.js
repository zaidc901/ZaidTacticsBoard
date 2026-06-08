/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#091014',
        panel: '#101820',
        accent: '#61f4a2',
      },
      boxShadow: {
        glow: '0 0 30px rgba(97, 244, 162, 0.22)',
      },
    },
  },
  plugins: [],
};
