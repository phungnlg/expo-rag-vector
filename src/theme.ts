/**
 * Lumina RAG design tokens (bright theme).
 *
 * Mirrors the Stitch "Lumina RAG" design system: an Electric Indigo primary on
 * an airy off-white canvas, white elevated surfaces with soft ambient shadows,
 * large soft radii, and pill-shaped interactive elements.
 */

export const colors = {
  background: '#f9f9ff',
  surface: '#f9f9ff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f1f3ff',
  surfaceContainer: '#e9edff',
  surfaceContainerHigh: '#e1e8fd',
  surfaceContainerHighest: '#dce2f7',

  onSurface: '#141b2b',
  onSurfaceVariant: '#464554',
  outline: '#767586',
  outlineVariant: '#c7c4d7',

  primary: '#4648d4',
  onPrimary: '#ffffff',
  primaryContainer: '#6063ee',
  onPrimaryContainer: '#fffbff',

  secondaryContainer: '#ab8ffe',
  onSecondaryContainer: '#3f1e8c',

  // Translucent primary washes used for citation chips / hover states.
  primary05: 'rgba(70, 72, 212, 0.06)',
  primary10: 'rgba(70, 72, 212, 0.12)',
  primary20: 'rgba(70, 72, 212, 0.22)',
} as const;

export const radii = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
} as const;

/** Level 1 ambient shadow for white bubbles / cards. */
export const shadowSoft = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 16,
  elevation: 2,
} as const;

/** Level 2 shadow for the focused input bar. */
export const shadowFocused = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.1,
  shadowRadius: 24,
  elevation: 6,
} as const;
