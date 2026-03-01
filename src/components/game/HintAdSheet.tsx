import React, { useRef } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { showRewardedAd } from '../../services/adService';
import { useGameStore } from '../../stores/gameStore';
import { SkeuButton, SKEU_VARIANTS } from '../ui/Skeuomorphic';
import { SheetWrapper, type SheetWrapperRef } from '../ui/Sheet/SheetWrapper';
import { colors, useColors } from '../../theme/colors';
import { typography, fontFamilies } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';

interface HintAdSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function HintAdSheet({ visible, onClose }: HintAdSheetProps) {
  const c = useColors();
  const sheetRef = useRef<SheetWrapperRef>(null);

  const addPaidHints = useGameStore((s) => s.addPaidHints);
  const useHint = useGameStore((s) => s.useHint);

  const handleWatchAd = async () => {
    const earned = await showRewardedAd();
    if (earned) {
      addPaidHints(1);
      useHint();
      sheetRef.current?.close();
    }
  };

  if (!visible) return null;

  return (
    <SheetWrapper
      ref={sheetRef}
      visible={visible}
      onDismiss={onClose}
      blurBackground={false}
      containerStyle={{ alignItems: 'center' }}
    >
      <Ionicons
        name="bulb-outline"
        size={40}
        color={colors.coral}
        style={styles.icon}
      />

      <Text style={styles.title}>Out of Hints!</Text>

      <Text style={[styles.message, { color: c.textSecondary }]}>
        Watch a short ad to get a free hint.
      </Text>

      <SkeuButton
        onPress={handleWatchAd}
        variant="primary"
        borderRadius={borderRadius.lg}
        showHighlight={false}
        style={styles.adButton}
        contentStyle={styles.adButtonContent}
      >
        <Text style={[styles.adButtonText, { color: SKEU_VARIANTS.primary.textColor }]}>
          Watch Ad for a Free Hint
        </Text>
      </SkeuButton>

      <Pressable
        style={styles.dismissRow}
        onPress={() => sheetRef.current?.close()}
        hitSlop={12}
      >
        <Text style={[styles.dismissText, { color: c.textSecondary }]}>
          No Thanks
        </Text>
      </Pressable>
    </SheetWrapper>
  );
}

const styles = StyleSheet.create({
  icon: {
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  adButton: {
    alignSelf: 'stretch',
    width: '100%',
    marginBottom: spacing.lg,
  },
  adButtonContent: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adButtonText: {
    ...typography.button,
  },
  dismissRow: {
    paddingVertical: spacing.sm,
  },
  dismissText: {
    ...typography.body,
    fontFamily: fontFamilies.medium,
  },
});
