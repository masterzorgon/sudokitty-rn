// Mochi economy constants - single currency for earn and spend

import type { Difficulty } from '../engine/types';

// ============================================
// Mochis spend (consumables and premium)
// ============================================

export const MOCHIS_COST = {
  common_box: 10,
  rare_box: 40,
  legendary_box: 100,
  backing_track: 15,
  streak_freeze: 100,
  streak_reignite: 200,
} as const;

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
