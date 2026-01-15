import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors } from '@/src/theme/colors';
import { springConfigs } from '@/src/theme/animations';

export type TabName = 'index' | 'daily' | 'profile' | 'settings';

interface FloatingNavBarProps {
  activeTab: TabName;
  onTabPress: (tab: TabName) => void;
}

interface TabConfig {
  name: TabName;
  icon: keyof typeof Feather.glyphMap;
  label: string;
}

const tabs: TabConfig[] = [
  { name: 'index', icon: 'home', label: 'Home' },
  { name: 'daily', icon: 'play-circle', label: 'Play' },
  { name: 'profile', icon: 'bar-chart-2', label: 'Stats' },
  { name: 'settings', icon: 'settings', label: 'Settings' },
];

interface NavItemProps {
  tab: TabConfig;
  isActive: boolean;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function NavItem({ tab, isActive, onPress }: NavItemProps) {
  const scale = useSharedValue(isActive ? 1.08 : 1);
  const opacity = useSharedValue(isActive ? 1 : 0.7);

  React.useEffect(() => {
    scale.value = withSpring(isActive ? 1.08 : 1, springConfigs.quick);
    opacity.value = withSpring(isActive ? 1 : 0.7, springConfigs.quick);
  }, [isActive, scale, opacity]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
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
      style={[styles.navItem, animatedContainerStyle]}
    >
      <Animated.View style={styles.iconContainer}>
        <Feather
          name={tab.icon}
          size={26}
          color={isActive ? colors.softOrange : colors.navInactive}
        />
      </Animated.View>
    </AnimatedPressable>
  );
}

export function FloatingNavBar({ activeTab, onTabPress }: FloatingNavBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { bottom: insets.bottom + 16 }]}>
      <View style={styles.pill}>
        {tabs.map((tab) => (
          <NavItem
            key={tab.name}
            tab={tab}
            isActive={activeTab === tab.name}
            onPress={() => onTabPress(tab.name)}
          />
        ))}
        {/* 
          primary action button to start a new game
          should be a pill button that says "New Game"
          should be filled with the primary color
        */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
    borderWidth: 1,
    borderColor: 'blue',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 36,
    backgroundColor: colors.cream,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'red',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
