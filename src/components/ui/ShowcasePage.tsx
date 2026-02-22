// ShowcasePage - Reusable hero-image + text layout
// Used for technique overview, technique completion, onboarding screens, etc.
// The mascot peeks over a gradient container that bleeds into the background.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, useColors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import { AppButton } from './AppButton';
import { SpeechBubble } from './SpeechBubble';

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
}

const GRADIENT_HEIGHT = 500;
const SECTION_HEIGHT = 320;

export function ShowcasePage({
  heading,
  badge,
  mascotImage,
  bodyText,
  action,
}: ShowcasePageProps) {
  const c = useColors();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.mascotSection}>
          <LinearGradient
            colors={[c.cream, c.showcaseGradient[2], c.showcaseGradient[1], c.showcaseGradient[0]]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.gradientBar}
          />
          <View style={styles.headingArea}>
            <Text style={styles.heading}>{heading}</Text>
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
        <View style={styles.actionContainer}>
          <AppButton
            onPress={action.onPress}
            label={action.label}
            icon={action.icon}
            iconPosition={action.iconPosition}
          />
        </View>
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
  headingArea: {
    zIndex: 2,
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xl,
  },
  heading: {
    ...typography.largeTitle,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: 13,
    fontFamily: 'Pally-Bold',
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
  actionContainer: {
    paddingBottom: spacing.xl,
  },
});
