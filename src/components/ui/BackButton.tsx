import React, { useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../theme/colors';
import { playFeedback } from '../../utils/feedback';

interface BackButtonProps {
  onPress?: () => void;
  color?: string;
}

export function BackButton({ onPress, color }: BackButtonProps) {
  const c = useColors();
  const router = useRouter();

  const handlePress = useCallback(() => {
    playFeedback('tap');
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  }, [onPress, router]);

  return (
    <Pressable onPress={handlePress} hitSlop={12} style={styles.container}>
      <Feather name="arrow-left" size={22} color={color ?? c.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
