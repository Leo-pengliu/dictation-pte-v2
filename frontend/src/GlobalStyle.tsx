// src/GlobalStyle.tsx
import { createGlobalStyle } from 'styled-components';
import { theme } from './theme';

export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: ${theme.colors.text};
    font-family: ${theme.font.sans};
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar {
    width: 8px;
  }
  ::-webkit-scrollbar-track {
    background: ${theme.colors.surface};
  }
  ::-webkit-scrollbar-thumb {
    background: ${theme.colors.primary};
    border-radius: 4px;
  }
`;