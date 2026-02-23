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
  reverse?: boolean;
  intensity?: 'high' | 'low';
}

export function AtmosphericGradient({
  height = DEFAULT_GRADIENT_HEIGHT,
  glowRadius = DEFAULT_GLOW_RADIUS,
  reverse = false,
  intensity = 'high',
}: AtmosphericGradientProps) {
  const c = useColors();
  const theme = useColorTheme();

  const gradientColors = reverse ? [...c.homeGradient].reverse() : c.homeGradient;
  const glowY = reverse ? height : 0;
  const positioning = reverse ? { bottom: 0, top: undefined } : { top: 0, bottom: undefined };
  const opacity = intensity === 'low' ? 0.3 : 1;

  return (
    <>
      {/* Linear gradient overlay */}
      <LinearGradient
        key={`grad-${theme}-${reverse}-${intensity}`}
        colors={gradientColors as any}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.gradientOverlay, { height, opacity }, positioning]}
        pointerEvents="none"
      />
      
      {/* Radial glow at center */}
      <Canvas key={`glow-${theme}-${reverse}-${intensity}`} style={[styles.glowCanvas, { height, opacity }, positioning]} pointerEvents="none">
        <Circle cx={SCREEN_WIDTH / 2} cy={glowY} r={glowRadius}>
          <RadialGradient
            c={vec(SCREEN_WIDTH / 2, glowY)}
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
    left: 0,
    right: 0,
  },
  glowCanvas: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
