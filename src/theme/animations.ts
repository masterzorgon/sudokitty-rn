// Animation configurations for Sudokitty
// Matching iOS spring animations

import { WithSpringConfig, WithTimingConfig, Easing } from 'react-native-reanimated';

// Spring animation configs (matching SwiftUI's response/damping)
export const springConfigs = {
  // Default spring - matches SwiftUI Animation.spring(response: 0.35, dampingFraction: 0.7)
  default: {
    damping: 15,
    stiffness: 200,
    mass: 1,
  } as WithSpringConfig,

  // Gentle spring for subtle animations
  gentle: {
    damping: 20,
    stiffness: 150,
    mass: 1,
  } as WithSpringConfig,

  // Bouncy spring for playful animations
  bouncy: {
    damping: 8,
    stiffness: 300,
    mass: 1,
  } as WithSpringConfig,

  // Quick spring for snappy feedback
  quick: {
    damping: 20,
    stiffness: 400,
    mass: 1,
  } as WithSpringConfig,

  // Slow spring for entrance animations
  slow: {
    damping: 15,
    stiffness: 100,
    mass: 1,
  } as WithSpringConfig,
};

// Timing animation configs
export const timingConfigs = {
  // Quick timing - 0.2s
  quick: {
    duration: 200,
    easing: Easing.inOut(Easing.ease),
  } as WithTimingConfig,

  // Gentle timing - 0.4s
  gentle: {
    duration: 400,
    easing: Easing.inOut(Easing.ease),
  } as WithTimingConfig,

  // Glow fade in
  glowIn: {
    duration: 150,
    easing: Easing.in(Easing.ease),
  } as WithTimingConfig,

  // Glow fade out
  glowOut: {
    duration: 600,
    easing: Easing.out(Easing.cubic),
  } as WithTimingConfig,

  // Wave animation
  wave: {
    duration: 300,
    easing: Easing.out(Easing.cubic),
  } as WithTimingConfig,

  // Wave fade out
  waveFade: {
    duration: 400,
    easing: Easing.inOut(Easing.cubic),
  } as WithTimingConfig,
};

// Animation durations in ms
export const durations = {
  quick: 200,
  default: 350,
  gentle: 400,
  slow: 600,
  veryFast: 100,

  // Specific animations
  cellGlowTotal: 750, // 150ms in + 600ms out
  completionWave: 700,
  confettiFall: 2500,
  mochiBreathing: 2000,
  mochiBlinking: 150,
};

// Delays for staggered animations
export const delays = {
  // Wave animation: delay per cell distance from epicenter
  wavePerCell: 50,

  // Staggered list items
  listItem: 50,

  // Confetti spawn delay range
  confettiMin: 0,
  confettiMax: 500,
};

// Scale values for animations
export const scales = {
  pressed: 0.95,
  selected: 1.05,
  bounce: 1.1,
  celebration: 1.2,
};
