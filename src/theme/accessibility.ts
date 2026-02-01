// Accessibility constants and utilities for WCAG 2.1 AA compliance

import { AccessibilityInfo, AccessibilityRole } from 'react-native';

/**
 * Standard accessibility roles used throughout the app
 */
export const ACCESSIBILITY_ROLES = {
  button: 'button' as AccessibilityRole,
  text: 'text' as AccessibilityRole,
  header: 'header' as AccessibilityRole,
  link: 'link' as AccessibilityRole,
  search: 'search' as AccessibilityRole,
  image: 'image' as AccessibilityRole,
  imagebutton: 'imagebutton' as AccessibilityRole,
  adjustable: 'adjustable' as AccessibilityRole,
  summary: 'summary' as AccessibilityRole,
  none: 'none' as AccessibilityRole,
} as const;

/**
 * Minimum touch target sizes for accessibility
 * iOS: 44x44 points
 * Android: 48x48 density-independent pixels
 */
export const TOUCH_TARGET_SIZES = {
  ios: 44,
  android: 48,
  minimum: 44, // Use the more restrictive iOS size as baseline
} as const;

/**
 * Color contrast ratios for WCAG 2.1 AA compliance
 * Normal text: 4.5:1
 * Large text (18pt+/14pt+ bold): 3:1
 */
export const CONTRAST_RATIOS = {
  normalText: 4.5,
  largeText: 3.0,
  uiComponents: 3.0,
} as const;

/**
 * Check if reduced motion is enabled on the device
 */
export const checkReducedMotion = async (): Promise<boolean> => {
  try {
    return await AccessibilityInfo.isReduceMotionEnabled();
  } catch (error) {
    console.warn('Failed to check reduced motion setting:', error);
    return false;
  }
};

/**
 * Announce a message to screen readers
 */
export const announceToScreenReader = (message: string) => {
  AccessibilityInfo.announceForAccessibility(message);
};

/**
 * Standard accessibility hints for common interactions
 */
export const ACCESSIBILITY_HINTS = {
  button: 'Double tap to activate',
  link: 'Double tap to open',
  dismissModal: 'Double tap to close',
  selectOption: 'Double tap to select',
  toggleOption: 'Double tap to toggle',
  editText: 'Double tap to edit',
} as const;

/**
 * Accessibility labels for game-specific components
 */
export const GAME_ACCESSIBILITY_LABELS = {
  cell: (row: number, col: number, value?: number) =>
    `Cell ${row + 1}, ${col + 1}${value ? `, value ${value}` : ', empty'}`,
  numberPadButton: (number: number) => `Number ${number}`,
  difficultyButton: (difficulty: string) => `${difficulty} difficulty`,
  undoButton: 'Undo last move',
  eraseButton: 'Erase cell',
  notesButton: 'Toggle notes mode',
  hintButton: 'Get a hint',
} as const;

/**
 * Test if a text size meets minimum accessibility standards
 */
export const meetsMinimumTextSize = (fontSize: number, isBold: boolean = false): boolean => {
  // Minimum font sizes for readability
  const minimumSize = 14;
  const minimumBoldSize = 12;

  return isBold ? fontSize >= minimumBoldSize : fontSize >= minimumSize;
};

/**
 * Get accessibility state for a component
 */
export const getAccessibilityState = (options: {
  disabled?: boolean;
  selected?: boolean;
  checked?: boolean;
  busy?: boolean;
  expanded?: boolean;
}) => {
  return {
    disabled: options.disabled || false,
    selected: options.selected,
    checked: options.checked,
    busy: options.busy,
    expanded: options.expanded,
  };
};
