import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ma: {
          bg: '#0c0c0c',
          surface: '#141414',
          elevated: '#1c1c1c',
          border: '#262626',
          muted: '#5a5a5a',
          text: '#a0a0a0',
          foreground: '#ededed',
          orange: '#ff6a00',
          'orange-dim': '#b34a00',
          cream: '#f0ece4',
          mint: '#00d4aa',
          red: '#ff3333',
          yellow: '#ffcc00',
          blue: '#3388ff',
          ink: '#1a1a1a',
        },
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        '3xs': ['0.5rem', { lineHeight: '0.75rem' }],
      },
      spacing: {
        'titlebar': '2.25rem',
      },
      borderRadius: {
        'none': '0px',
        'sm': '2px',
        'DEFAULT': '2px',
        'md': '3px',
        'lg': '4px',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
