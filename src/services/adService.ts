import {
  InterstitialAd,
  RewardedAd,
  TestIds,
  AdEventType,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';

const interstitialAdUnitId = TestIds.INTERSTITIAL;
const rewardedAdUnitId = TestIds.REWARDED;

let interstitial: InterstitialAd | null = null;
let interstitialLoaded = false;

let rewarded: RewardedAd | null = null;
let rewardedLoaded = false;

function createInterstitial() {
  interstitialLoaded = false;
  interstitial = InterstitialAd.createForAdRequest(interstitialAdUnitId);

  interstitial.addAdEventListener(AdEventType.LOADED, () => {
    interstitialLoaded = true;
  });

  interstitial.addAdEventListener(AdEventType.ERROR, () => {
    interstitialLoaded = false;
  });

  interstitial.load();
}

function createRewarded() {
  rewardedLoaded = false;
  rewarded = RewardedAd.createForAdRequest(rewardedAdUnitId);

  rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
    rewardedLoaded = true;
  });

  rewarded.addAdEventListener(AdEventType.ERROR, () => {
    rewardedLoaded = false;
  });

  rewarded.load();
}

export function preloadInterstitial() {
  createInterstitial();
}

export function preloadRewarded() {
  createRewarded();
}

/**
 * Shows a loaded interstitial ad. Resolves when the ad closes.
 * Resolves immediately if no ad is loaded (never blocks the user).
 * Auto-preloads the next ad after close.
 */
export function showInterstitialIfReady(): Promise<void> {
  return new Promise((resolve) => {
    if (!interstitial || !interstitialLoaded) {
      resolve();
      return;
    }

    const closedListener = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        closedListener();
        createInterstitial();
        resolve();
      },
    );

    interstitial.show();
  });
}

/**
 * Shows a rewarded ad and returns whether the user earned the reward.
 * Returns false if no ad is loaded or the user dismissed early.
 * Auto-preloads the next ad after close.
 */
export function showRewardedAd(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!rewarded || !rewardedLoaded) {
      resolve(false);
      return;
    }

    let earned = false;

    const earnedListener = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        earned = true;
      },
    );

    const closedListener = rewarded.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        earnedListener();
        closedListener();
        createRewarded();
        resolve(earned);
      },
    );

    rewarded.show();
  });
}
