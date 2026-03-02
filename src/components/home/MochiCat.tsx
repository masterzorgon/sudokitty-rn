// MochiCat - The adorable orange tabby mascot for Sudokitty
// Displays the mochi cat character as a static image

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

interface MochiCatProps {
  size?: number;
  variant?: 'default' | 'game' | 'welcome';
}

const IMG_MAP = {
  default: require('../../../assets/images/mochi/mochi-hello.png'),
  game: require('../../../assets/images/mochi/mochi-happy.png'),
  welcome: require('../../../assets/images/mochi/mochi-home.png'),
} as const;

export function MochiCat({
  size = 180,
  variant = 'default',
}: MochiCatProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image source={IMG_MAP[variant]} style={{ width: size, height: size }} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
