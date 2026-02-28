import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  Dimensions,
  ScrollView,
  FlatList,
  type ViewToken,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  useSettingsStore,
  useSoundsEnabled,
  useHapticsEnabled,
  useUnlimitedMistakes,
  useUnlimitedHints,
} from '../../stores/settingsStore';
import { useGameStore } from '../../stores/gameStore';
import { useOwnedTracksStore } from '../../stores/ownedTracksStore';
import { useIsPremium } from '../../stores/premiumStore';
import { presentPaywall } from '../../lib/revenueCat';
import { BACKING_TRACKS, type BackingTrackDef } from '../../constants/backingTracks';
import { MAX_MISTAKES, MAX_HINTS } from '../../engine/types';
import { playDemo, stopDemo } from '../../services/trackDemoService';
import { colors, useColors } from '../../theme/colors';
import { typography, fontFamilies } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import { SkeuToggle } from '../ui/Skeuomorphic';
import { SkeuCard } from '../ui/Skeuomorphic';
import { AppButton } from '../ui/AppButton';
import { SheetWrapper, type SheetWrapperRef } from '../ui/SheetWrapper';
import { playFeedback } from '../../utils/feedback';

// MARK: - Types

interface GameSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToStore?: () => void;
}

interface SettingRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityHint?: string;
  backgroundColor?: string;
}

// MARK: - Constants

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_CONTENT_WIDTH = SCREEN_WIDTH - spacing.lg * 2 - spacing.md * 2;

// MARK: - Helpers

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// MARK: - SettingRow Component

function SettingRow({
  label,
  description,
  value,
  onValueChange,
  backgroundColor,
}: SettingRowProps) {
  return (
    <View style={[styles.settingRow, backgroundColor && { backgroundColor }]}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>
      <SkeuToggle
        value={value}
        onValueChange={onValueChange}
        accessibilityLabel={label}
      />
    </View>
  );
}

// MARK: - StatPill Component

function StatPill({ icon, value, cream }: { icon: string; value: string; cream: string }) {
  return (
    <View style={[styles.statPill, { backgroundColor: cream }]}>
      <Ionicons name={icon as any} size={14} color={colors.textSecondary} />
      <Text style={styles.statPillText}>{value}</Text>
    </View>
  );
}

// MARK: - MusicPage Component (single page inside the swipeable card)

function MusicPage({
  track,
  isActive,
  isDemoPlaying,
  onToggleDemo,
  onSelect,
  width,
}: {
  track: BackingTrackDef;
  isActive: boolean;
  isDemoPlaying: boolean;
  onToggleDemo: () => void;
  onSelect: () => void;
  width: number;
}) {
  const c = useColors();

  return (
    <View style={[styles.musicPage, { width }]}>
      <Text style={[styles.musicNowPlaying, { color: c.textSecondary }]}>
        {isActive ? 'now playing' : 'tap to select'}
      </Text>
      <Text style={[styles.musicTrackName, { color: c.textPrimary }]} numberOfLines={1}>
        {track.name}
      </Text>
      <View style={styles.musicControls}>
        <Pressable
          onPress={onToggleDemo}
          style={[styles.demoButton, { backgroundColor: c.accent + '20' }]}
          accessibilityLabel={isDemoPlaying ? 'Stop preview' : 'Play preview'}
        >
          <Ionicons
            name={isDemoPlaying ? 'pause' : 'play'}
            size={18}
            color={c.accent}
          />
        </Pressable>
        {!isActive && (
          <Pressable
            onPress={onSelect}
            style={[styles.selectButton, { backgroundColor: c.accent }]}
            accessibilityLabel={`Select ${track.name}`}
          >
            <Text style={styles.selectButtonText}>use this</Text>
          </Pressable>
        )}
        {isActive && (
          <View style={styles.activeIndicator}>
            <Ionicons name="checkmark-circle" size={22} color={c.accent} />
            <Text style={[styles.activeText, { color: c.accent }]}>selected</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// MARK: - GameSettingsModal Component

export function GameSettingsModal({ visible, onClose, onNavigateToStore }: GameSettingsModalProps) {
  const c = useColors();
  const isPremium = useIsPremium();

  // Settings state
  const soundsEnabled = useSoundsEnabled();
  const hapticsEnabled = useHapticsEnabled();
  const unlimitedMistakes = useUnlimitedMistakes();
  const unlimitedHints = useUnlimitedHints();

  // Settings actions
  const setSoundsEnabled = useSettingsStore((s) => s.setSoundsEnabled);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);
  const setUnlimitedMistakes = useSettingsStore((s) => s.setUnlimitedMistakes);
  const setUnlimitedHints = useSettingsStore((s) => s.setUnlimitedHints);

  // Game stats
  const timeElapsed = useGameStore((s) => s.timeElapsed);
  const difficulty = useGameStore((s) => s.difficulty);
  const mistakeCount = useGameStore((s) => s.mistakeCount);
  const hintsUsed = useGameStore((s) => s.hintsUsed);

  // Track state
  const ownedTrackIds = useOwnedTracksStore((s) => s.ownedTrackIds);
  const activeTrackId = useOwnedTracksStore((s) => s.activeTrackId);
  const setActiveTrack = useOwnedTracksStore((s) => s.setActiveTrack);

  const [demoPlayingTrackId, setDemoPlayingTrackId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const ownedTracks = useMemo(
    () => BACKING_TRACKS.filter((t) => ownedTrackIds.includes(t.id)),
    [ownedTrackIds],
  );

  // Set initial page to the active track when modal opens
  useEffect(() => {
    if (visible) {
      const idx = ownedTracks.findIndex((t) => t.id === activeTrackId);
      if (idx >= 0) setCurrentPage(idx);
    }
  }, [visible]);

  const handlePremiumToggle = useCallback(
    async (enabled: boolean, setter: (v: boolean) => void) => {
      if (!enabled) {
        setter(false);
        return;
      }
      if (isPremium) {
        setter(true);
        return;
      }
      const purchased = await presentPaywall();
      if (purchased) {
        setter(true);
      }
    },
    [isPremium],
  );

  const handleToggleDemo = useCallback(async (track: BackingTrackDef) => {
    if (demoPlayingTrackId === track.id) {
      await stopDemo();
      setDemoPlayingTrackId(null);
    } else {
      await stopDemo();
      await playDemo(track.asset, track.demoDurationMs);
      setDemoPlayingTrackId(track.id);
      setTimeout(() => {
        setDemoPlayingTrackId((current) => (current === track.id ? null : current));
      }, track.demoDurationMs);
    }
  }, [demoPlayingTrackId]);

  const handleSelectTrack = useCallback((trackId: string) => {
    playFeedback('tap');
    setActiveTrack(trackId);
  }, [setActiveTrack]);

  const sheetRef = useRef<SheetWrapperRef>(null);

  const handleClose = useCallback(() => {
    stopDemo();
    setDemoPlayingTrackId(null);
    sheetRef.current?.close();
  }, []);

  const handleNavigateToStore = useCallback(() => {
    stopDemo();
    setDemoPlayingTrackId(null);
    sheetRef.current?.close(() => {
      onNavigateToStore?.();
    });
  }, [onNavigateToStore]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentPage(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  // Derived stats
  const livesRemaining = unlimitedMistakes ? '\u221E' : String(MAX_MISTAKES - mistakeCount);
  const hintsRemaining = unlimitedHints ? '\u221E' : String(MAX_HINTS - hintsUsed);

  return (
    <SheetWrapper
      ref={sheetRef}
      visible={visible}
      onDismiss={onClose}
      containerStyle={{ backgroundColor: c.cream, maxHeight: SCREEN_HEIGHT * 0.85 }}
    >
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Section 1: Game Stats Pills */}
            <View style={styles.statsRow}>
              <StatPill icon="timer-outline" value={formatTime(timeElapsed)} cream={c.cream} />
              <StatPill icon="skull-outline" value={difficulty} cream={c.cream} />
              <StatPill icon="heart" value={livesRemaining} cream={c.cream} />
              <StatPill icon="bulb" value={hintsRemaining} cream={c.cream} />
            </View>

            {/* Section 2: Music Selector Card */}
            {soundsEnabled && ownedTracks.length > 0 && (
              <View style={styles.musicSection}>
                <SkeuCard
                  borderRadius={borderRadius.lg}
                  contentStyle={styles.musicCardContent}
                >
                  {ownedTracks.length === 1 ? (
                    <MusicPage
                      track={ownedTracks[0]}
                      isActive={ownedTracks[0].id === activeTrackId}
                      isDemoPlaying={demoPlayingTrackId === ownedTracks[0].id}
                      onToggleDemo={() => handleToggleDemo(ownedTracks[0])}
                      onSelect={() => handleSelectTrack(ownedTracks[0].id)}
                      width={CARD_CONTENT_WIDTH}
                    />
                  ) : (
                    <>
                      <FlatList
                        data={ownedTracks}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.id}
                        initialScrollIndex={Math.max(0, ownedTracks.findIndex((t) => t.id === activeTrackId))}
                        getItemLayout={(_, index) => ({
                          length: CARD_CONTENT_WIDTH,
                          offset: CARD_CONTENT_WIDTH * index,
                          index,
                        })}
                        onViewableItemsChanged={onViewableItemsChanged}
                        viewabilityConfig={viewabilityConfig}
                        renderItem={({ item }) => (
                          <MusicPage
                            track={item}
                            isActive={item.id === activeTrackId}
                            isDemoPlaying={demoPlayingTrackId === item.id}
                            onToggleDemo={() => handleToggleDemo(item)}
                            onSelect={() => handleSelectTrack(item.id)}
                            width={CARD_CONTENT_WIDTH}
                          />
                        )}
                      />
                      <View style={styles.dotsRow}>
                        {ownedTracks.map((t, i) => (
                          <View
                            key={t.id}
                            style={[
                              styles.dot,
                              {
                                backgroundColor:
                                  i === currentPage ? c.accent : colors.gridLine,
                              },
                            ]}
                          />
                        ))}
                      </View>
                    </>
                  )}
                </SkeuCard>

                <Pressable onPress={handleNavigateToStore} style={styles.getMoreLink}>
                  <Text style={[styles.getMoreText, { color: c.accent }]}>
                    get more in store
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={c.accent} />
                </Pressable>
              </View>
            )}

            {/* Section 3: Toggles */}
            <View style={styles.settingsList}>
              <SettingRow
                label="sounds"
                description="game audio effects"
                value={soundsEnabled}
                onValueChange={setSoundsEnabled}
                accessibilityHint="Toggle game sounds on or off"
                backgroundColor={c.cream}
              />

              <SettingRow
                label="haptics"
                description="vibration feedback"
                value={hapticsEnabled}
                onValueChange={setHapticsEnabled}
                accessibilityHint="Toggle haptic feedback on or off"
                backgroundColor={c.cream}
              />

              <SettingRow
                label="unlimited mistakes"
                description="no penalty for wrong answers"
                value={unlimitedMistakes}
                onValueChange={(v) => handlePremiumToggle(v, setUnlimitedMistakes)}
                accessibilityHint="Toggle unlimited mistakes (premium feature)"
                backgroundColor={c.cream}
              />

              <SettingRow
                label="unlimited hints"
                description="no limit on hints per game"
                value={unlimitedHints}
                onValueChange={(v) => handlePremiumToggle(v, setUnlimitedHints)}
                accessibilityHint="Toggle unlimited hints (premium feature)"
                backgroundColor={c.cream}
              />
            </View>
          </ScrollView>

          {/* Section 4: Close Button */}
          <View style={styles.closeButtonWrapper}>
            <AppButton
              onPress={handleClose}
              label="resume game"
              variant="primary"
            />
          </View>
    </SheetWrapper>
  );
}

// MARK: - Styles

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.md,
  },

  // Stats pills
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  statPillText: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Music section
  musicSection: {
    marginBottom: spacing.lg,
  },
  musicCardContent: {
    paddingVertical: spacing.md,
    overflow: 'hidden',
  },
  musicPage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  musicNowPlaying: {
    fontFamily: fontFamilies.medium,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  musicTrackName: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
  },
  musicControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  demoButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  selectButtonText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  getMoreLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginTop: spacing.md,
  },
  getMoreText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
  },

  // Settings
  settingsList: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    ...typography.body,
    fontFamily: fontFamilies.bold,
    color: colors.textPrimary,
  },
  settingDescription: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Close button
  closeButtonWrapper: {
    marginTop: spacing.sm,
  },
});
