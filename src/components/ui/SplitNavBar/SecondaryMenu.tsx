// Secondary menu that unfurls from primary action pill
// Expands upward from primary action pill

import React, { useRef, useMemo } from 'react';
import { StyleSheet, View, Pressable, Modal, PanResponder } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { SecondaryMenuProps, MENU_CONFIGS, LAYOUT, MenuItem } from './types';
import { MenuRow } from './MenuRow';

const SWIPE_THRESHOLD = 50; // Minimum distance to trigger dismiss
const SWIPE_VELOCITY_THRESHOLD = 0.3; // Minimum velocity to trigger dismiss

export function SecondaryMenu({
  isOpen,
  menuType,
  onSelect,
  onDismiss,
}: SecondaryMenuProps) {
  const insets = useSafeAreaInsets();
  const menuScale = useSharedValue(0);
  const menuOpacity = useSharedValue(0);
  const isDismissing = useRef(false);

  const menuItems = MENU_CONFIGS[menuType];

  // PanResponder for swipe-down to dismiss
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
    [onDismiss]
  );

  React.useEffect(() => {
    if (isOpen) {
      // Scale up from 0 → 1 with subtle overshoot
      menuScale.value = withTiming(1, {
        duration: 120,
        easing: Easing.out(Easing.back(1.1)),
      });
      menuOpacity.value = withTiming(1, { duration: 120 });
    } else {
      // Fast collapse
      menuScale.value = withTiming(0, {
        duration: 80,
        easing: Easing.in(Easing.cubic),
      });
      menuOpacity.value = withTiming(0, { duration: 80 });
    }
  }, [isOpen, menuScale, menuOpacity]);

  const animatedMenuStyle = useAnimatedStyle(() => ({
    opacity: menuOpacity.value,
    transform: [{ scale: menuScale.value }],
  }));

  const handleItemSelect = (item: MenuItem) => {
    onSelect(item);
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      {/* Full-screen blur overlay with tap and swipe to dismiss */}
      <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill}>
        <View style={styles.overlayTouchable} {...panResponder.panHandlers}>
          <Pressable style={styles.overlayPressable} onPress={onDismiss} />
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
          <View style={[styles.menu, menuType === 'resume' && styles.menuWide]}>
            {menuItems.map((item, index) => (
              <MenuRow
                key={item.id}
                item={item}
                index={index}
                isVisible={isOpen}
                isLast={index === menuItems.length - 1}
                onPress={() => handleItemSelect(item)}
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
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingRight: LAYOUT.horizontalPadding,
  },
  menuWrapper: {
    // Transform origin: scales from bottom-right corner
  },
  menu: {
    // padding: LAYOUT.unfurlPadding,
    gap: LAYOUT.rowGap,
    minWidth: 180,
  },
  menuWide: {
    minWidth: 416,
    borderWidth: 1,
  },
});
