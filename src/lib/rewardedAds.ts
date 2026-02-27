import { showRewardedAd as showRewarded } from '../services/adService';

/**
 * Show a rewarded ad and return whether the user earned the reward.
 * Delegates to the centralized ad service.
 */
export async function showRewardedAd(): Promise<boolean> {
  return showRewarded();
}
