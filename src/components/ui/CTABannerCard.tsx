import React from 'react';
import { View, Text, Image, StyleSheet, type ImageSourcePropType, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useColors } from '../../theme/colors';
import { typography, fontFamilies } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import { SkeuCard, SkeuButton } from './Skeuomorphic';
import { playFeedback } from '../../utils/feedback';

const MochiStarsImg = require('../../../assets/images/mochi/mochi-stars.png');

interface CTABannerCardProps {
  badge: string;
  title: string;
  buttonLabel: string | React.ReactNode;
  onPress: () => void;
  image?: ImageSourcePropType;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

export function CTABannerCard({
  badge,
  title,
  buttonLabel,
  onPress,
  image = MochiStarsImg,
  accessibilityLabel,
  style,
}: CTABannerCardProps) {
  const c = useColors();

  return (
    <SkeuCard
      borderRadius={borderRadius.lg}
      contentStyle={styles.card}
      style={style}
      accessibilityLabel={accessibilityLabel ?? badge}
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
            {badge}
          </Text>
          <Text style={[styles.title, { color: c.textPrimary }]}>
            {title}
          </Text>
        </View>
        <View style={styles.imageArea}>
          <Image source={image} style={styles.mochiImage} />
        </View>
      </View>
      <SkeuButton
        onPress={() => { playFeedback('tap'); onPress(); }}
        variant="primary"
        sheen
        borderRadius={borderRadius.md}
        contentStyle={styles.btnContent}
        style={styles.btn}
        accessibilityLabel={typeof buttonLabel === 'string' ? buttonLabel : undefined}
      >
        {typeof buttonLabel === 'string' ? (
          <Text style={styles.btnText}>{buttonLabel}</Text>
        ) : (
          buttonLabel
        )}
      </SkeuButton>
    </SkeuCard>
  );
}

const styles = StyleSheet.create({
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
  btn: {
    marginTop: 0,
  },
  btnContent: {
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
