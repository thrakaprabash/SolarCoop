/**
 * src/technician/theme.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Design tokens for the Technician Portal (Epic 9 / SOL-191).
 *
 * Matches the Figma "technician_dashboard_dark" frames: a warm near-black
 * base, charcoal cards, and the SolarCoop orange as the single accent.
 * Urgency colours are kept to three so a technician can triage at a glance.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const TECH = {
  bg:            '#15110E',
  card:          '#211B17',
  cardRaised:    '#2A221D',
  border:        'rgba(255, 255, 255, 0.08)',
  borderStrong:  'rgba(255, 255, 255, 0.14)',

  orange:        '#F28C38',
  orangeDark:    '#E0702A',
  orangeSoft:    'rgba(242, 140, 56, 0.16)',
  orangeBorder:  'rgba(242, 140, 56, 0.45)',

  red:           '#EF4444',
  redSoft:       'rgba(239, 68, 68, 0.12)',
  redBorder:     'rgba(239, 68, 68, 0.45)',
  amber:         '#F5B942',
  amberSoft:     'rgba(245, 185, 66, 0.14)',
  green:         '#22C55E',
  greenSoft:     'rgba(34, 197, 94, 0.12)',
  greenBorder:   'rgba(34, 197, 94, 0.45)',
  blue:          '#38BDF8',

  text:          '#F5EFE9',
  textSecondary: 'rgba(245, 239, 233, 0.62)',
  textMuted:     'rgba(245, 239, 233, 0.4)',
};

// urgency → accent colour. Anything unknown falls back to 'low'.
export const URGENCY_COLOR = {
  urgent: TECH.red,
  medium: TECH.amber,
  low:    TECH.green,
};

export const urgencyColor = (urgency) => URGENCY_COLOR[urgency] ?? URGENCY_COLOR.low;
