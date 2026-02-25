// Mochi rewards for technique mastery (awarded once when the user earns 3 stars)

import { TechniqueCategory } from '../data/techniqueMetadata';

export const TECHNIQUE_MOCHI_REWARDS: Record<TechniqueCategory, number> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 4,
  Expert: 6,
};

/**
 * Get mochi reward amount for a technique based on its category
 */
export function getTechniqueReward(category: TechniqueCategory): number {
  return TECHNIQUE_MOCHI_REWARDS[category];
}
