/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0b0b0c',
          deep: '#060607',
          card: '#141416',
          elevated: '#1a1a1e',
          hover: '#242429',
        },
        primary: {
          DEFAULT: '#d4af37',
          hover: '#e5c07b',
          light: '#fef08a',
          dark: '#a18220',
          subtle: 'rgba(212, 175, 55, 0.12)',
        },
        accent: {
          DEFAULT: '#f59e0b',
          hover: '#fbbf24',
          light: '#fde68a',
          dark: '#b45309',
          subtle: 'rgba(245, 158, 11, 0.12)',
        },
        surface: {
          DEFAULT: '#141416',
          border: '#2a2822',
          borderLight: '#3d392e',
        },
        node: {
          trigger: '#d4af37',
          http: '#38bdf8',
          transform: '#e5c07b',
          condition: '#f59e0b',
          delay: '#71717a',
          code: '#10b981',
          log: '#f43f5e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulseSubtle 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow-dash': 'flowDash 1.2s linear infinite',
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'slide-up': 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        pulseSubtle: {
          '0%, 100%': {
            boxShadow: '0 0 0 1px rgba(212, 175, 55, 0.3), 0 4px 16px -2px rgba(212, 175, 55, 0.15)',
          },
          '50%': {
            boxShadow: '0 0 0 1px rgba(212, 175, 55, 0.7), 0 4px 24px 0px rgba(212, 175, 55, 0.3)',
          },
        },
        flowDash: {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'card-carbon': '0 4px 20px -2px rgba(0, 0, 0, 0.7), 0 0 1px 1px rgba(212, 175, 55, 0.08)',
        'gold-active': '0 0 0 1px #d4af37, 0 4px 24px -4px rgba(212, 175, 55, 0.25)',
        'gold-subtle': '0 0 0 1px rgba(212, 175, 55, 0.2)',
      },
    },
  },
  plugins: [],
};
