// Individual menu row for the secondary menu
// Shows label with mochi SVG icons for all menu items

import React, { useCallback } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { SvgProps } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors } from '@/src/theme/colors';
import { Difficulty } from '@/src/engine/types';
import { MenuRowProps, LAYOUT } from './types';

// Import mochi SVG characters for difficulty levels
import MochiEasy from '../../../../assets/images/mochi/mochi-easy.svg';
import MochiMedium from '../../../../assets/images/mochi/mochi-medium.svg';
import MochiHard from '../../../../assets/images/mochi/mochi-hard.svg';
import MochiExpert from '../../../../assets/images/mochi/mochi-expert.svg';

// Import mochi SVG characters for action items
import MochiResume from '../../../../assets/images/mochi/mochi-resume.svg';
import MochiQuit from '../../../../assets/images/mochi/mochi-quit.svg';

// Mapping from difficulty to mochi SVG component
const MOCHI_DIFFICULTY_ICONS: Record<Difficulty, React.FC<SvgProps>> = {
  easy: MochiEasy,
  medium: MochiMedium,
  hard: MochiHard,
  expert: MochiExpert,
};

// Mapping from action to mochi SVG component
const MOCHI_ACTION_ICONS: Record<'continue_game' | 'quit_game', React.FC<SvgProps>> = {
  continue_game: MochiResume,
  quit_game: MochiQuit,
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
          // Determine which mochi icon to use
          let MochiIcon: React.FC<SvgProps>;
          
          if (item.difficulty) {
            // Difficulty items use difficulty icons
            MochiIcon = MOCHI_DIFFICULTY_ICONS[item.difficulty];
          } else if (item.action === 'continue_game' || item.action === 'quit_game') {
            // Action items use action icons
            MochiIcon = MOCHI_ACTION_ICONS[item.action];
          } else {
            // Fallback (should not happen)
            return null;
          }
          
          return <MochiIcon width={55} height={55} />;
        })()}
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
