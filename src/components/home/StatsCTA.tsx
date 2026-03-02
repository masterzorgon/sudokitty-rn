// Stats CTA card — invites users to view their game stats
// Same style as TechniquesCTA, uses reusable HomeCTACard

import React, { memo } from 'react';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../theme/colors';
import { HomeCTACard } from '../ui/HomeCTACard';

interface StatsCTAProps {
  onPress: () => void;
}

export const StatsCTA = memo(({ onPress }: StatsCTAProps) => {
  const c = useColors();

  return (
    <HomeCTACard
      title="Your Progress"
      subtitle="Track streaks, best times & rankings"
      icon={<Feather name="bar-chart-2" size={20} color={c.mochiPillText} />}
      onPress={onPress}
      accessibilityLabel="View your game stats"
    />
  );
});

StatsCTA.displayName = 'StatsCTA';
