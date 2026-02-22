import { Alert } from 'react-native';

/**
 * Show a rewarded ad and return whether the user earned the reward.
 * Currently a placeholder -- returns false and shows an info alert.
 * TODO: Integrate Google AdMob or similar SDK.
 */
export async function showRewardedAd(): Promise<boolean> {
  Alert.alert(
    'Coming Soon',
    'Rewarded ads will be available in a future update. Keep playing to earn more mochis!',
  );
  return false;
}
