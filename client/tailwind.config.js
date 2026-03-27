/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand Primary ──────────────────────────────
        amber:    { DEFAULT: '#C88B00', light: '#E0A500', dark: '#A07000' },
        coral:    { DEFAULT: '#D85A30', light: '#E87050', dark: '#B84020' },
        // ── Brand Accents ──────────────────────────────
        emerald:  { DEFAULT: '#0F6E56', light: '#1A8A6A', dark: '#094D3C' },
        purple:   { DEFAULT: '#6A4C93', light: '#8060AD', dark: '#4E3570' },
        brightGreen: { DEFAULT: '#2DC653', light: '#45D668', dark: '#1FA03D' },
        steelBlue:   { DEFAULT: '#457B9D', light: '#5A93B5', dark: '#315E7A' },
        // ── Backgrounds ────────────────────────────────
        warmWhite: '#FFFCF5',
        darkBg:    '#1C0A00',
        // ── Utility ────────────────────────────────────
        bazaar: {
          50:  '#FFF8E7',
          100: '#FFEFC0',
          200: '#FFD97A',
          300: '#F0BE3A',
          400: '#C88B00',   // primary amber
          500: '#A07000',
          600: '#7A5400',
          700: '#543A00',
          800: '#2E1F00',
          900: '#1C0A00',   // dark bg
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Times New Roman', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        bazaar: '0.18em',
        wide2:  '0.08em',
      },
      boxShadow: {
        amber:  '0 4px 24px 0 rgba(200,139,0,0.22)',
        coral:  '0 4px 24px 0 rgba(216,90,48,0.20)',
        card:   '0 2px 16px 0 rgba(200,139,0,0.14)',
      },
      backgroundImage: {
        'mosaic-hero': "url('/src/assets/mosaic-bg.svg')",
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite linear',
        float:   'float 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
}
