// Game Settings Modal - In-game settings bottom sheet
// Slides up from bottom with settings toggles
// Pause state preservation is handled by the parent (game.tsx)

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

import {
  useSettingsStore,
  useSoundsEnabled,
  useHapticsEnabled,
  useTimerEnabled,
  useMistakeLimitEnabled,
} from '../../stores/settingsStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius, shadows } from '../../theme';
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
}: SettingRowProps) {
  return (
    <View style={styles.settingRow}>
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
  // Settings state
  const soundsEnabled = useSoundsEnabled();
  const hapticsEnabled = useHapticsEnabled();
  const timerEnabled = useTimerEnabled();
  const mistakeLimitEnabled = useMistakeLimitEnabled();

  // Settings actions
  const setSoundsEnabled = useSettingsStore((s) => s.setSoundsEnabled);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);
  const setTimerEnabled = useSettingsStore((s) => s.setTimerEnabled);
  const setMistakeLimitEnabled = useSettingsStore((s) => s.setMistakeLimitEnabled);

  // Animation
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      // Slide up when modal becomes visible
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      // Reset position when modal closes
      slideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [visible, slideAnim]);

  const handleClose = () => {
    // Slide down before closing
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
        {/* Dismiss area (tap outside to close) */}
        <Pressable style={styles.dismissArea} onPress={handleClose} />

        {/* Modal content */}
        <Animated.View
          style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
        >
          {/* Header */}
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

          {/* Drag indicator */}
          <View style={styles.dragIndicator} />

          {/* Settings list */}
          <View style={styles.settingsList}>
            <SettingRow
              label="Sounds"
              description="Game audio effects"
              value={soundsEnabled}
              onValueChange={setSoundsEnabled}
              accessibilityHint="Toggle game sounds on or off"
            />

            <SettingRow
              label="Haptics"
              description="Vibration feedback"
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              accessibilityHint="Toggle haptic feedback on or off"
            />

            <SettingRow
              label="Timer"
              description="Show elapsed time"
              value={timerEnabled}
              onValueChange={setTimerEnabled}
              accessibilityHint="Show or hide the game timer"
            />

            <SettingRow
              label="Mistake Limit"
              description="End game after 3 mistakes"
              value={mistakeLimitEnabled}
              onValueChange={setMistakeLimitEnabled}
              accessibilityHint="Enable or disable the 3 mistake limit"
            />
          </View>

          {/* Footer note */}
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
    paddingBottom: spacing.xl + 20, // Extra padding for home indicator
    ...shadows.large,
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
    backgroundColor: colors.cream,
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
    fontWeight: '600',
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
