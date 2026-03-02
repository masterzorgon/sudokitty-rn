// RevenueCat SDK wrapper
// All purchase/entitlement logic lives here. Other modules import from
// this file, never directly from react-native-purchases.

import Purchases, { LOG_LEVEL, CustomerInfo, PurchasesStoreProduct } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { MOCHI_PACK_PRODUCT_IDS, MOCHI_PACK_AMOUNTS, type MochiPackProductId } from '../constants/economy';
import { usePlayerStreakStore } from '../stores/playerStreakStore';

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
// Mochi Pack Consumables
// ============================================

/** Fetch mochi pack products from RevenueCat. Returns empty array on failure. */
export async function getMochiPackProducts(): Promise<PurchasesStoreProduct[]> {
  try {
    const products = await Purchases.getProducts([...MOCHI_PACK_PRODUCT_IDS]);
    if (__DEV__ && products.length === 0) {
      console.warn(
        '[RevenueCat] getMochiPackProducts: no products returned. Check: (1) EXPO_PUBLIC_RC_API_KEY is set, (2) products mochis_100, mochis_500, mochis_1200, mochis_3000 exist in App Store Connect as consumables, (3) RevenueCat dashboard has the app linked to App Store Connect.',
      );
    }
    return products;
  } catch (e) {
    if (__DEV__) {
      console.warn('[RevenueCat] getMochiPackProducts failed:', e);
    }
    return [];
  }
}

/** Purchase a mochi pack consumable. Credits mochis on success. */
export async function purchaseMochiPack(
  product: PurchasesStoreProduct,
): Promise<{ success: boolean; amount?: number }> {
  try {
    await Purchases.purchaseStoreProduct(product);

    const productId = product.identifier as MochiPackProductId;
    const amount = MOCHI_PACK_AMOUNTS[productId];
    if (!amount) return { success: false };

    usePlayerStreakStore.getState().addMochiHistoryEntry(amount, 'iap');

    return { success: true, amount };
  } catch (error: any) {
    if (error.userCancelled) return { success: false };
    throw error;
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
