/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Matte black ground, white plot ink; colour is reserved for meaning (severity).
        bg: '#050505',
        card: '#0D0D0D',
        input: '#080808',
        subtle: '#171717',
        border: '#2E2E2E',
        line: '#BDBDB8',
        text: '#F2F2EC',
        muted: '#A3A39E',
        // FAC code blocks. accent = the "active" red; accent-strong = plot white.
        accent: '#D9261C',
        'accent-strong': '#F2F2EC',
        cyan: '#F2F2EC',
        success: '#F2F2EC',
        code: '#030303',
        'fac-blue': '#2B57D6',
        'fac-yellow': '#F0C20A',
        'fac-red': '#D9261C',
        'fac-grey': '#8C8C88',
        'fac-white': '#F2F2EC',
        // Severity: P0 red, P1 yellow, P2 blue, P3 white, P4 grey.
        p0: '#D9261C',
        p1: '#F0C20A',
        p2: '#2B57D6',
        p3: '#F2F2EC',
        p4: '#8C8C88',
      },
      borderRadius: {
        none: '0',
        sm: '0',
        DEFAULT: '0',
        md: '0',
        lg: '0',
        xl: '0',
        '2xl': '0',
        '3xl': '0',
        full: '9999px',
      },
      fontFamily: {
        sans: ['"Geist Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Archivo Variable"', '"Geist Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
