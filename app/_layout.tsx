import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { View, StatusBar, AppState, AppStateStatus } from 'react-native';
import 'react-native-reanimated';

import { useColors } from '../src/theme/colors';
import { TECHNIQUE_IDS } from '../src/engine/techniqueGenerator';
import { prefetchPuzzles, prefetchGamePuzzles, warmCaches } from '../src/services/puzzleCacheService';
import { useTechniqueProgressStore } from '../src/stores/techniqueProgressStore';
import { usePlayerStreakStore } from '../src/stores/playerStreakStore';
import { initRevenueCat } from '../src/lib/revenueCat';
import { usePremiumStore, startPremiumListener } from '../src/stores/premiumStore';
import { configureAudioSession } from '../src/services/audioService';
import { preloadInterstitial, preloadRewarded } from '../src/services/adService';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Pally - soft, rounded display font
    'Pally-Regular': require('../assets/fonts/Pally-Regular.otf'),
    'Pally-Medium': require('../assets/fonts/Pally-Medium.otf'),
    'Pally-Bold': require('../assets/fonts/Pally-Bold.otf'),
    ...FontAwesome.font,
  });
  const [dataReady, setDataReady] = useState(false);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  // Warm caches and hydrate technique progress before hiding splash
  useEffect(() => {
    Promise.all([
      warmCaches(),
      useTechniqueProgressStore.getState().loadState(),
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

  // Prefetch caches, sync streaks, init audio, and init RevenueCat on mount
  useEffect(() => {
    prefetchGamePuzzles(['easy', 'medium', 'hard', 'expert']);
    prefetchPuzzles(Object.keys(TECHNIQUE_IDS));
    // Pull remote streak data (background, best-effort)
    usePlayerStreakStore.getState().syncFromRemote();
    // Configure audio session for background music
    configureAudioSession();
    // RevenueCat: init -> sync entitlements -> start real-time listener
    initRevenueCat().then(() => {
      usePremiumStore.getState().syncStatus();
      startPremiumListener();
    });
    // Preload ads so they're ready when needed
    preloadInterstitial();
    preloadRewarded();
  }, []);

  // Re-prefetch puzzle cache when the app returns to the foreground
  useEffect(() => {
    const handleAppStateChange = (state: AppStateStatus) => {
      if (state === 'active') {
        const now = Date.now();
        if (now - lastPrefetchRef.current > PREFETCH_COOLDOWN_MS) {
          lastPrefetchRef.current = now;
          prefetchPuzzles(Object.keys(TECHNIQUE_IDS));
          prefetchGamePuzzles(['easy', 'medium', 'hard', 'expert']);
        }
      }
    };
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, []);

  return (
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
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Select Difficulty',
            headerStyle: { backgroundColor: c.cream },
            headerTintColor: c.textPrimary,
          }}
        />
        <Stack.Screen
          name="techniques/index"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="techniques/[id]"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="feedback"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="info"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="tutorial"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </View>
  );
}
