import React, { useCallback } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { useColors } from "../../theme/colors";
import { playFeedback } from "../../utils/feedback";

interface BackButtonProps {
  onPress?: () => void;
  color?: string;
  /** When true, press is ignored (e.g. during async work). */
  disabled?: boolean;
}

export function BackButton({ onPress, color, disabled = false }: BackButtonProps) {
  const c = useColors();
  const router = useRouter();

  const handlePress = useCallback(() => {
    if (disabled) return;
    playFeedback("tap");
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  }, [disabled, onPress, router]);

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={12}
      style={styles.container}
      disabled={disabled}
      accessibilityState={{ disabled }}
    >
      <Feather name="arrow-left" size={22} color={color ?? c.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
