// Individual menu row for the secondary menu
// Shows label with icon (mochi SVG for difficulty items, Feather icon for others)

import React, { useCallback } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SvgProps } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/src/theme/colors';
import { triggerHaptic, ImpactFeedbackStyle } from '@/src/utils/haptics';
import { Difficulty } from '@/src/engine/types';
import { MenuRowProps, LAYOUT } from './types';

// Import mochi SVG characters for difficulty levels
import MochiEasy from '../../../../assets/images/mochi/mochi-easy.svg';
import MochiMedium from '../../../../assets/images/mochi/mochi-medium.svg';
import MochiHard from '../../../../assets/images/mochi/mochi-hard.svg';
import MochiExpert from '../../../../assets/images/mochi/mochi-expert.svg';

// Mapping from difficulty to mochi SVG component
const MOCHI_ICONS: Record<Difficulty, React.FC<SvgProps>> = {
  easy: MochiEasy,
  medium: MochiMedium,
  hard: MochiHard,
  expert: MochiExpert,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PRESS_DURATION = 120;

export function MenuRow({
  item,
  index,
  onPress,
  isVisible,
  isLast,
}: MenuRowProps) {
  const isPressed = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    isPressed.value = withTiming(1, { duration: PRESS_DURATION });
  }, [isPressed]);

  const handlePressOut = useCallback(() => {
    isPressed.value = withTiming(0, { duration: PRESS_DURATION });
  }, [isPressed]);

  const handlePress = useCallback(() => {
    triggerHaptic(ImpactFeedbackStyle.Medium);
    onPress();
  }, [onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor:
      isPressed.value === 1 ? 'rgba(245, 237, 229, 0.5)' : 'transparent',
  }));

  if (!isVisible) return null;

  return (
    <AnimatedPressable
      style={[styles.row, animatedStyle, isLast && styles.lastRow]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      {/* menu item icon - mochi SVG for difficulty items, Feather icon for others */}
      <View style={styles.iconContainer}>
        {item.difficulty ? (
          // Render mochi SVG for difficulty items
          (() => {
            const MochiIcon = MOCHI_ICONS[item.difficulty];
            return <MochiIcon width={55} height={55} />;
          })()
        ) : (
          // Render Feather icon for non-difficulty items (continue playing, quit game)
          <Feather
            name={item.icon as keyof typeof Feather.glyphMap}
            size={55}
            color={colors.softOrange}
          />
        )}
      </View>
      {/* menu item label */}
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{item.label}</Text>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 0,
    paddingVertical: 12,
    paddingHorizontal: 1,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gridLine,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 29,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  iconContainer: {
    marginLeft: 12,
    marginRight: 12,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
});
