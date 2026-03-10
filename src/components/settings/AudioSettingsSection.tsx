import React from 'react';
import { View, StyleSheet } from 'react-native';

import { spacing, borderRadius } from '../../theme';
import { SkeuCard } from '../ui/Skeuomorphic';
import { SettingsToggleRow } from './SettingsToggleRow';
import { MusicTrackSelector } from '../ui/MusicTrackSelector';
import {
  useSoundsEnabled,
  useMusicEnabled,
  useTimerEnabled,
  useHapticsEnabled,
  useSettingsStore,
} from '../../stores/settingsStore';

export interface AudioSettingsSectionProps {
  showTimer?: boolean;
  showTrackSelector?: boolean;
  surface: 'modal' | 'screen';
  /** When false, Haptics row won't have bottom border (e.g. when more rows follow in same card) */
  isLastSection?: boolean;
}

export function AudioSettingsSection({
  showTimer = true,
  showTrackSelector = true,
  surface,
  isLastSection = surface === 'modal',
}: AudioSettingsSectionProps) {
  const musicEnabled = useMusicEnabled();
  const soundsEnabled = useSoundsEnabled();
  const timerEnabled = useTimerEnabled();
  const hapticsEnabled = useHapticsEnabled();

  const setMusicEnabled = useSettingsStore((s) => s.setMusicEnabled);
  const setSoundsEnabled = useSettingsStore((s) => s.setSoundsEnabled);
  const setTimerEnabled = useSettingsStore((s) => s.setTimerEnabled);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);

  const showIcons = surface === 'screen';

  const rows: React.ReactNode[] = [];

  rows.push(
    <SettingsToggleRow
      key="music"
      label="Music"
      description="Background music"
      value={musicEnabled}
      onValueChange={setMusicEnabled}
      icon={showIcons ? 'music' : undefined}
    />
  );

  // Track selector inside card only for 'screen' surface; modal renders it above
  if (showTrackSelector && surface === 'screen') {
    rows.push(
      <View key="trackSelector" style={styles.trackSelector}>
        <MusicTrackSelector />
      </View>
    );
  }

  rows.push(
    <SettingsToggleRow
      key="sounds"
      label="Sounds"
      description="Game sound effects"
      value={soundsEnabled}
      onValueChange={setSoundsEnabled}
      icon={showIcons ? 'volume-2' : undefined}
      feedbackOptions={(on) => (on ? { forceSfx: true } : undefined)}
    />
  );

  if (showTimer) {
    rows.push(
      <SettingsToggleRow
        key="timer"
        label="Timer"
        description="Show game clock"
        value={timerEnabled}
        onValueChange={setTimerEnabled}
        icon={showIcons ? 'clock' : undefined}
      />
    );
  }

  rows.push(
    <SettingsToggleRow
      key="haptics"
      label="Haptics"
      description="Vibration feedback"
      value={hapticsEnabled}
      onValueChange={setHapticsEnabled}
      icon={showIcons ? 'smartphone' : undefined}
      isLast={isLastSection}
      feedbackOptions={(on) => (on ? { forceHaptic: true } : undefined)}
    />
  );

  if (surface === 'modal') {
    return (
      <SkeuCard borderRadius={borderRadius.lg} contentStyle={styles.cardContent}>
        {rows}
      </SkeuCard>
    );
  }

  return <View style={styles.wrapper}>{rows}</View>;
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 0,
  },
  cardContent: {
    padding: 0,
    overflow: 'visible',
  },
  trackSelector: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
});
