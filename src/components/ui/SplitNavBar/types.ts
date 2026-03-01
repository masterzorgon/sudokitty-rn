// Type definitions for Split Navigation Bar
import { Difficulty } from '@/src/engine/types';

// Tab types for left cluster (Home, Profile, Settings)
export type SecondaryTab = 'index' | 'profile' | 'store' | 'settings';

// Primary action button states
export type PrimaryActionState = 'new_game' | 'resume';

// Props for the main SplitNavBar container
export interface SplitNavBarProps {
  activeTab: SecondaryTab;
  onTabPress: (tab: SecondaryTab) => void;
  onNewGame: (difficulty: Difficulty) => void;
  onResume: () => void;
  onQuitGame: () => void;
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

// Menu action types
export type MenuAction = 'select_difficulty' | 'continue_game' | 'quit_game';

// Generic menu item that can represent any action
export interface MenuItem {
  id: string;
  label: string;
  icon: string; // Feather icon name (used when difficulty is not present)
  action: MenuAction;
  difficulty?: Difficulty; // Only for difficulty items - when present, mochi SVG is used instead of icon
}

// Props for SecondaryMenu (replaces DifficultyUnfurl)
export interface SecondaryMenuProps {
  isOpen: boolean;
  menuType: PrimaryActionState;
  onSelect: (item: MenuItem) => void;
  onDismiss: () => void;
}

// Props for individual MenuRow (replaces DifficultyRow)
export interface MenuRowProps {
  item: MenuItem;
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
  // Shared width for LeftCluster and PrimaryActionPill: 3 icons + 2 gaps + padding
  pillWidth: 3 * 24 + 2 * 32 + 2 * 20, // 176
} as const;

// Menu configurations for each primary action state
export const MENU_CONFIGS: Record<PrimaryActionState, MenuItem[]> = {
  new_game: [
    { id: 'expert', label: 'Expert', icon: 'zap', action: 'select_difficulty', difficulty: 'expert' },
    { id: 'hard', label: 'Hard', icon: 'frown', action: 'select_difficulty', difficulty: 'hard' },
    { id: 'medium', label: 'Medium', icon: 'meh', action: 'select_difficulty', difficulty: 'medium' },
    { id: 'easy', label: 'Easy', icon: 'smile', action: 'select_difficulty', difficulty: 'easy' },
  ],
  resume: [
    { id: 'quit', label: 'Quit Game', icon: 'x-circle', action: 'quit_game' },
    { id: 'continue', label: 'Continue Playing', icon: 'play', action: 'continue_game' },
  ],
};
