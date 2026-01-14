// Animated "play" button - wraps GameButton for home screen use
// Matches reference animation-demos button behavior

import React from 'react';
import { FadeOut, AnimatedProps } from 'react-native-reanimated';
import { ViewProps } from 'react-native';
import { GameButton } from '../ui';
import { startGameAnimations } from '../../theme/animations';

interface AnimatedStartButtonProps {
  onPress: () => void;
  label?: string;
  exiting?: AnimatedProps<ViewProps>['exiting'];
}

export const AnimatedStartButton = ({
  onPress,
  label = 'play',
  exiting,
}: AnimatedStartButtonProps) => {
  return (
    <GameButton
      onPress={onPress}
      label={label}
      variant="primary"
      exiting={exiting || FadeOut.duration(startGameAnimations.buttonFadeOut.duration)}
    />
  );
};
