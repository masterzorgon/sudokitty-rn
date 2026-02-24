// Left side secondary navigation cluster
// Contains Home, Profile, and Settings icons

import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { colors, useColors } from '@/src/theme/colors';
import { triggerHaptic, ImpactFeedbackStyle } from '@/src/utils/haptics';
import { springConfigs } from '@/src/theme/animations';
import { useCardSkeuColors } from '@/src/theme/skeuomorphic';
import { LeftClusterProps, TabConfig, LAYOUT } from './types';
import { Skeu3D } from '../Skeuomorphic';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Tab configuration
const tabs: TabConfig[] = [
  { name: 'index', icon: 'home', label: 'home' },
  { name: 'store', icon: 'shopping-bag', label: 'store' },
  { name: 'settings', icon: 'user', label: 'settings' },
];

interface NavIconProps {
  tab: TabConfig;
  isActive: boolean;
  onPress: () => void;
}

function NavIcon({ tab, isActive, onPress }: NavIconProps) {
  const c = useColors();
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
    triggerHaptic(ImpactFeedbackStyle.Light);
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
        color={isActive ? c.accent : colors.navInactive}
      />
    </AnimatedPressable>
  );
}

export function LeftCluster({ activeTab, onTabPress }: LeftClusterProps) {
  const cardColors = useCardSkeuColors();
  return (
    <Skeu3D
      variant="secondary"
      customColors={cardColors}
      borderRadius={LAYOUT.rightPillRadius}
      showHighlight={false}
      faceStyle={styles.container}
    >
      {tabs.map((tab) => (
        <NavIcon
          key={tab.name}
          tab={tab}
          isActive={activeTab === tab.name}
          onPress={() => onTabPress(tab.name)}
        />
      ))}
    </Skeu3D>
  );
}

const styles = StyleSheet.create({
  container: {
    width: LAYOUT.pillWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: LAYOUT.iconGap,
    paddingVertical: LAYOUT.rightPillPaddingV,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
