import { Alert } from 'react-native';

/**
 * Show a rewarded ad and return whether the user earned the reward.
 * Placeholder until an ad SDK is integrated.
 */
export async function showRewardedAd(): Promise<boolean> {
  Alert.alert(
    'coming soon',
    'rewarded ads will be available in a future update. keep playing to earn more mochis!',
  );
  return false;
}
