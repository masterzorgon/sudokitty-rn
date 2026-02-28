import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  Animated,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import { useColors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { fontFamilies } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import { SkeuButton } from '../ui/Skeuomorphic';
import { useDailyChallengeStore } from '../../stores/dailyChallengeStore';
import MochiPointIcon from '../../../assets/images/icons/mochi-point.svg';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export interface PurchaseSheetConfig {
  image: React.ReactNode;
  title: string;
  price: number | string;
  currency: 'mochis' | 'iap';
  buttonLabel: string;
  onConfirm: () => void | Promise<void>;
  /** Called when the user taps the buy button but can't afford the item. */
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
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const visible = config !== null;

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

  const animateDismiss = useCallback((cb?: () => void) => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
      cb?.();
    });
  }, [slideAnim, onDismiss]);

  if (!config) return null;

  const canAfford = config.currency === 'iap' || totalMochis >= (config.price as number);
  const insufficientFunds = config.currency === 'mochis' && !canAfford;

  const handlePress = () => {
    if (insufficientFunds && config.onInsufficientFunds) {
      animateDismiss(() => config.onInsufficientFunds!());
      return;
    }
    if (insufficientFunds) return;
    animateDismiss(() => config.onConfirm());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => animateDismiss()}>
      <View style={sheetStyles.overlay}>
        <Pressable style={sheetStyles.dismissArea} onPress={() => animateDismiss()} />
        <Animated.View style={[sheetStyles.container, { backgroundColor: c.cream, transform: [{ translateY: slideAnim }] }]}>
          <View style={[sheetStyles.dragIndicator, { backgroundColor: c.gridLine }]} />

          {config.currency === 'mochis' && (
            <View style={[sheetStyles.balancePill, { backgroundColor: c.gridLine + '60' }]}>
              <MochiPointIcon width={21} height={21} />
              <Text style={[sheetStyles.balanceText, { color: c.textPrimary }]}>
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
            <View style={[sheetStyles.balancePill, { backgroundColor: c.gridLine + '60' }]}>
              <Text style={[sheetStyles.balanceText, { color: c.textPrimary }]}>
                {config.price}
              </Text>
            </View>
          )}

          <View style={sheetStyles.imageContainer}>{config.image}</View>

          <Text style={[sheetStyles.ctaText, { color: c.textPrimary }]}>
            {config.title}
          </Text>

          <SkeuButton
            onPress={handlePress}
            variant="primary"
            borderRadius={borderRadius.lg}
            disabled={loading}
            style={sheetStyles.buyButton}
            contentStyle={sheetStyles.buyButtonContent}
            accessibilityLabel={insufficientFunds ? 'Get more mochis' : config.buttonLabel}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : insufficientFunds ? (
              <View style={sheetStyles.buttonRow}>
                <MochiPointIcon width={20} height={20} />
                <Text style={sheetStyles.buyButtonText}>GET MOCHIS</Text>
              </View>
            ) : config.currency === 'mochis' ? (
              <View style={sheetStyles.buttonRow}>
                <MochiPointIcon width={20} height={20} />
                <Text style={sheetStyles.buyButtonText}>GET FOR {config.price}</Text>
              </View>
            ) : (
              <Text style={sheetStyles.buyButtonText}>{config.buttonLabel}</Text>
            )}
          </SkeuButton>

          <Pressable onPress={() => animateDismiss()} style={sheetStyles.noThanks}>
            <Text style={[sheetStyles.noThanksText, { color: c.textSecondary }]}>NO THANKS</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  container: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl + 20,
    alignItems: 'center',
  },
  dragIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
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
    color: '#FFFFFF',
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
