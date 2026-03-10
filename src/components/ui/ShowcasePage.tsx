// ShowcasePage - Reusable hero-image + text layout
// Used for technique overview, technique completion, onboarding screens, etc.
// The mascot peeks over a gradient container that bleeds into the background.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '../../theme/colors';
import { typography, fontFamilies } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import { BottomActionBar } from './Layout/BottomActionBar';
import { AppButton } from './AppButton';
import { SpeechBubble } from './Typography/SpeechBubble';

export interface ShowcasePageBadge {
  label: string;
  color: string;
}

export interface ShowcasePageAction {
  label: string;
  onPress: () => void;
  icon?: string;
  iconPosition?: 'left' | 'right';
}

export interface ShowcasePageProps {
  heading: string;
  badge?: ShowcasePageBadge;
  mascotImage: React.ReactNode;
  bodyText: string;
  action?: ShowcasePageAction;
  rewardPill?: React.ReactNode;
}

const GRADIENT_HEIGHT = 500;
const SECTION_HEIGHT = 320;

export function ShowcasePage({
  heading,
  badge,
  mascotImage,
  bodyText,
  action,
  rewardPill,
}: ShowcasePageProps) {
  const c = useColors();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {rewardPill && (
          <View style={styles.rewardPillContainer}>
            {rewardPill}
          </View>
        )}
        <View style={styles.mascotSection}>
          <LinearGradient
            colors={[c.cream, c.showcaseGradient[2], c.showcaseGradient[1], c.showcaseGradient[0]]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.gradientBar}
          />
          <View style={styles.headingArea}>
            <Text style={[styles.heading, { color: c.textPrimary }]}>{heading}</Text>
            {badge && (
              <View style={[styles.badge, { backgroundColor: badge.color + '20' }]}>
                <Text style={[styles.badgeText, { color: badge.color }]}>
                  {badge.label}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.mascotCharacter}>
            {mascotImage}
          </View>
        </View>

        <SpeechBubble
          text={bodyText}
          pointerDirection="up"
          style={styles.bubbleOverride}
        />
      </View>

      {action && (
        <BottomActionBar style={styles.actionBar}>
          <AppButton
            onPress={action.onPress}
            label={action.label}
            icon={action.icon}
            iconPosition={action.iconPosition}
          />
        </BottomActionBar>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  mascotSection: {
    width: '85%',
    height: SECTION_HEIGHT,
    overflow: 'hidden',
    borderRadius: borderRadius.xl,
    marginVertical: spacing.md,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardPillContainer: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  headingArea: {
    zIndex: 2,
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.md,
  },
  heading: {
    ...typography.largeTitle,
    textAlign: 'center',
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: fontFamilies.bold,
  },
  mascotCharacter: {
    zIndex: 1,
    marginBottom: -40,
  },
  gradientBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: GRADIENT_HEIGHT,
  },
  bubbleOverride: {
    width: '100%',
  },
  actionBar: {
    paddingHorizontal: 0,
  },
});
