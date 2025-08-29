// App-wide constants and configuration
export const APP_CONFIG = {
  name: "Cap'n Pay",
  version: "1.0.0",
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
  },
} as const;

// Design system colors
export const COLORS = {
  primary: "#0A3D91",    // Deep Blue
  secondary: "#2F6DFF",  // Electric Blue
  accent: "#2CD3C5",     // Mint
  text: "#1A212E",       // Ink
  textSecondary: "#2A2F3A", // Slate
  background: "#F5F7FB",  // Cloud
  surface: "#FFFFFF",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
} as const;

// Spacing system (8px grid)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Border radius
export const RADIUS = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

// Touch target minimum size
export const TOUCH_TARGET = 44;
