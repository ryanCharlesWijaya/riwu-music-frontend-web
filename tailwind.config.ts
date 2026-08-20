import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0B0D10',
          50: '#F4F6F8',
          100: '#E2E7EC',
          200: '#C5CED8',
          300: '#9AA8B6',
          400: '#6B7C8C',
          500: '#4A5B6A',
          600: '#334250',
          700: '#232E39',
          800: '#161D24',
          900: '#0F1419',
          950: '#0B0D10',
        },
        signal: {
          DEFAULT: '#38BDF8',
          dim: '#06B6D4',
          soft: 'rgba(56, 189, 248, 0.14)',
        },
        ember: {
          DEFAULT: '#FF5C3A',
          soft: 'rgba(255, 92, 58, 0.16)',
        },
        mist: '#E8EEF2',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'signal-mesh':
          'radial-gradient(ellipse 80% 60% at 10% 0%, rgba(56,189,248,0.14), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 20%, rgba(255,92,58,0.08), transparent 50%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(14,165,233,0.1), transparent 55%)',
      },
      boxShadow: {
        panel: '0 1px 0 rgba(255,255,255,0.04) inset, 0 18px 40px rgba(0,0,0,0.35)',
        lift: '0 12px 28px rgba(0,0,0,0.28)',
      },
      keyframes: {
        'rise-in': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-soft': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'signal-pulse': {
          '0%, 100%': { transform: 'scaleY(0.35)' },
          '50%': { transform: 'scaleY(1)' },
        },
        'drift': {
          '0%, 100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(2%, -1.5%, 0)' },
        },
        'player-in': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'rise-in': 'rise-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-soft': 'fade-soft 0.8s ease both',
        'signal-pulse': 'signal-pulse 1.1s ease-in-out infinite',
        drift: 'drift 18s ease-in-out infinite',
        'player-in': 'player-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}
export default config
