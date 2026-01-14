// Animated game view - renders the Sudoku board with entrance animation
// Board is positioned in the middle zone, pushed toward the bottom

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SudokuBoard } from '../board';

export const AnimatedGameView = () => {
  return (
    <View style={styles.boardContainer}>
      <SudokuBoard animateEntrance />
    </View>
  );
};

const styles = StyleSheet.create({
  boardContainer: {
    // Board sits at the bottom of the middle zone
  },
});
