// Settings link row component
// Shows label with optional icon and chevron/external link indicator

import React, { useCallback } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme';
import { playFeedback } from '../../utils/feedback';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SettingsLinkRowProps {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Feather.glyphMap;
  isExternal?: boolean;
  isDestructive?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  isLast?: boolean;
}

export function SettingsLinkRow({
  label,
  onPress,
  icon,
  isExternal = false,
  isDestructive = false,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  isLast = false,
}: SettingsLinkRowProps) {
  const pressOpacity = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    pressOpacity.value = withTiming(0.7, { duration: 100 });
  }, [pressOpacity]);

  const handlePressOut = useCallback(() => {
    pressOpacity.value = withTiming(1, { duration: 100 });
  }, [pressOpacity]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    playFeedback('tap');
    onPress();
  }, [disabled, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pressOpacity.value,
  }));

  const labelColor = isDestructive
    ? colors.errorText
    : disabled
    ? colors.textLight
    : colors.textPrimary;

  const iconColor = isDestructive
    ? colors.errorText
    : colors.textSecondary;

  return (
    <AnimatedPressable
      style={[
        styles.container,
        !isLast && styles.borderBottom,
        animatedStyle,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={
        accessibilityHint || (isExternal ? 'Opens in browser' : undefined)
      }
      accessibilityState={{ disabled }}
    >
      <View style={styles.leftContent}>
        {icon && (
          <Feather
            name={icon}
            size={22}
            color={iconColor}
            style={styles.icon}
          />
        )}
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      </View>
      <Feather
        name={isExternal ? 'external-link' : 'chevron-right'}
        size={20}
        color={colors.textLight}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.cardBackground,
  },
  borderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gridLine,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: spacing.md,
  },
  label: {
    ...typography.body,
  },
});
