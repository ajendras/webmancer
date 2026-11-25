import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#c026d3',
          50: '#fdf4ff',
          500: '#c026d3',
          600: '#a21caf',
          700: '#86198f',
        },
        accent: {
          DEFAULT: '#22d3ee',
          50: '#f0fdff',
          500: '#22d3ee',
          600: '#06b6d4',
          700: '#0891b2',
        },
        glass: {
          bg: 'rgba(255, 255, 255, 0.09)',
          border: 'rgba(255, 255, 255, 0.18)',
          highlight: 'rgba(255, 255, 255, 0.25)',
        },
        mesh: {
          from: '#c026d3',
          via: '#a855f7',
          to: '#22d3ee',
          purple: '#c026d3',
          cyan: '#22d3ee',
          fuchsia: '#d946ef',
          violet: '#8b5cf6',
        },
      },
      borderRadius: {
        'glass': '24px',
        '3xl': '24px',
      },
      backdropBlur: {
        'glass': '24px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'glass-inner': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.3)',
        'neon': '0 0 15px -3px rgb(194 38 211), 0 0 6px -4px rgb(34 211 238)',
      },
      keyframes: {
        'gradient-mesh': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'spring-pop': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '50%': { transform: 'scale(1.03)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'orb-float': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-25px) rotate(8deg)' },
        },
        'step-slide': {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'gradient-mesh': 'gradient-mesh 15s ease infinite',
        'spring-pop': 'spring-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'orb-float': 'orb-float 6s ease-in-out infinite',
        'step-slide': 'step-slide 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
