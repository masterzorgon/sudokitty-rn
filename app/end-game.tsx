import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useColors } from '../src/theme/colors';
import { typography, fontFamilies } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme';
import { ConfettiCannon } from '../src/components/ui/ConfettiCannon';
import { SkeuButton, SkeuCard, SKEU_VARIANTS } from '../src/components/ui/Skeuomorphic';
import { ScreenBackground, BottomActionBar } from '../src/components/ui/Layout';
import { showRewardedAd } from '../src/services/adService';
import { showInterstitialIfReady } from '../src/services/adService';
import { useGameStore } from '../src/stores/gameStore';
import { useEffectivePremium } from '../src/stores/premiumStore';
import { formatTime } from '../src/utils/formatTime';
import { playFeedback } from '../src/utils/feedback';
import {
  Difficulty,
  MAX_MISTAKES,
  calculateMochiReward,
  calculateMochiRewardBreakdown,
  DAILY_MOCHI_POINTS,
} from '../src/engine/types';
import { DIFFICULTY_XP_MULTIPLIER } from '../src/constants/xp';
import MochiPointIcon from '../assets/images/icons/mochi-point.svg';

const MochiWowImg = require('../assets/images/mochi/mochi-wow.png');
const MochiQuitImg = require('../assets/images/mochi/mochi-quit.png');

/** Display multiplier without trailing .0 for whole numbers (e.g. 1.5, 2, 1). */
function formatXpMultiplier(mult: number): string {
  if (Number.isInteger(mult)) return String(mult);
  return String(mult);
}

function StatRow({ label, value, icon, iconComponent, iconColor }: {
  label: string;
  value: string;
  icon?: string;
  iconComponent?: React.ReactNode;
  iconColor?: string;
}) {
  const c = useColors();
  return (
    <View style={statStyles.row}>
      <View style={statStyles.labelRow}>
        {iconComponent ?? (icon && <Ionicons name={icon as any} size={16} color={iconColor ?? c.textSecondary} />)}
        <Text style={[statStyles.label, { color: c.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[statStyles.value, { color: c.textPrimary }]}>{value}</Text>
    </View>
  );
}

export default function EndGameScreen() {
  const c = useColors();
  const router = useRouter();
  const params = useLocalSearchParams();
  const s = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

  const status = (s(params.status) || 'won') as 'won' | 'lost';
  const difficulty = (s(params.difficulty) || 'easy') as Difficulty;
  const timeElapsed = parseInt(s(params.timeElapsed), 10);
  const mistakeCount = parseInt(s(params.mistakeCount), 10);
  const hintsUsed = parseInt(s(params.hintsUsed), 10);
  const isDaily = s(params.isDaily) === 'true';
  const rawXpEarned = parseInt(s(params.xpEarned), 10);
  const pointsThisGame = Number.isFinite(rawXpEarned) ? rawXpEarned : 0;

  const isWon = status === 'won';
  const canContinue = useGameStore((s) => s.canContinue);
  const continueGame = useGameStore((s) => s.continueGame);
  const resetGame = useGameStore((s) => s.resetGame);
  const isPremium = useEffectivePremium();

  const difficultyMult = DIFFICULTY_XP_MULTIPLIER[difficulty];
  const finalXpWon = isWon ? Math.round(pointsThisGame * difficultyMult) : 0;
  const totalXpDisplayLine =
    difficultyMult === 1
      ? `+${finalXpWon}`
      : `${pointsThisGame} × ${formatXpMultiplier(difficultyMult)} = +${finalXpWon}`;

  const mochisEarned = isWon
    ? isDaily
      ? DAILY_MOCHI_POINTS[difficulty]
      : calculateMochiReward(difficulty, timeElapsed)
    : 0;
  const rewardBreakdown = isWon && !isDaily
    ? calculateMochiRewardBreakdown(difficulty, timeElapsed)
    : null;

  const livesRemaining = MAX_MISTAKES - mistakeCount;
  const mochisCouldHaveWon = !isWon
    ? isDaily
      ? DAILY_MOCHI_POINTS[difficulty]
      : calculateMochiReward(difficulty, timeElapsed)
    : 0;

  const showContinue = !isWon && canContinue();

  const handleContinue = useCallback(async () => {
    playFeedback('tap');
    const earned = await showRewardedAd();
    if (earned) {
      continueGame();
      router.back();
    }
  }, [continueGame, router]);

  const handlePlayAgain = useCallback(async () => {
    playFeedback('tap');
    if (!isPremium) {
      await showInterstitialIfReady();
    }
    router.dismissAll();
    router.push({
      pathname: '/game',
      params: { difficulty, isDaily: String(isDaily) },
    });
  }, [difficulty, isDaily, isPremium, router]);

  const handleGoHome = useCallback(() => {
    playFeedback('tap');
    resetGame();
    router.dismissAll();
  }, [resetGame, router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.cream }]} edges={['top']}>
      <ScreenBackground showBottom={false} />

      <View style={styles.content}>
        {/* Title */}
        <Text style={[styles.title, { color: c.textPrimary }]}>
          {isWon ? 'Purrfect!' : 'Game Over'}
        </Text>

        {/* Mochi Cat Image */}
        <Image
          source={isWon ? MochiWowImg : MochiQuitImg}
          style={styles.mochiImage}
          contentFit="contain"
        />

        {/* Stats Card */}
        <SkeuCard
          borderRadius={borderRadius.lg}
          contentStyle={styles.statsCard}
          style={styles.statsCardOuter}
        >
          {isWon && (
            <>
              <StatRow label="Total XP" value={totalXpDisplayLine} icon="sparkles" />
              <View style={[styles.divider, { backgroundColor: c.gridLine }]} />
              {rewardBreakdown ? (
                <>
                  <StatRow
                    label="Mochis Earned"
                    value={`+${rewardBreakdown.total}`}
                    iconComponent={<MochiPointIcon width={16} height={16} color={c.accent} />}
                    iconColor={c.accent}
                  />
                  <Text style={[styles.breakdownNote, { color: c.textSecondary }]}>
                    Base {rewardBreakdown.base} + Time bonus {rewardBreakdown.timeBonus}
                  </Text>
                </>
              ) : (
                <StatRow
                  label="Mochis Earned"
                  value={`+${mochisEarned}`}
                  iconComponent={<MochiPointIcon width={16} height={16} color={c.accent} />}
                  iconColor={c.accent}
                />
              )}
              <View style={[styles.divider, { backgroundColor: c.gridLine }]} />
              <StatRow
                label="Lives Remaining"
                value={`${Math.max(0, livesRemaining)} / ${MAX_MISTAKES}`}
                icon="heart"
              />
              <View style={[styles.divider, { backgroundColor: c.gridLine }]} />
            </>
          )}
          {!isWon && (
            <>
              <StatRow label="XP Could Have Earned" value={`${pointsThisGame}`} icon="star" />
              <View style={[styles.divider, { backgroundColor: c.gridLine }]} />
              <StatRow
                label="Mochis Could Have Won"
                value={`+${mochisCouldHaveWon}`}
                iconComponent={<MochiPointIcon width={16} height={16} color={c.accent} />}
                iconColor={c.accent}
              />
              <View style={[styles.divider, { backgroundColor: c.gridLine }]} />
            </>
          )}
          <StatRow label="Time" value={formatTime(timeElapsed)} icon="time" />
          <View style={[styles.divider, { backgroundColor: c.gridLine }]} />
          <StatRow label="Hints Used" value={`${hintsUsed}`} icon="bulb" />
        </SkeuCard>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Action Buttons */}
        <BottomActionBar style={styles.actionsBar}>
          <View style={styles.actions}>
          {showContinue && (
            <SkeuButton
              onPress={handleContinue}
              variant="primary"
              borderRadius={borderRadius.lg}
              showHighlight={false}
              style={styles.fullWidthBtn}
              contentStyle={styles.btnContent}
            >
              <Text style={[styles.btnText, { color: SKEU_VARIANTS.primary.textColor }]}>
                Watch Ad to Continue Game
              </Text>
            </SkeuButton>
          )}

          {isDaily && isWon ? (
            <SkeuButton
              onPress={handleGoHome}
              variant="secondary"
              borderRadius={borderRadius.lg}
              style={styles.fullWidthBtn}
              contentStyle={styles.btnContent}
            >
              <Text style={[styles.btnText, { color: SKEU_VARIANTS.secondary.textColor }]}>
                Back to Daily
              </Text>
            </SkeuButton>
          ) : (
            <SkeuButton
              onPress={handlePlayAgain}
              variant="neutral"
              borderRadius={borderRadius.lg}
              style={styles.fullWidthBtn}
              contentStyle={styles.btnContent}
            >
              <Text style={[styles.btnText, { color: SKEU_VARIANTS.neutral.textColor }]}>
                New Game
              </Text>
            </SkeuButton>
          )}

          <Pressable
            style={styles.returnHomeRow}
            onPress={handleGoHome}
            hitSlop={12}
          >
            <Ionicons name="arrow-back" size={22} color={c.textSecondary} />
            <Text style={[styles.returnHomeText, { color: c.textSecondary }]}>
              Return Home
            </Text>
          </Pressable>
          </View>
        </BottomActionBar>
      </View>

      {isWon && <ConfettiCannon />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.largeTitle,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  mochiImage: {
    width: 140,
    height: 140,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  statsCardOuter: {
    width: '100%',
  },
  statsCard: {
    padding: spacing.lg,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.sm,
  },
  breakdownNote: {
    fontSize: 12,
    fontFamily: fontFamilies.regular,
    marginTop: spacing.xs,
    marginLeft: spacing.xl + spacing.xs,
  },
  actionsBar: {
    paddingHorizontal: 0,
  },
  actions: {
    gap: spacing.md,
    paddingTop: spacing.lg,
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
  returnHomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  returnHomeText: {
    ...typography.body,
    fontFamily: fontFamilies.medium,
  },
});

const statStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 0,
  },
  label: {
    ...typography.body,
    fontFamily: fontFamilies.medium,
  },
  value: {
    ...typography.body,
    fontFamily: fontFamilies.bold,
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    textAlign: 'right',
  },
});
