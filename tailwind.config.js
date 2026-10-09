/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#172B55',
          midnight: '#101D3B',
          gold: '#E4C66A',
          champagne: '#F4E6B2',
          ivory: '#FFFCF5',
          white: '#FFFFFF',
          slate: '#526482',
          goldLight: '#FBF4DF',
          success: '#E8F5EF',
          successText: '#27845B',
          warning: '#FFF4DE',
          warningText: '#B87A00',
          error: '#FDECEC',
          errorText: '#C74747',
          // Brand semantic mapping for Royal Navy & Gold
          forest: '#172B55',
          emerald: '#101D3B',
          leaf: '#172B55',
          cream: '#FBF4DF',
          charcoal: '#101D3B',
        }
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 2px 10px rgba(16, 29, 59, 0.04), 0 1px 3px rgba(16, 29, 59, 0.06)',
        'card': '0 4px 20px -2px rgba(16, 29, 59, 0.06), 0 2px 6px -1px rgba(16, 29, 59, 0.04)',
        'elevated': '0 12px 32px -4px rgba(16, 29, 59, 0.15), 0 4px 12px -2px rgba(16, 29, 59, 0.08)',
        'gold': '0 4px 16px -2px rgba(228, 198, 106, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}
