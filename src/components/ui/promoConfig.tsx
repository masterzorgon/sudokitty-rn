import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Share, Alert } from 'react-native';
import { fontFamilies } from '../../theme/typography';
import { useDailyChallengeStore } from '../../stores/dailyChallengeStore';
import { presentPaywallAlways } from '../../lib/revenueCat';
import MochiPointIcon from '../../../assets/images/icons/mochi-point.svg';

export type PromoKey = 'techniques' | 'invite' | 'rate';

const SHARE_MESSAGE =
  'Check out SudoKitty — a cute way to master sudoku! 🐱🧩';

function InviteButtonLabel() {
  return (
    <View style={btnLabelStyles.row}>
      <Text style={btnLabelStyles.text}>EARN</Text>
      <MochiPointIcon width={16} height={16} />
      <Text style={btnLabelStyles.text}>100 MOCHIS</Text>
    </View>
  );
}

const btnLabelStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  text: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

export const PROMO_COPY: Record<
  PromoKey,
  {
    badge: string;
    title: string;
    buttonLabel: string | React.ReactNode;
    accessibilityLabel: string;
  }
> = {
  techniques: {
    badge: 'SUDOKU TECHNIQUES',
    title: 'level up your solving skills',
    buttonLabel: 'UNLOCK ALL TECHNIQUES',
    accessibilityLabel: 'Unlock all sudoku techniques',
  },
  invite: {
    badge: 'INVITE FRIENDS',
    title: 'give sudokitty to friends',
    buttonLabel: <InviteButtonLabel />,
    accessibilityLabel: 'Invite friends and earn 100 mochis',
  },
  rate: {
    badge: 'RATE SUDOKITTY',
    title: 'share the love of sudokitty',
    buttonLabel: 'RATE SUDOKITTY',
    accessibilityLabel: 'Rate SudoKitty on the App Store',
  },
};

export function usePromoActions(): Record<PromoKey, () => void> {
  const handleTechniques = useCallback(async () => {
    await presentPaywallAlways();
  }, []);

  const handleInvite = useCallback(async () => {
    try {
      const result = await Share.share({ message: SHARE_MESSAGE });
      if (result.action === Share.sharedAction) {
        useDailyChallengeStore.getState().addMochiHistoryEntry(100, 'bonus');
        Alert.alert('You earned 100 Mochis!', 'Thanks for sharing SudoKitty with your friends.');
      }
    } catch { /* user cancelled */ }
  }, []);

  const handleRate = useCallback(async () => {
    try {
      const StoreReview = await import('expo-store-review');
      await StoreReview.requestReview();
    } catch {
      Alert.alert('Thanks!', 'Please rate us on the App Store.');
    }
  }, []);

  return { techniques: handleTechniques, invite: handleInvite, rate: handleRate };
}
