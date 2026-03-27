// Mochi economy constants - single currency for earn and spend
export const MOCHIS_COST = {
  common_box: 10,
  rare_box: 40,
  legendary_box: 100,
  backing_track: 100,
  streak_freeze: 950,
  streak_reignite: 2950,
} as const;

export const STREAK_FREEZE_TIER_PRICES: Record<1 | 2 | 3, number> = {
  1: 950,
  2: 1850,
  3: 2750,
};

export function getStreakFreezeCost(qty: 1 | 2 | 3): number {
  return STREAK_FREEZE_TIER_PRICES[qty];
}

/** Labels and quantities for streak freeze bundles (store + purchase sheet). */
export const STREAK_FREEZE_PACK_OPTIONS = [
  { qty: 1 as const, label: '1 Streak Freeze' },
  { qty: 2 as const, label: '2 Streak Freezes' },
  { qty: 3 as const, label: '3 Streak Freezes' },
] as const;

// ============================================
// Mochi IAP packs (RevenueCat consumables)
// ============================================

export const MOCHI_PACK_PRODUCT_IDS = [
  'mochis_100',
  'mochis_500',
  'mochis_1200',
  'mochis_3000',
] as const;

export type MochiPackProductId = (typeof MOCHI_PACK_PRODUCT_IDS)[number];

export const MOCHI_PACK_AMOUNTS: Record<MochiPackProductId, number> = {
  mochis_100: 100,
  mochis_500: 500,
  mochis_1200: 1200,
  mochis_3000: 3000,
};
