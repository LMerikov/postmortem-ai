/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#0F1117',
        card: '#1A1D27',
        input: '#12141C',
        accent: '#6C5CE7',
        cyan: '#00D2D3',
        border: '#2D3142',
        text: '#E4E6EB',
        muted: '#9AA3B2',
        subtle: '#232634',
        'accent-strong': '#8B7CF6',
        success: '#00E676',
        code: '#0D0F15',
        p0: '#FF6B6B',
        p1: '#FFA502',
        p2: '#FECA57',
        p3: '#48DBFB',
        p4: '#A4B0BD',
      },
      fontFamily: {
        sans: ['"Geist Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
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
