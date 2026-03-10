import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SCREEN_PADDING, BOTTOM_ACTION_OFFSET } from '../../../theme';

interface BottomActionBarProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function BottomActionBar({ children, style }: BottomActionBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.container,
        { paddingBottom: insets.bottom + BOTTOM_ACTION_OFFSET },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SCREEN_PADDING,
  },
});
