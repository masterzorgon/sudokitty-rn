// Home screen - Landing page with mochi cat mascot and animated greeting

import React, { useCallback, useEffect, useState } from "react";
import { View, Image, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { playFeedback } from "../../src/utils/feedback";

import { useColors } from "../../src/theme/colors";
import { fontFamilies } from "../../src/theme/typography";
import { spacing, SCREEN_PADDING } from "../../src/theme";
import { usePlayerStreakStore, useCurrentStreak } from "../../src/stores/playerStreakStore";
import { MochiCat, TechniquesCTA, StreakPill } from "../../src/components/home";
import { ScreenBackground } from "../../src/components/ui/Layout/ScreenBackground";
import { ScreenHeader } from "../../src/components/ui/Layout/ScreenHeader";
import { SpeechBubble } from "../../src/components/ui/Typography/SpeechBubble";
import { PurchaseSheet, type PurchaseSheetConfig } from "../../src/components/store/PurchaseSheet";
import { preloadedWelcomeMessage } from "../_layout";
import { getMochiPackProducts } from "../../src/lib/revenueCat";
import { MOCHI_PACK_AMOUNTS, type MochiPackProductId } from "../../src/constants/economy";

const MochiFreezeImg = require("../../assets/images/mochi/mochi-freeze.png");

const ESTIMATED_HEADER_CONTENT_HEIGHT = 50;
const CTA_BOTTOM_OFFSET = 16 + 52 + 20; // 88px from safe area bottom

export default function HomeScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [headerHeight, setHeaderHeight] = useState(ESTIMATED_HEADER_CONTENT_HEIGHT);

  const currentStreak = useCurrentStreak();
  const streakLostInfo = usePlayerStreakStore((s) => s.streakLostInfo);
  const reigniteStreak = usePlayerStreakStore((s) => s.reigniteStreak);
  const clearStreakLostInfo = usePlayerStreakStore((s) => s.clearStreakLostInfo);
  const totalMochis = usePlayerStreakStore((s) => s.totalMochiPoints);

  const [sheetConfig, setSheetConfig] = useState<PurchaseSheetConfig | null>(null);

  const [welcomeMessage] = useState(preloadedWelcomeMessage);

  const handleInsufficientFunds = useCallback(
    async (itemPrice: number) => {
      const deficit = itemPrice - totalMochis;
      const sortedAmounts = Object.entries(MOCHI_PACK_AMOUNTS).sort(([, a], [, b]) => a - b);

      const targetPack = sortedAmounts.find(([, amount]) => amount >= deficit);
      const packId = (
        targetPack ? targetPack[0] : sortedAmounts[sortedAmounts.length - 1][0]
      ) as MochiPackProductId;

      const packProducts = await getMochiPackProducts();
      const product = packProducts.find((p) => p.identifier === packId);
      if (!product) {
        router.push("/store");
        return;
      }

      router.push("/store");
    },
    [totalMochis, router],
  );

  useEffect(() => {
    if (streakLostInfo) {
      setSheetConfig({
        image: (
          <Image source={MochiFreezeImg} style={{ width: 160, height: 160 }} resizeMode="contain" />
        ),
        title: `Reignite your ${streakLostInfo.previousStreak}-day streak?`,
        price: streakLostInfo.reigniteCost,
        currency: "mochis",
        buttonLabel: `Reignite for ${streakLostInfo.reigniteCost}`,
        onConfirm: () => {
          reigniteStreak();
        },
        onInsufficientFunds: () => handleInsufficientFunds(streakLostInfo.reigniteCost),
      });
    }
  }, [streakLostInfo, reigniteStreak, handleInsufficientFunds]);

  const handleTechniquesPress = () => {
    playFeedback("tap");
    router.push("/techniques");
  };

  const handleStreakPress = () => {
    playFeedback("tap");
    router.push("/(tabs)/stats");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.cream }]} edges={["top"]}>
      <ScreenBackground />

      <View style={[styles.content, { paddingTop: headerHeight }]}>
        <View style={styles.heroSection}>
          <Animated.View
            entering={FadeInDown.delay(200).duration(500).springify()}
            style={styles.catContainer}
          >
            <MochiCat size={180} variant="welcome" />
          </Animated.View>

          {welcomeMessage ? (
            <Animated.View
              entering={FadeInUp.delay(400).duration(400).springify()}
              style={styles.bubbleContainer}
            >
              <SpeechBubble
                text={welcomeMessage}
                pointerDirection="up"
                textStyle={styles.bubbleText}
              />
            </Animated.View>
          ) : null}
        </View>

        <Animated.View entering={FadeInUp.delay(800).duration(400)} style={styles.streakContainer}>
          <StreakPill streakCount={currentStreak} onPress={handleStreakPress} />
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeInDown.delay(1000).duration(400)}
        style={[styles.ctaSection, { bottom: insets.bottom + CTA_BOTTOM_OFFSET }]}
      >
        <View style={styles.ctaStack}>
          <TechniquesCTA onPress={handleTechniquesPress} />
        </View>
      </Animated.View>

      <ScreenHeader onHeightChange={setHeaderHeight} />

      <PurchaseSheet
        config={sheetConfig}
        onDismiss={() => {
          setSheetConfig(null);
          clearStreakLostInfo();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SCREEN_PADDING,
  },
  heroSection: {
    alignItems: "center",
    marginTop: spacing.xxl + spacing.xl,
  },
  catContainer: {},
  streakContainer: {
    marginTop: spacing.xl,
    alignItems: "center",
  },
  ctaSection: {
    position: "absolute",
    left: SCREEN_PADDING,
    right: SCREEN_PADDING,
  },
  ctaStack: {
    gap: spacing.md,
  },
  bubbleContainer: {
    alignItems: "center",
    marginTop: spacing.lg,
  },
  bubbleText: {
    fontFamily: fontFamilies.medium,
    fontSize: 20,
    color: "#8b7878",
    paddingVertical: spacing.md,
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    lineHeight: 24,
  },
});
