// Test utilities for React Native Testing Library

import type { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react-native";

/**
 * Custom render function that wraps components with necessary providers
 */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  // Add any providers here as needed (e.g., theme, navigation, state management)
  // For now, just use the default render
  return render(ui, options);
}

/**
 * Mock animation helpers
 */
export const mockAnimationFrame = (callback: () => void) => {
  return setTimeout(callback, 16); // ~60fps
};

/**
 * Wait for animations to complete
 */
export const waitForAnimation = (duration: number = 100) => {
  return new Promise((resolve) => setTimeout(resolve, duration));
};

/**
 * Mock noop function for testing
 */
export const noop = () => {};

/**
 * Create mock press event
 */
export const createMockPressEvent = () => ({
  nativeEvent: {
    pageX: 0,
    pageY: 0,
    locationX: 0,
    locationY: 0,
    timestamp: Date.now(),
  },
});

// Re-export everything from React Native Testing Library
export * from "@testing-library/react-native";
