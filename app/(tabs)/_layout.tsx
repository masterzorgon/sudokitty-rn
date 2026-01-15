import React from 'react';
import { Tabs, useRouter } from 'expo-router';

import { SplitNavBar, SecondaryTab } from '@/src/components/ui/SplitNavBar';
import { useGameStore } from '@/src/stores/gameStore';
import { startGameAnimations } from '@/src/theme/animations';
import { Difficulty } from '@/src/engine/types';

export default function TabLayout() {
  const router = useRouter();
  const resumeGame = useGameStore((s) => s.resumeGame);
  const startTimer = useGameStore((s) => s.startTimer);

  // Handle new game - navigate to game screen with difficulty
  const handleNewGame = (difficulty: Difficulty) => {
    router.push({
      pathname: '/game',
      params: { difficulty },
    });
  };

  // Handle resume - resume existing game and navigate
  const handleResume = () => {
    resumeGame();
    router.push('/game');
    // Start timer after navigation animations
    setTimeout(() => {
      startTimer();
    }, startGameAnimations.controlsDelay);
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
      tabBar={(props) => {
        // Map route name to SecondaryTab, filtering out 'daily'
        const routeName = props.state.routes[props.state.index].name;
        // Default to 'index' if current route isn't a secondary tab
        const activeTab: SecondaryTab =
          routeName === 'index' || routeName === 'profile' || routeName === 'settings'
            ? routeName
            : 'index';

        return (
          <SplitNavBar
            activeTab={activeTab}
            onTabPress={(tab) => {
              const event = props.navigation.emit({
                type: 'tabPress',
                target: tab,
                canPreventDefault: true,
              });
              if (!event.defaultPrevented) {
                props.navigation.navigate(tab);
              }
            }}
            onNewGame={handleNewGame}
            onResume={handleResume}
          />
        );
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="daily" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
