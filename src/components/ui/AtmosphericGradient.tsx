// Atmospheric gradient background with radial glow
// Reusable across home screen and tutorial/showcase pages

import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Canvas, Circle, RadialGradient, vec } from '@shopify/react-native-skia';
import { useColors } from '../../theme/colors';
import { useColorTheme } from '../../stores/settingsStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DEFAULT_GRADIENT_HEIGHT = SCREEN_HEIGHT * 0.45;
const DEFAULT_GLOW_RADIUS = SCREEN_WIDTH * 0.6;

export interface AtmosphericGradientProps {
  height?: number;
  glowRadius?: number;
}

export function AtmosphericGradient({
  height = DEFAULT_GRADIENT_HEIGHT,
  glowRadius = DEFAULT_GLOW_RADIUS,
}: AtmosphericGradientProps) {
  const c = useColors();
  const theme = useColorTheme();

  return (
    <>
      {/* Linear gradient overlay */}
      <LinearGradient
        key={`grad-${theme}`}
        colors={[...c.homeGradient]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.gradientOverlay, { height }]}
        pointerEvents="none"
      />
      
      {/* Radial glow at top center */}
      <Canvas key={`glow-${theme}`} style={[styles.glowCanvas, { height }]} pointerEvents="none">
        <Circle cx={SCREEN_WIDTH / 2} cy={0} r={glowRadius}>
          <RadialGradient
            c={vec(SCREEN_WIDTH / 2, 0)}
            r={glowRadius}
            colors={[c.homeGlowColor, 'transparent']}
          />
        </Circle>
      </Canvas>
    </>
  );
}

const styles = StyleSheet.create({
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  glowCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
