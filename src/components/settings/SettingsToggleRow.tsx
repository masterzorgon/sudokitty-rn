// Settings toggle row component
// Shows label with optional icon, optional description, and a skeuomorphic toggle switch

import React, { useCallback } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme';
import { SkeuToggle } from '../ui/Skeuomorphic';
import { playFeedback } from '../../utils/feedback';
import { ROW_HEIGHT } from './constants';

interface SettingsToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  icon?: keyof typeof Feather.glyphMap;
  description?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  isLast?: boolean;
  containerStyle?: ViewStyle;
}

export function SettingsToggleRow({
  label,
  value,
  onValueChange,
  icon,
  description,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  isLast = false,
  containerStyle,
}: SettingsToggleRowProps) {
  const handleValueChange = useCallback(
    (newValue: boolean) => {
      playFeedback('tap');
      onValueChange(newValue);
    },
    [onValueChange]
  );

  return (
    <View
      style={[styles.container, !isLast && styles.borderBottom, containerStyle]}
      accessibilityLabel={accessibilityLabel || label}
      accessibilityHint={accessibilityHint}
    >
      <View style={styles.leftContent}>
        {icon && (
          <Feather
            name={icon}
            size={22}
            color={colors.textSecondary}
            style={styles.icon}
          />
        )}
        <View style={styles.textContent}>
          <Text style={[styles.label, disabled && styles.labelDisabled]}>
            {label}
          </Text>
          {description && (
            <Text style={styles.description}>{description}</Text>
          )}
        </View>
      </View>
      <SkeuToggle
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled}
        accessibilityLabel={`${label} toggle`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: ROW_HEIGHT,
    paddingHorizontal: spacing.md,
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
  textContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  icon: {
    marginRight: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.textPrimary,
  },
  labelDisabled: {
    color: colors.textLight,
  },
  description: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
