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
  }

  /* 响应式容器 */
  .container {
    @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
  }

  /* 响应式文字 */
  .text-responsive {
    @apply text-sm sm:text-base lg:text-lg;
  }

  /* 卡片通用 */
  .card {
    @apply bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-700/50 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105;
  }
  
  .no-autofill:-webkit-autofill,
  .no-autofill:-webkit-autofill:hover,
  .no-autofill:-webkit-autofill:focus,
  .no-autofill:-webkit-autofill:active {
    transition: background-color 5000s ease-in-out 0s !important;
  }
`;