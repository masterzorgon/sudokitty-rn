import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import { colors, useColors } from '../../theme/colors';
import { DemoPlayButton } from './DemoPlayButton';
import { StoreItemRow } from './StoreItemRow';
import { MochiPricePill } from './MochiPricePill';
import type { BackingTrackDef } from '../../constants/backingTracks';

export interface MusicTrackCardProps {
  track: BackingTrackDef;
  isOwned?: boolean;
  isActive: boolean;
  isDemoPlaying: boolean;
  demoProgress: number;
  disabled?: boolean;
  onToggleDemo: () => void;
  onSelect: () => void;
}

export function MusicTrackCard({
  track,
  isOwned = true,
  isActive,
  isDemoPlaying,
  demoProgress,
  disabled = false,
  onToggleDemo,
  onSelect,
}: MusicTrackCardProps) {
  const c = useColors();
  const mutedColor = colors.textLight;
  const trailingColor = disabled ? mutedColor : (isActive ? c.accent : c.boxBorder);

  const icon = (
    <DemoPlayButton
      isPlaying={isDemoPlaying}
      progress={demoProgress}
      onPress={onToggleDemo}
      size={48}
      color={disabled ? mutedColor : undefined}
    />
  );

  const subtitle = isOwned ? (isActive ? 'Playing' : 'Owned') : undefined;

  const trailing = !isOwned ? (
    <MochiPricePill price={track.cost} />
  ) : isActive ? (
    <Ionicons name="checkmark-circle" size={24} color={trailingColor} />
  ) : (
    <Ionicons name="ellipse-outline" size={24} color={trailingColor} />
  );

  return (
    <StoreItemRow
      icon={icon}
      title={track.name}
      subtitle={subtitle}
      trailing={trailing}
      onPress={onSelect}
    />
  );
}
