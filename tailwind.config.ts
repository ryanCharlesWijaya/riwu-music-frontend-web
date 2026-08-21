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
          DEFAULT: 'var(--ink-950)',
          50: 'var(--ink-50)',
          100: 'var(--ink-100)',
          200: 'var(--ink-200)',
          300: 'var(--ink-300)',
          400: 'var(--ink-400)',
          500: 'var(--ink-500)',
          600: 'var(--ink-600)',
          700: 'var(--ink-700)',
          800: 'var(--ink-800)',
          900: 'var(--ink-900)',
          950: 'var(--ink-950)',
        },
        signal: {
          DEFAULT: 'var(--signal)',
          dim: '#06B6D4',
          soft: 'rgba(56, 189, 248, 0.14)',
        },
        ember: {
          DEFAULT: 'var(--ember)',
          soft: 'rgba(255, 92, 58, 0.16)',
        },
        mist: 'var(--mist)',
      },
      fontFamily: {
        display: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
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
