export const theme = {
  colors: {
    dark: {
      background: '#000000',
      backgroundSecondary: '#0A0A0A',
      card: '#1C1C1E',
      cardElevated: '#2C2C2E',
      border: '#3A3A3C',
      text: '#FFFFFF',
      textSecondary: '#8E8E93',
      textTertiary: '#636366',
      accent: '#0A84FF',
      accentDark: '#0066CC',
      success: '#30D158',
      warning: '#FF9500',
      danger: '#FF453A',
      speed: '#0A84FF',
      overlay: 'rgba(0, 0, 0, 0.85)',
    },
  },
  typography: {
    largeTitle: {
      fontSize: 72,
      fontWeight: '700' as const,
      letterSpacing: -2,
    },
    title1: {
      fontSize: 34,
      fontWeight: '700' as const,
      letterSpacing: -0.5,
    },
    title2: {
      fontSize: 28,
      fontWeight: '600' as const,
      letterSpacing: -0.3,
    },
    title3: {
      fontSize: 22,
      fontWeight: '600' as const,
    },
    headline: {
      fontSize: 17,
      fontWeight: '600' as const,
    },
    body: {
      fontSize: 17,
      fontWeight: '400' as const,
    },
    callout: {
      fontSize: 16,
      fontWeight: '400' as const,
    },
    subheadline: {
      fontSize: 15,
      fontWeight: '400' as const,
    },
    footnote: {
      fontSize: 13,
      fontWeight: '400' as const,
    },
    caption1: {
      fontSize: 12,
      fontWeight: '400' as const,
    },
    caption2: {
      fontSize: 11,
      fontWeight: '400' as const,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },
};

export type Theme = typeof theme;
