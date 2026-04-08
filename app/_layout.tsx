import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef, useState } from "react";
import { View, StatusBar, AppState, AppStateStatus } from "react-native";
import { muteAllAudio } from "../src/services/audioEmergencyMute";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import "react-native-reanimated";

import { useColors } from "../src/theme/colors";
import { TECHNIQUE_IDS } from "../src/engine/techniqueGenerator";
import {
  prefetchPuzzles,
  prefetchGamePuzzles,
  warmCaches,
} from "../src/services/puzzleCacheService";
import { useTechniqueProgressStore } from "../src/stores/techniqueProgressStore";
import { usePlayerStreakStore } from "../src/stores/playerStreakStore";
import { initRevenueCat } from "../src/lib/revenueCat";
import { usePremiumStore, startPremiumListener } from "../src/stores/premiumStore";
import { preloadInterstitial, preloadRewarded } from "../src/services/adService";
import { useAppRatedStore } from "../src/stores/appRatedStore";
import { runEconomyV2Migration } from "../src/services/economyMigration";
import { getRandomWelcomeMessage } from "../src/constants/welcomeMessages";
import { MochiBurstOverlay } from "../src/components/fx/MochiBurstOverlay";
import { loadSfx } from "../src/services/sfxService";

export let preloadedWelcomeMessage = "";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    "Pally-Regular": require("../assets/fonts/Pally-Regular.otf"),
    "Pally-Medium": require("../assets/fonts/Pally-Medium.otf"),
    "Pally-Bold": require("../assets/fonts/Pally-Bold.otf"),
    ...FontAwesome.font,
  });
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    Promise.all([
      warmCaches(),
      useTechniqueProgressStore.getState().loadState(),
      runEconomyV2Migration().then(() => {
        usePlayerStreakStore.getState().loadState();
        usePlayerStreakStore.getState().applyDailyLoginBonusIfNeeded();
      }),
      getRandomWelcomeMessage().then((msg) => {
        preloadedWelcomeMessage = msg;
      }),
      loadSfx(),
      initRevenueCat(),
    ]).then(() => setDataReady(true));
  }, []);

  useEffect(() => {
    if (loaded && dataReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, dataReady]);

  if (!loaded || !dataReady) {
    return null;
  }

  return <RootLayoutNav />;
}

const PREFETCH_COOLDOWN_MS = 60_000; // 60-second debounce for foreground prefetch

function RootLayoutNav() {
  const c = useColors();
  const lastPrefetchRef = useRef<number>(0);

  /** SFX preloaded in RootLayout Promise.all (splash-blocking). */

  useEffect(() => {
    useAppRatedStore.getState().setRated(false);
  }, []);

  useEffect(() => {
    prefetchGamePuzzles(["easy", "medium", "hard", "expert"]);
    prefetchPuzzles(Object.keys(TECHNIQUE_IDS));
    usePlayerStreakStore.getState().syncFromRemote();
    usePremiumStore.getState().syncStatus();
    startPremiumListener();
    preloadInterstitial();
    preloadRewarded();
  }, []);

  useEffect(() => {
    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === "inactive" || state === "background") {
        void muteAllAudio();
      }
      if (state === "active") {
        const now = Date.now();
        if (now - lastPrefetchRef.current > PREFETCH_COOLDOWN_MS) {
          lastPrefetchRef.current = now;
          prefetchPuzzles(Object.keys(TECHNIQUE_IDS));
          prefetchGamePuzzles(["easy", "medium", "hard", "expert"]);
        }
      }
    };
    const sub = AppState.addEventListener("change", handleAppStateChange);
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <View style={{ flex: 1, backgroundColor: c.cream }}>
        <StatusBar barStyle="dark-content" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: c.cream },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="game"
            options={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="modal"
            options={{
              presentation: "modal",
              headerShown: true,
              headerTitle: "Select Difficulty",
              headerStyle: { backgroundColor: c.cream },
              headerTintColor: c.textPrimary,
            }}
          />
          <Stack.Screen
            name="techniques/index"
            options={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="techniques/[id]"
            options={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="feedback"
            options={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="info"
            options={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="tutorial"
            options={{
              headerShown: false,
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="end-game"
            options={{
              headerShown: false,
              animation: "fade",
            }}
          />
        </Stack>
        <MochiBurstOverlay />
      </View>
    </SafeAreaProvider>
  );
}
