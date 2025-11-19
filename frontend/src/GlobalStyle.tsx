// src/GlobalStyle.tsx
import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    scroll-behavior: smooth;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    -webkit-font-smoothing: antialiased;
    background: linear-gradient(to bottom right, #0f172a, #1e293b);
    color: #e2e8f0;
    min-height: 100vh;
    padding: 0;
    margin: 0;
  }

  /* 通用容器（大多数屏幕完美适配） */
  .container {
    width: min(90vw, 1400px);
    margin: 0 auto;
    padding-left: clamp(1rem, 3vw, 2rem);
    padding-right: clamp(1rem, 3vw, 2rem);
  }

  /* 响应式文字（自动缩放） */
  .text-responsive {
    font-size: clamp(0.9rem, 0.8rem + 0.5vw, 1.25rem);
  }

  /* 卡片 */
  .card {
    background: rgba(30, 41, 59, 0.55);
    backdrop-filter: blur(12px);
    border-radius: 1.25rem;
    padding: clamp(1rem, 1rem + 1vw, 2rem);
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 12px 25px rgba(0,0,0,0.2);
    transition: all 0.3s;
  }
`;
