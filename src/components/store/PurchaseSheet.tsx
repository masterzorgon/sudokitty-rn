import React, { useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import { colors, useColors } from '../../theme/colors';
import { typography, fontFamilies } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import { SkeuButton } from '../ui/Skeuomorphic';
import { SheetWrapper, type SheetWrapperRef } from '../ui/Sheet/SheetWrapper';
import { useDailyChallengeStore } from '../../stores/dailyChallengeStore';
import MochiPointIcon from '../../../assets/images/icons/mochi-point.svg';

export interface PurchaseSheetConfig {
  image: React.ReactNode;
  title: string;
  price: number | string;
  currency: 'mochis' | 'iap';
  buttonLabel: string;
  onConfirm: () => void | Promise<void>;
  onInsufficientFunds?: () => void | Promise<void>;
}

export interface PurchaseSheetProps {
  config: PurchaseSheetConfig | null;
  onDismiss: () => void;
  loading?: boolean;
}

export function PurchaseSheet({ config, onDismiss, loading }: PurchaseSheetProps) {
  const c = useColors();
  const totalMochis = useDailyChallengeStore((s) => s.totalMochiPoints);
  const sheetRef = useRef<SheetWrapperRef>(null);

  const visible = config !== null;

  const { canAfford, insufficientFunds } = useMemo(() => {
    if (!config) return { canAfford: true, insufficientFunds: false };
    const afford = config.currency === 'iap' || totalMochis >= (config.price as number);
    return { canAfford: afford, insufficientFunds: config.currency === 'mochis' && !afford };
  }, [config, totalMochis]);

  const handlePress = useCallback(() => {
    if (!config) return;
    if (insufficientFunds && config.onInsufficientFunds) {
      sheetRef.current?.close(() => config.onInsufficientFunds!());
      return;
    }
    if (insufficientFunds) return;
    sheetRef.current?.close(() => config.onConfirm());
  }, [config, insufficientFunds]);

  if (!config) return null;

  return (
    <SheetWrapper
      ref={sheetRef}
      visible={visible}
      onDismiss={onDismiss}
      containerStyle={{ backgroundColor: c.cream, alignItems: 'center' }}
    >
      {config.currency === 'mochis' && (
        <View style={[styles.balancePill, { backgroundColor: c.gridLine + '60' }]}>
          <MochiPointIcon width={21} height={21} />
          <Text style={[styles.balanceText, { color: c.textPrimary }]}>
            {totalMochis} / {config.price}
            {insufficientFunds && (
              <Text style={{ color: c.accent }}>
                {' \u00B7 need '}{(config.price as number) - totalMochis}{' more'}
              </Text>
            )}
          </Text>
        </View>
      )}

      {config.currency === 'iap' && (
        <View style={[styles.balancePill, { backgroundColor: c.gridLine + '60' }]}>
          <Text style={[styles.balanceText, { color: c.textPrimary }]}>
            {config.price}
          </Text>
        </View>
      )}

      <View style={styles.imageContainer}>{config.image}</View>

      <Text style={[styles.ctaText, { color: c.textPrimary }]}>
        {config.title}
      </Text>

      <SkeuButton
        onPress={handlePress}
        variant="primary"
        borderRadius={borderRadius.lg}
        disabled={loading}
        style={styles.buyButton}
        contentStyle={styles.buyButtonContent}
        accessibilityLabel={insufficientFunds ? 'Get more mochis' : config.buttonLabel}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : insufficientFunds ? (
          <View style={styles.buttonRow}>
            <MochiPointIcon width={20} height={20} />
            <Text style={styles.buyButtonText}>GET MOCHIS</Text>
          </View>
        ) : config.currency === 'mochis' ? (
          <View style={styles.buttonRow}>
            <Text style={styles.buyButtonText}>GET FOR</Text>
            <MochiPointIcon width={20} height={20} />
            <Text style={styles.buyButtonText}>{config.price}</Text>
          </View>
        ) : (
          <Text style={styles.buyButtonText}>{config.buttonLabel}</Text>
        )}
      </SkeuButton>

      <Pressable onPress={() => sheetRef.current?.close()} style={styles.noThanks}>
        <Text style={[styles.noThanksText, { color: c.textSecondary }]}>NO THANKS</Text>
      </Pressable>
    </SheetWrapper>
  );
}

const styles = StyleSheet.create({
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xl,
  },
  balanceText: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
  },
  imageContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  ctaText: {
    ...typography.headline,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  buyButton: {
    width: '100%',
  },
  buyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buyButtonText: {
    fontFamily: fontFamilies.bold,
    fontSize: 16,
    color: colors.white,
  },
  noThanks: {
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
  },
  noThanksText: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
