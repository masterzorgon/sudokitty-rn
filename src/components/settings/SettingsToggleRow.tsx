// Settings toggle row component
// Shows label with optional icon and a skeuomorphic toggle switch

import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme';
import { SkeuToggle } from '../ui/Skeuomorphic';
import { playFeedback } from '../../utils/feedback';

interface SettingsToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  icon?: keyof typeof Feather.glyphMap;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  isLast?: boolean;
}

export function SettingsToggleRow({
  label,
  value,
  onValueChange,
  icon,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  isLast = false,
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
      style={[styles.container, !isLast && styles.borderBottom]}
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
        <Text style={[styles.label, disabled && styles.labelDisabled]}>
          {label}
        </Text>
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
    height: 56,
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
});
