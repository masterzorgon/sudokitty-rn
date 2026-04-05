import React, { useCallback, useEffect, useRef } from "react";
import { View, Text, StyleSheet, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors, type ColorPalette } from "../../theme/colors";
import { fontFamilies } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme";
import type { CustomSkeuColors } from "../ui/Skeuomorphic";
import { SkeuButton } from "../ui/Skeuomorphic";
import MochiPointIcon from "../../../assets/images/icons/mochi-point.svg";
import { useFXStore } from "../../stores/fxStore";

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

export function HeaderPill({ type, value, onPress }: HeaderPillProps) {
  const c = useColors();
  const mochiWrapRef = useRef<View>(null);
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

  useEffect(() => {
    if (type !== "mochis") return;
    return () => {
      useFXStore.getState().setTargetLayout(null);
    };
  }, [type]);

  const handleMochiLayout = useCallback(() => {
    if (type !== "mochis") return;
    mochiWrapRef.current?.measureInWindow((x, y, w, h) => {
      useFXStore.getState().setTargetLayout({ x, y, width: w, height: h });
    });
  }, [type]);

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
    return (
      <View
        ref={mochiWrapRef}
        onLayout={handleMochiLayout}
        collapsable={false}
        style={styles.container}
      >
        {buttonEl}
      </View>
    );
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
