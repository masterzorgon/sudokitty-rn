// Unified game button component
// Composable button with primary/secondary variants and optional subtext

import React, { useCallback } from 'react';
import { StyleSheet, Text, Pressable, ViewStyle } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  AnimatedProps,
} from 'react-native-reanimated';
import { ViewProps } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme';
import { startGameAnimations } from '../../theme/animations';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = 'primary' | 'secondary';

interface GameButtonProps {
  onPress: () => void;
  label: string;
  subtext?: string;
  variant?: ButtonVariant;
  entering?: AnimatedProps<ViewProps>['entering'];
  exiting?: AnimatedProps<ViewProps>['exiting'];
  style?: ViewStyle;
}

export const GameButton = ({
  onPress,
  label,
  subtext,
  variant = 'primary',
  entering,
  exiting,
  style,
}: GameButtonProps) => {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, startGameAnimations.buttonSpring);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, startGameAnimations.buttonSpring);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isPrimary = variant === 'primary';

  return (
    <Animated.View
      entering={entering || FadeIn.duration(300)}
      exiting={exiting || FadeOut.duration(startGameAnimations.buttonFadeOut.duration)}
      style={style}
    >
      <AnimatedPressable
        style={[
          styles.button,
          isPrimary ? styles.buttonPrimary : styles.buttonSecondary,
          animatedStyle,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Text
          style={[
            styles.buttonText,
            isPrimary ? styles.textPrimary : styles.textSecondary,
          ]}
        >
          {label}
        </Text>
        {subtext && (
          <Text style={styles.subtext}>{subtext}</Text>
        )}
      </AnimatedPressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    marginHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.medium,
    borderWidth: 3,
    borderColor: 'red',
    width: '100%',
  },
  buttonPrimary: {
    backgroundColor: colors.softOrange,
  },
  buttonSecondary: {
    backgroundColor: colors.cardBackground,
    borderWidth: 2,
    borderColor: colors.softOrange,
  },
  buttonText: {
    ...typography.button,
  },
  textPrimary: {
    color: colors.cardBackground,
  },
  textSecondary: {
    color: colors.softOrange,
  },
  subtext: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
