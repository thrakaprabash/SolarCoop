export const COLORS = {
  // Brand colors
  primary: '#10B981',       // Emerald Green (Clean Energy)
  primaryDark: '#059669',
  primaryLight: '#D1FAE5',
  
  secondary: '#F59E0B',     // Solar Amber/Gold (Solar Gen)
  secondaryDark: '#D97706',
  secondaryLight: '#FEF3C7',
  
  accent: '#06B6D4',        // Electric Cyan (Grid/Flow)
  accentDark: '#0891B2',
  accentLight: '#CFFAFE',

  alert: '#EF4444',         // Deficit Red
  alertLight: '#FEE2E2',
  
  warning: '#F97316',       // Warning Orange
  warningLight: '#FFEDD5',

  // Background & Surfaces
  bgDark: '#0F172A',        // Dark Slate Main BG
  cardDark: '#1E293B',      // Card Surface
  cardBorderDark: '#334155',
  
  bgLight: '#F8FAFC',       // Light Mode BG
  cardLight: '#FFFFFF',     // Light Card
  cardBorderLight: '#E2E8F0',

  // Neutral text
  textPrimaryDark: '#F8FAFC',
  textSecondaryDark: '#94A3B8',
  textMutedDark: '#64748B',

  textPrimaryLight: '#0F172A',
  textSecondaryLight: '#475569',
  textMutedLight: '#94A3B8',

  // Special energy indicators
  batteryFull: '#10B981',
  batteryMid: '#F59E0B',
  batteryLow: '#EF4444',
  
  gridExport: '#10B981',
  gridImport: '#EF4444',
  coopPool: '#06B6D4',
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  glowGreen: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  glowSolar: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  }
};
