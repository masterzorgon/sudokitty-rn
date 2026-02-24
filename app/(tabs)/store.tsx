// Store screen - placeholder for future shop/purchasable items

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../../src/theme/colors';
import { typography } from '../../src/theme/typography';
import { AtmosphericGradient } from '../../src/components/ui/AtmosphericGradient';

export default function StoreScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AtmosphericGradient />
      <AtmosphericGradient reverse intensity="low" />
      <View style={styles.content}>
        <Text style={styles.title}>store</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.largeTitle,
    color: colors.textPrimary,
  },
});
