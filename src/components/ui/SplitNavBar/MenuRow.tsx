// Individual menu row for the secondary menu
// Shows label with icon (mochi SVG for difficulty items, Feather icon for others)

import React, { useCallback } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { SvgProps } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/src/theme/colors';
import { triggerHaptic, ImpactFeedbackStyle } from '@/src/utils/haptics';
import { Difficulty, GAME_BASE_MOCHIS } from '@/src/engine/types';
import { MenuRowProps, LAYOUT } from './types';
import MochiPointIcon from '../../../../assets/images/icons/mochi-point.svg';

// Import mochi SVG characters for difficulty levels
import MochiEasy from '../../../../assets/images/mochi/mochi-easy.svg';
import MochiMedium from '../../../../assets/images/mochi/mochi-medium.svg';
import MochiHard from '../../../../assets/images/mochi/mochi-hard.svg';
import MochiExpert from '../../../../assets/images/mochi/mochi-expert.svg';
// Import mochi SVG characters for resume menu actions
import MochiQuit from '../../../../assets/images/mochi/mochi-quit.svg';
import MochiResume from '../../../../assets/images/mochi/mochi-resume.svg';

// Mapping from difficulty to mochi SVG component
const MOCHI_ICONS: Record<Difficulty, React.FC<SvgProps>> = {
  easy: MochiEasy,
  medium: MochiMedium,
  hard: MochiHard,
  expert: MochiExpert,
};

// Mapping from menu action to mochi SVG component
const ACTION_MOCHI_ICONS: Record<string, React.FC<SvgProps>> = {
  quit_game: MochiQuit,
  continue_game: MochiResume,
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
  const maxMochis = item.difficulty ? GAME_BASE_MOCHIS[item.difficulty] * 2 : null;
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
      {/* menu item icon - mochi SVG for all items */}
      <View style={styles.iconContainer}>
        {(() => {
          // Use difficulty mochi icon if available, otherwise use action mochi icon
          const MochiIcon = item.difficulty
            ? MOCHI_ICONS[item.difficulty]
            : ACTION_MOCHI_ICONS[item.action];
          return MochiIcon ? <MochiIcon width={55} height={55} /> : null;
        })()}
      </View>
      {/* menu item label + mochi reward */}
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{item.label}</Text>
        {maxMochis != null && (
          <View style={styles.rewardRow}>
            <MochiPointIcon width={24} height={24} />
            <Text style={styles.rewardText}>{maxMochis} mochis</Text>
          </View>
        )}
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
    gap: 2,
  },
  label: {
    fontSize: 29,
    fontFamily: 'Pally-Medium',
    color: colors.textPrimary,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rewardText: {
    fontSize: 16,
    fontFamily: 'Pally-Medium',
    color: colors.textSecondary,
  },
  iconContainer: {
    marginLeft: 12,
    marginRight: 12,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
});
