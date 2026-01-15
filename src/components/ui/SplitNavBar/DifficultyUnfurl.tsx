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

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

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
      // Scale up from 0 → 1 (200ms ease-out)
      menuScale.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
      menuOpacity.value = withTiming(1, { duration: 200 });
    } else {
      // Scale down 1 → 0 (150ms ease-in)
      menuScale.value = withTiming(0, {
        duration: 150,
        easing: Easing.in(Easing.ease),
      });
      menuOpacity.value = withTiming(0, { duration: 150 });
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

      {/* Menu container */}
      <Animated.View
        style={[
          styles.menuContainer,
          animatedMenuStyle,
          { bottom: insets.bottom + LAYOUT.bottomOffset + 70 },
        ]}
      >
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayPressable: {
    flex: 1,
  },
  menuContainer: {
    position: 'absolute',
    right: LAYOUT.horizontalPadding,
  },
  menu: {
    padding: LAYOUT.unfurlPadding,
    gap: LAYOUT.rowGap,
    minWidth: 260,
  },
});
