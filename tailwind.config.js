/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#18212f',
        mist: '#f5f7fb',
        leaf: '#177d5b',
        coral: '#df5f4c',
      },
      boxShadow: {
        soft: '0 16px 40px rgba(24, 33, 47, 0.08)',
      },
    },
  },
  plugins: [],
};
