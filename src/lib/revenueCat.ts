// RevenueCat SDK wrapper
// All purchase/entitlement logic lives here. Other modules import from
// this file, never directly from react-native-purchases.

import Purchases, { LOG_LEVEL, CustomerInfo } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';

import { FISHIES_PACK_AMOUNTS } from '../constants/economy';
import { useFishyStore } from '../stores/fishyStore';

const API_KEY = process.env.EXPO_PUBLIC_RC_API_KEY ?? '';
const ENTITLEMENT_ID = 'Sudokitty Premium';

// ============================================
// Initialization
// ============================================

export async function initRevenueCat(): Promise<void> {
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey: API_KEY });
}

// ============================================
// Entitlement Checking
// ============================================

/** Check if the current user has the premium entitlement. */
export async function checkPremiumStatus(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo();
    return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
    return false;
  }
}

/** Synchronously check premium from a CustomerInfo object. */
export function isPremiumFromInfo(info: CustomerInfo): boolean {
  return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

// ============================================
// Paywalls (pre-built RevenueCat UI)
// ============================================

/**
 * Present the paywall only if the user does NOT already have the entitlement.
 * Returns true if the user now has premium (purchased, restored, or already had it).
 */
export async function presentPaywall(): Promise<boolean> {
  try {
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: ENTITLEMENT_ID,
    });
    // PURCHASED, RESTORED, or NOT_PRESENTED (already has entitlement)
    return result === 'PURCHASED' || result === 'RESTORED' || result === 'NOT_PRESENTED';
  } catch {
    return false;
  }
}

/**
 * Always present the paywall regardless of current entitlement status.
 * Use for the settings "Upgrade" button where the user explicitly wants to see pricing.
 */
export async function presentPaywallAlways(): Promise<boolean> {
  try {
    const result = await RevenueCatUI.presentPaywall();
    return result === 'PURCHASED' || result === 'RESTORED';
  } catch {
    return false;
  }
}

// ============================================
// Customer Center
// ============================================

/** Open the RevenueCat Customer Center for subscription management. */
export async function presentCustomerCenter(): Promise<void> {
  try {
    await RevenueCatUI.presentCustomerCenter();
  } catch {
    // Silent failure — Customer Center requires RC Pro/Enterprise plan.
    // If unavailable, nothing happens.
  }
}

// ============================================
// Restore
// ============================================

/** Restore previous purchases. Returns true if premium was restored. */
export async function restorePurchases(): Promise<boolean> {
  try {
    const info = await Purchases.restorePurchases();
    return isPremiumFromInfo(info);
  } catch {
    return false;
  }
}

// ============================================
// Customer Info
// ============================================

/** Get the current customer info (or null on error). */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    return await Purchases.getCustomerInfo();
  } catch {
    return null;
  }
}

// ============================================
// Fishies packs (consumables)
// ============================================

const FISHIES_PACK_PRODUCT_IDS = [
  'fishies_150',
  'fishies_350',
  'fishies_1000',
  'fishies_2200',
  'fishies_5000',
] as const;

/** Fetch store products for Fishies packs (for display and purchase). */
export async function getFishiesPackProducts() {
  try {
    return await Purchases.getProducts([...FISHIES_PACK_PRODUCT_IDS]);
  } catch {
    return [] as Awaited<ReturnType<typeof Purchases.getProducts>>;
  }
}

export type PurchaseFishiesPackResult =
  | { success: true; amount: number }
  | { success: false; cancelled?: boolean };

/**
 * Purchase a Fishies pack by product ID. On success, grants Fishies client-side and returns amount.
 * For consumables, Restore does not re-grant; this is the only way to get IAP Fishies.
 */
export async function purchaseFishiesPack(productId: string): Promise<PurchaseFishiesPackResult> {
  const amount = FISHIES_PACK_AMOUNTS[productId];
  if (amount == null || amount <= 0) {
    return { success: false };
  }
  try {
    const products = await Purchases.getProducts([productId]);
    const product = products[0];
    if (!product) {
      return { success: false };
    }
    await Purchases.purchaseStoreProduct(product);
    useFishyStore.getState().addFishyPoints(amount, 'iap');
    return { success: true, amount };
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean };
    return { success: false, cancelled: err?.userCancelled === true };
  }
}

// ============================================
// Listener
// ============================================

/**
 * Register a listener for real-time CustomerInfo changes.
 * Fires when the user purchases, restores, or their subscription status
 * changes (e.g., renewal, cancellation, cross-device sync).
 * Returns a cleanup function to remove the listener.
 */
export function addCustomerInfoListener(
  listener: (info: CustomerInfo) => void,
): () => void {
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
}
