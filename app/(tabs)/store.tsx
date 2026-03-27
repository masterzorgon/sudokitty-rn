import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import type { PurchasesStoreProduct } from 'react-native-purchases';

import { useColors } from '../../src/theme/colors';
import { fontFamilies } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme';
import { ScreenBackground, ScreenContent, ScreenHeader } from '../../src/components/ui/Layout';
import { CTABannerCarousel } from '../../src/components/ui/CTABannerCarousel';
import { usePlayerStreakStore } from '../../src/stores/playerStreakStore';
import { useEffectivePremium } from '../../src/stores/premiumStore';
import { useOwnedTracksStore } from '../../src/stores/ownedTracksStore';
import { BACKING_TRACKS, type BackingTrackDef } from '../../src/constants/backingTracks';
import {
  MOCHIS_COST,
  MOCHI_PACK_AMOUNTS,
  MOCHI_PACK_PRODUCT_IDS,
  getStreakFreezeCost,
  STREAK_FREEZE_PACK_OPTIONS,
  type MochiPackProductId,
} from '../../src/constants/economy';
import { getMochiPackProducts, purchaseMochiPack, presentPaywallAlways } from '../../src/lib/revenueCat';
import { playDemo, stopDemo } from '../../src/services/trackDemoService';
import { playFeedback } from '../../src/utils/feedback';
import { SectionTitle } from '../../src/components/ui/Typography/SectionTitle';
import { StoreItemRow } from '../../src/components/ui/StoreItemRow';
import { MusicTrackCard } from '../../src/components/ui/MusicTrackCard';
import { MochiPricePill } from '../../src/components/ui/MochiPricePill';
import { PurchaseSheet, type PurchaseSheetConfig } from '../../src/components/store/PurchaseSheet';
import MochiPointIcon from '../../assets/images/icons/mochi-point.svg';
const MochiMusicImg = require('../../assets/images/mochi/mochi-music.png');
const MochiFreezeImg = require('../../assets/images/mochi/mochi-freeze.png');
const MochiMochisImg = require('../../assets/images/mochi/mochi-mochis.png');

// ============================================
// Store Screen
// ============================================

export default function StoreScreen() {
  const c = useColors();
  const router = useRouter();
  const isPremium = useEffectivePremium();
  const totalMochis = usePlayerStreakStore((s) => s.totalMochiPoints);
  const streakFreezesCount = usePlayerStreakStore((s) => s.streakFreezesCount);
  const buyStreakFreezes = usePlayerStreakStore((s) => s.buyStreakFreezes);

  const ownedTrackIds = useOwnedTracksStore((s) => s.ownedTrackIds);
  const activeTrackId = useOwnedTracksStore((s) => s.activeTrackId);
  const buyTrack = useOwnedTracksStore((s) => s.buyTrack);
  const setActiveTrack = useOwnedTracksStore((s) => s.setActiveTrack);

  const [products, setProducts] = useState<PurchasesStoreProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [purchaseInProgress, setPurchaseInProgress] = useState<string | null>(null);
  const [demoPlayingTrackId, setDemoPlayingTrackId] = useState<string | null>(null);
  const [sheetConfig, setSheetConfig] = useState<PurchaseSheetConfig | null>(null);

  const mountedRef = useRef(true);

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
    const result = await getMochiPackProducts();
    if (!mountedRef.current) return;
    setProducts(result);
    setProductsLoading(false);
  }, []);

  // ============================================
  // Handlers
  // ============================================

  const handleBuyTrack = useCallback((trackId: string) => {
    const track = BACKING_TRACKS.find((t) => t.id === trackId);
    if (!track) return;
    const success = buyTrack(trackId);
    if (success) {
      Alert.alert('Track Purchased!', `${track.name} is now your active backing track.`);
    }
  }, [buyTrack]);

  const handleToggleDemo = useCallback(async (track: BackingTrackDef) => {
    if (demoPlayingTrackId === track.id) {
      await stopDemo();
      setDemoPlayingTrackId(null);
    } else {
      await stopDemo();
      setDemoPlayingTrackId(track.id);
      await playDemo(track.asset, track.demoDurationMs, {
        onComplete: () => {
          if (mountedRef.current) {
            setDemoPlayingTrackId(null);
          }
        },
      });
    }
  }, [demoPlayingTrackId]);

  const handlePurchasePack = useCallback(async (product: PurchasesStoreProduct) => {
    if (purchaseInProgress) return;
    setPurchaseInProgress(product.identifier);
    try {
      const result = await purchaseMochiPack(product);
      if (mountedRef.current && result.success && result.amount) {
        Alert.alert('Purchase Complete!', `You received ${result.amount.toLocaleString()} mochis!`);
      }
    } catch {
      if (mountedRef.current) {
        Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
      }
    } finally {
      if (mountedRef.current) setPurchaseInProgress(null);
    }
  }, [purchaseInProgress]);

  const handleInsufficientFunds = useCallback(async (itemPrice: number) => {
    const deficit = itemPrice - totalMochis;
    const sortedAmounts = Object.entries(MOCHI_PACK_AMOUNTS)
      .sort(([, a], [, b]) => a - b);

    const targetPack = sortedAmounts.find(([, amount]) => amount >= deficit);
    const packId = targetPack ? targetPack[0] : sortedAmounts[sortedAmounts.length - 1][0];

    const packProducts = await getMochiPackProducts();
    const product = packProducts.find((p) => p.identifier === packId);
    if (!product) {
      Alert.alert('Unavailable', 'Mochi packs are currently unavailable. Please try again later.');
      return;
    }
    await handlePurchasePack(product);
  }, [totalMochis, handlePurchasePack]);

  // Sheet openers
  const openStreakFreezeSheet = useCallback(
    (qty: 1 | 2 | 3) => {
      playFeedback('tap');
      const cost = getStreakFreezeCost(qty);
      setSheetConfig({
        image: <Image source={MochiFreezeImg} style={{ width: 140, height: 140 }} contentFit="contain" />,
        title: 'Each streak freeze protects your streak for 1 missed day!',
        price: cost,
        currency: 'mochis',
        buttonLabel: `Buy for ${cost}`,
        onConfirm: () => {
          const success = buyStreakFreezes(qty);
          if (success) {
            if (qty === 1) {
              Alert.alert('Streak Freeze Purchased!', 'Your streak is protected for one missed day.');
            } else {
              Alert.alert(
                'Streak Freeze Purchased!',
                `${qty} streak freezes added. You're protected for ${qty} missed days.`,
              );
            }
          }
        },
        onInsufficientFunds: () => handleInsufficientFunds(cost),
      });
    },
    [buyStreakFreezes, handleInsufficientFunds],
  );

  const openTrackSheet = useCallback((track: BackingTrackDef) => {
    playFeedback('tap');
    setSheetConfig({
      image: <Image source={MochiMusicImg} style={{ width: 120, height: 120 }} contentFit="contain" />,
      title: `Unlock ${track.name}?`,
      price: track.cost,
      currency: 'mochis',
      buttonLabel: `Buy for ${track.cost}`,
      onConfirm: () => handleBuyTrack(track.id),
      onInsufficientFunds: () => handleInsufficientFunds(track.cost),
    });
  }, [handleBuyTrack, handleInsufficientFunds]);

  const openMochiPackSheet = useCallback((packId: MochiPackProductId, amount: number) => {
    playFeedback('tap');
    const product = products.find((p) => p.identifier === packId);
    const priceLabel = product?.priceString ?? '---';
    setSheetConfig({
      image: <Image source={MochiMochisImg} style={{ width: 200, height: 200 }} contentFit="contain" />,
      title: `Get ${amount.toLocaleString()} Mochis!`,
      price: priceLabel,
      currency: 'iap',
      buttonLabel: product ? `Buy for ${priceLabel}` : 'Unavailable',
      onConfirm: product ? () => handlePurchasePack(product) : () => {},
    });
  }, [products, handlePurchasePack]);

  // ============================================
  // Render
  // ============================================

  const [headerHeight, setHeaderHeight] = useState(0);
  const contentStyle = useMemo(() => ({ ...styles.content, paddingTop: 70 }), [headerHeight]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.cream }]} edges={['top']}>
      <ScreenBackground />

      <ScreenContent contentStyle={contentStyle}>
        <CTABannerCarousel />

        <SectionTitle>Subscriptions</SectionTitle>

        <StoreItemRow
          icon={
            <View style={[styles.iconCircle, { backgroundColor: c.accentLight + '60' }]}>
              <Ionicons name="star" size={22} color={c.accent} />
            </View>
          }
          title="Remove Ads"
          subtitle={isPremium ? 'Premium active' : 'Upgrade to premium to remove ads'}
          trailing={
            isPremium ? (
              <Ionicons name="checkmark-circle" size={24} color={c.accent} />
            ) : (
              <Feather name="chevron-right" size={20} color={c.textSecondary} />
            )
          }
          onPress={isPremium ? undefined : async () => { playFeedback('tap'); await presentPaywallAlways(); }}
        />

        <SectionTitle>Streak Freeze</SectionTitle>

        {STREAK_FREEZE_PACK_OPTIONS.map(({ qty, label }, index) => {
          const cost = getStreakFreezeCost(qty);
          const subtitle =
            index === 0 && (streakFreezesCount ?? 0) > 0
              ? `Protect your streak · You have ${streakFreezesCount}`
              : 'Protect your streak for missed days';
          return (
            <StoreItemRow
              key={qty}
              icon={
                <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="snow" size={22} color="#42A5F5" />
                </View>
              }
              title={label}
              subtitle={subtitle}
              trailing={<MochiPricePill price={cost} />}
              onPress={() => openStreakFreezeSheet(qty)}
            />
          );
        })}

        <SectionTitle>Sound Tracks</SectionTitle>

        {BACKING_TRACKS.map((track) => {
          const isOwned = ownedTrackIds.includes(track.id);
          const isActive = activeTrackId === track.id;
          return (
            <MusicTrackCard
              key={track.id}
              track={track}
              isOwned={isOwned}
              isActive={isActive}
              isDemoPlaying={demoPlayingTrackId === track.id}
              onToggleDemo={() => handleToggleDemo(track)}
              onSelect={
                !isOwned && track.cost > 0
                  ? () => openTrackSheet(track)
                  : isOwned && !isActive
                    ? () => { playFeedback('tap'); setActiveTrack(track.id); }
                    : () => {}
              }
            />
          );
        })}

        <SectionTitle>Get More Mochis</SectionTitle>

        {MOCHI_PACK_PRODUCT_IDS.map((packId) => {
          const amount = MOCHI_PACK_AMOUNTS[packId];
          const product = products.find((p) => p.identifier === packId);
          const priceLabel = productsLoading ? 'Loading…' : product?.priceString;

          return (
            <StoreItemRow
              key={packId}
              icon={
                <View style={[styles.iconCircle, { backgroundColor: c.accentLight + '40' }]}>
                  <MochiPointIcon width={22} height={22} />
                </View>
              }
              title={`${amount.toLocaleString()} Mochis`}
              subtitle={priceLabel}
              trailing={
                <Feather name="chevron-right" size={20} color={c.textSecondary} />
              }
              onPress={() => openMochiPackSheet(packId, amount)}
            />
          );
        })}

      </ScreenContent>

      <ScreenHeader onHeightChange={setHeaderHeight} />

      <PurchaseSheet
        config={sheetConfig}
        onDismiss={() => setSheetConfig(null)}
        loading={purchaseInProgress !== null}
      />
    </SafeAreaView>
  );
}


// ============================================
// Banner Styles
// ============================================


// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 0,
    paddingBottom: 140,
  },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  smallBtnText: {
    fontFamily: fontFamilies.semibold,
    fontSize: 13,
  },


});
