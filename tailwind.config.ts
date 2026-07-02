import type { Config } from 'tailwindcss';

/**
 * Theme is driven entirely by CSS custom properties (see src/styles/themes.css).
 * Tailwind consumes them via the `rgb(var(--x) / <alpha-value>)` pattern so that
 * opacity modifiers (e.g. `bg-surface/60`) keep working while the theme swaps at runtime.
 */
const withAlpha = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: withAlpha('--color-bg'),
        surface: withAlpha('--color-surface'),
        'surface-2': withAlpha('--color-surface-2'),
        overlay: withAlpha('--color-overlay'),
        border: withAlpha('--color-border'),
        muted: withAlpha('--color-muted'),
        fg: withAlpha('--color-fg'),
        'fg-muted': withAlpha('--color-fg-muted'),
        accent: withAlpha('--color-accent'),
        'accent-fg': withAlpha('--color-accent-fg'),
        success: withAlpha('--color-success'),
        warning: withAlpha('--color-warning'),
        danger: withAlpha('--color-danger'),
      },
      borderRadius: {
        window: 'var(--radius-window)',
      },
      boxShadow: {
        window: 'var(--shadow-window)',
        dock: 'var(--shadow-dock)',
        popover: 'var(--shadow-popover)',
      },
      backdropBlur: {
        glass: 'var(--blur-glass)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'scale-in': 'scale-in 0.18s var(--ease-smooth, cubic-bezier(0.22,1,0.36,1))',
      },
    },
  },
  plugins: [],
};

export default config;
