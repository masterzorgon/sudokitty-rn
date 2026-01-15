// Split floating navigation bar
// Left: Secondary nav cluster (Home, Profile, Settings)
// Right: Primary action pill (New Game / Resume)

import React, { useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useHasResumableGame } from '@/src/stores/gameStore';
import { SplitNavBarProps, PrimaryActionState, LAYOUT, MenuItem } from './types';
import { LeftCluster } from './LeftCluster';
import { PrimaryActionPill } from './PrimaryActionPill';
import { SecondaryMenu } from './SecondaryMenu';

export function SplitNavBar({
  activeTab,
  onTabPress,
  onNewGame,
  onResume,
  onQuitGame,
}: SplitNavBarProps) {
  const insets = useSafeAreaInsets();
  const hasResumableGame = useHasResumableGame();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Determine primary action state based on game store
  const primaryState: PrimaryActionState = hasResumableGame ? 'resume' : 'new_game';

  // Handle primary pill press - always opens menu for both states
  const handlePrimaryPress = useCallback(() => {
    setIsMenuOpen(true);
  }, []);

  // Handle menu item selection
  const handleMenuSelect = useCallback(
    (item: MenuItem) => {
      setIsMenuOpen(false);
      // Small delay to allow menu close animation
      setTimeout(() => {
        switch (item.action) {
          case 'select_difficulty':
            if (item.difficulty) {
              onNewGame(item.difficulty);
            }
            break;
          case 'continue_game':
            onResume();
            break;
          case 'quit_game':
            onQuitGame();
            break;
        }
      }, 100);
    },
    [onNewGame, onResume, onQuitGame]
  );

  // Handle menu dismiss
  const handleMenuDismiss = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  // Close menu when navigating away
  const handleTabPress = useCallback(
    (tab: typeof activeTab) => {
      if (isMenuOpen) {
        setIsMenuOpen(false);
      }
      onTabPress(tab);
    },
    [isMenuOpen, onTabPress]
  );

  return (
    <View
      style={[
        styles.container,
        { bottom: insets.bottom + LAYOUT.bottomOffset },
      ]}
      pointerEvents="box-none"
    >
      {/* Secondary menu (rendered first for z-index) */}
      <SecondaryMenu
        isOpen={isMenuOpen}
        menuType={primaryState}
        onSelect={handleMenuSelect}
        onDismiss={handleMenuDismiss}
      />

      {/* Navigation pills container */}
      <View style={styles.pillsContainer}>
        {/* Left cluster - secondary navigation */}
        <LeftCluster activeTab={activeTab} onTabPress={handleTabPress} />

        {/* Right pill - primary action */}
        <PrimaryActionPill
          state={primaryState}
          onPress={handlePrimaryPress}
          isHidden={isMenuOpen}
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
