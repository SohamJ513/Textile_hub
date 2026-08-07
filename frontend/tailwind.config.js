/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Textile Theme Colors
        textile: {
          indigo: '#1a237e',
          royal: '#2563eb',
          gold: '#f59e0b',
          amber: '#d97706',
          terracotta: '#e74c3c',
          coral: '#f472b6',
          cream: '#fef3c7',
          warm: '#faf5f0',
          brown: '#3b2f2f',
          charcoal: '#1a1a2e',
          thread: '#d4a373',
          yarn: '#c77dff',
          silk: '#f8e8e0',
          cotton: '#e8f0fe',
          linen: '#f5f0e8',
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      backgroundImage: {
        'textile-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        'weave-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4a373' fill-opacity='0.05'%3E%3Cpath d='M20 0v40M0 20h40' stroke='%23d4a373' stroke-width='0.5'/%3E%3C/g%3E%3C/svg%3E\")",
        'thread-pattern': "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M50 10 L90 30 L90 70 L50 90 L10 70 L10 30 Z' fill='none' stroke='%23c77dff' stroke-width='0.5' opacity='0.1'/%3E%3C/svg%3E\")",
        'textile-gradient': 'linear-gradient(135deg, #1a237e 0%, #2563eb 25%, #f59e0b 50%, #e74c3c 75%, #f472b6 100%)',
        'warm-gradient': 'linear-gradient(135deg, #fef3c7 0%, #faf5f0 50%, #f5e6d3 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-in-down': 'fadeInDown 0.6s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'scale-in': 'scaleIn 0.3s ease-out',
        'rotate-in': 'rotateIn 0.5s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'weave': 'weave 4s ease-in-out infinite',
        'thread': 'thread 8s linear infinite',
        'fabric-shimmer': 'fabricShimmer 3s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        rotateIn: {
          '0%': { transform: 'rotate(-10deg) scale(0.9)', opacity: '0' },
          '100%': { transform: 'rotate(0) scale(1)', opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(59, 130, 246, 0.6)' },
        },
        weave: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-5px) scale(1.02)' },
        },
        thread: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        fabricShimmer: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.7' },
        },
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 30px -5px rgba(59, 130, 246, 0.3)',
        'glow-strong': '0 0 50px -5px rgba(59, 130, 246, 0.5)',
        'card': '0 4px 20px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.12)',
        'textile': '0 4px 20px rgba(26, 35, 126, 0.15), 0 1px 3px rgba(26, 35, 126, 0.1)',
        'textile-hover': '0 8px 30px rgba(26, 35, 126, 0.2), 0 2px 6px rgba(26, 35, 126, 0.15)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      backgroundSize: {
        'pattern': '60px 60px',
        'weave': '40px 40px',
        'thread': '100px 100px',
      },
    },
  },
  plugins: [],
}