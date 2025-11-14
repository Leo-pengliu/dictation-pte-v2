// src/theme.ts
// src/theme.ts
import type { DefaultTheme } from 'styled-components';

export const theme: DefaultTheme = {
  colors: {
    background: '#0f172a',
    surface: '#1e293b',
    surfaceHover: '#334155',
    primary: '#10b981',     // emerald-500
    primaryLight: '#34d399', // emerald-400
    accent: '#14b8a6',       // teal-500
    text: '#e2e8f0',
    textMuted: '#94a3b8',
    error: '#ef4444',
    success: '#10b981',
    border: '#334155',
  },
  font: {
    sans: '"Inter", system-ui, sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
  radius: {
    sm: '0.375rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
  },
  shadow: {
    sm: '0 1px 3px rgba(0,0,0,0.1)',
    md: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    lg: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
    xl: '0 25px 50px -12px rgba(0,0,0,0.25)',
  },
};