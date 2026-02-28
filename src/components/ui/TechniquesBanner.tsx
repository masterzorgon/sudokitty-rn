import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '../../theme/colors';
import { typography, fontFamilies } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import { SkeuCard, SkeuButton } from './Skeuomorphic';
import { playFeedback } from '../../utils/feedback';
import { presentPaywallAlways } from '../../lib/revenueCat';

const MochiStarsImg = require('../../../assets/images/mochi/mochi-stars.png');

export function TechniquesBanner() {
  const c = useColors();

  return (
    <SkeuCard
      borderRadius={borderRadius.lg}
      contentStyle={styles.card}
      style={styles.wrapper}
      accessibilityLabel="Unlock sudoku techniques"
    >
      <LinearGradient
        colors={[c.boardBackground, c.accentLight + '10', c.buttonPrimary + '40']}
        locations={[1, 0.55, 0]}
        style={styles.gradientOverlay}
        pointerEvents="none"
      />

      <View style={styles.row}>
        <View style={styles.textArea}>
          <Text style={[styles.badge, { color: c.mochiPillText, backgroundColor: c.mochiPillBorder + '40' }]}>
            SUDOKU TECHNIQUES
          </Text>
          <Text style={[styles.title, { color: c.textPrimary }]}>
            level up your solving skills
          </Text>
        </View>
        <View style={styles.imageArea}>
          <Image source={MochiStarsImg} style={styles.mochiImage} />
        </View>
      </View>
      <SkeuButton
        onPress={async () => { playFeedback('tap'); await presentPaywallAlways(); }}
        variant="primary"
        sheen
        borderRadius={borderRadius.md}
        contentStyle={styles.unlockBtnContent}
        style={styles.unlockBtn}
        accessibilityLabel="Unlock all sudoku techniques"
      >
        <Text style={styles.learnMoreText}>UNLOCK ALL TECHNIQUES</Text>
      </SkeuButton>
    </SkeuCard>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  card: {
    padding: spacing.lg,
    overflow: 'hidden',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.lg,
    margin: -spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textArea: {
    flex: 1,
    marginRight: spacing.md,
  },
  badge: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    letterSpacing: 1,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.headline,
    marginBottom: spacing.xs,
  },
  imageArea: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  mochiImage: {
    width: 120,
    height: 120,
    marginRight: spacing.xl + spacing.sm,
    resizeMode: 'contain',
    marginBottom: -spacing.md - spacing.sm,
  },
  unlockBtn: {
    marginTop: 0,
  },
  unlockBtnContent: {
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  learnMoreText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
