// ChatBubble - Speech bubble with dynamic random welcome messages
// Uses SpeechBubble component with upward-pointing tail

import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { spacing } from '../../theme';
import { fontFamilies } from '../../theme/typography';
import { colors } from '../../theme/colors';
import { SpeechBubble } from '../ui/SpeechBubble';
import { getRandomWelcomeMessage } from '../../constants/welcomeMessages';

interface ChatBubbleProps {
  appearDelay?: number;
}

export function ChatBubble({
  appearDelay = 600,
}: ChatBubbleProps) {
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    getRandomWelcomeMessage().then(setMessage);
  }, []);

  if (!message) return null;

  return (
    <Animated.View
      entering={FadeInUp.delay(appearDelay).duration(400).springify()}
      style={styles.container}
    >
      <SpeechBubble
        text={message}
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
  bubble: {},
  bubbleText: {
    fontFamily: fontFamilies.medium,
    fontSize: 20,
    color: '#8b7878',
    paddingVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    lineHeight: 24,
  },
});
