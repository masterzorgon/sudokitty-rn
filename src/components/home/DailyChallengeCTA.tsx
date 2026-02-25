// Daily challenge CTA card - play today's puzzle, keep your streak

import React, { memo } from 'react';
import { Feather } from '@expo/vector-icons';

import { useColors } from '../../theme/colors';
import { HomeCTACard } from '../ui/HomeCTACard';

interface DailyChallengeCTAProps {
  onPress: () => void;
}

export const DailyChallengeCTA = memo(({ onPress }: DailyChallengeCTAProps) => {
  const c = useColors();

  return (
    <HomeCTACard
      title="daily challenge"
      subtitle="one puzzle per day, keep your streak"
      icon={<Feather name="award" size={20} color={c.mochiPillText} />}
      onPress={onPress}
      accessibilityLabel="Daily challenge, play today's puzzle"
    />
  );
});

DailyChallengeCTA.displayName = 'DailyChallengeCTA';
