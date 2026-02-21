// ChatBubble - Speech bubble with Japanese greeting
// Uses SpeechBubble component with upward-pointing tail

import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { spacing } from '../../theme';
import { fontFamilies } from '../../theme/typography';
import { colors } from '../../theme/colors';
import { SpeechBubble } from '../ui/SpeechBubble';

interface ChatBubbleProps {
  text?: string;
  appearDelay?: number;
}

const DEFAULT_TEXT = 'こんにちは！';

export function ChatBubble({
  text = DEFAULT_TEXT,
  appearDelay = 600,
}: ChatBubbleProps) {
  return (
    <Animated.View
      entering={FadeInUp.delay(appearDelay).duration(400).springify()}
      style={styles.container}
    >
      <SpeechBubble
        text={text}
        pointerDirection="up"
        style={styles.bubble}
        textStyle={styles.bubbleText}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  bubble: {
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  bubbleText: {
    fontFamily: fontFamilies.bold,
    fontSize: 28,
    color: colors.textSecondary,
  },
});
