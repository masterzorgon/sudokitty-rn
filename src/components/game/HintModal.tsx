import React, { useMemo, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useColors } from '../../theme/colors';
import { typography, fontFamilies } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import { useLastHint, useGameStore } from '../../stores/gameStore';
import { SheetWrapper, type SheetWrapperRef } from '../ui/Sheet/SheetWrapper';
import { SkeuButton } from '../ui/Skeuomorphic';
import { MiniBoard, sliceBox } from '../board';
import type { SudokuCellData } from '../board';

export function HintModal() {
  const lastHint = useLastHint();
  const dismissHintModal = useGameStore((s) => s.dismissHintModal);
  const rawBoard = useGameStore((s) => s.board);
  const c = useColors();
  const sheetRef = useRef<SheetWrapperRef>(null);

  const miniGrid = useMemo(() => {
    if (!lastHint || !rawBoard) return null;
    const cellData: SudokuCellData[][] = rawBoard.map((row) =>
      row.map((cell) => ({
        value: cell.value,
        isGiven: cell.isGiven,
        isValid: cell.isValid,
        notes: cell.notes,
      })),
    );
    return sliceBox(cellData, lastHint.targetCell.row, lastHint.targetCell.col);
  }, [lastHint, rawBoard]);

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
      {/* Centered header: badge → technique name → mochi hint */}
      <View style={styles.header}>
        {lastHint.category && (
          <View style={[styles.badge, { backgroundColor: (lastHint.categoryColor ?? c.accent) + '20' }]}>
            <Text style={[styles.badgeText, { color: lastHint.categoryColor ?? c.accent }]}>
              {lastHint.category}
            </Text>
          </View>
        )}
        <Text style={[styles.title, { color: c.textPrimary }]}>
          {lastHint.techniqueName}
        </Text>
        <Text style={[styles.mochiHint, { color: c.textSecondary }]}>
          "{lastHint.mochiHint}"
        </Text>
      </View>

      {/* Mini 3x3 grid preview */}
      {miniGrid && (
        <View style={styles.miniGridContainer}>
          <MiniBoard
            cells={miniGrid.box}
            highlightCell={{ row: miniGrid.localRow, col: miniGrid.localCol }}
          />
        </View>
      )}

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
  header: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  miniGridContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    textAlign: 'center',
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
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
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
