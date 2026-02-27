import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Modal,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { showRewardedAd } from '../../services/adService';
import { useGameStore } from '../../stores/gameStore';
import { SkeuButton, SKEU_VARIANTS } from '../ui/Skeuomorphic';
import { colors, useColors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface HintAdSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function HintAdSheet({ visible, onClose }: HintAdSheetProps) {
  const c = useColors();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const addPaidHints = useGameStore((s) => s.addPaidHints);
  const useHint = useGameStore((s) => s.useHint);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [visible, slideAnim]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleWatchAd = async () => {
    const earned = await showRewardedAd();
    if (earned) {
      addPaidHints(1);
      useHint();
      handleClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={handleClose} />

        <Animated.View
          style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.dragIndicator} />

          <Ionicons
            name="bulb-outline"
            size={40}
            color={colors.coral}
            style={styles.icon}
          />

          <Text style={styles.title}>out of hints!</Text>

          <Text style={[styles.message, { color: c.textSecondary }]}>
            watch a short ad to get a free hint
          </Text>

          <SkeuButton
            onPress={handleWatchAd}
            variant="primary"
            borderRadius={borderRadius.lg}
            showHighlight={false}
            style={styles.adButton}
            contentStyle={styles.adButtonContent}
          >
            <Text
              style={[
                styles.adButtonText,
                { color: SKEU_VARIANTS.primary.textColor },
              ]}
            >
              watch ad for a free hint
            </Text>
          </SkeuButton>

          <Pressable
            style={styles.dismissRow}
            onPress={handleClose}
            hitSlop={12}
          >
            <Text style={[styles.dismissText, { color: c.textSecondary }]}>
              no thanks
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlayBackground,
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  container: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 20,
    alignItems: 'center',
  },
  dragIndicator: {
    width: 36,
    height: 4,
    backgroundColor: colors.gridLine,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  icon: {
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  adButton: {
    alignSelf: 'stretch',
    width: '100%',
    marginBottom: spacing.lg,
  },
  adButtonContent: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adButtonText: {
    ...typography.button,
  },
  dismissRow: {
    paddingVertical: spacing.sm,
  },
  dismissText: {
    ...typography.body,
    fontFamily: 'Pally-Medium',
  },
});
