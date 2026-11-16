/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0a0a0f',
          deep: '#07070b',
          card: '#111118',
          elevated: '#1a1a25',
          hover: '#222232',
        },
        primary: {
          DEFAULT: '#7c3aed',
          hover: '#8b5cf6',
          light: '#a78bfa',
          dark: '#5b21b6',
          subtle: 'rgba(124, 58, 237, 0.15)',
        },
        accent: {
          DEFAULT: '#06b6d4',
          hover: '#22d3ee',
          light: '#67e8f9',
          dark: '#0891b2',
          subtle: 'rgba(6, 182, 212, 0.15)',
        },
        surface: {
          DEFAULT: '#111118',
          border: '#1e293b',
          borderLight: '#334155',
        },
        node: {
          trigger: '#06b6d4',
          http: '#3b82f6',
          transform: '#8b5cf6',
          condition: '#f59e0b',
          delay: '#64748b',
          code: '#10b981',
          log: '#f43f5e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flow-dash': 'flowDash 1.2s linear infinite',
        'fade-in': 'fadeIn 0.25s ease-out forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': {
            boxShadow: '0 0 15px 2px rgba(124, 58, 237, 0.6), 0 0 30px 4px rgba(6, 182, 212, 0.3)',
          },
          '50%': {
            boxShadow: '0 0 25px 6px rgba(124, 58, 237, 0.85), 0 0 45px 8px rgba(6, 182, 212, 0.5)',
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
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        'glow-primary': '0 0 25px -5px rgba(124, 58, 237, 0.4)',
        'glow-accent': '0 0 25px -5px rgba(6, 182, 212, 0.4)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.4)',
        'glow-red': '0 0 25px -5px rgba(239, 68, 68, 0.4)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
