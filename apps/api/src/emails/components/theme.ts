import { pixelBasedPreset, type TailwindConfig } from '@react-email/components';

export const emailTheme: TailwindConfig = {
  presets: [pixelBasedPreset],
  theme: {
    extend: {
      colors: {
        canvas: '#f6f7fb',
        surface: '#ffffff',
        subtle: '#f1f3f8',
        line: '#e6e9f0',
        ink: '#0f172a',
        'ink-2': '#475569',
        'ink-3': '#94a3b8',
        accent: '#335cff',
        'accent-soft': '#eef2ff',
        'accent-ink': '#2447e0',
        mint: { 50: '#f0fdfa', 100: '#ccfbf1', 500: '#14b8a6', 700: '#0f766e' },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'Segoe UI', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
};
