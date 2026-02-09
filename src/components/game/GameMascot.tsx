// GameMascot - Mascot with contextual speech bubble for game screen
// Presentational component - receives message as prop from parent

import React, { useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  FadeIn,
  withSpring,
  withTiming,
  useSharedValue,
  useDerivedValue,
  SharedValue,
} from 'react-native-reanimated';
import { Canvas, Circle } from '@shopify/react-native-skia';

import { MochiCat } from '../home/MochiCat';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { GAME_LAYOUT } from '../../constants/layout';

// MARK: - Puff Particle Constants

const PUFF_COLORS = ['#FFB088', '#FFCBA4', '#FFE4D6', '#FFA07A', '#FFD4B8'];

// MARK: - Puff Particle Component

interface PuffParticleProps {
  x: SharedValue<number>;
  y: SharedValue<number>;
  opacity: SharedValue<number>;
  radius: number;
  color: string;
}

const PuffParticle = ({ x, y, opacity, radius, color }: PuffParticleProps) => {
  const cx = useDerivedValue(() => x.value);
  const cy = useDerivedValue(() => y.value);
  const op = useDerivedValue(() => opacity.value);
  return <Circle cx={cx} cy={cy} r={radius} color={color} opacity={op} />;
};

// MARK: - Animations

// Snappy enter - quick pop with minimal bounce
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

// Quick exit - fast scale down
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

// MARK: - Types

interface GameMascotProps {
  /** The contextual message to display in the speech bubble (null = no bubble) */
  message: string | null;
  /** Max number of lines for the bubble text (default: 2). Set to undefined for unlimited. */
  maxLines?: number;
  /** Whether the mascot zone height should be flexible (default: false = fixed 100px) */
  flexibleHeight?: boolean;
}

// MARK: - Component

export const GameMascot = memo(function GameMascot({ message, maxLines = 2, flexibleHeight = false }: GameMascotProps) {
  // Puff particle shared values - declared at top level for fixed allocation
  const p0x = useSharedValue(0);
  const p0y = useSharedValue(0);
  const p0opacity = useSharedValue(0);
  const p1x = useSharedValue(0);
  const p1y = useSharedValue(0);
  const p1opacity = useSharedValue(0);
  const p2x = useSharedValue(0);
  const p2y = useSharedValue(0);
  const p2opacity = useSharedValue(0);
  const p3x = useSharedValue(0);
  const p3y = useSharedValue(0);
  const p3opacity = useSharedValue(0);
  const p4x = useSharedValue(0);
  const p4y = useSharedValue(0);
  const p4opacity = useSharedValue(0);

  // Fixed particle pool - no runtime allocations
  const puffParticles = useMemo(() => [
    { x: p0x, y: p0y, opacity: p0opacity, radius: 5, color: PUFF_COLORS[0] },
    { x: p1x, y: p1y, opacity: p1opacity, radius: 4.5, color: PUFF_COLORS[1] },
    { x: p2x, y: p2y, opacity: p2opacity, radius: 5.5, color: PUFF_COLORS[2] },
    { x: p3x, y: p3y, opacity: p3opacity, radius: 4, color: PUFF_COLORS[3] },
    { x: p4x, y: p4y, opacity: p4opacity, radius: 5, color: PUFF_COLORS[4] },
  ], []);

  // Track previous message for spawn detection
  const prevMessageRef = useRef<string | null>(null);

  // Memoized spawn function - no setTimeout, all particles animate simultaneously
  const spawnPuffParticles = useCallback(() => {
    const centerX = 80; // Approximate bubble center X
    const centerY = 30; // Approximate bubble center Y

    puffParticles.forEach((p, i) => {
      // Evenly distribute angles with slight randomness
      const baseAngle = (i / puffParticles.length) * Math.PI * 2;
      const angle = baseAngle + (Math.random() - 0.5) * 0.4;
      const distance = 35 + Math.random() * 20;
      const duration = 250 + Math.random() * 60; // Randomize duration instead of stagger

      const endX = centerX + Math.cos(angle) * distance;
      const endY = centerY + Math.sin(angle) * distance;

      // Reset to center
      p.x.value = centerX;
      p.y.value = centerY;
      p.opacity.value = 0.8;

      // Animate outward - all start simultaneously
      p.x.value = withTiming(endX, { duration });
      p.y.value = withTiming(endY, { duration });
      p.opacity.value = withTiming(0, { duration });
    });
  }, [puffParticles]);

  // Trigger puff particles when message appears or changes
  useEffect(() => {
    if (message && message !== prevMessageRef.current) {
      spawnPuffParticles();
    }
    prevMessageRef.current = message;
  }, [message, spawnPuffParticles]);

  return (
    <Animated.View 
      entering={FadeIn.duration(400).delay(200)}
      style={[styles.container, flexibleHeight && styles.containerFlexible]}
    >
      {/* MochiCat on the left */}
      <View style={styles.mascotWrapper}>
        <MochiCat size={GAME_LAYOUT.MASCOT_SIZE} animate={true} />
      </View>

      {/* Speech bubble on the right - only shown when message exists */}
      <View style={styles.bubbleContainer}>
        {/* Puff particles canvas - renders behind bubble */}
        <Canvas style={styles.puffCanvas} pointerEvents="none">
          {puffParticles.map((p, i) => (
            <PuffParticle
              key={i}
              x={p.x}
              y={p.y}
              opacity={p.opacity}
              radius={p.radius}
              color={p.color}
            />
          ))}
        </Canvas>

        {message && (
          <Animated.View
            key={message}
            entering={BubbleEntering}
            exiting={BubbleExiting}
            style={styles.bubble}
          >
            {/* Tail pointing left toward the cat - border layer then fill layer */}
            <View style={styles.bubbleTailBorder} />
            <View style={styles.bubbleTail} />
            <Text style={styles.bubbleText} numberOfLines={maxLines || undefined}>
              {message}
            </Text>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
});

// MARK: - Styles

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: GAME_LAYOUT.MASCOT_ZONE_HEIGHT,
    paddingHorizontal: GAME_LAYOUT.SCREEN_PADDING,
  },
  containerFlexible: {
    height: undefined,
    minHeight: GAME_LAYOUT.MASCOT_ZONE_HEIGHT,
    alignItems: 'flex-end', // Pin children to bottom so cat stays anchored
  },
  mascotWrapper: {
    // Slight negative margin to overlap the mascot slightly
    marginLeft: -10,
    marginRight: 15,
  },
  bubbleContainer: {
    flex: 1,
    justifyContent: 'center',
    overflow: 'visible',
  },
  puffCanvas: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    zIndex: -1,
  },
  bubble: {
    alignSelf: 'flex-start', // Shrink-wrap to content
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.gridLine,
    // Subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleTailBorder: {
    position: 'absolute',
    left: -10,
    top: '90%',
    marginTop: -9,
    width: 0,
    height: 0,
    borderTopWidth: 9,
    borderBottomWidth: 9,
    borderRightWidth: 11,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: colors.gridLine, // Border color
  },
  bubbleTail: {
    position: 'absolute',
    left: -8,
    top: '90%',
    marginTop: -8,
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderRightWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: colors.cardBackground, // Fill color
  },
  bubbleText: {
    ...typography.body,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
});
