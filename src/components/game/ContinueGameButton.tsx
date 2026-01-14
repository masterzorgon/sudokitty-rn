// Continue Game button - shows when there's a paused/resumable game
// Displays difficulty and elapsed time as subtext

import React from 'react';
import { StyleSheet } from 'react-native';
import { useResumableGameInfo } from '../../stores/gameStore';
import { GameButton } from '../ui';
import { spacing } from '../../theme';

interface ContinueGameButtonProps {
  onPress: () => void;
}

// Format time as MM:SS
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const ContinueGameButton = ({ onPress }: ContinueGameButtonProps) => {
  const gameInfo = useResumableGameInfo();

  if (!gameInfo) return null;

  const { difficulty, timeElapsed } = gameInfo;

  return (
    <GameButton
      onPress={onPress}
      label="continue game"
      subtext={`${difficulty} · ${formatTime(timeElapsed)}`}
      variant="secondary"
      style={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
});
