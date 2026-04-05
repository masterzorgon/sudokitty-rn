import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useIsFocused } from "@react-navigation/native";
import { useColors, type ColorPalette } from "../../theme/colors";
import { fontFamilies } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme";
import type { CustomSkeuColors } from "../ui/Skeuomorphic";
import { SkeuButton } from "../ui/Skeuomorphic";
import MochiPointIcon from "../../../assets/images/icons/mochi-point.svg";
import { setOnBurstComplete, setOnMochiArrival, useFXStore } from "../../stores/fxStore";
import { PARTICLE_COUNT } from "../../constants/mochiBurst";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { RollingNumber } from "../ui/RollingNumber";

const PILL_HEIGHT = 34;
const ICON_SIZE = 18;
const ICON_CIRCLE_SIZE = 26;
const FONT_SIZE = 14;

export type HeaderPillType = "mochis" | "freezes" | "xp" | "level";

interface PillConfig {
  colorKeys: { border: keyof ColorPalette; text: keyof ColorPalette };
  label: string;
  renderIcon: (color: string, size: number) => React.ReactNode;
}

const PILL_CONFIGS: Record<HeaderPillType, PillConfig> = {
  freezes: {
    colorKeys: { border: "freezePillBorder", text: "freezePillText" },
    label: "Streak Freezes",
    renderIcon: (color, size) => <Ionicons name="snow" size={size} color={color} />,
  },
  xp: {
    colorKeys: { border: "xpPillBorder", text: "xpPillText" },
    label: "XP",
    renderIcon: (color, size) => <Ionicons name="flash" size={size} color={color} />,
  },
  level: {
    colorKeys: { border: "levelPillBorder", text: "levelPillText" },
    label: "Level",
    renderIcon: (color, size) => <Ionicons name="trophy" size={size} color={color} />,
  },
  mochis: {
    colorKeys: { border: "mochiPillBorder", text: "mochiPillText" },
    label: "Mochis",
    renderIcon: (_, size) => <MochiPointIcon width={size} height={size} />,
  },
};

export interface HeaderPillProps {
  type: HeaderPillType;
  value: number;
  onPress: () => void;
}

function MochiHeaderPillInner({ value, onPress }: { value: number; onPress: () => void }) {
  const c = useColors();
  const isFocused = useIsFocused();
  const reducedMotion = useReducedMotion();
  const burstId = useFXStore((s) => s.burstId);
  const burstAmount = useFXStore((s) => s.burstAmount);
  const mochiWrapRef = useRef<View>(null);
  const config = PILL_CONFIGS.mochis;
  const borderColor = c[config.colorKeys.border] as string;
  const textColor = c[config.colorKeys.text] as string;

  const valueRef = useRef(value);
  valueRef.current = value;

  const totalParticlesRef = useRef(1);
  const perArrivalRef = useRef(0);
  const remainderRef = useRef(0);
  const arrivedCountRef = useRef(0);

  const [displayedMochis, setDisplayedMochis] = useState(value);
  /** Scale the count text only — avoids nested Reanimated + SkeuButton press transform fighting the pill wrapper. */
  const countScale = useSharedValue(1);

  const countAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countScale.value }],
  }));

  const iconCircleStyle = {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: ICON_CIRCLE_SIZE / 2,
    backgroundColor: borderColor + "50",
  };

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
    gap: spacing.sm,
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: spacing.sm,
    height: PILL_HEIGHT,
  };

  useEffect(() => {
    if (burstId === 0) {
      setDisplayedMochis(value);
    }
  }, [value, burstId]);

  useEffect(() => {
    if (burstId === 0) return;
    const n = PARTICLE_COUNT(burstAmount);
    totalParticlesRef.current = n;
    const per = Math.floor(burstAmount / n);
    perArrivalRef.current = per;
    remainderRef.current = burstAmount - per * n;
    arrivedCountRef.current = 0;
    if (reducedMotion) {
      setDisplayedMochis(value);
    } else {
      setDisplayedMochis(value - burstAmount);
    }
  }, [burstId, burstAmount, value, reducedMotion]);

  const handleMochiArrival = useCallback(() => {
    if (reducedMotion) return;
    arrivedCountRef.current += 1;
    const n = totalParticlesRef.current;
    const isLast = arrivedCountRef.current >= n;
    const inc = isLast ? perArrivalRef.current + remainderRef.current : perArrivalRef.current;
    setDisplayedMochis((prev) => prev + inc);
    countScale.value = withSequence(
      withTiming(1.2, { duration: 55, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 120, easing: Easing.inOut(Easing.quad) }),
    );
  }, [reducedMotion, countScale]);

  useEffect(() => {
    if (!isFocused) return;
    setOnMochiArrival(handleMochiArrival);
    return () => setOnMochiArrival(null);
  }, [handleMochiArrival, isFocused]);

  useEffect(() => {
    if (!isFocused) return;
    setOnBurstComplete(() => {
      setDisplayedMochis(valueRef.current);
    });
    return () => setOnBurstComplete(null);
  }, [isFocused]);

  useEffect(() => {
    return () => {
      useFXStore.getState().setTargetLayout(null);
    };
  }, []);

  const measureAndReport = useCallback(() => {
    mochiWrapRef.current?.measureInWindow((x, y, w, h) => {
      if (w > 0 && h > 0) {
        useFXStore.getState().setTargetLayout({ x, y, width: w, height: h });
      }
    });
  }, []);

  const handleMochiLayout = useCallback(() => {
    if (!isFocused) return;
    measureAndReport();
  }, [isFocused, measureAndReport]);

  /** Re-measure when this tab gains focus (native view may have been detached/reattached by react-native-screens). */
  useEffect(() => {
    if (!isFocused) return;
    const timer = setTimeout(measureAndReport, 50);
    return () => clearTimeout(timer);
  }, [isFocused, measureAndReport]);

  return (
    <View
      ref={mochiWrapRef}
      onLayout={handleMochiLayout}
      collapsable={false}
      style={styles.container}
    >
      <SkeuButton
        onPress={onPress}
        customColors={skeuColors}
        borderRadius={borderRadius.full}
        style={styles.container}
        contentStyle={faceStyle}
        accessibilityLabel={`${displayedMochis} ${config.label}`}
      >
        <View style={[styles.iconCircle, iconCircleStyle]}>
          {config.renderIcon(textColor, ICON_SIZE)}
        </View>
        <Animated.View style={countAnimatedStyle}>
          <RollingNumber
            value={displayedMochis}
            fontSize={FONT_SIZE}
            color={textColor}
            textStyle={{ fontFamily: fontFamilies.bold }}
            digitsAlign="end"
          />
        </Animated.View>
      </SkeuButton>
    </View>
  );
}

export function HeaderPill({ type, value, onPress }: HeaderPillProps) {
  const c = useColors();
  const config = PILL_CONFIGS[type];
  const borderColor = c[config.colorKeys.border] as string;
  const textColor = c[config.colorKeys.text] as string;

  const iconCircleStyle = {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: ICON_CIRCLE_SIZE / 2,
    backgroundColor: borderColor + "50",
  };

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
    gap: spacing.sm,
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: spacing.sm,
    height: PILL_HEIGHT,
  };

  const buttonEl = (
    <SkeuButton
      onPress={onPress}
      customColors={skeuColors}
      borderRadius={borderRadius.full}
      style={styles.container}
      contentStyle={faceStyle}
      accessibilityLabel={`${value} ${config.label}`}
    >
      <View style={[styles.iconCircle, iconCircleStyle]}>
        {config.renderIcon(textColor, ICON_SIZE)}
      </View>
      <Text style={[styles.countText, { color: textColor }]}>{value}</Text>
    </SkeuButton>
  );

  if (type === "mochis") {
    return <MochiHeaderPillInner value={value} onPress={onPress} />;
  }

  return buttonEl;
}

const styles = StyleSheet.create({
  container: {
    overflow: "visible",
    borderRadius: borderRadius.full,
  },
  iconCircle: {
    alignItems: "center",
    justifyContent: "center",
  },
  countText: {
    fontFamily: fontFamilies.bold,
    fontSize: FONT_SIZE,
  },
});
