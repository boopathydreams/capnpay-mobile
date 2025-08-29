// Modern Design System for Cap'n Pay
export const DESIGN_SYSTEM = {
  // Modern Color Palette - Fintech Inspired
  colors: {
    // Primary - Cap'n Pay Blue (from mockup)
    primary: {
      50: '#F0F6FF',
      100: '#E0ECFF',
      200: '#C7DBFF',
      300: '#A5C4FF',
      400: '#8FA6FF',
      500: '#6366F1', // Main Cap'n Pay blue
      600: '#4F46E5',
      700: '#4338CA',
      800: '#3730A3',
      900: '#312E81',
    },

    // Success - OK status green (mint accent)
    success: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#34D399', // OK status
      500: '#10B981',
      600: '#059669',
      700: '#047857',
    },

    // Warning - Near status amber
    warning: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24', // Near status
      500: '#F59E0B',
      600: '#D97706',
    },

    // Error - Over status red
    error: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      200: '#FECACA',
      300: '#FCA5A5',
      400: '#F87171', // Over status
      500: '#EF4444',
      600: '#DC2626',
    },

    // Dark theme colors (from mockup)
    dark: {
      background: '#0A0E1A', // Deep navy background
      surface: '#1A1F2E',    // Card background
      surfaceLight: '#242936', // Lighter surface
      border: '#2D3748',     // Border color
      text: '#FFFFFF',       // Primary text
      textSecondary: '#A0AEC0', // Secondary text
      accent: '#6366F1',     // Blue accent
    },

    // Light theme colors (primary theme)
    light: {
      background: '#FAFBFC',        // Soft gray background
      surface: '#FFFFFF',           // Pure white cards
      surfaceSecondary: '#F8FAFC',  // Secondary surface
      surfaceElevated: '#FFFFFF',   // Elevated cards
      border: '#E2E8F0',           // Border color
      borderLight: '#F1F5F9',      // Light borders
      text: '#0F172A',             // Primary text
      textSecondary: '#475569',     // Secondary text
      textTertiary: '#94A3B8',     // Tertiary text
      accent: '#6366F1',           // Blue accent
      accentLight: '#F0F4FF',      // Light accent background
    },

    // Neutrals - Modern grayscale
    neutral: {
      0: '#FFFFFF',
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },

    // Gradients
    gradients: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      success: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
      card: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 100%)',
    }
  },

  // Modern Typography Scale
  typography: {
    // Display - Hero sections
    display: {
      fontSize: 48,
      fontWeight: '800' as const,
      lineHeight: 1.1,
      letterSpacing: -1,
    },

    // Headings
    h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 1.2, letterSpacing: -0.5 },
    h2: { fontSize: 24, fontWeight: '600' as const, lineHeight: 1.3, letterSpacing: -0.25 },
    h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 1.4 },
    h4: { fontSize: 16, fontWeight: '600' as const, lineHeight: 1.4 },

    // Body text
    body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 1.5 },
    bodyMedium: { fontSize: 14, fontWeight: '400' as const, lineHeight: 1.5 },
    bodySmall: { fontSize: 12, fontWeight: '400' as const, lineHeight: 1.4 },

    // Interactive elements
    button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 1.2 },
    caption: { fontSize: 11, fontWeight: '500' as const, lineHeight: 1.3, letterSpacing: 0.5 },
  },

  // Modern Spacing Scale (8pt grid)
  spacing: {
    xs: 4,   // 0.25rem
    sm: 8,   // 0.5rem
    md: 16,  // 1rem
    lg: 24,  // 1.5rem
    xl: 32,  // 2rem
    '2xl': 48, // 3rem
    '3xl': 64, // 4rem
    '4xl': 96, // 6rem
  },

    // Border Radius (Modern rounded corners - matching mockup)
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32, // Hero cards
    '3xl': 40,
    full: 9999,
  },

  // Modern Shadow System
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
        },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 6,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.12,
      shadowRadius: 40,
      elevation: 10,
    },
  },

  // Status Colors (from mockup)
  status: {
    ok: '#34D399',      // Green for OK caps
    near: '#FBBF24',    // Amber for Near caps
    over: '#F87171',    // Red for Over caps
    info: '#6366F1',    // Blue for info
  },

  // Gradients (modern fintech style)
  gradients: {
    primary: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    success: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
    warning: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
    dark: 'linear-gradient(135deg, #0A0E1A 0%, #1A1F2E 100%)',
    heroRing: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)',
  },

  // Animation Curves (from design notes)
  animation: {
    duration: {
      fast: 150,
      normal: 200,
      slow: 300,
    },
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)', // Standard material easing
  },

  // Animation Curves (Modern easing)
  animations: {
    easeOut: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    easeIn: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
    easeInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  }
};

// Component Variants
export const COMPONENT_VARIANTS = {
  button: {
    primary: {
      backgroundColor: DESIGN_SYSTEM.colors.primary[500],
      borderRadius: DESIGN_SYSTEM.borderRadius.lg,
      paddingVertical: DESIGN_SYSTEM.spacing.md,
      paddingHorizontal: DESIGN_SYSTEM.spacing.xl,
      ...DESIGN_SYSTEM.shadows.md,
    },

    secondary: {
      backgroundColor: DESIGN_SYSTEM.colors.neutral[0],
      borderWidth: 1,
      borderColor: DESIGN_SYSTEM.colors.neutral[200],
      borderRadius: DESIGN_SYSTEM.borderRadius.lg,
      paddingVertical: DESIGN_SYSTEM.spacing.md,
      paddingHorizontal: DESIGN_SYSTEM.spacing.xl,
      ...DESIGN_SYSTEM.shadows.sm,
    }
  },

  card: {
    elevated: {
      backgroundColor: DESIGN_SYSTEM.colors.neutral[0],
      borderRadius: DESIGN_SYSTEM.borderRadius.xl,
      padding: DESIGN_SYSTEM.spacing.lg,
      ...DESIGN_SYSTEM.shadows.lg,
    },

    glass: {
      backgroundColor: 'rgba(255, 255, 255, 0.7)',
      borderRadius: DESIGN_SYSTEM.borderRadius.xl,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
      padding: DESIGN_SYSTEM.spacing.lg,
      backdropFilter: 'blur(20px)',
    }
  }
};
