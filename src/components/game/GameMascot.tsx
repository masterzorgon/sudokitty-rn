// GameMascot - Mascot with contextual speech bubble for game screen
// Presentational component - receives message as prop from parent

import React, { memo, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import { MochiCat } from '../home/MochiCat';
import { GAME_LAYOUT } from '../../constants/layout';
import { SpeechBubble } from '../ui/Typography/SpeechBubble';

interface GameMascotProps {
  message: string | null;
  maxLines?: number;
  flexibleHeight?: boolean;
  skipEntering?: boolean;
}

export const GameMascot = memo(function GameMascot({
  message,
  maxLines = 2,
  flexibleHeight = false,
  skipEntering = false,
}: GameMascotProps) {
  const [displayMessage, setDisplayMessage] = useState(message ?? '');
  const textOpacity = useSharedValue(message ? 1 : 0);

  useEffect(() => {
    if (!message) {
      textOpacity.value = withTiming(0, { duration: 80 });
      return;
    }

    if (!displayMessage || message === displayMessage) {
      setDisplayMessage(message);
      textOpacity.value = 1;
      return;
    }

    textOpacity.value = withTiming(0, { duration: 60 }, (finished) => {
      if (finished) {
        runOnJS(setDisplayMessage)(message);
        textOpacity.value = withTiming(1, { duration: 90 });
      }
    });
  }, [message, displayMessage, textOpacity]);

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ scale: 0.985 + textOpacity.value * 0.015 }],
  }));

  const bubbleWrapperStyle = flexibleHeight ? styles.bubbleWrapperFlexible : styles.bubbleWrapper;

  return (
    <Animated.View
      entering={skipEntering ? undefined : FadeIn.duration(400).delay(200)}
      style={[styles.container, flexibleHeight && styles.containerFlexible]}
    >
      <View style={styles.mascotWrapper}>
        <MochiCat size={GAME_LAYOUT.MASCOT_SIZE} variant="game" />
      </View>

      <View style={styles.bubbleContainer}>
        {message && (
          <Animated.View style={bubbleWrapperStyle}>
            <SpeechBubble
              text={displayMessage}
              pointerDirection="left"
              pointerPosition={0.9}
              maxLines={flexibleHeight ? undefined : (maxLines || undefined)}
              scrollable={flexibleHeight}
              contentContainerStyle={animatedTextStyle}
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
