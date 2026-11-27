/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/index.html', './app/src/**/*.{ts,tsx}'],
  theme: {
    // Fixed rem scale (ratio about 1.2). 12px is the floor for functional text.
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1.125rem' }],
      sm: ['0.8125rem', { lineHeight: '1.25rem' }],
      base: ['0.9375rem', { lineHeight: '1.4rem' }],
      lg: ['1.125rem', { lineHeight: '1.5rem' }],
      title: ['1.25rem', { lineHeight: '1.5rem' }],
      xl: ['1.375rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.75rem', { lineHeight: '2rem' }],
      '4xl': ['3rem', { lineHeight: '1' }],
    },
    extend: {
      colors: {
        ink: 'oklch(var(--ink) / <alpha-value>)',
        danger: 'oklch(var(--danger) / <alpha-value>)',
        'danger-tint': 'oklch(var(--danger-tint) / <alpha-value>)',
        'danger-ink': 'oklch(var(--danger-ink) / <alpha-value>)',
        muted: 'oklch(var(--muted) / <alpha-value>)',
        line: 'oklch(var(--line) / <alpha-value>)',
        'line-strong': 'oklch(var(--line-strong) / <alpha-value>)',
        surface: 'oklch(var(--surface) / <alpha-value>)',
        canvas: 'oklch(var(--canvas) / <alpha-value>)',
        sunken: 'oklch(var(--sunken) / <alpha-value>)',
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
          'Quicksand',
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
      // Stacking order above the map. Leaflet keeps its own panes below 700 inside the map.
      zIndex: {
        'map-top': '400',
        'map-float': '450',
        'map-control': '500',
        'map-strip': '550',
        card: '600',
        tooltip: '700',
        sheet: '800',
        transport: '850',
        scrub: '1000',
        'card-mobile': '1100',
        search: '1150',
        modal: '1200',
        lightbox: '1300',
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
      },
      transitionTimingFunction: {
        DEFAULT: 'var(--ease-out)',
        sheet: 'var(--ease-sheet)',
      },
      animation: {
        'fade-up': 'fade-up 220ms var(--ease-out) both',
        'fade-in': 'fade-in 180ms var(--ease-out) both',
      },
    },
  },
  plugins: [],
};
