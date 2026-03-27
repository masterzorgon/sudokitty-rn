import React, { useEffect, useCallback, useImperativeHandle, forwardRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  PanResponder,
  useWindowDimensions,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import { colors, useColors } from '../../../theme/colors';
import { spacing, borderRadius } from '../../../theme';

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

export const SheetWrapper = forwardRef<SheetWrapperRef, SheetWrapperProps>(
  function SheetWrapper(
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

    useEffect(() => {
      if (visible) {
        translateY.value = withTiming(0, { duration: 250 });
      } else {
        translateY.value = screenHeight;
      }
    }, [visible, translateY, screenHeight]);

    const animateOut = useCallback(
      (cb?: () => void) => {
        translateY.value = withTiming(screenHeight, { duration: 250 }, () => {
          if (cb) {
            runOnJS(cb)();
          } else {
            runOnJS(onDismiss)();
          }
        });
      },
      [translateY, screenHeight, onDismiss],
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
          },
          onPanResponderRelease: (_, gs) => {
            if (gs.dy > DISMISS_DISTANCE || gs.vy > DISMISS_VELOCITY) {
              animateOut();
            } else {
              translateY.value = withTiming(0, { duration: 200 });
            }
          },
          onPanResponderTerminate: () => {
            translateY.value = withTiming(0, { duration: 200 });
          },
        }),
      [translateY, animateOut],
    );

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
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

    const overlayInner =
      blurBackground ? (
        <BlurView intensity={60} tint="dark" style={styles.overlay}>
          <Pressable style={styles.dismissArea} onPress={handleTapOutside} />
          {sheetContent}
        </BlurView>
      ) : (
        <View style={[styles.overlay, styles.dimOverlay]}>
          <Pressable style={styles.dismissArea} onPress={handleTapOutside} />
          {sheetContent}
        </View>
      );

    if (embedded) {
      if (!visible) {
        return null;
      }
      return <View style={styles.embeddedRoot}>{overlayInner}</View>;
    }

    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={() => animateOut()}
      >
        {overlayInner}
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  embeddedRoot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    elevation: 99999,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dimOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
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
    paddingBottom: spacing.xl + 20, // clears iOS home indicator (~34pt) plus standard spacing
    overflow: 'hidden',
  },
  sheetGradient: {
    position: 'absolute',
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
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
});
