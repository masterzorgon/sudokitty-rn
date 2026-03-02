// Charity Policy screen — explains 1% revenue donation and lists supported charities

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { colors, useColors } from '../src/theme/colors';
import { typography, fontFamilies } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme';
import { BackButton } from '../src/components/ui/BackButton';
import { SpeechBubble } from '../src/components/ui/Typography/SpeechBubble';
import { SettingsSection, SettingsLinkRow } from '../src/components/settings';
import { SkeuButton } from '../src/components/ui/Skeuomorphic';
import { trackExternalLinkOpened } from '../src/utils/analytics';
import { playFeedback } from '../src/utils/feedback';
import { getMochiPackProducts, purchaseMochiPack } from '../src/lib/revenueCat';
import MochiPointIcon from '../assets/images/icons/mochi-point.svg';

import { CHARITIES } from '../src/constants/charities';
import { ScreenBackground } from '@/src/components/ui';

const MochiTeacherImg = require('../assets/images/mochi/mochi-teacher.png');

const CHARITY_POLICY_EXCERPT =
  'We believe every kitty deserves a loving home. That\'s why Sudokitty donates 1% of all app revenue to organizations that rescue and care for kittens in need. Your support through purchases and subscriptions helps fund food, veterinary care, and adoption programs for cats awaiting their forever families.';

const MASCOT_SIZE = 160;

export default function CharityPolicyScreen() {
  const c = useColors();

  const handleCharityPress = useCallback(async (charity: { id: string; name: string; url: string }) => {
    try {
      trackExternalLinkOpened('charity_' + charity.id);
      await Linking.openURL(charity.url);
    } catch {
      Alert.alert('Error', 'Unable to open the link.');
    }
  }, []);

  const [purchasing, setPurchasing] = useState(false);

  const onSupportPurchase = useCallback(async () => {
    playFeedback('tap');
    setPurchasing(true);
    try {
      const products = await getMochiPackProducts();
      const product = products.find((p) => p.identifier === 'mochis_100');
      if (!product) {
        Alert.alert(
          'Unavailable',
          'Mochi packs are not available right now. Please try again later.',
        );
        return;
      }
      const result = await purchaseMochiPack(product);
      if (result.success) {
        Alert.alert(
          'Thank You!',
          `You received ${result.amount?.toLocaleString() ?? 100} mochis. 1% of your purchase supports rescued kittens. 🐱`,
        );
      }
    } catch {
      Alert.alert(
        'Purchase Failed',
        'Something went wrong. Please try again later.',
      );
    } finally {
      setPurchasing(false);
    }
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.cream }]} edges={['top', 'bottom']}>
      <ScreenBackground />
      {/* Header: [ BackButton | Title | spacer ] */}
      <View style={styles.header}>
        <BackButton />
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: c.textPrimary }]}>Charity Policy</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Mochi mascot with speech bubble */}
        <View style={styles.mascotSection}>
          <View style={styles.imageContainer}>
            <Image
              source={MochiTeacherImg}
              style={{ width: MASCOT_SIZE, height: MASCOT_SIZE }}
              contentFit="contain"
            />
          </View>
          <View style={styles.bubbleWrapper}>
            <SpeechBubble
              text={CHARITY_POLICY_EXCERPT}
              pointerDirection="up"
              pointerPosition={0.5}
              scrollable
              style={styles.bubbleConstraint}
              textStyle={StyleSheet.flatten([styles.bubbleText, { color: c.textSecondary }])}
            />
          </View>
        </View>

        {/* Charities section */}
        <SettingsSection title="Charities We Support">
          {CHARITIES.map((charity, index) => (
            <SettingsLinkRow
              key={charity.id}
              label={charity.name}
              isExternal
              onPress={() => handleCharityPress(charity)}
              isLast={index === CHARITIES.length - 1}
            />
          ))}
        </SettingsSection>
      </ScrollView>

      {/* Support CTA — fixed at bottom, same spacing as ShowcasePage */}
      <View style={styles.supportButtonContainer}>
        <SkeuButton
          variant="primary"
          borderRadius={borderRadius.xl}
          sheen
          onPress={onSupportPurchase}
          disabled={purchasing}
          style={styles.supportButton}
          contentStyle={styles.supportButtonContent}
          accessibilityLabel="Buy 100 mochis to support kittens"
        >
          {purchasing ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <View style={styles.supportButtonRow}>
              <Text style={styles.supportButtonText}>Get </Text>
              <MochiPointIcon width={22} height={22} color={colors.white} />
              <Text style={styles.supportButtonText}> 100 Mochis and Support Kittens</Text>
            </View>
          )}
        </SkeuButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerSpacer: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.headline,
    fontSize: 18,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  mascotSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  bubbleWrapper: {
    width: '100%',
  },
  bubbleConstraint: {
    maxHeight: 150,
  },
  bubbleText: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  supportButtonContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  supportButton: {
    width: '100%',
  },
  supportButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  supportButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  supportButtonText: {
    fontFamily: fontFamilies.bold,
    fontSize: 16,
    color: colors.white,
  },
});
