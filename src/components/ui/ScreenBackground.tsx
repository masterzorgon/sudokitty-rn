import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Canvas, Circle, RadialGradient, vec } from '@shopify/react-native-skia';

import { useColors } from '../../theme/colors';
import { useColorTheme } from '../../stores/settingsStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DEFAULT_GRADIENT_HEIGHT = SCREEN_HEIGHT * 0.45;
const DEFAULT_GLOW_RADIUS = SCREEN_WIDTH * 0.6;

interface GradientLayerProps {
  height?: number;
  glowRadius?: number;
  reverse?: boolean;
  intensity?: 'high' | 'low';
}

function GradientLayer({
  height = DEFAULT_GRADIENT_HEIGHT,
  glowRadius = DEFAULT_GLOW_RADIUS,
  reverse = false,
  intensity = 'high',
}: GradientLayerProps) {
  const c = useColors();
  const theme = useColorTheme();

  const gradientColors = reverse ? [...c.homeGradient].reverse() : c.homeGradient;
  const glowY = reverse ? height : 0;
  const positioning = reverse ? { bottom: 0, top: undefined } : { top: 0, bottom: undefined };
  const opacity = intensity === 'low' ? 0.3 : 1;

  return (
    <>
      <LinearGradient
        key={`grad-${theme}-${reverse}-${intensity}`}
        colors={gradientColors as any}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.layer, { height, opacity }, positioning]}
        pointerEvents="none"
      />
      <Canvas
        key={`glow-${theme}-${reverse}-${intensity}`}
        style={[styles.layer, { height, opacity }, positioning]}
        pointerEvents="none"
      >
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

interface ScreenBackgroundProps {
  /** Show the top gradient. Default: true */
  showTop?: boolean;
  /** Intensity of the top gradient. Default: 'high' */
  topIntensity?: 'high' | 'low';
  /** Show the bottom reversed gradient. Default: true */
  showBottom?: boolean;
  /** Intensity of the bottom gradient. Default: 'low' */
  bottomIntensity?: 'high' | 'low';
}

export function ScreenBackground({
  showTop = true,
  topIntensity = 'high',
  showBottom = true,
  bottomIntensity = 'low',
}: ScreenBackgroundProps) {
  return (
    <>
      {showTop && <GradientLayer intensity={topIntensity} />}
      {showBottom && <GradientLayer reverse intensity={bottomIntensity} />}
    </>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
