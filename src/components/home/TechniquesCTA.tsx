// Sudoku Techniques CTA card with 3D press effect
// Full-width card inviting users to learn solving strategies

import React, { memo } from 'react';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../theme/colors';
import { HomeCTACard } from '../ui/HomeCTACard';

interface TechniquesCTAProps {
  onPress: () => void;
}

export const TechniquesCTA = memo(({ onPress }: TechniquesCTAProps) => {
  const c = useColors();

  return (
    <HomeCTACard
      title="Sudoku Techniques"
      subtitle="Learn advanced solving strategies"
      icon={<Feather name="award" size={20} color={c.mochiPillText} />}
      onPress={onPress}
      accessibilityLabel="Sudoku techniques, learn advanced solving strategies"
    />
  );
});

TechniquesCTA.displayName = 'TechniquesCTA';
