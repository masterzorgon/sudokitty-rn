import { useEffect, useCallback, useImperativeHandle, forwardRef, useMemo } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  PanResponder,
  useWindowDimensions,
  ViewStyle,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

import { colors, useColors } from "../../../theme/colors";
import { spacing, borderRadius } from "../../../theme";

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 0.8;

export interface SheetWrapperRef {
  close: (callback?: () => void) => void;
}

export interface SheetWrapperProps {
  visible: boolean;
  onDismiss: () => void;
  dismissOnTapOutside?: boolean;
  blurBackground?: boolean;
  containerStyle?: ViewStyle;
  children: React.ReactNode;
  embedded?: boolean;
}

export const SheetWrapper = forwardRef<SheetWrapperRef, SheetWrapperProps>(function SheetWrapper(
  {
    visible,
    onDismiss,
    dismissOnTapOutside = true,
    blurBackground = true,
    containerStyle,
    children,
    embedded = false,
  },
  ref,
) {
  const c = useColors();
  const { height: screenHeight } = useWindowDimensions();
  const translateY = useSharedValue(screenHeight);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 250 });
      overlayOpacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = screenHeight;
      overlayOpacity.value = 0;
    }
  }, [visible, translateY, overlayOpacity, screenHeight]);

  const animateOut = useCallback(
    (cb?: () => void) => {
      // #region agent log
      fetch("http://127.0.0.1:7242/ingest/0ae61ecd-caec-474e-bdeb-3b6e3b859537", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "0514f9" },
        body: JSON.stringify({
          sessionId: "0514f9",
          location: "SheetWrapper.tsx:animateOut",
          message: "animateOut called",
          data: { hasCallback: !!cb, willCallOnDismiss: !cb },
          timestamp: Date.now(),
          hypothesisId: "H4",
        }),
      }).catch(() => {});
      // #endregion
      overlayOpacity.value = withTiming(0, { duration: 250 });
      translateY.value = withTiming(screenHeight, { duration: 250 }, () => {
        if (cb) {
          runOnJS(cb)();
        } else {
          runOnJS(onDismiss)();
        }
      });
    },
    [translateY, overlayOpacity, screenHeight, onDismiss],
  );

  useImperativeHandle(ref, () => ({ close: animateOut }), [animateOut]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gs) =>
          gs.dy > 8 && Math.abs(gs.dy) > Math.abs(gs.dx) * 1.5,
        onPanResponderMove: (_, gs) => {
          translateY.value = Math.max(0, gs.dy);
          overlayOpacity.value = interpolate(gs.dy, [0, screenHeight], [1, 0], Extrapolation.CLAMP);
        },
        onPanResponderRelease: (_, gs) => {
          if (gs.dy > DISMISS_DISTANCE || gs.vy > DISMISS_VELOCITY) {
            animateOut();
          } else {
            translateY.value = withTiming(0, { duration: 200 });
            overlayOpacity.value = withTiming(1, { duration: 200 });
          }
        },
        onPanResponderTerminate: () => {
          translateY.value = withTiming(0, { duration: 200 });
          overlayOpacity.value = withTiming(1, { duration: 200 });
        },
      }),
    [translateY, overlayOpacity, screenHeight, animateOut],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const handleTapOutside = dismissOnTapOutside ? () => animateOut() : undefined;

  const sheetContent = (
    <Animated.View
      style={[styles.container, containerStyle, animatedStyle]}
      {...panResponder.panHandlers}
    >
      <LinearGradient
        colors={c.homeGradient as any}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.sheetGradient}
        pointerEvents="none"
      />
      <View style={styles.dragIndicator} />
      {children}
    </Animated.View>
  );

  const overlayInner = blurBackground ? (
    <Animated.View style={[StyleSheet.absoluteFill, overlayAnimatedStyle]}>
      <BlurView intensity={60} tint="dark" style={styles.overlay}>
        <Pressable style={styles.dismissArea} onPress={handleTapOutside} />
        {sheetContent}
      </BlurView>
    </Animated.View>
  ) : (
    <Animated.View style={[styles.overlay, styles.dimOverlay, overlayAnimatedStyle]}>
      <Pressable style={styles.dismissArea} onPress={handleTapOutside} />
      {sheetContent}
    </Animated.View>
  );

  if (embedded) {
    if (!visible) {
      return null;
    }
    return <View style={styles.embeddedRoot}>{overlayInner}</View>;
  }

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={() => animateOut()}>
      {overlayInner}
    </Modal>
  );
});

const styles = StyleSheet.create({
  embeddedRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    elevation: 99999,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  dimOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  dismissArea: {
    flex: 1,
  },
  container: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl + 20,
    overflow: "hidden",
  },
  sheetGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    opacity: 0.5,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    backgroundColor: colors.gridLine,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
});
