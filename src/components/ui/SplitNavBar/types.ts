// Type definitions for Split Navigation Bar
import { Difficulty } from '@/src/engine/types';

// Tab types for left cluster (Home, Profile, Settings)
export type SecondaryTab = 'index' | 'profile' | 'settings';

// Primary action button states
export type PrimaryActionState = 'new_game' | 'resume';

// Props for the main SplitNavBar container
export interface SplitNavBarProps {
  activeTab: SecondaryTab;
  onTabPress: (tab: SecondaryTab) => void;
  onNewGame: (difficulty: Difficulty) => void;
  onResume: () => void;
}

// Props for LeftCluster (secondary navigation)
export interface LeftClusterProps {
  activeTab: SecondaryTab;
  onTabPress: (tab: SecondaryTab) => void;
}

// Tab configuration for left cluster
export interface TabConfig {
  name: SecondaryTab;
  icon: string;
  label: string;
}

// Props for PrimaryActionPill
export interface PrimaryActionPillProps {
  state: PrimaryActionState;
  onPress: () => void;
  isHidden?: boolean; // When true, button scales to 0 (unfurl is open)
}

// Props for DifficultyUnfurl menu
export interface DifficultyUnfurlProps {
  isOpen: boolean;
  onSelect: (difficulty: Difficulty) => void;
  onDismiss: () => void;
}

// Props for individual DifficultyRow
export interface DifficultyRowProps {
  difficulty: Difficulty;
  index: number;
  onPress: () => void;
  isVisible: boolean;
  isLast?: boolean;
}

// Layout constants
export const LAYOUT = {
  bottomOffset: 16,
  horizontalPadding: 16,
  leftClusterRadius: 24,
  leftClusterPaddingH: 20,
  leftClusterPaddingV: 12,
  iconSize: 24,
  iconGap: 32,
  rightPillRadius: 24,
  rightPillPaddingH: 24,
  rightPillPaddingV: 14,
  edgeHeight: 4,
  pressDepth: 2,
  unfurlRadius: 24,
  unfurlPadding: 16,
  rowHeight: 56,
  rowGap: 8,
} as const;

// Mochi icon mapping for difficulties (using Feather icons)
export const DIFFICULTY_ICONS: Record<Difficulty, string> = {
  easy: 'smile',
  medium: 'meh',
  hard: 'frown',
  expert: 'zap',
};
