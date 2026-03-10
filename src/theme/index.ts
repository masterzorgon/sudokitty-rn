// Theme exports
export * from './colors';
export * from './typography';
export * from './animations';

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Standard horizontal inset for screen-level content and headers. */
export const SCREEN_PADDING = spacing.lg;

/** Fixed offset above safe area for bottom action bars (matches SplitNavBar). */
export const BOTTOM_ACTION_OFFSET = 16;

// Border radius
export const borderRadius = {
  xs: 4, // Cells
  sm: 8,
  md: 12,
  lg: 16, // Cards, buttons
  xl: 24,
  full: 9999,
} as const;
