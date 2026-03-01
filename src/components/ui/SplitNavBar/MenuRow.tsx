// Individual menu row for the secondary menu
// Shows label with icon (mochi SVG for difficulty items, Feather icon for others)

import React, { useCallback } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/src/theme/colors';
import { fontFamilies } from '@/src/theme/typography';
import { playFeedback } from '@/src/utils/feedback';
import { Difficulty, GAME_BASE_MOCHIS } from '@/src/engine/types';
import { MenuRowProps } from './types';
import MochiPointIcon from '../../../../assets/images/icons/mochi-point.svg';

const MOCHI_ICONS: Record<Difficulty, ImageSource> = {
  easy:   require('../../../../assets/images/mochi/mochi-easy.png'),
  medium: require('../../../../assets/images/mochi/mochi-medium.png'),
  hard:   require('../../../../assets/images/mochi/mochi-hard.png'),
  expert: require('../../../../assets/images/mochi/mochi-expert.png'),
};

const ACTION_MOCHI_ICONS: Record<string, ImageSource> = {
  quit_game:     require('../../../../assets/images/mochi/mochi-quit.png'),
  continue_game: require('../../../../assets/images/mochi/mochi-happy.png'),
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
  const mochisRewardLabel = item.difficulty ? `${GAME_BASE_MOCHIS[item.difficulty]}+` : null;
  const isPressed = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    isPressed.value = withTiming(1, { duration: PRESS_DURATION });
  }, [isPressed]);

  const handlePressOut = useCallback(() => {
    isPressed.value = withTiming(0, { duration: PRESS_DURATION });
  }, [isPressed]);

  const handlePress = useCallback(() => {
    playFeedback('tapHeavy');
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
      <View style={styles.iconContainer}>
        {(() => {
          const mochiSource = item.difficulty
            ? MOCHI_ICONS[item.difficulty]
            : ACTION_MOCHI_ICONS[item.action];
          return mochiSource
            ? <Image source={mochiSource} style={{ width: 55, height: 55 }} contentFit="contain" />
            : null;
        })()}
      </View>
      {/* menu item label + mochis reward */}
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{item.label}</Text>
        {mochisRewardLabel != null && (
          <View style={styles.rewardRow}>
            <Text style={styles.rewardText}>earn {mochisRewardLabel} mochis</Text>
            <MochiPointIcon width={20} height={20} />
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
    fontFamily: fontFamilies.medium,
    color: colors.textPrimary,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardText: {
    fontSize: 16,
    fontFamily: fontFamilies.medium,
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
