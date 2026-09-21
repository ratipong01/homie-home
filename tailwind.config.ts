import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#FFFBF5',
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#FFF7ED',
          muted: '#FFEDD5',
        },
        brand: {
          primary: '#F97316',
          hover: '#EA580C',
          active: '#C2410C',
          accent: '#FB923C',
          soft: '#FED7AA',
        },
        text: {
          main: '#431407',
          secondary: '#7C2D12',
          muted: '#9A3412',
          inverted: '#FFFFFF',
        },
        handover: '#D946EF',
      },
    },
  },
  plugins: [],
} satisfies Config;
