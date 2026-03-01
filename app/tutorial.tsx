import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { colors, useColors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing } from '../src/theme';
import { BackButton } from '../src/components/ui/BackButton';
import { ScreenBackground } from '../src/components/ui/Layout/ScreenBackground';

import { Image } from 'expo-image';

const MochiTeacherImg = require('../assets/images/mochi/mochi-teacher.png');

const MASCOT_SIZE = 180;

const SECTIONS = [
  {
    title: 'Use Numbers 1-9',
    body: 'Sudoku is played on a grid of 9 x 9 spaces. Within the rows and columns are 9 "squares" (made up of 3 x 3 spaces). Each row, column and square (9 spaces each) needs to be filled out with the numbers 1-9, without repeating any numbers within the row, column or square.',
  },
  {
    title: "Don't Repeat Any Numbers",
    body: 'By seeing which numbers are missing from each square, row, or column, we can use process of elimination and deductive reasoning to decide which numbers need to go in each blank space.',
  },
  {
    title: "Don't Guess",
    body: "Sudoku is a game of logic and reasoning, so you shouldn't have to guess. If you don't know what number to put in a certain space, keep scanning the other areas of the grid until you see an opportunity to place a number. Sudoku rewards patience, insights, and recognition of patterns, not blind luck or guessing.",
  },
  {
    title: 'Use Process of Elimination',
    body: 'Find out which spaces are available, which numbers are missing — and then deduce, based on the position of those numbers within the grid, which numbers fit into each space.',
  },
] as const;

export default function TutorialScreen() {
  const router = useRouter();
  const c = useColors();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.cream }]} edges={['top']}>
      <ScreenBackground />

      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>how to play</Text>

        <View style={styles.mascotContainer}>
          <Image source={MochiTeacherImg} style={{ width: MASCOT_SIZE, height: MASCOT_SIZE }} contentFit="contain" />
        </View>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  heading: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  mascotContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.headline,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sectionBody: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
});
