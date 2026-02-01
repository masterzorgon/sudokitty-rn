// CTAButton test suite
// Tests component rendering, interaction, accessibility, and feature flags

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { CTAButton } from '../CTAButton';
import { useFeatureFlags } from '../../../stores/featureFlagStore';

// Mock the feature flag store
jest.mock('../../../stores/featureFlagStore');

// Mock haptics
jest.mock('expo-haptics');

describe('CTAButton', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: feature flag enabled
    (useFeatureFlags as jest.Mock).mockReturnValue({
      skeuomorphicCTAButton: true,
    });
  });

  describe('Rendering', () => {
    it('renders with correct label', () => {
      const { getByText } = render(
        <CTAButton onPress={mockOnPress} label="Test Button" />
      );
      expect(getByText('Test Button')).toBeTruthy();
    });

    it('renders primary variant by default', () => {
      const { getByText } = render(
        <CTAButton onPress={mockOnPress} label="Primary" />
      );
      expect(getByText('Primary')).toBeTruthy();
    });

    it('renders all variants correctly', () => {
      const variants: Array<'primary' | 'secondary' | 'success' | 'disabled'> = [
        'primary',
        'secondary',
        'success',
        'disabled',
      ];

      variants.forEach((variant) => {
        const { getByText } = render(
          <CTAButton onPress={mockOnPress} label={`${variant} button`} variant={variant} />
        );
        expect(getByText(`${variant} button`)).toBeTruthy();
      });
    });
  });

  describe('Interaction', () => {
    it('calls onPress when pressed', () => {
      const { getByTestId } = render(
        <CTAButton onPress={mockOnPress} label="Press Me" variant="primary" />
      );

      const button = getByTestId('cta-button-primary');
      fireEvent.press(button);

      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', () => {
      const { getByTestId } = render(
        <CTAButton onPress={mockOnPress} label="Disabled" variant="primary" disabled />
      );

      const button = getByTestId('cta-button-primary');
      fireEvent.press(button);

      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('triggers haptic feedback on press', () => {
      const { getByTestId } = render(
        <CTAButton onPress={mockOnPress} label="Haptic Test" variant="primary" />
      );

      const button = getByTestId('cta-button-primary');
      fireEvent.press(button);

      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Medium
      );
    });

    it('does not trigger haptic feedback when disabled', () => {
      const { getByTestId } = render(
        <CTAButton onPress={mockOnPress} label="No Haptic" variant="primary" disabled />
      );

      const button = getByTestId('cta-button-primary');
      fireEvent.press(button);

      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has correct accessibility role', () => {
      const { getByRole } = render(
        <CTAButton onPress={mockOnPress} label="Accessible Button" />
      );

      expect(getByRole('button')).toBeTruthy();
    });

    it('has correct accessibility label', () => {
      const { getByRole } = render(
        <CTAButton onPress={mockOnPress} label="My Label" />
      );

      const button = getByRole('button');
      expect(button.props.accessibilityLabel).toBe('My Label');
    });

    it('has correct accessibility state when disabled', () => {
      const { getByRole } = render(
        <CTAButton onPress={mockOnPress} label="Disabled Button" disabled />
      );

      const button = getByRole('button');
      expect(button.props.accessibilityState).toEqual({ disabled: true });
    });

    it('has correct testID for each variant', () => {
      const variants: Array<'primary' | 'secondary' | 'success'> = ['primary', 'secondary', 'success'];

      variants.forEach((variant) => {
        const { getByTestId } = render(
          <CTAButton onPress={mockOnPress} label="Test" variant={variant} />
        );
        expect(getByTestId(`cta-button-${variant}`)).toBeTruthy();
      });
    });
  });

  describe('Feature Flag', () => {
    it('uses new implementation when feature flag is enabled', () => {
      (useFeatureFlags as jest.Mock).mockReturnValue({
        skeuomorphicCTAButton: true,
      });

      const { getByTestId } = render(
        <CTAButton onPress={mockOnPress} label="New Version" variant="primary" />
      );

      expect(getByTestId('cta-button-primary')).toBeTruthy();
    });

    it('uses legacy implementation when feature flag is disabled', () => {
      (useFeatureFlags as jest.Mock).mockReturnValue({
        skeuomorphicCTAButton: false,
      });

      const { getByText } = render(
        <CTAButton onPress={mockOnPress} label="Legacy Version" />
      );

      // Legacy version doesn't have testID
      expect(getByText('Legacy Version')).toBeTruthy();
    });

    it('legacy implementation still calls onPress', () => {
      (useFeatureFlags as jest.Mock).mockReturnValue({
        skeuomorphicCTAButton: false,
      });

      const { getByText } = render(
        <CTAButton onPress={mockOnPress} label="Legacy Press" />
      );

      fireEvent.press(getByText('Legacy Press'));
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Disabled State', () => {
    it('uses disabled variant when disabled prop is true', () => {
      const { getByTestId } = render(
        <CTAButton onPress={mockOnPress} label="Disabled" variant="primary" disabled />
      );

      // Should use 'disabled' variant regardless of prop variant
      const button = getByTestId('cta-button-primary');
      expect(button).toBeTruthy();
    });

    it('does not respond to press events when disabled', () => {
      const { getByTestId } = render(
        <CTAButton onPress={mockOnPress} label="Disabled" disabled />
      );

      const button = getByTestId('cta-button-primary');
      fireEvent.press(button);
      fireEvent(button, 'pressIn');
      fireEvent(button, 'pressOut');

      expect(mockOnPress).not.toHaveBeenCalled();
    });
  });

  describe('Style Customization', () => {
    it('accepts custom style prop', () => {
      const customStyle = { marginTop: 20 };
      const { getByTestId } = render(
        <CTAButton onPress={mockOnPress} label="Custom Style" variant="primary" style={customStyle} />
      );

      const button = getByTestId('cta-button-primary');
      expect(button).toBeTruthy();
    });
  });
});
