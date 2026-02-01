// Unified game button component
// Uses skeuomorphic design system with entering/exiting animations

import React from 'react';
import { StyleSheet, Text, Pressable, ViewStyle, View } from 'react-native';
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
import { Pill3DContainer, Pill3DFace } from './Skeuomorphic';
import { useSkeuomorphicPress } from '../../hooks/useSkeuomorphicPress';
import { useFeatureFlags } from '../../stores/featureFlagStore';
import { SKEU_VARIANTS, SkeuVariant } from '../../theme/skeuomorphic';
import { ACCESSIBILITY_ROLES } from '../../theme/accessibility';

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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/94ae2156-4726-49ff-ada6-508e5ac3a39a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameButton.tsx:51',message:'GameButton render start',data:{label,variant,disabled},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const { skeuomorphicGameButton } = useFeatureFlags();
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/94ae2156-4726-49ff-ada6-508e5ac3a39a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameButton.tsx:55',message:'Feature flag read',data:{skeuomorphicGameButton},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A,D'})}).catch(()=>{});
  // #endregion

  // Use legacy implementation if feature flag is disabled
  if (!skeuomorphicGameButton) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/94ae2156-4726-49ff-ada6-508e5ac3a39a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameButton.tsx:58',message:'Taking legacy path - early return',data:{willCallLegacyHooks:true},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A,B'})}).catch(()=>{});
    // #endregion
    return (
      <GameButtonLegacy
        onPress={onPress}
        label={label}
        subtext={subtext}
        variant={variant}
        entering={entering}
        exiting={exiting}
        style={style}
        disabled={disabled}
      />
    );
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/94ae2156-4726-49ff-ada6-508e5ac3a39a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameButton.tsx:72',message:'Taking skeuomorphic path - about to call useSkeuomorphicPress',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const skeuVariant = variantMap[variant];
  const { animatedStyle, pressHandlers } = useSkeuomorphicPress({
    onPress,
    disabled,
    hapticStyle: Haptics.ImpactFeedbackStyle.Light,
  });
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/94ae2156-4726-49ff-ada6-508e5ac3a39a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameButton.tsx:78',message:'useSkeuomorphicPress called successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  return (
    <Animated.View
      entering={entering || FadeIn.duration(300)}
      exiting={exiting || FadeOut.duration(startGameAnimations.buttonFadeOut.duration)}
      style={style}
    >
      <Pressable
        {...pressHandlers}
        disabled={disabled}
        accessibilityRole={ACCESSIBILITY_ROLES.button}
        accessibilityLabel={subtext ? `${label}, ${subtext}` : label}
        accessibilityState={{ disabled }}
        testID={`game-button-${variant}`}
      >
        <Animated.View style={animatedStyle}>
          <Pill3DContainer variant={skeuVariant} borderRadius={borderRadius.lg}>
            <Pill3DFace variant={skeuVariant} borderRadius={borderRadius.lg} style={styles.face}>
              <View style={styles.content}>
                <Text
                  style={[styles.buttonText, { color: SKEU_VARIANTS[skeuVariant].textColor }]}
                >
                  {label}
                </Text>
                {subtext && (
                  <Text style={styles.subtext}>{subtext}</Text>
                )}
              </View>
            </Pill3DFace>
          </Pill3DContainer>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

// Legacy implementation (will be removed after rollout)
function GameButtonLegacy({
  onPress,
  label,
  subtext,
  variant = 'primary',
  entering,
  exiting,
  style,
  disabled = false,
}: GameButtonProps) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/94ae2156-4726-49ff-ada6-508e5ac3a39a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameButtonLegacy:125',message:'Legacy component render - about to call hooks',data:{label,variant},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B,C'})}).catch(()=>{});
  // #endregion
  const React = require('react');
  const { useCallback } = React;
  const { useSharedValue, useAnimatedStyle, withSpring } = require('react-native-reanimated');
  const { colors } = require('../../theme/colors');
  const { shadows } = require('../../theme');

  const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
  const scale = useSharedValue(1);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/94ae2156-4726-49ff-ada6-508e5ac3a39a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameButtonLegacy:135',message:'Legacy hooks called (useSharedValue)',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'B,C'})}).catch(()=>{});
  // #endregion

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
          legacyStyles.button,
          isPrimary ? legacyStyles.buttonPrimary : legacyStyles.buttonSecondary,
          animatedStyle,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <Text
          style={[
            legacyStyles.buttonText,
            isPrimary ? legacyStyles.textPrimary : legacyStyles.textSecondary,
          ]}
        >
          {label}
        </Text>
        {subtext && (
          <Text style={legacyStyles.subtext}>{subtext}</Text>
        )}
      </AnimatedPressable>
    </Animated.View>
  );
}

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
    color: 'rgba(93, 78, 78, 0.7)', // textSecondary with opacity
    marginTop: spacing.xs,
  },
});

// Legacy styles (will be removed after rollout)
const legacyStyles = StyleSheet.create({
  button: {
    marginHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...require('../../theme').shadows.medium,
    width: '100%',
  },
  buttonPrimary: {
    backgroundColor: require('../../theme/colors').colors.softOrange,
  },
  buttonSecondary: {
    backgroundColor: require('../../theme/colors').colors.cardBackground,
    borderWidth: 2,
    borderColor: require('../../theme/colors').colors.softOrange,
  },
  buttonText: {
    ...typography.button,
  },
  textPrimary: {
    color: require('../../theme/colors').colors.cardBackground,
  },
  textSecondary: {
    color: require('../../theme/colors').colors.softOrange,
  },
  subtext: {
    ...typography.caption,
    color: require('../../theme/colors').colors.textSecondary,
    marginTop: spacing.xs,
  },
});
