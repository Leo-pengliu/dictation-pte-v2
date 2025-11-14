// src/index.d.ts
import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: {
      background: string;
      surface: string;
      surfaceHover: string;
      primary: string;
      primaryLight: string;
      accent: string;
      text: string;
      textMuted: string;
      error: string;
      success: string;
      border: string;
    };
    font: { sans: string; mono: string };
    radius: { sm: string; md: string; lg: string; xl: string };
    shadow: { sm: string; md: string; lg: string; xl: string };
  }
}