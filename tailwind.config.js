/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'float': 'float 8s ease-in-out infinite',
        'float-slow': 'float 12s ease-in-out infinite',
        'float-slow-2': 'float 14s ease-in-out infinite 1s',
        'float-slow-3': 'float 16s ease-in-out infinite 2s',
        'float-slow-4': 'float 13s ease-in-out infinite 3s',
        'float-slow-5': 'float 15s ease-in-out infinite 2.5s',
        'float-slow-6': 'float 17s ease-in-out infinite 1.5s',
        'pulse-subtle': 'pulse-subtle 3s ease-in-out infinite',
        'gradient-x': 'gradient-x 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '25%': { transform: 'translateY(-15px) translateX(10px)' },
          '50%': { transform: 'translateY(5px) translateX(-5px)' },
          '75%': { transform: 'translateY(-5px) translateX(-10px)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'gradient-x': {
          '0%': { backgroundPosition: '0% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      backgroundSize: {
        'size-200': '200% auto',
      },
      backgroundPosition: {
        'pos-0': '0% center',
        'pos-100': '100% center',
      },
    },
  },
  plugins: [],
};
