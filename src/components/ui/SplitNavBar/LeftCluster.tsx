import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useColors } from '@/src/theme/colors';
import { triggerHaptic, ImpactFeedbackStyle } from '@/src/utils/haptics';
import { springConfigs } from '@/src/theme/animations';
import { LeftClusterProps, TabConfig, LAYOUT } from './types';
import { Skeu3D } from '../Skeuomorphic';
import type { CustomSkeuColors } from '../Skeuomorphic';
import { borderRadius } from '@/src/theme';

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
        color={isActive ? c.mochiPillText : c.mochiPillBorder}
      />
    </AnimatedPressable>
  );
}

export function LeftCluster({ activeTab, onTabPress }: LeftClusterProps) {
  const c = useColors();

  const skeuColors: CustomSkeuColors = {
    gradient: [c.mochiPillBg, c.mochiPillBg, c.mochiPillBg] as readonly [string, string, string],
    edge: c.mochiPillEdge,
    borderLight: 'rgba(255, 255, 255, 0.5)',
    borderDark: c.mochiPillBorder + '80',
    textColor: c.mochiPillText,
  };

  return (
    <Skeu3D
      customColors={skeuColors}
      // borderRadius={LAYOUT.rightPillRadius}
      borderRadius={borderRadius.lg}
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
