// BottomSheet - Reusable slide-up bottom sheet modal
// Used for hints, validation feedback, or any contextual bottom panel

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Modal,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import { AppButton } from './AppButton';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export interface BottomSheetAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'neutral';
}

export interface BottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  description: string;
  action: BottomSheetAction;
  dismissOnTapOutside?: boolean;
}

export function BottomSheet({
  visible,
  onDismiss,
  title,
  description,
  action,
  dismissOnTapOutside = true,
}: BottomSheetProps) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

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

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const handleAction = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      action.onPress();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.dismissArea}
          onPress={dismissOnTapOutside ? handleDismiss : undefined}
        />

        <Animated.View
          style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.dragIndicator} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
          <View style={styles.actionContainer}>
            <AppButton
              onPress={handleAction}
              label={action.label}
              variant={action.variant ?? 'primary'}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlayBackground,
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
  title: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  actionContainer: {
    width: '100%',
  },
});
