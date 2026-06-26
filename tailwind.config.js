/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        midnight:  '#111827',
        emerald:   '#00C853',
        charcoal:  '#0F172A',
        slate:     '#475569',
        light:     '#F8FAFC',
        surface:   '#F1F5F9',
        border:    '#E2E8F0',
        success:   '#16A34A',
        warning:   '#F59E0B',
        error:     '#DC2626',
        info:      '#2563EB',
        white:     '#FFFFFF',
        // Keep legacy tokens as aliases so nothing breaks:
        ink:       '#0F172A',
        mist:      '#F8FAFC',
        leaf:      '#16A34A',
        coral:     '#DC2626',
        amber:     '#F59E0B',
        slate2:    '#475569',
        forest:    '#111827',
        sage:      '#00C853',
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.08em' }],
      },
      borderRadius: {
        'sm':  '4px',
        'md':  '8px',
        'lg':  '12px',
        'xl':  '16px',
        '2xl': '24px',
      },
      boxShadow: {
        'card': '0 1px 2px rgba(17,24,39,0.06)',
        'sm':   '0 1px 2px rgba(17,24,39,0.06)',
        'lift': '0 8px 24px rgba(17,24,39,0.08)',
        'md':   '0 8px 24px rgba(17,24,39,0.08)',
        'lg':   '0 20px 48px rgba(17,24,39,0.12)',
      },
    },
  },
  plugins: [],
};
