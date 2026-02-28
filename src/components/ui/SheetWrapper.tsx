import React, { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';

import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export interface SheetWrapperRef {
  close: (callback?: () => void) => void;
}

export interface SheetWrapperProps {
  visible: boolean;
  onDismiss: () => void;
  dismissOnTapOutside?: boolean;
  containerStyle?: ViewStyle;
  children: React.ReactNode;
}

export const SheetWrapper = forwardRef<SheetWrapperRef, SheetWrapperProps>(
  function SheetWrapper(
    { visible, onDismiss, dismissOnTapOutside = true, containerStyle, children },
    ref,
  ) {
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const callbackRef = useRef<(() => void) | null>(null);

    useEffect(() => {
      if (visible) {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }).start();
      } else {
        slideAnim.setValue(SCREEN_HEIGHT);
      }
    }, [visible, slideAnim]);

    const animateOut = useCallback(
      (cb?: () => void) => {
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          onDismiss();
          cb?.();
        });
      },
      [slideAnim, onDismiss],
    );

    useImperativeHandle(ref, () => ({ close: animateOut }), [animateOut]);

    const handleTapOutside = dismissOnTapOutside ? () => animateOut() : undefined;

    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => animateOut()}
      >
        <BlurView intensity={60} tint="dark" style={styles.overlay}>
          <Pressable style={styles.dismissArea} onPress={handleTapOutside} />

          <Animated.View
            style={[
              styles.container,
              containerStyle,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.dragIndicator} />
            {children}
          </Animated.View>
        </BlurView>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
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
