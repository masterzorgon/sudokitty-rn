// GameStatusSheet - Bottom sheet shown when game ends (won or lost)
// Uses SkeuButton for primary/secondary actions and a text "return home" link

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Modal,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useGameStore } from '../../stores/gameStore';
import { useFishyStore } from '../../stores/fishyStore';
import { showRewardedAd } from '../../lib/rewardedAds';
import { SkeuButton, SKEU_VARIANTS } from '../ui/Skeuomorphic';
import { colors, useColors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import { Difficulty } from '../../engine/types';
import { calculateFishyReward, FISHIES_COST } from '../../constants/economy';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export interface GameStatusSheetProps {
  onPlayAgain: (difficulty: Difficulty) => void;
  onGoHome: () => void;
  onContinue: () => void;
  onGetFishies?: () => void;
  isDaily: boolean;
}

export function GameStatusSheet({
  onPlayAgain,
  onGoHome,
  onContinue,
  onGetFishies,
  isDaily,
}: GameStatusSheetProps) {
  const c = useColors();
  const gameStatus = useGameStore((s) => s.gameStatus);
  const difficulty = useGameStore((s) => s.difficulty);
  const timeElapsed = useGameStore((s) => s.timeElapsed);
  const canContinue = useGameStore((s) => s.canContinue);
  const totalFishies = useFishyStore((s) => s.totalFishyPoints);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const visible = gameStatus === 'won' || gameStatus === 'lost';

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [visible, slideAnim]);

  const handleClose = (callback: () => void) => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      callback();
    });
  };

  if (!visible) {
    return null;
  }

  const isWon = gameStatus === 'won';
  const fishiesEarned = isWon ? calculateFishyReward(difficulty, timeElapsed) : 0;

  const continueCostFishies = FISHIES_COST.continue;
  const canAffordContinue = totalFishies >= continueCostFishies;
  const showContinue = !isWon && canContinue();

  const handlePrimaryPress = async () => {
    if (canAffordContinue) {
      const spent = useFishyStore.getState().spendFishies(continueCostFishies, 'continue');
      if (spent) handleClose(onContinue);
    } else {
      const earned = await showRewardedAd();
      if (earned) handleClose(onContinue);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => handleClose(onGoHome)}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={() => handleClose(onGoHome)} />

        <Animated.View
          style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.dragIndicator} />
          <Text style={styles.title}>
            {isWon ? 'purrfect!' : 'game over'}
          </Text>
          <Text style={styles.message}>
            {isWon
              ? `you earned ${fishiesEarned} fishies!`
              : 'too many mistakes...'}
          </Text>

          {showContinue && (
            <View style={styles.continueSection}>
              <Text style={styles.mochiBalance}>{totalFishies} fishies</Text>
              <SkeuButton
                onPress={handlePrimaryPress}
                variant="primary"
                borderRadius={borderRadius.lg}
                showHighlight={false}
                style={styles.primaryButton}
                contentStyle={styles.primaryButtonContent}
              >
                <Text style={[styles.primaryButtonText, { color: SKEU_VARIANTS.primary.textColor }]}>
                  {canAffordContinue
                    ? `continue (${continueCostFishies} fishies)`
                    : 'watch ad to continue'}
                </Text>
              </SkeuButton>
              {!canAffordContinue && onGetFishies && (
                <Pressable
                  style={styles.getFishiesRow}
                  onPress={() => handleClose(onGetFishies)}
                  hitSlop={8}
                >
                  <Text style={[styles.getFishiesText, { color: c.accent }]}>Get Fishies</Text>
                </Pressable>
              )}
            </View>
          )}

          <View style={styles.secondaryRow}>
            {isDaily && isWon ? (
              <SkeuButton
                onPress={() => handleClose(onGoHome)}
                variant="secondary"
                borderRadius={borderRadius.lg}
                style={styles.secondaryButton}
                contentStyle={styles.secondaryButtonContent}
              >
                <Text style={[styles.secondaryButtonText, { color: SKEU_VARIANTS.secondary.textColor }]}>
                  back to daily
                </Text>
              </SkeuButton>
            ) : (
              <SkeuButton
                onPress={() => handleClose(() => onPlayAgain(difficulty))}
                variant="secondary"
                borderRadius={borderRadius.lg}
                style={styles.secondaryButton}
                contentStyle={styles.secondaryButtonContent}
              >
                <Text style={[styles.secondaryButtonText, { color: SKEU_VARIANTS.secondary.textColor }]}>
                  play new game
                </Text>
              </SkeuButton>
            )}
          </View>

          <Pressable
            style={styles.returnHomeRow}
            onPress={() => handleClose(onGoHome)}
            hitSlop={12}
          >
            <Ionicons name="arrow-back" size={20} color={c.textSecondary} />
            <Text style={[styles.returnHomeText, { color: c.textSecondary }]}>
              return home
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlayBackground,
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  container: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 20,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    backgroundColor: colors.gridLine,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginHorizontal: "auto",
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  continueSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  mochiBalance: {
    ...typography.caption,
    color: colors.textLight,
  },
  primaryButton: {
    alignSelf: 'stretch',
    width: '100%',
  },
  primaryButtonContent: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...typography.button,
  },
  getFishiesRow: {
    paddingVertical: spacing.xs,
  },
  getFishiesText: {
    ...typography.caption,
  },
  secondaryRow: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  secondaryButton: {
    alignSelf: 'stretch',
    width: '100%',
  },
  secondaryButtonContent: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
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
    fontFamily: 'Pally-Medium',
  },
});
