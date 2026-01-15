// Difficulty selection unfurl menu
// Expands upward from primary action pill

import React from 'react';
import { StyleSheet, View, Pressable, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Difficulty } from '@/src/engine/types';
import { DifficultyUnfurlProps, LAYOUT } from './types';
import { DifficultyRow } from './DifficultyRow';

const DIFFICULTIES: Difficulty[] = ['expert', 'hard', 'medium', 'easy'];

export function DifficultyUnfurl({
  isOpen,
  onSelect,
  onDismiss,
}: DifficultyUnfurlProps) {
  const insets = useSafeAreaInsets();
  const menuScale = useSharedValue(0);
  const menuOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (isOpen) {
      // Scale up from 0 → 1 with subtle overshoot
      menuScale.value = withTiming(1, {
        duration: 120,
        easing: Easing.out(Easing.back(1.1)),
      });
      menuOpacity.value = withTiming(1, { duration: 120 });
    } else {
      // Fast collapse
      menuScale.value = withTiming(0, {
        duration: 80,
        easing: Easing.in(Easing.cubic),
      });
      menuOpacity.value = withTiming(0, { duration: 80 });
    }
  }, [isOpen, menuScale, menuOpacity]);

  const animatedMenuStyle = useAnimatedStyle(() => ({
    opacity: menuOpacity.value,
    transform: [{ scale: menuScale.value }],
  }));

  const handleDifficultySelect = (difficulty: Difficulty) => {
    onSelect(difficulty);
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      {/* Full-screen blur overlay */}
      <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill}>
        <Pressable style={styles.overlayPressable} onPress={onDismiss} />
      </BlurView>

      {/* Anchor container - positioned at bottom-right, same as button */}
      <View
        style={[
          styles.anchorContainer,
          { bottom: insets.bottom + LAYOUT.bottomOffset },
        ]}
      >
        {/* Animated menu - scales from bottom-right due to flex alignment */}
        <Animated.View style={[styles.menuWrapper, animatedMenuStyle]}>
          <View style={styles.menu}>
            {DIFFICULTIES.map((difficulty, index) => (
              <DifficultyRow
                key={difficulty}
                difficulty={difficulty}
                index={index}
                isVisible={isOpen}
                isLast={index === DIFFICULTIES.length - 1}
                onPress={() => handleDifficultySelect(difficulty)}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayPressable: {
    flex: 1,
  },
  anchorContainer: {
    position: 'absolute',
    right: LAYOUT.horizontalPadding,
    // Flex alignment makes content anchor to bottom-right
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  menuWrapper: {
    // Transform origin simulation: content naturally anchors bottom-right
    // due to parent's flex alignment
  },
  menu: {
    padding: LAYOUT.unfurlPadding,
    gap: LAYOUT.rowGap,
    minWidth: 260,
  },
});
