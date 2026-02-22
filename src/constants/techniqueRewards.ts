// Mochi rewards for technique completions
// Rewards are given for each successful completion (3x total when mastered)

import { TechniqueCategory } from '../data/techniqueMetadata';

export const TECHNIQUE_MOCHI_REWARDS: Record<TechniqueCategory, number> = {
  Beginner: 50,
  Intermediate: 100,
  Advanced: 200,
  Expert: 400,
};

/**
 * Get mochi reward amount for a technique based on its category
 */
export function getTechniqueReward(category: TechniqueCategory): number {
  return TECHNIQUE_MOCHI_REWARDS[category];
}
