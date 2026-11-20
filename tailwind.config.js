/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/index.html', './app/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'oklch(var(--ink) / <alpha-value>)',
        muted: 'oklch(var(--ink-muted) / <alpha-value>)',
        line: 'oklch(var(--rule) / <alpha-value>)',
        'line-strong': 'oklch(var(--rule-strong) / <alpha-value>)',
        surface: 'oklch(var(--paper-raised) / <alpha-value>)',
        canvas: 'oklch(var(--paper) / <alpha-value>)',
        sunken: 'oklch(var(--paper-sunken) / <alpha-value>)',
        cultural: 'oklch(var(--type-cultural) / <alpha-value>)',
        'cultural-tint': 'oklch(var(--type-cultural-tint) / <alpha-value>)',
        'cultural-ink': 'oklch(var(--type-cultural-ink) / <alpha-value>)',
        natural: 'oklch(var(--type-natural) / <alpha-value>)',
        'natural-tint': 'oklch(var(--type-natural-tint) / <alpha-value>)',
        'natural-ink': 'oklch(var(--type-natural-ink) / <alpha-value>)',
        mixed: 'oklch(var(--type-mixed) / <alpha-value>)',
        'mixed-tint': 'oklch(var(--type-mixed-tint) / <alpha-value>)',
        'mixed-ink': 'oklch(var(--type-mixed-ink) / <alpha-value>)',
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
        card: '0 1px 2px oklch(var(--ink) / 0.06), 0 8px 24px oklch(var(--ink) / 0.08)',
        float: '0 2px 6px oklch(var(--ink) / 0.08), 0 16px 40px oklch(var(--ink) / 0.12)',
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
