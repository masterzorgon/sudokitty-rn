import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import type { PurchasesStoreProduct } from 'react-native-purchases';

import { useColors } from '../../src/theme/colors';
import { typography, fontFamilies } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme';
import { ScreenBackground } from '../../src/components/ui/ScreenBackground';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { SkeuButton, SkeuCard } from '../../src/components/ui/Skeuomorphic';
import { useDailyChallengeStore } from '../../src/stores/dailyChallengeStore';
import { useIsPremium } from '../../src/stores/premiumStore';
import { useOwnedTracksStore } from '../../src/stores/ownedTracksStore';
import { BACKING_TRACKS, type BackingTrackDef } from '../../src/constants/backingTracks';
import { MOCHIS_COST, MOCHI_PACK_AMOUNTS, MOCHI_PACK_PRODUCT_IDS, type MochiPackProductId } from '../../src/constants/economy';
import { getMochiPackProducts, purchaseMochiPack, presentPaywallAlways } from '../../src/lib/revenueCat';
import { playDemo, stopDemo } from '../../src/services/trackDemoService';
import { playFeedback } from '../../src/utils/feedback';
import { LinearGradient as ExpoGradient } from 'expo-linear-gradient';
import { SectionTitle } from '../../src/components/ui/SectionTitle';
import { StoreItemRow } from '../../src/components/ui/StoreItemRow';
import { PurchaseSheet, type PurchaseSheetConfig } from '../../src/components/store/PurchaseSheet';
import MochiPointIcon from '../../assets/images/icons/mochi-point.svg';
const MochiStarsImg = require('../../assets/images/mochi/mochi-stars.png');
const MochiMusicImg = require('../../assets/images/mochi/mochi-music.png');
const MochiFreezeImg = require('../../assets/images/mochi/mochi-freeze.png');
const MochiMochisImg = require('../../assets/images/mochi/mochi-mochis.png');



// ============================================
// Mochi Price Pill
// ============================================

function MochiPricePill({ price }: { price: number }) {
  const c = useColors();
  return (
    <View style={priceStyles.pill}>
      <MochiPointIcon width={21} height={21} />
      <Text style={[priceStyles.text, { color: c.textPrimary }]}>{price}</Text>
    </View>
  );
}

const priceStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontFamily: fontFamilies.semibold,
    fontSize: 18,
  },
});


// ============================================
// Store Screen
// ============================================

export default function StoreScreen() {
  const c = useColors();
  const router = useRouter();
  const isPremium = useIsPremium();
  const totalMochis = useDailyChallengeStore((s) => s.totalMochiPoints);
  const streakFreezesCount = useDailyChallengeStore((s) => s.streakFreezesCount);
  const buyStreakFreeze = useDailyChallengeStore((s) => s.buyStreakFreeze);

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

  const handleBuyStreakFreeze = useCallback(() => {
    const success = buyStreakFreeze();
    if (success) {
      Alert.alert('Streak Freeze Purchased!', 'Your streak is protected for one missed day.');
    }
  }, [buyStreakFreeze]);

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
      setDemoPlayingTrackId(track.id);
      await playDemo(track.asset, track.demoDurationMs);
      if (mountedRef.current) setDemoPlayingTrackId(null);
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
  const openStreakFreezeSheet = useCallback(() => {
    playFeedback('tap');
    setSheetConfig({
      image: <Image source={MochiFreezeImg} style={{ width: 140, height: 140 }} resizeMode="contain" />,
      title: `Each streak freeze protects your streak for 1 missed day!`,
      price: MOCHIS_COST.streak_freeze,
      currency: 'mochis',
      buttonLabel: `BUY FOR ${MOCHIS_COST.streak_freeze}`,
      onConfirm: handleBuyStreakFreeze,
      onInsufficientFunds: () => handleInsufficientFunds(MOCHIS_COST.streak_freeze),
    });
  }, [handleBuyStreakFreeze, handleInsufficientFunds]);

  const openTrackSheet = useCallback((track: BackingTrackDef) => {
    playFeedback('tap');
    setSheetConfig({
      image: <Image source={MochiMusicImg} style={{ width: 120, height: 120 }} resizeMode="contain" />,
      title: `Unlock ${track.name}?`,
      price: track.cost,
      currency: 'mochis',
      buttonLabel: `BUY FOR ${track.cost}`,
      onConfirm: () => handleBuyTrack(track.id),
      onInsufficientFunds: () => handleInsufficientFunds(track.cost),
    });
  }, [handleBuyTrack, handleInsufficientFunds]);

  const openMochiPackSheet = useCallback((packId: MochiPackProductId, amount: number) => {
    playFeedback('tap');
    const product = products.find((p) => p.identifier === packId);
    const priceLabel = product?.priceString ?? '---';
    setSheetConfig({
      image: <Image source={MochiMochisImg} style={{ width: 200, height: 200 }} resizeMode="contain" />,
      title: `Get ${amount.toLocaleString()} Mochis!`,
      price: priceLabel,
      currency: 'iap',
      buttonLabel: product ? `BUY FOR ${priceLabel}` : 'UNAVAILABLE',
      onConfirm: product ? () => handlePurchasePack(product) : () => {},
    });
  }, [products, handlePurchasePack]);

  // ============================================
  // Render
  // ============================================

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.cream }]} edges={['top']}>
      <ScreenBackground />

      <ScreenHeader title="store" showFreezePill showMochiPill />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SkeuCard
          borderRadius={borderRadius.lg}
          contentStyle={bannerStyles.card}
          style={bannerStyles.wrapper}
          accessibilityLabel="Unlock sudoku techniques"
        >
          <ExpoGradient
            colors={[c.boardBackground, c.accentLight + '10', c.buttonPrimary + '40']}
            locations={[1, 0.55, 0]}
            style={bannerStyles.gradientOverlay}
            pointerEvents="none"
          />

          <View style={bannerStyles.row}>
            <View style={bannerStyles.textArea}>
              <Text style={[bannerStyles.badge, { color: c.mochiPillText, backgroundColor: c.mochiPillBorder + '40' }]}>
                SUDOKU TECHNIQUES
              </Text>
              <Text style={[bannerStyles.title, { color: c.textPrimary }]}>
                level up your solving skills
              </Text>
            </View>
            <View style={bannerStyles.imageArea}>
              <Image source={MochiStarsImg} style={bannerStyles.mochiImage} />
            </View>
          </View>
          <SkeuButton
            onPress={async () => { playFeedback('tap'); await presentPaywallAlways(); }}
            variant="primary"
            sheen
            borderRadius={borderRadius.md}
            contentStyle={bannerStyles.unlockBtnContent}
            style={bannerStyles.unlockBtn}
            accessibilityLabel="Unlock all sudoku techniques"
          >
            <Text style={bannerStyles.learnMoreText}>UNLOCK TECHNIQUES</Text>
          </SkeuButton>
        </SkeuCard>

        <SectionTitle>Subscriptions</SectionTitle>

        <StoreItemRow
          icon={
            <View style={[styles.iconCircle, { backgroundColor: c.accentLight + '60' }]}>
              <Ionicons name="star" size={22} color={c.accent} />
            </View>
          }
          title="Remove Ads"
          subtitle={isPremium ? 'Premium active' : 'Upgrade to premium'}
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

        <StoreItemRow
          icon={
            <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="snow" size={22} color="#42A5F5" />
            </View>
          }
          title="Streak Freeze"
          subtitle={
            (streakFreezesCount ?? 0) > 0
              ? `Protect your streak \u00B7 You have ${streakFreezesCount}`
              : 'Protect your streak for 1 missed day'
          }
          trailing={<MochiPricePill price={MOCHIS_COST.streak_freeze} />}
          onPress={openStreakFreezeSheet}
        />

        <SectionTitle>Sound Tracks</SectionTitle>

        {BACKING_TRACKS.map((track) => {
          const isOwned = ownedTrackIds.includes(track.id);
          const isActive = activeTrackId === track.id;
          const isDemoPlaying = demoPlayingTrackId === track.id;

          return (
            <StoreItemRow
              key={track.id}
              icon={
                <Pressable
                  onPress={() => handleToggleDemo(track)}
                  style={[styles.iconCircle, { backgroundColor: c.accentLight + '40' }]}
                  accessibilityLabel={isDemoPlaying ? 'Stop preview' : 'Play preview'}
                >
                  <Ionicons
                    name={isDemoPlaying ? 'pause' : 'play'}
                    size={20}
                    color={c.accent}
                  />
                </Pressable>
              }
              title={track.name}
              subtitle={
                isOwned
                  ? isActive ? 'Playing' : 'Owned'
                  : undefined
              }
              trailing={
                isOwned ? (
                  isActive ? (
                    <Ionicons name="checkmark-circle" size={24} color={c.accent} />
                  ) : (
                    <SkeuButton
                      onPress={() => { playFeedback('tap'); setActiveTrack(track.id); }}
                      variant="secondary"
                      borderRadius={borderRadius.sm}
                      contentStyle={styles.smallBtn}
                      accessibilityLabel="Set as active track"
                    >
                      <Text style={[styles.smallBtnText, { color: c.textPrimary }]}>Use</Text>
                    </SkeuButton>
                  )
                ) : (
                  <MochiPricePill price={track.cost} />
                )
              }
              onPress={!isOwned && track.cost > 0 ? () => openTrackSheet(track) : undefined}
            />
          );
        })}

        <SectionTitle>Get More Mochis</SectionTitle>

        {MOCHI_PACK_PRODUCT_IDS.map((packId) => {
          const amount = MOCHI_PACK_AMOUNTS[packId];
          const product = products.find((p) => p.identifier === packId);
          const priceLabel = productsLoading ? 'Loading...' : product?.priceString;

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

      </ScrollView>

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

const bannerStyles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  card: {
    padding: spacing.lg,
    overflow: 'hidden',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.lg,
    margin: -spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textArea: {
    flex: 1,
    marginRight: spacing.md,
  },
  badge: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    letterSpacing: 1,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.headline,
    marginBottom: spacing.xs,
  },
  imageArea: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  mochiImage: {
    width: 120,
    height: 120,
    marginRight: spacing.xl + spacing.sm,
    resizeMode: 'contain',
    marginBottom: -spacing.md -spacing.sm,
  },
  unlockBtn: {
    marginTop: 0,
  },
  unlockBtnContent: {
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  learnMoreText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

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
