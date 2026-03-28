import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, type LayoutChangeEvent, type ViewStyle } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../../theme/colors";
import { fontFamilies } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme";
import type { CustomSkeuColors } from "../ui/Skeuomorphic";
import { SkeuButton } from "../ui/Skeuomorphic";

const PILL_HEIGHT = 34;
const ICON_SIZE = 18;
const ICON_CIRCLE_SIZE = 26;
const FONT_SIZE = 14;

export interface LevelProgressPillProps {
  level: number;
  currentXP: number;
  xpThreshold: number;
  progressFraction: number;
  onPress: () => void;
}

export function LevelProgressPill({
  level,
  currentXP,
  xpThreshold,
  progressFraction,
  onPress,
}: LevelProgressPillProps) {
  const c = useColors();
  const borderColor = c.levelPillBorder as string;
  const textColor = c.levelPillText as string;

  const [pillWidth, setPillWidth] = useState(0);
  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setPillWidth(e.nativeEvent.layout.width);
  }, []);

  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withSpring(progressFraction * pillWidth, {
      damping: 20,
      stiffness: 120,
    });
  }, [progressFraction, pillWidth, animatedWidth]);

  const fillStyle = useAnimatedStyle(() => ({
    width: animatedWidth.value,
  }));

  const skeuColors: CustomSkeuColors = {
    gradient: [c.cream, c.cream, c.cream] as readonly [string, string, string],
    edge: borderColor + "99",
    borderLight: "rgba(255, 255, 255, 0.4)",
    borderDark: borderColor + "99",
    textColor,
  };

  const faceStyle: ViewStyle = {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: spacing.sm,
    height: PILL_HEIGHT,
  };

  const iconCircleStyle = {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: ICON_CIRCLE_SIZE / 2,
    backgroundColor: borderColor + "50",
  };

  return (
    <SkeuButton
      onPress={onPress}
      customColors={skeuColors}
      borderRadius={borderRadius.full}
      style={styles.container}
      contentStyle={faceStyle}
      accessibilityLabel={`Level ${level}, ${currentXP} of ${xpThreshold} XP`}
    >
      <Animated.View onLayout={handleLayout} style={[styles.fillTrack]}>
        <Animated.View style={[styles.fill, { backgroundColor: borderColor + "30" }, fillStyle]} />
      </Animated.View>

      <View style={styles.leftGroup}>
        <View style={[styles.iconCircle, iconCircleStyle]}>
          <Ionicons name="trophy" size={ICON_SIZE} color={textColor} />
        </View>
        <Text style={[styles.levelText, { color: textColor }]}>Lv {level}</Text>
      </View>

      <Text style={[styles.xpText, { color: textColor }]}>
        {currentXP} / {xpThreshold}
      </Text>
    </SkeuButton>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "visible",
    borderRadius: borderRadius.full,
  },
  fillTrack: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  fill: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: borderRadius.full,
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  iconCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  levelText: {
    fontFamily: fontFamilies.bold,
    fontSize: FONT_SIZE,
  },
  xpText: {
    fontFamily: fontFamilies.bold,
    fontSize: FONT_SIZE,
  },
});
