// ChatBubble - Speech bubble with Japanese greeting
// Uses custom SVG for seamless bubble + tail design

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { spacing } from '../../theme';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';

// SVG import - the bubble shape with tail pointing up
import ChatBubbleSvg from '../../../assets/images/chat-bubble.svg';

// MARK: - Types

interface ChatBubbleProps {
  // Text to display in the bubble
  text?: string;
  // Delay before the bubble appears (ms)
  appearDelay?: number;
}

// MARK: - Constants

const DEFAULT_TEXT = 'こんにちは！';

// SVG bubble dimensions (from the SVG viewBox)
const BUBBLE_WIDTH = 241;
const BUBBLE_HEIGHT = 87;

// Content area within the bubble body (y=17 to y=85, height=68)
const BODY_TOP = 17;
const BODY_HEIGHT = 68;

// MARK: - Component

export function ChatBubble({
  text = DEFAULT_TEXT,
  appearDelay = 600,
}: ChatBubbleProps) {
  // MARK: - Render

  return (
    <Animated.View
      entering={FadeInUp.delay(appearDelay).duration(400).springify()}
      style={styles.container}
    >
      <View style={styles.bubbleWrapper}>
        {/* SVG bubble background */}
        <ChatBubbleSvg
          width={BUBBLE_WIDTH}
          height={BUBBLE_HEIGHT}
          style={StyleSheet.absoluteFill}
        />

        {/* Text content centered in the bubble body */}
        <View style={styles.contentContainer}>
          <Text style={styles.bubbleText}>{text}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// MARK: - Styles

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  bubbleWrapper: {
    width: BUBBLE_WIDTH,
    height: BUBBLE_HEIGHT,
    position: 'relative',
  },
  contentContainer: {
    position: 'absolute',
    top: BODY_TOP,
    left: 0,
    right: 0,
    height: BODY_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleText: {
    fontFamily: fontFamilies.bold,
    fontSize: 28,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
