// Centralized layout constants for game screen
// Single source of truth for spacing and sizing values

export const GAME_LAYOUT = {
  // Screen padding (applies to all elements except grid)
  SCREEN_PADDING: 15,
  
  // Progress bar
  PROGRESS_BAR_HEIGHT: 20,
  
  // Mascot zone
  MASCOT_SIZE: 110,
  MASCOT_ZONE_HEIGHT: 100,
  
  // Section labels
  SECTION_LABEL_MARGIN_BOTTOM: 8,
  
  // Speech bubble for game (smaller than home)
  GAME_BUBBLE_WIDTH: 180,
  GAME_BUBBLE_HEIGHT: 65,
} as const;
