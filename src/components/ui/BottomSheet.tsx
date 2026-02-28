import React, { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme';
import { AppButton } from './AppButton';
import { SheetWrapper, type SheetWrapperRef } from './SheetWrapper';

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
  const sheetRef = useRef<SheetWrapperRef>(null);

  const handleAction = () => {
    sheetRef.current?.close(action.onPress);
  };

  return (
    <SheetWrapper
      ref={sheetRef}
      visible={visible}
      onDismiss={onDismiss}
      dismissOnTapOutside={dismissOnTapOutside}
    >
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <View style={styles.actionContainer}>
        <AppButton
          onPress={handleAction}
          label={action.label}
          variant={action.variant ?? 'primary'}
        />
      </View>
    </SheetWrapper>
  );
}

const styles = StyleSheet.create({
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
