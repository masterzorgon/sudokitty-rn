import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { PurchasesStoreProduct } from 'react-native-purchases';

import { useColors } from '../../src/theme/colors';
import { typography, fontFamilies } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme';
import { AtmosphericGradient } from '../../src/components/ui/AtmosphericGradient';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { SkeuButton, SkeuCard } from '../../src/components/ui/Skeuomorphic';
import { useDailyChallengeStore } from '../../src/stores/dailyChallengeStore';
import { useOwnedTracksStore } from '../../src/stores/ownedTracksStore';
import { BACKING_TRACKS, type BackingTrackDef } from '../../src/constants/backingTracks';
import { MOCHIS_COST } from '../../src/constants/economy';
import { getMochiPackProducts, purchaseMochiPack } from '../../src/lib/revenueCat';
import { playDemo, stopDemo } from '../../src/services/trackDemoService';
import MochiPointIcon from '../../assets/images/icons/mochi-point.svg';

// ============================================
// Track Row
// ============================================

interface TrackRowProps {
  track: BackingTrackDef;
  isOwned: boolean;
  isActive: boolean;
  isDemoPlaying: boolean;
  canAfford: boolean;
  onBuy: () => void;
  onSetActive: () => void;
  onToggleDemo: () => void;
}

function TrackRow({
  track,
  isOwned,
  isActive,
  isDemoPlaying,
  canAfford,
  onBuy,
  onSetActive,
  onToggleDemo,
}: TrackRowProps) {
  const c = useColors();

  return (
    <View style={styles.trackRow}>
      <View style={styles.trackInfo}>
        <Text style={[styles.trackName, { color: c.textPrimary }]}>
          {track.name}
        </Text>
        {isOwned ? (
          <Text style={[styles.trackStatus, { color: c.accent }]}>
            {isActive ? 'Playing' : 'Owned'}
          </Text>
        ) : (
          <View style={styles.trackCostRow}>
            <MochiPointIcon width={14} height={14} />
            <Text style={[styles.trackCost, { color: c.textSecondary }]}>
              {track.cost}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.trackActions}>
        <SkeuButton
          onPress={onToggleDemo}
          variant="secondary"
          borderRadius={borderRadius.sm}
          contentStyle={styles.smallBtn}
          accessibilityLabel={isDemoPlaying ? 'Stop preview' : 'Play preview'}
        >
          <Ionicons
            name={isDemoPlaying ? 'pause' : 'play'}
            size={16}
            color={c.textPrimary}
          />
        </SkeuButton>

        {isOwned ? (
          isActive ? (
            <View style={[styles.activeBadge, { backgroundColor: c.accentLight }]}>
              <Ionicons name="checkmark" size={16} color={c.accent} />
            </View>
          ) : (
            <SkeuButton
              onPress={onSetActive}
              variant="secondary"
              borderRadius={borderRadius.sm}
              contentStyle={styles.smallBtn}
              accessibilityLabel="Set as active track"
            >
              <Text style={[styles.smallBtnText, { color: c.textPrimary }]}>
                Use
              </Text>
            </SkeuButton>
          )
        ) : (
          <SkeuButton
            onPress={onBuy}
            variant="primary"
            borderRadius={borderRadius.sm}
            disabled={!canAfford}
            contentStyle={styles.smallBtn}
            accessibilityLabel={`Buy ${track.name} for ${track.cost} mochis`}
          >
            <Text style={[styles.smallBtnText, { color: '#FFFFFF' }]}>
              Buy
            </Text>
          </SkeuButton>
        )}
      </View>
    </View>
  );
}

// ============================================
// Mochi Pack Row
// ============================================

interface MochiPackRowProps {
  product: PurchasesStoreProduct;
  amount: number;
  purchasing: boolean;
  disabled: boolean;
  onBuy: () => void;
}

function MochiPackRow({ product, amount, purchasing, disabled, onBuy }: MochiPackRowProps) {
  const c = useColors();

  return (
    <View style={styles.packRow}>
      <View style={styles.packInfo}>
        <View style={styles.packAmountRow}>
          <MochiPointIcon width={18} height={18} />
          <Text style={[styles.packAmount, { color: c.textPrimary }]}>
            {amount.toLocaleString()}
          </Text>
        </View>
        <Text style={[styles.packPrice, { color: c.textSecondary }]}>
          {product.priceString}
        </Text>
      </View>
      <SkeuButton
        onPress={onBuy}
        variant="primary"
        borderRadius={borderRadius.sm}
        disabled={disabled || purchasing}
        contentStyle={styles.buyBtn}
        accessibilityLabel={`Buy ${amount} mochis for ${product.priceString}`}
      >
        {purchasing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={[styles.buyBtnText, { color: '#FFFFFF' }]}>Buy</Text>
        )}
      </SkeuButton>
    </View>
  );
}

// ============================================
// Store Screen
// ============================================

export default function StoreScreen() {
  const c = useColors();
  const totalMochis = useDailyChallengeStore((s) => s.totalMochiPoints);
  const streakFreezesCount = useDailyChallengeStore((s) => s.streakFreezesCount);
  const buyStreakFreeze = useDailyChallengeStore((s) => s.buyStreakFreeze);

  const ownedTrackIds = useOwnedTracksStore((s) => s.ownedTrackIds);
  const activeTrackId = useOwnedTracksStore((s) => s.activeTrackId);
  const buyTrack = useOwnedTracksStore((s) => s.buyTrack);
  const setActiveTrack = useOwnedTracksStore((s) => s.setActiveTrack);

  const [products, setProducts] = useState<PurchasesStoreProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(false);
  const [purchaseInProgress, setPurchaseInProgress] = useState<string | null>(null);
  const [demoPlayingTrackId, setDemoPlayingTrackId] = useState<string | null>(null);

  const mountedRef = useRef(true);

  // Load IAP products on mount
  useEffect(() => {
    mountedRef.current = true;
    loadProducts();
    return () => {
      mountedRef.current = false;
      stopDemo();
    };
  }, []);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(false);
    const result = await getMochiPackProducts();
    if (!mountedRef.current) return;
    if (result.length === 0) {
      setProductsError(true);
    }
    setProducts(result);
    setProductsLoading(false);
  }, []);

  // ============================================
  // Handlers
  // ============================================

  const handleBuyStreakFreeze = useCallback(() => {
    if (totalMochis < MOCHIS_COST.streak_freeze) {
      Alert.alert('Not enough Mochis', `You need ${MOCHIS_COST.streak_freeze} Mochis to buy a Streak Freeze.`);
      return;
    }
    const success = buyStreakFreeze();
    if (success) {
      Alert.alert('Streak Freeze Purchased!', 'Your streak is protected for one missed day.');
    }
  }, [totalMochis, buyStreakFreeze]);

  const handleBuyTrack = useCallback((trackId: string) => {
    const track = BACKING_TRACKS.find((t) => t.id === trackId);
    if (!track) return;
    if (totalMochis < track.cost) {
      Alert.alert('Not enough Mochis', `You need ${track.cost} Mochis to buy this track.`);
      return;
    }
    const success = buyTrack(trackId);
    if (success) {
      Alert.alert('Track Purchased!', `${track.name} is now your active backing track.`);
    }
  }, [totalMochis, buyTrack]);

  const handleToggleDemo = useCallback(async (track: BackingTrackDef) => {
    if (demoPlayingTrackId === track.id) {
      await stopDemo();
      setDemoPlayingTrackId(null);
    } else {
      setDemoPlayingTrackId(track.id);
      await playDemo(track.asset, track.demoDurationMs);
      if (mountedRef.current) {
        setDemoPlayingTrackId(null);
      }
    }
  }, [demoPlayingTrackId]);

  const handlePurchasePack = useCallback(async (product: PurchasesStoreProduct) => {
    if (purchaseInProgress) return;
    setPurchaseInProgress(product.identifier);
    try {
      const result = await purchaseMochiPack(product);
      if (mountedRef.current && result.success && result.amount) {
        Alert.alert('Purchase Complete!', `You received ${result.amount.toLocaleString()} Mochis!`);
      }
    } catch {
      if (mountedRef.current) {
        Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
      }
    } finally {
      if (mountedRef.current) {
        setPurchaseInProgress(null);
      }
    }
  }, [purchaseInProgress]);

  // ============================================
  // Render
  // ============================================

  const canAffordFreeze = totalMochis >= MOCHIS_COST.streak_freeze;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.cream }]} edges={['top']}>
      <AtmosphericGradient />
      <AtmosphericGradient reverse intensity="low" />

      <ScreenHeader title="store" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* Balance */}
        <View style={styles.balanceRow}>
          <MochiPointIcon width={24} height={24} />
          <Text style={[styles.balanceText, { color: c.textPrimary }]}>
            {totalMochis.toLocaleString()} Mochis
          </Text>
        </View>

        {/* Spend Section */}
        <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>
          Spend Mochis
        </Text>

        {/* Streak Freeze */}
        <SkeuCard
          borderRadius={borderRadius.lg}
          contentStyle={styles.card}
          style={styles.cardWrapper}
        >
          <View style={styles.streakFreezeRow}>
            <View style={styles.streakFreezeInfo}>
              <View style={styles.streakFreezeHeader}>
                <Ionicons name="snow-outline" size={20} color={c.accent} />
                <Text style={[styles.itemTitle, { color: c.textPrimary }]}>
                  Streak Freeze
                </Text>
              </View>
              <Text style={[styles.itemDesc, { color: c.textSecondary }]}>
                Protect your streak if you miss a day
              </Text>
              {(streakFreezesCount ?? 0) > 0 && (
                <Text style={[styles.ownedCount, { color: c.accent }]}>
                  You have {streakFreezesCount}
                </Text>
              )}
            </View>
            <View style={styles.streakFreezeAction}>
              <View style={styles.costBadge}>
                <MochiPointIcon width={14} height={14} />
                <Text style={[styles.costText, { color: c.textSecondary }]}>
                  {MOCHIS_COST.streak_freeze}
                </Text>
              </View>
              <SkeuButton
                onPress={handleBuyStreakFreeze}
                variant="primary"
                borderRadius={borderRadius.sm}
                disabled={!canAffordFreeze}
                contentStyle={styles.buyBtn}
                accessibilityLabel="Buy streak freeze"
              >
                <Text style={[styles.buyBtnText, { color: '#FFFFFF' }]}>Buy</Text>
              </SkeuButton>
            </View>
          </View>
        </SkeuCard>

        {/* Backing Tracks */}
        <Text style={[styles.subsectionTitle, { color: c.textPrimary }]}>
          Music Tracks
        </Text>

        <SkeuCard
          borderRadius={borderRadius.lg}
          contentStyle={styles.card}
          style={styles.cardWrapper}
        >
          {BACKING_TRACKS.map((track, index) => (
            <React.Fragment key={track.id}>
              {index > 0 && <View style={[styles.divider, { backgroundColor: c.cardBorder }]} />}
              <TrackRow
                track={track}
                isOwned={ownedTrackIds.includes(track.id)}
                isActive={activeTrackId === track.id}
                isDemoPlaying={demoPlayingTrackId === track.id}
                canAfford={totalMochis >= track.cost}
                onBuy={() => handleBuyTrack(track.id)}
                onSetActive={() => setActiveTrack(track.id)}
                onToggleDemo={() => handleToggleDemo(track)}
              />
            </React.Fragment>
          ))}
        </SkeuCard>

        {/* IAP Section */}
        <Text style={[styles.sectionTitle, { color: c.textPrimary, marginTop: spacing.xl }]}>
          Get More Mochis
        </Text>

        <SkeuCard
          borderRadius={borderRadius.lg}
          contentStyle={styles.card}
          style={styles.cardWrapper}
        >
          {productsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={c.textSecondary} />
              <Text style={[styles.loadingText, { color: c.textSecondary }]}>
                Loading prices...
              </Text>
            </View>
          ) : productsError ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.errorText, { color: c.textSecondary }]}>
                Unable to load prices.
              </Text>
              <SkeuButton
                onPress={loadProducts}
                variant="secondary"
                borderRadius={borderRadius.sm}
                contentStyle={styles.retryBtn}
              >
                <Text style={[styles.retryBtnText, { color: c.textPrimary }]}>
                  Retry
                </Text>
              </SkeuButton>
            </View>
          ) : (
            products.map((product, index) => {
              const amount = getPackAmount(product.identifier);
              if (!amount) return null;
              return (
                <React.Fragment key={product.identifier}>
                  {index > 0 && <View style={[styles.divider, { backgroundColor: c.cardBorder }]} />}
                  <MochiPackRow
                    product={product}
                    amount={amount}
                    purchasing={purchaseInProgress === product.identifier}
                    disabled={purchaseInProgress !== null}
                    onBuy={() => handlePurchasePack(product)}
                  />
                </React.Fragment>
              );
            })
          )}
        </SkeuCard>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================
// Helpers
// ============================================

function getPackAmount(productId: string): number | undefined {
  const amounts: Record<string, number> = {
    mochis_100: 100,
    mochis_500: 500,
    mochis_1200: 1200,
    mochis_3000: 3000,
  };
  return amounts[productId];
}

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    paddingBottom: spacing.xxl,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  balanceText: {
    ...typography.title,
  },
  sectionTitle: {
    ...typography.headline,
    marginBottom: spacing.md,
  },
  subsectionTitle: {
    ...typography.headline,
    fontSize: 16,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },

  // Cards
  cardWrapper: {
    marginBottom: spacing.md,
  },
  card: {
    padding: spacing.lg,
  },

  // Streak Freeze
  streakFreezeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakFreezeInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  streakFreezeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  streakFreezeAction: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  itemTitle: {
    fontFamily: fontFamilies.semibold,
    fontSize: 16,
  },
  itemDesc: {
    ...typography.caption,
    marginTop: 2,
  },
  ownedCount: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  costText: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
  },

  // Track rows
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  trackInfo: {
    flex: 1,
  },
  trackName: {
    fontFamily: fontFamilies.medium,
    fontSize: 15,
  },
  trackStatus: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    marginTop: 2,
  },
  trackCostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  trackCost: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
  },
  trackActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  smallBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  smallBtnText: {
    fontFamily: fontFamilies.semibold,
    fontSize: 13,
  },
  activeBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Mochi pack rows
  packRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  packInfo: {
    flex: 1,
  },
  packAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  packAmount: {
    fontFamily: fontFamilies.semibold,
    fontSize: 16,
  },
  packPrice: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    marginTop: 2,
  },
  buyBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  buyBtnText: {
    fontFamily: fontFamilies.semibold,
    fontSize: 14,
  },

  // Loading / Error
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  loadingText: {
    ...typography.caption,
  },
  errorText: {
    ...typography.caption,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryBtnText: {
    fontFamily: fontFamilies.semibold,
    fontSize: 13,
  },

  // Misc
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.xs,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
