// =============================================================================
// src/theme/luxuryTheme.js
// Sophisticated Luxury Hospitality Design System
// Strict production palette: Warm charcoal, alabaster white, muted heritage gold.
// =============================================================================

export const LUXURY_THEME = {
  // Backgrounds
  background: '#101114',
  sidebar: '#15161A',
  cardSurface: '#1C1D21',
  secondarySurface: '#25262B',
  inputSurface: '#15161A',
  modalSurface: '#1C1D21',
  backdrop: 'rgba(0, 0, 0, 0.78)',

  // Accents & Golds
  primaryAccent: '#C5A46D', // Warm muted gold
  softGold: '#D8BD8A',      // Soft champagne highlight
  goldDark: '#8C6F3E',
  goldMuted: 'rgba(197, 164, 109, 0.12)',
  goldBorder: 'rgba(197, 164, 109, 0.3)',
  goldGlow: 'rgba(197, 164, 109, 0.08)',

  // Typography
  textPrimary: '#F2EFE8',   // Alabaster white
  textSecondary: '#A5A39D', // Warm muted grey
  textTertiary: '#73716B',  // Subtle hint/caption
  textInverse: '#101114',   // Dark contrast on gold buttons

  // Neutral Borders & Separators (Subtle Charcoal)
  border: '#2A2B31',
  borderLight: 'rgba(255, 255, 255, 0.08)',
  borderUltraLight: 'rgba(255, 255, 255, 0.04)',

  // Status Colors (Restrained Luxury Palette)
  status: {
    approved: {
      text: '#4E9F76',
      bg: 'rgba(78, 159, 118, 0.12)',
      border: 'rgba(78, 159, 118, 0.28)',
    },
    pending: {
      text: '#D49A3D',
      bg: 'rgba(212, 154, 61, 0.12)',
      border: 'rgba(212, 154, 61, 0.28)',
    },
    rejected: {
      text: '#D9534F',
      bg: 'rgba(217, 83, 79, 0.12)',
      border: 'rgba(217, 83, 79, 0.28)',
    },
  },

  // Radii
  radius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
};

