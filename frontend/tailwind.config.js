/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        accent: {
          50: '#f0fdf4',
          100: '#dcfce7',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.1)',
          dark: 'rgba(0, 0, 0, 0.2)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-soft': 'bounceSoft 0.6s ease-in-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideIn: { '0%': { transform: 'translateX(-20px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        bounceSoft: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-5px)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } }
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'glass-lg': '0 8px 32px rgba(0, 0, 0, 0.15)',
        'glow': '0 0 20px rgba(99, 102, 241, 0.3)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.3)',
      }
    }
  },
  plugins: []
}
