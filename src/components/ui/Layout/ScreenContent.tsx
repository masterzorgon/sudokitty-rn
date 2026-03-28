import React from "react";
import { View, ScrollView, StyleSheet, Platform, type ViewStyle } from "react-native";

import { SCREEN_PADDING } from "../../../theme";

interface ScreenContentProps {
  children: React.ReactNode;
  /** When true (default), wraps children in a ScrollView. */
  scroll?: boolean;
  /** Applied to the ScrollView / View container itself. */
  style?: ViewStyle;
  /** Extra styles merged into the ScrollView's contentContainerStyle (scroll mode only). */
  contentStyle?: ViewStyle;
}

export function ScreenContent({
  children,
  scroll = true,
  style,
  contentStyle,
}: ScreenContentProps) {
  if (scroll) {
    return (
      <ScrollView
        style={[styles.scroll, style]}
        contentContainerStyle={[styles.content, contentStyle]}
        showsVerticalScrollIndicator={false}
        /** Avoid iOS re-applying safe-area content insets when an off-screen tab becomes visible (jerky jump). Safe area is already handled by SafeAreaView + header padding on tab screens. */
        contentInsetAdjustmentBehavior={Platform.OS === "ios" ? "never" : undefined}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.content, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SCREEN_PADDING,
  },
});
