import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useColors } from '../../theme/colors';
import { typography, fontFamilies } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import { useLastHint, useGameStore } from '../../stores/gameStore';
import { SheetWrapper, type SheetWrapperRef } from '../ui/Sheet/SheetWrapper';
import { SkeuButton } from '../ui/Skeuomorphic';

export function HintModal() {
  const lastHint = useLastHint();
  const dismissHintModal = useGameStore((s) => s.dismissHintModal);
  const c = useColors();
  const sheetRef = useRef<SheetWrapperRef>(null);

  const handleApply = () => {
    sheetRef.current?.close(dismissHintModal);
  };

  if (!lastHint) return null;

  return (
    <SheetWrapper
      ref={sheetRef}
      visible={lastHint !== null}
      onDismiss={dismissHintModal}
      blurBackground={false}
    >
      {/* Header: technique name + category badge */}
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: c.textPrimary }]}>
          {lastHint.techniqueName}
        </Text>
        {lastHint.category && (
          <View style={[styles.badge, { backgroundColor: (lastHint.categoryColor ?? c.accent) + '20' }]}>
            <Text style={[styles.badgeText, { color: lastHint.categoryColor ?? c.accent }]}>
              {lastHint.category}
            </Text>
          </View>
        )}
      </View>

      {/* Mochi hint */}
      <Text style={[styles.mochiHint, { color: c.textSecondary }]}>
        "{lastHint.mochiHint}"
      </Text>

      {/* How it works */}
      {lastHint.techniqueDescription && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: c.accent }]}>HOW IT WORKS</Text>
          <Text style={[styles.sectionBody, { color: c.textPrimary }]}>
            {lastHint.techniqueDescription}
          </Text>
        </View>
      )}

      {/* In your puzzle */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: c.accent }]}>IN YOUR PUZZLE</Text>
        <View style={[styles.puzzleHintBox, { backgroundColor: c.gridLine + '30' }]}>
          <Text style={[styles.puzzleHintText, { color: c.textPrimary }]}>
            {lastHint.explanation}
          </Text>
        </View>
      </View>

      {/* Apply button */}
      <SkeuButton
        onPress={handleApply}
        variant="primary"
        borderRadius={borderRadius.lg}
        style={styles.button}
        contentStyle={styles.buttonContent}
        accessibilityLabel="Apply hint"
      >
        <Text style={styles.buttonText}>APPLY HINT</Text>
      </SkeuButton>
    </SheetWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.title,
    flex: 1,
  },
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontFamily: fontFamilies.bold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  mochiHint: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  sectionBody: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  puzzleHintBox: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
  },
  puzzleHintText: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    lineHeight: 21,
  },
  button: {
    width: '100%',
    marginTop: spacing.xs,
  },
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  buttonText: {
    fontFamily: fontFamilies.bold,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
