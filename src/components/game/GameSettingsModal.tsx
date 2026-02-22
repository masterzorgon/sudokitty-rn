// Game Settings Modal - In-game settings bottom sheet
// Slides up from bottom with settings toggles
// Pause state preservation is handled by the parent (game.tsx)

import React, { useCallback, useEffect, useRef } from 'react';
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

import {
  useSettingsStore,
  useSoundsEnabled,
  useHapticsEnabled,
  useTimerEnabled,
  useUnlimitedMistakes,
  useUnlimitedHints,
} from '../../stores/settingsStore';
import { useIsPremium } from '../../stores/premiumStore';
import { presentPaywall } from '../../lib/revenueCat';
import { colors, useColors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import { SkeuToggle } from '../ui/Skeuomorphic';

// MARK: - Types

interface GameSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

interface SettingRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityHint?: string;
  backgroundColor?: string;
}

// MARK: - Constants

const SCREEN_HEIGHT = Dimensions.get('window').height;

// MARK: - SettingRow Component

function SettingRow({
  label,
  description,
  value,
  onValueChange,
  accessibilityHint,
  backgroundColor,
}: SettingRowProps) {
  return (
    <View style={[styles.settingRow, backgroundColor && { backgroundColor }]}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>
      <SkeuToggle
        value={value}
        onValueChange={onValueChange}
        accessibilityLabel={label}
      />
    </View>
  );
}

// MARK: - GameSettingsModal Component

export function GameSettingsModal({ visible, onClose }: GameSettingsModalProps) {
  const c = useColors();
  const isPremium = useIsPremium();

  // Settings state
  const soundsEnabled = useSoundsEnabled();
  const hapticsEnabled = useHapticsEnabled();
  const timerEnabled = useTimerEnabled();
  const unlimitedMistakes = useUnlimitedMistakes();
  const unlimitedHints = useUnlimitedHints();

  // Settings actions
  const setSoundsEnabled = useSettingsStore((s) => s.setSoundsEnabled);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);
  const setTimerEnabled = useSettingsStore((s) => s.setTimerEnabled);
  const setUnlimitedMistakes = useSettingsStore((s) => s.setUnlimitedMistakes);
  const setUnlimitedHints = useSettingsStore((s) => s.setUnlimitedHints);

  const handlePremiumToggle = useCallback(
    async (enabled: boolean, setter: (v: boolean) => void) => {
      if (!enabled) {
        setter(false);
        return;
      }
      if (isPremium) {
        setter(true);
        return;
      }
      const purchased = await presentPaywall();
      if (purchased) {
        setter(true);
      }
    },
    [isPremium],
  );

  // Animation
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

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
          <View style={styles.header}>
            <Text style={styles.title}>Game Settings</Text>
            <Pressable
              style={styles.closeButton}
              onPress={handleClose}
              hitSlop={12}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.dragIndicator} />

          <View style={styles.settingsList}>
            <SettingRow
              label="Sounds"
              description="Game audio effects"
              value={soundsEnabled}
              onValueChange={setSoundsEnabled}
              accessibilityHint="Toggle game sounds on or off"
              backgroundColor={c.cream}
            />

            <SettingRow
              label="Haptics"
              description="Vibration feedback"
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              accessibilityHint="Toggle haptic feedback on or off"
              backgroundColor={c.cream}
            />

            <SettingRow
              label="Timer"
              description="Show elapsed time"
              value={timerEnabled}
              onValueChange={setTimerEnabled}
              accessibilityHint="Show or hide the game timer"
              backgroundColor={c.cream}
            />

            <SettingRow
              label="Unlimited Mistakes"
              description="No penalty for wrong answers"
              value={unlimitedMistakes}
              onValueChange={(v) => handlePremiumToggle(v, setUnlimitedMistakes)}
              accessibilityHint="Toggle unlimited mistakes (premium feature)"
              backgroundColor={c.cream}
            />

            <SettingRow
              label="Unlimited Hints"
              description="No limit on hints per game"
              value={unlimitedHints}
              onValueChange={(v) => handlePremiumToggle(v, setUnlimitedHints)}
              accessibilityHint="Toggle unlimited hints (premium feature)"
              backgroundColor={c.cream}
            />
          </View>

          <Text style={styles.footerNote}>
            Game is paused while settings are open
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

// MARK: - Styles

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
  },
  dragIndicator: {
    width: 36,
    height: 4,
    backgroundColor: colors.gridLine,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  settingsList: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    ...typography.body,
    fontFamily: 'Pally-Bold',
    color: colors.textPrimary,
  },
  settingDescription: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  footerNote: {
    ...typography.caption,
    color: colors.textLight,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
