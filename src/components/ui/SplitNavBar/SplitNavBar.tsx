// Split floating navigation bar
// Left: Secondary nav cluster (Home, Profile, Settings)
// Right: Primary action pill (New Game / Resume)

import React, { useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHasResumableGame } from '@/src/stores/gameStore';
import { Difficulty } from '@/src/engine/types';
import { SplitNavBarProps, PrimaryActionState, LAYOUT } from './types';
import { LeftCluster } from './LeftCluster';
import { PrimaryActionPill } from './PrimaryActionPill';
import { DifficultyUnfurl } from './DifficultyUnfurl';

export function SplitNavBar({
  activeTab,
  onTabPress,
  onNewGame,
  onResume,
}: SplitNavBarProps) {
  const insets = useSafeAreaInsets();
  const hasResumableGame = useHasResumableGame();
  const [isUnfurlOpen, setIsUnfurlOpen] = useState(false);

  // Determine primary action state based on game store
  const primaryState: PrimaryActionState = hasResumableGame ? 'resume' : 'new_game';

  // Handle primary pill press
  const handlePrimaryPress = useCallback(() => {
    if (primaryState === 'resume') {
      // Resume navigates directly to game
      onResume();
    } else {
      // New Game opens the difficulty unfurl
      setIsUnfurlOpen(true);
    }
  }, [primaryState, onResume]);

  // Handle difficulty selection from unfurl
  const handleDifficultySelect = useCallback(
    (difficulty: Difficulty) => {
      setIsUnfurlOpen(false);
      // Small delay to allow menu close animation
      setTimeout(() => {
        onNewGame(difficulty);
      }, 100);
    },
    [onNewGame]
  );

  // Handle unfurl dismiss
  const handleUnfurlDismiss = useCallback(() => {
    setIsUnfurlOpen(false);
  }, []);

  // Close unfurl when navigating away
  const handleTabPress = useCallback(
    (tab: typeof activeTab) => {
      if (isUnfurlOpen) {
        setIsUnfurlOpen(false);
      }
      onTabPress(tab);
    },
    [isUnfurlOpen, onTabPress]
  );

  return (
    <View
      style={[
        styles.container,
        { bottom: insets.bottom + LAYOUT.bottomOffset },
      ]}
      pointerEvents="box-none"
    >
      {/* Difficulty unfurl menu (rendered first for z-index) */}
      <DifficultyUnfurl
        isOpen={isUnfurlOpen}
        onSelect={handleDifficultySelect}
        onDismiss={handleUnfurlDismiss}
      />

      {/* Navigation pills container */}
      <View style={styles.pillsContainer}>
        {/* Left cluster - secondary navigation */}
        <LeftCluster activeTab={activeTab} onTabPress={handleTabPress} />

        {/* Right pill - primary action */}
        <PrimaryActionPill
          state={primaryState}
          onPress={handlePrimaryPress}
          isHidden={isUnfurlOpen}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
  },
  pillsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: LAYOUT.horizontalPadding,
  },
});
