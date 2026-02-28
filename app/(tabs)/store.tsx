import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Pressable,
  Modal,
  Animated,
  Dimensions,
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
import type { CustomSkeuColors } from '../../src/components/ui/Skeuomorphic';
import { RewardsPill } from '../../src/components/ui/RewardsPill';
import { useDailyChallengeStore } from '../../src/stores/dailyChallengeStore';
import { useIsPremium } from '../../src/stores/premiumStore';
import { useOwnedTracksStore } from '../../src/stores/ownedTracksStore';
import { BACKING_TRACKS, type BackingTrackDef } from '../../src/constants/backingTracks';
import { MOCHIS_COST } from '../../src/constants/economy';
import { getMochiPackProducts, purchaseMochiPack, presentPaywallAlways } from '../../src/lib/revenueCat';
import { playDemo, stopDemo } from '../../src/services/trackDemoService';
import { playFeedback } from '../../src/utils/feedback';
import { LinearGradient as ExpoGradient } from 'expo-linear-gradient';
import MochiPointIcon from '../../assets/images/icons/mochi-point.svg';
import MochiWowSvg from '../../assets/images/mochi/mochi-wow.svg';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// ============================================
// Store Item Row (Duolingo-style)
// ============================================

interface StoreItemRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing: React.ReactNode;
  onPress?: () => void;
}

function StoreItemRow({ icon, title, subtitle, trailing, onPress }: StoreItemRowProps) {
  const c = useColors();

  const content = (
    <View style={itemStyles.row}>
      <View style={itemStyles.iconArea}>{icon}</View>
      <View style={itemStyles.body}>
        <Text style={[itemStyles.title, { color: c.textPrimary }]}>{title}</Text>
        {subtitle ? (
          <Text style={[itemStyles.subtitle, { color: c.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      <View style={itemStyles.trailing}>{trailing}</View>
    </View>
  );

  return (
    <SkeuCard
      borderRadius={borderRadius.lg}
      contentStyle={itemStyles.card}
      style={itemStyles.wrapper}
      onPress={onPress}
      accessibilityLabel={title}
    >
      {content}
    </SkeuCard>
  );
}

const itemStyles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.sm,
  },
  card: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconArea: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  body: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontFamily: fontFamilies.semibold,
    fontSize: 16,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    marginTop: 2,
  },
  trailing: {
    alignItems: 'flex-end',
  },
});

// ============================================
// Mochi Price Pill
// ============================================

function MochiPricePill({ price }: { price: number }) {
  const c = useColors();
  return (
    <View style={priceStyles.pill}>
      <MochiPointIcon width={14} height={14} />
      <Text style={[priceStyles.text, { color: c.textPrimary }]}>{price}</Text>
    </View>
  );
}

const priceStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
  },
});

// ============================================
// Purchase Confirmation Sheet
// ============================================

interface PurchaseSheetConfig {
  image: React.ReactNode;
  title: string;
  price: number | string;
  currency: 'mochis' | 'iap';
  buttonLabel: string;
  onConfirm: () => void | Promise<void>;
}

interface PurchaseSheetProps {
  config: PurchaseSheetConfig | null;
  onDismiss: () => void;
  loading?: boolean;
}

function PurchaseSheet({ config, onDismiss, loading }: PurchaseSheetProps) {
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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => animateDismiss()}>
      <View style={sheetStyles.overlay}>
        <Pressable style={sheetStyles.dismissArea} onPress={() => animateDismiss()} />
        <Animated.View style={[sheetStyles.container, { backgroundColor: c.cream, transform: [{ translateY: slideAnim }] }]}>
          <View style={[sheetStyles.dragIndicator, { backgroundColor: c.gridLine }]} />

          <View style={sheetStyles.balancePill}>
            <RewardsPill mochis={totalMochis} variant="balance" size="small" />
          </View>

          <View style={sheetStyles.imageContainer}>{config.image}</View>

          <Text style={[sheetStyles.ctaText, { color: c.textPrimary }]}>
            {insufficientFunds ? "You don't have enough mochis" : config.title}
          </Text>

          <SkeuButton
            onPress={() => {
              if (insufficientFunds) return;
              animateDismiss(() => config.onConfirm());
            }}
            variant="primary"
            borderRadius={borderRadius.lg}
            disabled={insufficientFunds || loading}
            style={sheetStyles.buyButton}
            contentStyle={sheetStyles.buyButtonContent}
            accessibilityLabel={config.buttonLabel}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
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
    marginBottom: spacing.lg,
  },
  balancePill: {
    marginBottom: spacing.lg,
  },
  imageContainer: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  ctaText: {
    ...typography.headline,
    textAlign: 'center',
    marginBottom: spacing.xl,
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
  buyButtonText: {
    fontFamily: fontFamilies.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  noThanks: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
  noThanksText: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    letterSpacing: 0.5,
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
  const [productsError, setProductsError] = useState(false);
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
    setProductsError(false);
    const result = await getMochiPackProducts();
    if (!mountedRef.current) return;
    if (result.length === 0) setProductsError(true);
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

  // Sheet openers
  const openStreakFreezeSheet = useCallback(() => {
    playFeedback('tap');
    setSheetConfig({
      image: <Ionicons name="snow" size={80} color={c.accent} />,
      title: `Protect your streak with 1 Streak Freeze!`,
      price: MOCHIS_COST.streak_freeze,
      currency: 'mochis',
      buttonLabel: `BUY FOR ${MOCHIS_COST.streak_freeze}`,
      onConfirm: handleBuyStreakFreeze,
    });
  }, [c.accent, handleBuyStreakFreeze]);

  const openTrackSheet = useCallback((track: BackingTrackDef) => {
    playFeedback('tap');
    setSheetConfig({
      image: <Ionicons name="musical-notes" size={80} color={c.accent} />,
      title: `Unlock ${track.name}?`,
      price: track.cost,
      currency: 'mochis',
      buttonLabel: `BUY FOR ${track.cost}`,
      onConfirm: () => handleBuyTrack(track.id),
    });
  }, [c.accent, handleBuyTrack]);

  const openMochiPackSheet = useCallback((product: PurchasesStoreProduct, amount: number) => {
    playFeedback('tap');
    setSheetConfig({
      image: <MochiPointIcon width={80} height={80} />,
      title: `Get ${amount.toLocaleString()} Mochis!`,
      price: product.priceString,
      currency: 'iap',
      buttonLabel: `BUY FOR ${product.priceString}`,
      onConfirm: () => handlePurchasePack(product),
    });
  }, [handlePurchasePack]);

  // ============================================
  // Render
  // ============================================

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.cream }]} edges={['top']}>
      <ScreenBackground />

      <ScreenHeader title="store" left={<View />} showMochiPill />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Techniques CTA Banner */}
        <SkeuCard
          borderRadius={borderRadius.lg}
          contentStyle={bannerStyles.card}
          style={bannerStyles.wrapper}
          accessibilityLabel="Unlock sudoku techniques"
        >
          {/* Theme gradient glow from bottom */}
          <ExpoGradient
            colors={[c.boardBackground, c.accentLight + '10', c.buttonPrimary + '40']}
            locations={[1, 0.55, 0]}
            style={bannerStyles.gradientOverlay}
            pointerEvents="none"
            // borderRadius={borderRadius.lg}
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
              <MochiWowSvg width={60} height={60} />
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

        {/* Section 2: Subscriptions */}
        <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Subscriptions</Text>

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

        {/* Section 3: Streak Freeze */}
        <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Streak Freeze</Text>

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

        {/* Section 4: Sound Tracks */}
        <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Sound Tracks</Text>

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

        {/* Section 5: Get More Mochis (IAP) */}
        <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Get More Mochis</Text>

        {productsLoading ? (
          <SkeuCard borderRadius={borderRadius.lg} contentStyle={styles.loadingCard}>
            <ActivityIndicator size="small" color={c.textSecondary} />
            <Text style={[styles.loadingText, { color: c.textSecondary }]}>Loading prices...</Text>
          </SkeuCard>
        ) : productsError ? (
          <SkeuCard borderRadius={borderRadius.lg} contentStyle={styles.loadingCard}>
            <Text style={[styles.loadingText, { color: c.textSecondary }]}>Unable to load prices.</Text>
            <SkeuButton
              onPress={loadProducts}
              variant="secondary"
              borderRadius={borderRadius.sm}
              contentStyle={styles.smallBtn}
            >
              <Text style={[styles.smallBtnText, { color: c.textPrimary }]}>Retry</Text>
            </SkeuButton>
          </SkeuCard>
        ) : (
          products.map((product) => {
            const amount = getPackAmount(product.identifier);
            if (!amount) return null;
            return (
              <StoreItemRow
                key={product.identifier}
                icon={
                  <View style={[styles.iconCircle, { backgroundColor: c.accentLight + '40' }]}>
                    <MochiPointIcon width={22} height={22} />
                  </View>
                }
                title={`${amount.toLocaleString()} Mochis`}
                subtitle={product.priceString}
                trailing={
                  <Feather name="chevron-right" size={20} color={c.textSecondary} />
                }
                onPress={() => openMochiPackSheet(product, amount)}
              />
            );
          })
        )}

        <View style={styles.bottomSpacer} />
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
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockBtn: {
    marginTop: spacing.md,
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
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    ...typography.headline,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
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

  loadingCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  loadingText: {
    ...typography.caption,
  },

  bottomSpacer: {
    height: spacing.xxl,
  },
});
