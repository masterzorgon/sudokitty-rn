import React from "react";
import { Tabs, useRouter } from "expo-router";

import { SplitNavBar, SecondaryTab } from "@/src/components/ui/SplitNavBar";
import { useGameStore } from "@/src/stores/gameStore";
import { Difficulty } from "@/src/engine/types";

export default function TabLayout() {
  const router = useRouter();
  const resumeGame = useGameStore((s) => s.resumeGame);
  const resetGame = useGameStore((s) => s.resetGame);

  const handleNewGame = (difficulty: Difficulty) => {
    router.push({
      pathname: "/game",
      params: { difficulty },
    });
  };

  const handleResume = () => {
    resumeGame();
    router.push("/game");
  };

  const handleQuitGame = () => {
    resetGame();
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
        lazy: false,
        /**
         * detachInactiveScreens: false forces react-native-screens to use a JS fallback (display:none
         * on inactive tabs) — toggling to flex on focus causes a visible layout jump. Keep default true.
         * @see https://github.com/software-mansion/react-native-screens/blob/main/src/components/Screen.tsx
         */
        freezeOnBlur: false,
      }}
      tabBar={(props) => {
        const routeName = props.state.routes[props.state.index].name;
        const activeTab: SecondaryTab =
          routeName === "index" ||
          routeName === "store" ||
          routeName === "settings" ||
          routeName === "stats"
            ? routeName
            : "index";

        return (
          <SplitNavBar
            activeTab={activeTab}
            onTabPress={(tab) => {
              const event = props.navigation.emit({
                type: "tabPress",
                target: tab,
                canPreventDefault: true,
              });
              if (!event.defaultPrevented) {
                props.navigation.navigate(tab);
              }
            }}
            onNewGame={handleNewGame}
            onResume={handleResume}
            onQuitGame={handleQuitGame}
          />
        );
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="daily" />
      <Tabs.Screen name="stats" />
      <Tabs.Screen name="store" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
