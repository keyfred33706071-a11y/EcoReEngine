/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ios: {
          bg: 'var(--ios-bg)',
          fg: 'var(--ios-fg)',
          card: 'var(--ios-card)',
          grouped: 'var(--ios-grouped)',
          separator: 'var(--ios-separator)',
          quaternary: 'var(--ios-quaternary)',
          tertiary: 'var(--ios-tertiary)',
          secondary: 'var(--ios-secondary)',
          primary: 'var(--ios-primary)',
        },
        emerald: {
          50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0',
          300: '#6ee7b7', 400: '#34d399', 500: '#10b981',
          600: '#059669', 700: '#047857', 800: '#065f46', 900: '#064e3b', 950: '#022c22',
        },
        teal: {
          50: '#f0fdfa', 100: '#ccfbf1', 200: '#99f6e4',
          300: '#5eead4', 400: '#2dd4bf', 500: '#14b8a6',
          600: '#0d9488', 700: '#0f766e', 800: '#115e59', 900: '#134e4a', 950: '#042f2e',
        },
        amber: {
          50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a',
          300: '#fcd34d', 400: '#fbbf24', 500: '#f59e0b',
          600: '#d97706', 700: '#b45309', 800: '#92400e', 900: '#78350f',
        },
        slate: {
          50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0',
          300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b',
          600: '#475569', 700: '#334155', 800: '#1e293b', 900: '#0f172a', 950: '#020617',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'system-ui', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        'ios': '1.25rem',
        'ios-sm': '0.875rem',
        'ios-pill': '9999px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'bounce-sm': 'bounceSm 0.6s ease-in-out infinite alternate',
        'ios-press': 'iosPress 0.1s ease-out',
        'ios-transition': 'iosTransition 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideIn: { '0%': { opacity: '0', transform: 'translateX(-20px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
        glow: { '0%': { boxShadow: '0 0 5px #059669, 0 0 10px #059669' }, '100%': { boxShadow: '0 0 10px #059669, 0 0 30px #059669, 0 0 50px #059669' } },
        bounceSm: { '0%': { transform: 'translateY(0)' }, '100%': { transform: 'translateY(-5px)' } },
        iosPress: { '0%': { transform: 'scale(1)' }, '50%': { transform: 'scale(0.97)' }, '100%': { transform: 'scale(1)' } },
        iosTransition: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      backgroundImage: {
        'eco-gradient': 'linear-gradient(135deg, #059669 0%, #0d9488 50%, #0284c7 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(5,150,105,0.1) 0%, rgba(13,148,136,0.05) 100%)',
        'hero-gradient': 'radial-gradient(ellipse at top, #065f46 0%, #0f172a 60%)',
        'ios-mask': 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.03) 40%, rgba(0,0,0,0.03) 60%, transparent 100%)',
      },
    },
  },
  plugins: [],
};
