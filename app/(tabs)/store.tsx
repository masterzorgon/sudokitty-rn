// Store screen - Fishies packs (IAP) and future Mochis spend (boxes, tracks)

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, useColors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { spacing, borderRadius } from '../../src/theme';
import { AtmosphericGradient } from '../../src/components/ui/AtmosphericGradient';
import { useFishyStore } from '../../src/stores/fishyStore';
import FishyPointIcon from '../../assets/images/icons/fishy-point.svg';
import {
  getFishiesPackProducts,
  purchaseFishiesPack,
  type PurchaseFishiesPackResult,
} from '../../src/lib/revenueCat';
import { FISHIES_PACK_AMOUNTS, FISHIES_PER_MOCHI } from '../../src/constants/economy';
import { useDailyChallengeStore } from '../../src/stores/dailyChallengeStore';

type StoreProduct = Awaited<ReturnType<typeof getFishiesPackProducts>>[number];

function FishiesPackRow({
  product,
  purchasingId,
  onPurchase,
}: {
  product: StoreProduct;
  purchasingId: string | null;
  onPurchase: (productId: string) => void;
}) {
  const c = useColors();
  const productId = product.identifier;
  const amount = FISHIES_PACK_AMOUNTS[productId] ?? 0;
  const isPurchasing = purchasingId === productId;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.packRow,
        { backgroundColor: c.cardBackground },
        pressed && { opacity: 0.9 },
      ]}
      onPress={() => onPurchase(productId)}
      disabled={isPurchasing}
    >
      <View style={styles.packLeft}>
        <Text style={[styles.packAmount, { color: c.textPrimary }]}>{amount} Fishies</Text>
        <Text style={[styles.packPrice, { color: c.textSecondary }]}>{product.priceString}</Text>
      </View>
      <View style={styles.packRight}>
        {isPurchasing ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Text style={styles.buyButtonText}>Buy</Text>
        )}
      </View>
    </Pressable>
  );
}

const CONVERT_PRESETS = [50, 100, 500] as const;

export default function StoreScreen() {
  const c = useColors();
  const totalFishies = useFishyStore((s) => s.totalFishyPoints);
  const totalMochis = useDailyChallengeStore((s) => s.totalMochiPoints);
  const convertFishiesToMochis = useDailyChallengeStore((s) => s.convertFishiesToMochis);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [convertError, setConvertError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const list = await getFishiesPackProducts();
    setProducts(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handlePurchase = useCallback(async (productId: string) => {
    setPurchasingId(productId);
    let result: PurchaseFishiesPackResult;
    try {
      result = await purchaseFishiesPack(productId);
    } finally {
      setPurchasingId(null);
    }
    if (result.success) {
      // Balance already updated in store
    } else if (!result.cancelled) {
      Alert.alert(
        'Purchase failed',
        'Could not complete the purchase. Try again or check your connection.',
      );
    }
  }, []);

  const handleConvert = useCallback(
    (fishiesAmount: number) => {
      setConvertError(null);
      if (fishiesAmount < FISHIES_PER_MOCHI || fishiesAmount % FISHIES_PER_MOCHI !== 0) {
        setConvertError('Amount must be a multiple of 50.');
        return;
      }
      if (totalFishies < fishiesAmount) {
        setConvertError('Insufficient Fishies.');
        return;
      }
      const ok = convertFishiesToMochis(fishiesAmount);
      if (!ok) setConvertError('Insufficient Fishies.');
    },
    [totalFishies, convertFishiesToMochis],
  );

  const convertAllAmount = Math.floor(totalFishies / FISHIES_PER_MOCHI) * FISHIES_PER_MOCHI;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.cream }]} edges={['top']}>
      <AtmosphericGradient />
      <AtmosphericGradient reverse intensity="low" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.balanceRow}>
          <FishyPointIcon width={24} height={24} />
          <Text style={[styles.balanceText, { color: c.textPrimary }]}>
            You have {totalFishies} Fishies · {totalMochis} Mochis
          </Text>
        </View>

        {/* Convert Fishies → Mochis */}
        <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>
          Convert to Mochis
        </Text>
        <Text style={[styles.sectionSubtitle, { color: c.textSecondary }]}>
          {FISHIES_PER_MOCHI} Fishies = 1 Mochi. Use Mochis for treasure boxes and more.
        </Text>
        <View style={styles.presetRow}>
          {CONVERT_PRESETS.map((amount) => (
            <Pressable
              key={amount}
              style={({ pressed }) => [
                styles.presetButton,
                { backgroundColor: c.cardBackground },
                pressed && { opacity: 0.9 },
              ]}
              onPress={() => handleConvert(amount)}
            >
              <Text style={[styles.presetLabel, { color: c.textPrimary }]}>{amount}</Text>
              <Text style={[styles.presetSublabel, { color: c.textSecondary }]}>
                → {amount / FISHIES_PER_MOCHI} Mochi
              </Text>
            </Pressable>
          ))}
        </View>
        {convertAllAmount >= FISHIES_PER_MOCHI && (
          <Pressable
            style={({ pressed }) => [
              styles.convertAllButton,
              { backgroundColor: c.cardBackground },
              pressed && { opacity: 0.9 },
            ]}
            onPress={() => handleConvert(convertAllAmount)}
          >
            <Text style={[styles.convertAllText, { color: c.accent }]}>
              Convert all ({convertAllAmount} Fishies → {convertAllAmount / FISHIES_PER_MOCHI} Mochis)
            </Text>
          </Pressable>
        )}
        {convertError ? (
          <Text style={[styles.errorText, { color: colors.errorText }]}>{convertError}</Text>
        ) : null}

        <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>Get Fishies</Text>
        <Text style={[styles.sectionSubtitle, { color: c.textSecondary }]}>
          Buy Fishies packs to use on hints, lives, and more.
        </Text>

        {loading ? (
          <ActivityIndicator style={styles.loader} size="large" color={colors.accent} />
        ) : products.length === 0 ? (
          <Text style={[styles.emptyText, { color: c.textSecondary }]}>
            Fishies packs are not available right now. Try again later.
          </Text>
        ) : (
          <View style={styles.packList}>
            {products.map((product) => (
              <FishiesPackRow
                key={product.identifier}
                product={product}
                purchasingId={purchasingId}
                onPurchase={handlePurchase}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  balanceText: {
    ...typography.headline,
  },
  sectionTitle: {
    ...typography.title,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    ...typography.body,
    marginBottom: spacing.lg,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    marginVertical: spacing.lg,
  },
  packList: {
    gap: spacing.md,
  },
  presetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  presetButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  presetLabel: {
    ...typography.headline,
    marginBottom: spacing.xs,
  },
  presetSublabel: {
    ...typography.caption,
  },
  convertAllButton: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  convertAllText: {
    ...typography.caption,
  },
  errorText: {
    ...typography.caption,
    marginBottom: spacing.lg,
  },
  packRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  packLeft: {},
  packAmount: {
    ...typography.headline,
    marginBottom: spacing.xs,
  },
  packPrice: {
    ...typography.body,
  },
  packRight: {
    minWidth: 56,
    alignItems: 'flex-end',
  },
  buyButtonText: {
    ...typography.headline,
    color: colors.accent,
  },
});
