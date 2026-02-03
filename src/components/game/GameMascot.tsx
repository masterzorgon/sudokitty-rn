// GameMascot - Mascot with contextual speech bubble for game screen
// Presentational component - receives message as prop from parent

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { MochiCat } from '../home/MochiCat';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { GAME_LAYOUT } from '../../constants/layout';

// MARK: - Types

interface GameMascotProps {
  /** The contextual message to display in the speech bubble */
  message: string;
}

// MARK: - Component

export function GameMascot({ message }: GameMascotProps) {
  return (
    <Animated.View 
      entering={FadeIn.duration(400).delay(200)}
      style={styles.container}
    >
      {/* MochiCat on the left */}
      <View style={styles.mascotWrapper}>
        <MochiCat size={GAME_LAYOUT.MASCOT_SIZE} animate={true} />
      </View>

      {/* Speech bubble on the right */}
      <View style={styles.bubbleContainer}>
        <View style={styles.bubble}>
          {/* Tail pointing left toward the cat */}
          <View style={styles.bubbleTail} />
          <Text style={styles.bubbleText} numberOfLines={2}>
            {message}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

// MARK: - Styles

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: GAME_LAYOUT.MASCOT_ZONE_HEIGHT,
    paddingHorizontal: GAME_LAYOUT.SCREEN_PADDING,
  },
  mascotWrapper: {
    // Slight negative margin to overlap the mascot slightly
    marginLeft: -10,
    marginRight: 15,
  },
  bubbleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  bubble: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingLeft: 20, // Extra padding on left for tail
    borderWidth: 1,
    borderColor: colors.gridLine,
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleTail: {
    position: 'absolute',
    left: -8,
    top: '50%',
    marginTop: -8,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: colors.cardBackground,
  },
  bubbleText: {
    ...typography.body,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
