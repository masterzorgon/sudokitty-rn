// MochiCat - The adorable orange tabby mascot for Sudokitty
// Displays the mochi cat character as a static image

import React from 'react';
import { View, StyleSheet } from 'react-native';

// SVG imports - requires react-native-svg-transformer
import MochiCatSvg from '../../../assets/images/mochi/mochi-cat.svg';
import MochiGameViewSvg from '../../../assets/images/mochi/mochi-game-view.svg';

// MARK: - Types

interface MochiCatProps {
  // Size of the cat image (width and height will be equal)
  size?: number;
  // Which SVG variant to render (default: 'default')
  variant?: 'default' | 'game';
}

// MARK: - Component

export function MochiCat({
  size = 180,
  variant = 'default',
}: MochiCatProps) {
  const SvgComponent = variant === 'game' ? MochiGameViewSvg : MochiCatSvg;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.imageWrapper}>
        <SvgComponent width={size} height={size} />
      </View>
    </View>
  );
}

// MARK: - Styles

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {},
});
