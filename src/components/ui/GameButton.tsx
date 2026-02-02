// GameButton - Unified game button with skeuomorphic styling
// Uses SkeuButton with entering/exiting animations

import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  AnimatedProps,
} from 'react-native-reanimated';
import { ViewProps } from 'react-native';
import * as Haptics from 'expo-haptics';

import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import { startGameAnimations } from '../../theme/animations';
import { SkeuButton, SKEU_VARIANTS } from './Skeuomorphic';
import { SkeuVariant } from '../../theme/skeuomorphic';

type ButtonVariant = 'primary' | 'secondary';

interface GameButtonProps {
  onPress: () => void;
  label: string;
  subtext?: string;
  variant?: ButtonVariant;
  entering?: AnimatedProps<ViewProps>['entering'];
  exiting?: AnimatedProps<ViewProps>['exiting'];
  style?: ViewStyle;
  disabled?: boolean;
}

// Map ButtonVariant to SkeuVariant
const variantMap: Record<ButtonVariant, SkeuVariant> = {
  primary: 'primary',
  secondary: 'secondary',
};

export const GameButton = ({
  onPress,
  label,
  subtext,
  variant = 'primary',
  entering,
  exiting,
  style,
  disabled = false,
}: GameButtonProps) => {
  const skeuVariant = variantMap[variant];

  return (
    <Animated.View
      entering={entering || FadeIn.duration(300)}
      exiting={exiting || FadeOut.duration(startGameAnimations.buttonFadeOut.duration)}
      style={style}
    >
      <SkeuButton
        onPress={onPress}
        variant={skeuVariant}
        borderRadius={borderRadius.lg}
        disabled={disabled}
        hapticStyle={Haptics.ImpactFeedbackStyle.Light}
        contentStyle={styles.face}
        accessibilityLabel={subtext ? `${label}, ${subtext}` : label}
        testID={`game-button-${variant}`}
      >
        <View style={styles.content}>
          <Text style={[styles.buttonText, { color: SKEU_VARIANTS[skeuVariant].textColor }]}>
            {label}
          </Text>
          {subtext && (
            <Text style={styles.subtext}>{subtext}</Text>
          )}
        </View>
      </SkeuButton>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  face: {
    marginHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  content: {
    alignItems: 'center',
  },
  buttonText: {
    ...typography.button,
  },
  subtext: {
    ...typography.caption,
    color: 'rgba(93, 78, 78, 0.7)',
    marginTop: spacing.xs,
  },
});
