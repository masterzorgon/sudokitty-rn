// Secondary menu that unfurls from primary action pill
// Expands upward from primary action pill

import React, { useRef, useMemo, useCallback } from "react";
import { StyleSheet, View, Pressable, Modal, PanResponder } from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing } from "react-native-reanimated";
import { SecondaryMenuProps, MENU_CONFIGS, LAYOUT, type MenuItem } from "./types";
import { MenuRow } from "./MenuRow";
import { useVisibilityAnimation } from "@/src/hooks/useVisibilityAnimation";
import { useEffectivePremium, usePremiumStore } from "@/src/stores/premiumStore";
import { presentPaywallAlways } from "@/src/lib/revenueCat";
import { playFeedback } from "@/src/utils/feedback";

const SWIPE_THRESHOLD = 50; // Minimum distance to trigger dismiss
const SWIPE_VELOCITY_THRESHOLD = 0.3; // Minimum velocity to trigger dismiss

function isPremiumLockedDifficulty(item: MenuItem, isPremium: boolean): boolean {
  if (!item.difficulty) return false;
  if (isPremium) return false;
  return item.difficulty === "hard" || item.difficulty === "expert";
}

export function SecondaryMenu({ isOpen, menuType, onSelect, onDismiss }: SecondaryMenuProps) {
  const insets = useSafeAreaInsets();
  const isDismissing = useRef(false);
  const isPremium = useEffectivePremium();

  const animatedMenuStyle = useVisibilityAnimation(isOpen, {
    durationIn: 120,
    durationOut: 80,
    easingIn: Easing.out(Easing.back(1.1)),
    easingOut: Easing.in(Easing.cubic),
  });

  const menuItems = MENU_CONFIGS[menuType];

  const handleItemPress = useCallback(
    async (item: MenuItem) => {
      if (isPremiumLockedDifficulty(item, isPremium)) {
        const purchased = await presentPaywallAlways();
        if (purchased) {
          usePremiumStore.getState().setPremium(true);
          onSelect(item);
        }
        return;
      }
      onSelect(item);
    },
    [isPremium, onSelect],
  );

  // PanResponder for swipe-down dismiss gesture.
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          // Only respond to downward swipes
          return gestureState.dy > 10 && Math.abs(gestureState.dx) < Math.abs(gestureState.dy);
        },
        onPanResponderRelease: (_, gestureState) => {
          const { dy, vy } = gestureState;
          // Dismiss if swiped down far enough or with enough velocity
          if (
            !isDismissing.current &&
            (dy > SWIPE_THRESHOLD || (dy > 20 && vy > SWIPE_VELOCITY_THRESHOLD))
          ) {
            isDismissing.current = true;
            playFeedback("tap");
            onDismiss();
            // Reset after animation completes
            setTimeout(() => {
              isDismissing.current = false;
            }, 100);
          }
        },
        onPanResponderTerminate: () => {
          isDismissing.current = false;
        },
      }),
    [onDismiss],
  );

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        playFeedback("tap");
        onDismiss();
      }}
    >
      {/* Full-screen blur overlay with tap and swipe to dismiss */}
      <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill}>
        <View style={styles.overlayTouchable} {...panResponder.panHandlers}>
          <Pressable
            style={styles.overlayPressable}
            onPress={() => {
              playFeedback("tap");
              onDismiss();
            }}
          />
        </View>
      </BlurView>

      {/* Full-screen positioning container - passes all touches through */}
      <View
        style={[
          styles.positioningContainer,
          { paddingBottom: insets.bottom + LAYOUT.bottomOffset },
        ]}
        pointerEvents="box-none"
      >
        {/* Animated menu - only as large as its content */}
        <Animated.View style={[styles.menuWrapper, animatedMenuStyle]} pointerEvents="box-none">
          <View style={[styles.menu, menuType === "resume" && styles.menuWide]}>
            {menuItems.map((item, index) => (
              <MenuRow
                key={item.id}
                item={item}
                isVisible={isOpen}
                isLast={index === menuItems.length - 1}
                onPress={() => void handleItemPress(item)}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayTouchable: {
    flex: 1,
  },
  overlayPressable: {
    flex: 1,
  },
  positioningContainer: {
    ...StyleSheet.absoluteFillObject,
    // Flexbox positions content at bottom-right without expanding
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "flex-end",
    paddingRight: LAYOUT.horizontalPadding,
  },
  menuWrapper: {
    // Transform origin: scales from bottom-right corner
  },
  menu: {
    minWidth: 228,
  },
  menuWide: {
    minWidth: 300,
  },
});
