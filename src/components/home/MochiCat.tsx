// MochiCat - The adorable orange tabby mascot for Sudokitty
// Displays the mochi cat character as a static image

import React from 'react';
import { View, StyleSheet } from 'react-native';

import MochiCatSvg from '../../../assets/images/mochi/mochi-cat.svg';
import MochiGameViewSvg from '../../../assets/images/mochi/mochi-game-view.svg';
import MochiWelcomeSvg from '../../../assets/images/mochi/mochi-welcome.svg';

interface MochiCatProps {
  size?: number;
  variant?: 'default' | 'game' | 'welcome';
}

const SVG_MAP = {
  default: MochiCatSvg,
  game: MochiGameViewSvg,
  welcome: MochiWelcomeSvg,
} as const;

export function MochiCat({
  size = 180,
  variant = 'default',
}: MochiCatProps) {
  const SvgComponent = SVG_MAP[variant];

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <SvgComponent width={size} height={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
