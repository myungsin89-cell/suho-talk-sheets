/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        oatmeal: '#FAF8F5',
        forest: {
          DEFAULT: '#2D6A4F',
          deep: '#1B4D3E',
          dark: '#12352A',
          light: '#40916C',
        },
        sage: {
          DEFAULT: '#4A7C59',
          light: '#6B9E7A',
        },
        mint: {
          DEFAULT: '#EDF7F1',
          soft: '#E8F3EC',
          dark: '#D0E6D8',
        },
        honey: {
          DEFAULT: '#F59E0B',
          light: '#FFFBEB',
          soft: '#FEF3C7',
          dark: '#D97706',
        }
      },
      fontFamily: {
        sans: ['"Pretendard Variable"', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'post': '0 4px 20px -2px rgba(45, 106, 79, 0.06), 0 1px 4px -1px rgba(45, 106, 79, 0.03)',
        'wax': 'inset 0 2px 4px rgba(255,255,255,0.35), 0 3px 8px rgba(45,106,79,0.14)',
      }
    },
  },
  plugins: [],
}
