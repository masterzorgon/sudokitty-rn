import React, { useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  useWindowDimensions,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

import { colors } from '../../../theme/colors';
import { spacing, borderRadius } from '../../../theme';

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
}

export const SheetWrapper = forwardRef<SheetWrapperRef, SheetWrapperProps>(
  function SheetWrapper(
    { visible, onDismiss, dismissOnTapOutside = true, blurBackground = true, containerStyle, children },
    ref,
  ) {
    const { height: screenHeight } = useWindowDimensions();
    const translateY = useSharedValue(screenHeight);

    useEffect(() => {
      if (visible) {
        translateY.value = withSpring(0, { tension: 65, friction: 11 });
      } else {
        translateY.value = screenHeight;
      }
    }, [visible, translateY, screenHeight]);

    const animateOut = useCallback(
      (cb?: () => void) => {
        translateY.value = withTiming(screenHeight, { duration: 250 }, () => {
          runOnJS(onDismiss)();
          if (cb) runOnJS(cb)();
        });
      },
      [translateY, screenHeight, onDismiss],
    );

    useImperativeHandle(ref, () => ({ close: animateOut }), [animateOut]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
    }));

    const handleTapOutside = dismissOnTapOutside ? () => animateOut() : undefined;

    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => animateOut()}
      >
        {blurBackground ? (
          <BlurView intensity={60} tint="dark" style={styles.overlay}>
            <Pressable style={styles.dismissArea} onPress={handleTapOutside} />
            <Animated.View style={[styles.container, containerStyle, animatedStyle]}>
              <View style={styles.dragIndicator} />
              {children}
            </Animated.View>
          </BlurView>
        ) : (
          <View style={[styles.overlay, styles.dimOverlay]}>
            <Pressable style={styles.dismissArea} onPress={handleTapOutside} />
            <Animated.View style={[styles.container, containerStyle, animatedStyle]}>
              <View style={styles.dragIndicator} />
              {children}
            </Animated.View>
          </View>
        )}
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
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
