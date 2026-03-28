import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useColors } from "../../src/theme/colors";
import { StatsOverview } from "../../src/components/settings";
import { ScreenBackground, ScreenContent, ScreenHeader } from "../../src/components/ui/Layout";

export default function StatsScreen() {
  const c = useColors();
  const [headerHeight, setHeaderHeight] = useState(0);
  const contentStyle = useMemo(
    () => ({ ...styles.scrollContent, paddingTop: headerHeight > 0 ? headerHeight : 70 }),
    [headerHeight],
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.cream }]} edges={["top"]}>
      <ScreenBackground />
      <ScreenContent contentStyle={contentStyle}>
        <StatsOverview />

        <View style={{ height: 40 }} />
      </ScreenContent>
      <ScreenHeader onHeightChange={setHeaderHeight} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: 120,
  },
});
