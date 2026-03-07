// GameMascot - Mascot with contextual speech bubble for game screen
// Presentational component - receives message as prop from parent

import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { MochiCat } from '../home/MochiCat';
import { GAME_LAYOUT } from '../../constants/layout';
import { SpeechBubble } from '../ui/Typography/SpeechBubble';

const BubbleEntering = () => {
  'worklet';
  const initialValues = {
    opacity: 0,
    transform: [{ scale: 0.85 }],
  };
  const animations = {
    opacity: withTiming(1, { duration: 100 }),
    transform: [
      { scale: withSpring(1, { damping: 50, stiffness: 400 }) },
    ],
  };
  return { initialValues, animations };
};

const BubbleExiting = () => {
  'worklet';
  const initialValues = {
    opacity: 1,
    transform: [{ scale: 1 }],
  };
  const animations = {
    opacity: withTiming(0, { duration: 100 }),
    transform: [
      { scale: withTiming(0.8, { duration: 100 }) },
    ],
  };
  return { initialValues, animations };
};

interface GameMascotProps {
  message: string | null;
  maxLines?: number;
  flexibleHeight?: boolean;
}

export const GameMascot = memo(function GameMascot({ message, maxLines = 2, flexibleHeight = false }: GameMascotProps) {
  return (
    <Animated.View 
      entering={FadeIn.duration(400).delay(200)}
      style={[styles.container, flexibleHeight && styles.containerFlexible]}
    >
      <View style={styles.mascotWrapper}>
        <MochiCat size={GAME_LAYOUT.MASCOT_SIZE} variant="game" />
      </View>

      <View style={styles.bubbleContainer}>
        {message && (
          <Animated.View
            key={message}
            entering={BubbleEntering}
            exiting={BubbleExiting}
            style={flexibleHeight ? styles.bubbleWrapperFlexible : styles.bubbleWrapper}
          >
            <SpeechBubble
              text={message}
              pointerDirection="left"
              pointerPosition={0.9}
              maxLines={flexibleHeight ? undefined : (maxLines || undefined)}
              scrollable={flexibleHeight}
            />
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: GAME_LAYOUT.MASCOT_ZONE_HEIGHT,
    paddingLeft: GAME_LAYOUT.SCREEN_PADDING,
  },
  containerFlexible: {
    height: undefined,
    minHeight: GAME_LAYOUT.MASCOT_ZONE_HEIGHT,
    alignItems: 'flex-end',
  },
  mascotWrapper: {
    marginLeft: -10,
    marginRight: 15,
    top: 12 + GAME_LAYOUT.MASCOT_SIZE * 0.1, // 10% lower (12 + 12 = 24)
  },
  bubbleContainer: {
    flex: 1,
    justifyContent: 'center',
    overflow: 'visible',
  },
  bubbleWrapper: {
    alignSelf: 'flex-start',
    marginBottom: GAME_LAYOUT.MASCOT_SIZE * 0.15,
  },
  bubbleWrapperFlexible: {
    alignSelf: 'stretch',
    maxHeight: 150,
    marginBottom: GAME_LAYOUT.MASCOT_SIZE * 0.15,
  },
});
