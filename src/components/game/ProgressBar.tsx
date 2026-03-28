// Progress bar component - displays game completion progress
import React, { useCallback, useEffect, useRef, useMemo } from "react";
import { View, StyleSheet, Text, Pressable, LayoutChangeEvent } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  useDerivedValue,
  withSpring,
  withTiming,
  SharedValue,
} from "react-native-reanimated";
import { Canvas, Circle } from "@shopify/react-native-skia";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useProgress } from "../../stores/gameStore";
import { colors, useColors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { borderRadius } from "../../theme";
import { RollingNumber } from "../ui";
import { GAME_LAYOUT } from "../../constants/layout";

// Individual particle component that reads from shared values
interface ParticleProps {
  x: SharedValue<number>;
  y: SharedValue<number>;
  opacity: SharedValue<number>;
  radius: number;
  color: string;
}

const Particle = ({ x, y, opacity, radius, color }: ParticleProps) => {
  const cx = useDerivedValue(() => x.value);
  const cy = useDerivedValue(() => y.value);
  const op = useDerivedValue(() => opacity.value);

  return <Circle cx={cx} cy={cy} r={radius} color={color} opacity={op} />;
};

interface ProgressBarProps {
  onBack: () => void;
  /** Callback when settings button is pressed */
  onSettingsPress?: () => void;
}

export const ProgressBar = ({ onBack, onSettingsPress }: ProgressBarProps) => {
  const c = useColors();
  const progress = useProgress();
  const percentage = Math.round(progress * 100);
  /** Narrow digit strip (1–3 slots) keeps the value next to “%” instead of a wide odometer gap */
  const percentMaxDigits = percentage >= 100 ? 3 : percentage >= 10 ? 2 : 1;

  // Animated progress value for smooth transitions
  const animatedProgress = useSharedValue(percentage);

  // Track bar width for particle positioning
  const barWidth = useRef(0);
  const prevPercentage = useRef(percentage);

  // Particle shared values - must be at top level (not in useMemo)
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
  const p5x = useSharedValue(0);
  const p5y = useSharedValue(0);
  const p5opacity = useSharedValue(0);

  // Particle colors from accent palette (inside component for theme support)
  const particleColors = useMemo(
    () => [c.accent, c.ctaPrimaryHighlight, c.accentLight, c.accentSecondary],
    [c.accent, c.ctaPrimaryHighlight, c.accentLight, c.accentSecondary],
  );

  // Particle pool referencing the shared values
  const particles = useMemo(
    () => [
      { x: p0x, y: p0y, opacity: p0opacity, radius: 2.5, color: particleColors[0] },
      { x: p1x, y: p1y, opacity: p1opacity, radius: 3.0, color: particleColors[1] },
      { x: p2x, y: p2y, opacity: p2opacity, radius: 2.2, color: particleColors[2] },
      { x: p3x, y: p3y, opacity: p3opacity, radius: 2.8, color: particleColors[3] },
      { x: p4x, y: p4y, opacity: p4opacity, radius: 2.4, color: particleColors[0] },
      { x: p5x, y: p5y, opacity: p5opacity, radius: 3.2, color: particleColors[1] },
    ],
    // SharedValue refs are stable for the component lifetime; only theme colors change.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- particle SVs intentionally omitted
    [particleColors],
  );

  // Spawn particles in a radial spray from the right edge of the progress fill
  const spawnParticles = useCallback(() => {
    const barHeight = GAME_LAYOUT.PROGRESS_BAR_HEIGHT;
    const fillWidth = (percentage / 100) * barWidth.current;
    const startX = fillWidth - 5;
    const centerY = barHeight / 2;

    // Spray cone: -70° to +70° from horizontal (right-facing)
    const spreadAngle = Math.PI * 0.39; // ~70 degrees in radians
    const particleCount = particles.length;

    particles.forEach((p, i) => {
      // Distribute angles evenly across the spray cone, with slight randomness
      const baseAngle = -spreadAngle + (2 * spreadAngle * i) / (particleCount - 1);
      const angle = baseAngle + (Math.random() - 0.5) * 0.3; // Add jitter

      // Random travel distance for varied spray depth
      const distance = 18 + Math.random() * 14; // 18-32px

      // Calculate end position using polar coordinates
      const endX = startX + Math.cos(angle) * distance;
      const endY = centerY + Math.sin(angle) * distance;

      // Stagger timing slightly for burst effect
      const delay = Math.random() * 15;

      // Reset to starting position
      p.x.value = startX;
      p.y.value = centerY;
      p.opacity.value = 1;

      // Animate outward in spray pattern with fade
      setTimeout(() => {
        p.x.value = withTiming(endX, { duration: 400 });
        p.y.value = withTiming(endY, { duration: 400 });
        p.opacity.value = withTiming(0, { duration: 400 });
      }, delay);
    });
  }, [percentage, particles]);

  // Update animated value when percentage changes
  useEffect(() => {
    animatedProgress.value = withSpring(percentage, {
      damping: 200,
      stiffness: 1000,
    });

    // Spawn particles only when progress increases
    if (percentage > prevPercentage.current && barWidth.current > 0) {
      spawnParticles();
    }
    prevPercentage.current = percentage;
  }, [percentage, animatedProgress, spawnParticles]);

  // Animated style for the fill width
  const animatedFillStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value}%`,
  }));

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={onBack}>
        <Ionicons name="chevron-back" size={24} color={colors.textSecondary} />
      </Pressable>

      <View
        style={styles.barContainer}
        onLayout={(e: LayoutChangeEvent) => {
          barWidth.current = e.nativeEvent.layout.width - 8; // Account for paddingHorizontal
        }}
      >
        <View style={styles.barWrapper}>
          <View style={styles.barBackground}>
            <Animated.View
              style={[styles.barFill, { backgroundColor: c.accent }, animatedFillStyle]}
            >
              {/* Middle highlight layer - slightly lighter, inset 2px */}
              <View style={[styles.barFillMiddle, { backgroundColor: c.ctaPrimaryHighlight }]} />
              {/* Top gloss layer - lightest, thin strip near top */}
              <View style={[styles.barFillGloss, { backgroundColor: c.accentLight }]} />
            </Animated.View>
          </View>
          {/* Particle canvas overlay - outside overflow:hidden */}
          <Canvas style={styles.particleCanvas} pointerEvents="none">
            {particles.map((p, i) => (
              <Particle
                key={i}
                x={p.x}
                y={p.y}
                opacity={p.opacity}
                radius={p.radius}
                color={p.color}
              />
            ))}
          </Canvas>
        </View>
      </View>

      <View style={styles.percentageContainer}>
        <RollingNumber
          value={percentage}
          fontSize={20}
          color={colors.textLight}
          textStyle={typography.caption}
          maxDigits={percentMaxDigits}
          digitsAlign="end"
        />
        <Text style={styles.percentSign}>%</Text>
      </View>

      {onSettingsPress && (
        <Pressable onPress={onSettingsPress} hitSlop={12} style={styles.settingsButton}>
          <Feather name="settings" size={24} color={colors.textSecondary} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    paddingHorizontal: GAME_LAYOUT.SCREEN_PADDING,
  },
  backButton: {
    marginRight: 8,
  },
  barContainer: {
    flex: 1,
    paddingHorizontal: 4,
  },
  barWrapper: {
    position: "relative",
    overflow: "visible", // Allow particles to escape wrapper
  },
  barBackground: {
    height: GAME_LAYOUT.PROGRESS_BAR_HEIGHT,
    backgroundColor: colors.progressBarBg,
    borderRadius: borderRadius.full,
    overflow: "hidden", // Clip the fill bar
  },
  particleCanvas: {
    position: "absolute",
    top: 0,
    left: 0,
    right: -40, // Extend right for particles
    bottom: 0,
    zIndex: 10,
  },
  barFill: {
    height: "100%",
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  barFillMiddle: {
    position: "absolute",
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderRadius: borderRadius.full,
  },
  barFillGloss: {
    position: "absolute",
    top: 3,
    left: 10,
    right: 10,
    height: 5,
    borderRadius: 2,
  },
  percentageContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "flex-end",
    gap: 2,
    flexShrink: 0,
    minWidth: 36,
  },
  percentSign: {
    ...typography.caption,
    color: colors.textLight,
    fontSize: 20,
  },
  settingsButton: {
    padding: 4,
    marginLeft: 8,
  },
});
