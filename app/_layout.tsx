import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { View, StatusBar, AppState, AppStateStatus } from 'react-native';
import 'react-native-reanimated';

import { colors } from '../src/theme/colors';
import { TECHNIQUE_IDS } from '../src/engine/techniqueGenerator';
import { prefetchPuzzles, prefetchGamePuzzles } from '../src/services/puzzleCacheService';

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
    // Open Runde - rounded variant of Inter for soft, friendly aesthetic
    'OpenRunde-Regular': require('../assets/fonts/OpenRunde-Regular.otf'),
    'OpenRunde-Medium': require('../assets/fonts/OpenRunde-Medium.otf'),
    'OpenRunde-Semibold': require('../assets/fonts/OpenRunde-Semibold.otf'),
    'OpenRunde-Bold': require('../assets/fonts/OpenRunde-Bold.otf'),
    // Legacy font (can be removed if unused)
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

const PREFETCH_COOLDOWN_MS = 60_000; // 60-second debounce for foreground prefetch

function RootLayoutNav() {
  const lastPrefetchRef = useRef<number>(0);

  // Prefetch caches on initial mount
  useEffect(() => {
    prefetchGamePuzzles(['easy', 'medium', 'hard', 'expert']);
    prefetchPuzzles(Object.keys(TECHNIQUE_IDS));
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
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <StatusBar barStyle="dark-content" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.cream },
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
            headerStyle: { backgroundColor: colors.cream },
            headerTintColor: colors.textPrimary,
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
      </Stack>
    </View>
  );
}
