// Animated "play" button with spring physics
// Matches reference animation-demos button behavior

import React, { useCallback } from 'react';
import { StyleSheet, Text, Pressable } from 'react-native';
import Animated, {
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

interface AnimatedStartButtonProps {
  onPress: () => void;
  exiting?: AnimatedProps<ViewProps>['exiting'];
}

export const AnimatedStartButton = ({
  onPress,
  exiting,
}: AnimatedStartButtonProps) => {
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

  return (
    <Animated.View
      exiting={exiting || FadeOut.duration(startGameAnimations.buttonFadeOut.duration)}
    >
      <AnimatedPressable
        style={[styles.button, animatedStyle]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Text style={styles.buttonText}>play</Text>
      </AnimatedPressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    marginHorizontal: spacing.xl,
    backgroundColor: colors.softOrange,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.medium,
  },
  buttonText: {
    ...typography.button,
    color: colors.cardBackground,
  },
});
