// Left side secondary navigation cluster
// Contains Home, Profile, and Settings icons

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors } from '@/src/theme/colors';
import { springConfigs } from '@/src/theme/animations';
import { LeftClusterProps, SecondaryTab, TabConfig, LAYOUT } from './types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Tab configuration
const tabs: TabConfig[] = [
  { name: 'index', icon: 'home', label: 'Home' },
  { name: 'profile', icon: 'bar-chart-2', label: 'Stats' },
  { name: 'settings', icon: 'settings', label: 'Settings' },
];

interface NavIconProps {
  tab: TabConfig;
  isActive: boolean;
  onPress: () => void;
}

function NavIcon({ tab, isActive, onPress }: NavIconProps) {
  const scale = useSharedValue(isActive ? 1.08 : 1);
  const opacity = useSharedValue(isActive ? 1 : 0.7);

  React.useEffect(() => {
    scale.value = withSpring(isActive ? 1.08 : 1, springConfigs.quick);
    opacity.value = withSpring(isActive ? 1 : 0.7, springConfigs.quick);
  }, [isActive, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      hitSlop={12}
      style={[styles.iconContainer, animatedStyle]}
    >
      <Feather
        name={tab.icon as keyof typeof Feather.glyphMap}
        size={LAYOUT.iconSize}
        color={isActive ? colors.softOrange : colors.navInactive}
      />
    </AnimatedPressable>
  );
}

export function LeftCluster({ activeTab, onTabPress }: LeftClusterProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <NavIcon
          key={tab.name}
          tab={tab}
          isActive={activeTab === tab.name}
          onPress={() => onTabPress(tab.name)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: LAYOUT.iconGap,
    backgroundColor: colors.cream,
    borderRadius: LAYOUT.leftClusterRadius,
    paddingHorizontal: LAYOUT.leftClusterPaddingH,
    paddingVertical: LAYOUT.leftClusterPaddingV,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
