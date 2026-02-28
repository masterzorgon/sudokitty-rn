// GameStatusSheet - Bottom sheet shown when game ends (won or lost)

import React, { useRef } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useGameStore } from '../../stores/gameStore';
import { useDailyChallengeStore } from '../../stores/dailyChallengeStore';
import { showRewardedAd } from '../../lib/rewardedAds';
import { SkeuButton, SKEU_VARIANTS } from '../ui/Skeuomorphic';
import { SheetWrapper, type SheetWrapperRef } from '../ui/SheetWrapper';
import { colors, useColors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import { Difficulty, calculateMochiReward, calculateMochiRewardBreakdown } from '../../engine/types';

export interface GameStatusSheetProps {
  onPlayAgain: (difficulty: Difficulty) => void;
  onGoHome: () => void;
  onContinue: () => void;
  isDaily: boolean;
}

export function GameStatusSheet({
  onPlayAgain,
  onGoHome,
  onContinue,
  isDaily,
}: GameStatusSheetProps) {
  const c = useColors();
  const gameStatus = useGameStore((s) => s.gameStatus);
  const difficulty = useGameStore((s) => s.difficulty);
  const timeElapsed = useGameStore((s) => s.timeElapsed);
  const canContinue = useGameStore((s) => s.canContinue);

  const sheetRef = useRef<SheetWrapperRef>(null);
  const visible = gameStatus === 'won' || gameStatus === 'lost';

  if (!visible) return null;

  const isWon = gameStatus === 'won';
  const mochisEarned = isWon
    ? isDaily
      ? useDailyChallengeStore.getState().getTodayChallenge().mochiPoints
      : calculateMochiReward(difficulty, timeElapsed)
    : 0;
  const rewardBreakdown =
    isWon && !isDaily ? calculateMochiRewardBreakdown(difficulty, timeElapsed) : null;

  const showContinue = !isWon && canContinue();

  const handlePrimaryPress = async () => {
    const earned = await showRewardedAd();
    if (earned) sheetRef.current?.close(onContinue);
  };

  return (
    <SheetWrapper
      ref={sheetRef}
      visible={visible}
      onDismiss={onGoHome}
    >
      <Text style={styles.title}>
        {isWon ? 'purrfect!' : 'game over'}
      </Text>
      {isWon && rewardBreakdown ? (
        <View style={styles.rewardBreakdown}>
          <Text style={[styles.rewardBreakdownLine, { color: c.textSecondary }]}>
            Base: {rewardBreakdown.base} mochis
          </Text>
          <Text style={[styles.rewardBreakdownLine, { color: c.textSecondary }]}>
            Time bonus: {rewardBreakdown.timeBonus} mochis
          </Text>
          <Text style={[styles.rewardBreakdownTotal, { color: c.textPrimary }]}>
            Total: {rewardBreakdown.total} mochis
          </Text>
        </View>
      ) : isWon ? (
        <Text style={styles.message}>
          you earned {mochisEarned} mochis!
        </Text>
      ) : null}

      {showContinue && (
        <View style={styles.continueSection}>
          <SkeuButton
            onPress={handlePrimaryPress}
            variant="primary"
            borderRadius={borderRadius.lg}
            showHighlight={false}
            style={styles.fullWidthBtn}
            contentStyle={styles.btnContent}
          >
            <Text style={[styles.btnText, { color: SKEU_VARIANTS.primary.textColor }]}>
              watch ad to continue
            </Text>
          </SkeuButton>
        </View>
      )}

      <View style={styles.secondaryRow}>
        {isDaily && isWon ? (
          <SkeuButton
            onPress={() => sheetRef.current?.close(onGoHome)}
            variant="secondary"
            borderRadius={borderRadius.lg}
            style={styles.fullWidthBtn}
            contentStyle={styles.btnContent}
          >
            <Text style={[styles.btnText, { color: SKEU_VARIANTS.secondary.textColor }]}>
              back to daily
            </Text>
          </SkeuButton>
        ) : (
          <SkeuButton
            onPress={() => sheetRef.current?.close(() => onPlayAgain(difficulty))}
            variant="secondary"
            borderRadius={borderRadius.lg}
            style={styles.fullWidthBtn}
            contentStyle={styles.btnContent}
          >
            <Text style={[styles.btnText, { color: SKEU_VARIANTS.secondary.textColor }]}>
              play new game
            </Text>
          </SkeuButton>
        )}
      </View>

      <Pressable
        style={styles.returnHomeRow}
        onPress={() => sheetRef.current?.close(onGoHome)}
        hitSlop={12}
      >
        <Ionicons name="arrow-back" size={20} color={c.textSecondary} />
        <Text style={[styles.returnHomeText, { color: c.textSecondary }]}>
          return home
        </Text>
      </Pressable>
    </SheetWrapper>
  );
}

const styles = StyleSheet.create({
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginHorizontal: 'auto',
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  rewardBreakdown: {
    marginBottom: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  rewardBreakdownLine: {
    ...typography.body,
    textAlign: 'center',
  },
  rewardBreakdownTotal: {
    ...typography.headline,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  continueSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  fullWidthBtn: {
    alignSelf: 'stretch',
    width: '100%',
  },
  btnContent: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    ...typography.button,
  },
  secondaryRow: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  returnHomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  returnHomeText: {
    ...typography.body,
    fontFamily: 'Pally-Medium',
  },
});
