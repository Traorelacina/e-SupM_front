import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FBBF24',
          'orange-dark': '#F59E0B',
          'orange-light': '#FDE68A',
          red: '#DC2626',
          'red-dark': '#B91C1C',
          'red-light': '#FCA5A5',
          green: '#16A34A',
          'green-dark': '#15803D',
          'green-light': '#BBF7D0',
        },
        esup: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'slide-up':    'slideUp 0.3s ease-out',
        'slide-down':  'slideDown 0.3s ease-out',
        'fade-in':     'fadeIn 0.2s ease-out',
        'scale-in':    'scaleIn 0.2s ease-out',
        'bounce-in':   'bounceIn 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'shimmer':     'shimmer 2s linear infinite',
        'pulse-slow':  'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow':   'spin 3s linear infinite',
      },
      keyframes: {
        slideUp:   { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        bounceIn:  { '0%': { transform: 'scale(0.8)', opacity: '0' }, '60%': { transform: 'scale(1.05)' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      boxShadow: {
        'brand': '0 4px 20px rgba(251, 191, 36, 0.3)',
        'brand-lg': '0 8px 40px rgba(251, 191, 36, 0.4)',
        'red': '0 4px 20px rgba(220, 38, 38, 0.3)',
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.08)',
        'glow-orange': '0 0 20px rgba(251, 191, 36, 0.6)',
        'glow-red': '0 0 20px rgba(220, 38, 38, 0.4)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 50%, #FFF7ED 100%)',
        'brand-gradient': 'linear-gradient(135deg, #FBBF24 0%, #F97316 100%)',
        'dark-gradient': 'linear-gradient(135deg, #1E1B1B 0%, #111111 100%)',
      },
    },
  },
  plugins: [],
}

export default config
