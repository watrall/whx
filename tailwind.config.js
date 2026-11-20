/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/index.html', './app/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1c1917',
        muted: '#78716c',
        line: '#e7e5e4',
        surface: '#fdfcfa',
        canvas: '#faf9f7',
        cultural: 'oklch(0.55 0.15 55)',
        natural: 'oklch(0.55 0.12 165)',
        mixed: 'oklch(0.52 0.14 300)',
        accent: '#1d4ed8',
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 1px 2px rgba(28,25,23,0.06), 0 8px 24px rgba(28,25,23,0.08)',
        float: '0 2px 6px rgba(28,25,23,0.08), 0 16px 40px rgba(28,25,23,0.12)',
      },
      borderRadius: {
        '2xl': '1.25rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 220ms ease-out both',
        'fade-in': 'fade-in 180ms ease-out both',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};
