/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink:    '#0F1117',
        mist:   '#F7F7F5',
        leaf:   '#16A34A',
        coral:  '#E5484D',
        amber:  '#D97706',
        slate2: '#64748B',
        border: '#E2E8F0',
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.08em' }],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)',
        lift: '0 4px 12px rgba(0,0,0,0.10)',
      },
    },
  },
  plugins: [],
};