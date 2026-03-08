import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';

import { BACKING_TRACKS, type BackingTrackDef } from '../../constants/backingTracks';
import { useOwnedTracksStore } from '../../stores/ownedTracksStore';
import { useMusicEnabled } from '../../stores/settingsStore';
import * as musicCoordinator from '../../services/musicCoordinator';
import { playFeedback } from '../../utils/feedback';
import { spacing } from '../../theme';
import { swipeGesture } from '../../theme/animations';
import { MusicTrackCard } from './MusicTrackCard';

const PEEK_OFFSET = 8;
const SCALE_STEP = 0.03;
const { threshold: SWIPE_THRESHOLD, velocityThreshold: VELOCITY_THRESHOLD, offscreenX: OFFSCREEN_X, frictionPower: FRICTION_POWER, frictionScale: FRICTION_SCALE } = swipeGesture;
const RANK_ANIM_DURATION = 250;

function StackedTrackCard({
  track,
  rank,
  total,
  isFront,
  dragX,
  rotationSV,
  currentRotation,
  isActive,
  demoPlayingTrackId,
  demoProgress,
  disabled,
  onToggleDemo,
  onSelect,
}: {
  track: BackingTrackDef;
  rank: number;
  total: number;
  isFront: boolean;
  dragX: SharedValue<number>;
  rotationSV: SharedValue<number>;
  currentRotation: number;
  isActive: boolean;
  demoPlayingTrackId: string | null;
  demoProgress: number;
  disabled?: boolean;
  onToggleDemo: () => void;
  onSelect: () => void;
}) {
  const animRank = useSharedValue(rank);
  const prevRankRef = useRef(rank);

  useEffect(() => {
    if (prevRankRef.current !== rank) {
      if (rank < prevRankRef.current) {
        animRank.value = withTiming(rank, {
          duration: RANK_ANIM_DURATION,
          easing: Easing.out(Easing.cubic),
        });
      } else {
        animRank.value = rank;
      }
      prevRankRef.current = rank;
    }
  }, [rank, animRank]);

  const animStyle = useAnimatedStyle(() => {
    const isCurrentFront = isFront && rotationSV.value === currentRotation;

    return {
      zIndex: total - Math.round(animRank.value),
      transform: [
        { translateX: isCurrentFront ? dragX.value : 0 },
        { translateY: animRank.value * PEEK_OFFSET },
        { scale: 1 - animRank.value * SCALE_STEP },
      ],
      opacity: isFront && !isCurrentFront ? 0 : 1,
    };
  });

  return (
    <Animated.View style={[isFront ? styles.frontCard : styles.stackedCard, animStyle]}>
      <MusicTrackCard
        track={track}
        isActive={isActive}
        isDemoPlaying={demoPlayingTrackId === track.id}
        demoProgress={demoProgress}
        disabled={disabled}
        onToggleDemo={onToggleDemo}
        onSelect={onSelect}
      />
    </Animated.View>
  );
}

export function MusicTrackSelector() {
  const musicEnabled = useMusicEnabled();
  const ownedTrackIds = useOwnedTracksStore((s) => s.ownedTrackIds);
  const activeTrackId = useOwnedTracksStore((s) => s.activeTrackId);
  const setActiveTrack = useOwnedTracksStore((s) => s.setActiveTrack);

  const ownedTracks = useMemo(
    () => BACKING_TRACKS.filter((t) => ownedTrackIds.includes(t.id)),
    [ownedTrackIds],
  );

  const initialRotation = useMemo(() => {
    const idx = ownedTracks.findIndex((t) => t.id === activeTrackId);
    return idx >= 0 ? idx : 0;
  }, [ownedTracks, activeTrackId]);

  const [rotation, setRotation] = useState(initialRotation);
  const [demoPlayingTrackId, setDemoPlayingTrackId] = useState<string | null>(null);
  const [demoProgress, setDemoProgress] = useState(0);

  const dragX = useSharedValue(0);
  const rotationSV = useSharedValue(0);
  const swiping = useRef(false);

  useEffect(() => {
    return () => {
      musicCoordinator.stopPreview();
    };
  }, []);

  const advanceState = useCallback(() => {
    setRotation((prev) => prev + 1);
    swiping.current = false;
  }, []);

  const snapBack = useCallback(() => {
    dragX.value = withTiming(0, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
    swiping.current = false;
  }, [dragX]);

  const handleToggleDemo = useCallback((track: BackingTrackDef) => {
    playFeedback('tap');
    if (!musicEnabled) {
      if (demoPlayingTrackId === track.id) {
        musicCoordinator.stopPreview();
        setDemoPlayingTrackId(null);
        setDemoProgress(0);
      }
      return;
    }
    if (demoPlayingTrackId === track.id) {
      musicCoordinator.stopPreview();
      setDemoPlayingTrackId(null);
      setDemoProgress(0);
    } else {
      musicCoordinator.startPreview(track.asset, track.demoDurationMs, {
        onProgress: (fraction) => setDemoProgress(fraction),
        onComplete: () => {
          setDemoPlayingTrackId(null);
          setDemoProgress(0);
        },
      });
      setDemoPlayingTrackId(track.id);
      setDemoProgress(0);
    }
  }, [demoPlayingTrackId, musicEnabled]);

  const handleSelectTrack = useCallback((trackId: string) => {
    playFeedback('tap');
    musicCoordinator.stopPreview();
    setDemoPlayingTrackId(null);
    setActiveTrack(trackId);
  }, [setActiveTrack]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (
        _e: GestureResponderEvent,
        gs: PanResponderGestureState,
      ) => Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderMove: (_e, gs) => {
        const sign = gs.dx >= 0 ? 1 : -1;
        dragX.value = sign * Math.pow(Math.abs(gs.dx), FRICTION_POWER) * FRICTION_SCALE;
      },
      onPanResponderRelease: (_e, gs) => {
        if (swiping.current) return;

        const shouldDismiss =
          Math.abs(gs.dx) > SWIPE_THRESHOLD ||
          Math.abs(gs.vx) > VELOCITY_THRESHOLD / 1000;

        if (shouldDismiss) {
          swiping.current = true;
          const direction = gs.dx > 0 ? 1 : -1;
          dragX.value = withTiming(
            direction * OFFSCREEN_X,
            { duration: 200, easing: Easing.out(Easing.quad) },
            () => {
              'worklet';
              rotationSV.value = rotationSV.value + 1;
              dragX.value = 0;
              runOnJS(advanceState)();
            },
          );
        } else {
          snapBack();
        }
      },
      onPanResponderTerminate: () => {
        snapBack();
      },
    }),
  ).current;

  if (ownedTracks.length === 0) return null;

  if (ownedTracks.length === 1) {
    const track = ownedTracks[0];
    return (
      <View style={styles.wrapper}>
        <MusicTrackCard
          track={track}
          isActive={track.id === activeTrackId}
          isDemoPlaying={demoPlayingTrackId === track.id}
          demoProgress={demoProgress}
          disabled={!musicEnabled}
          onToggleDemo={() => handleToggleDemo(track)}
          onSelect={() => handleSelectTrack(track.id)}
        />
      </View>
    );
  }

  const rotatedTracks = useMemo(() => {
    const arr = [...ownedTracks];
    for (let i = 0; i < rotation % ownedTracks.length; i++) arr.push(arr.shift()!);
    return arr;
  }, [ownedTracks, rotation]);

  const peekHeight = Math.min(ownedTracks.length - 1, 2) * PEEK_OFFSET;

  return (
    <View style={[styles.wrapper, { marginBottom: peekHeight }]}>
      <View {...panResponder.panHandlers}>
        {rotatedTracks
          .map((track, i) => (
            <StackedTrackCard
              key={track.id}
              track={track}
              rank={i}
              total={rotatedTracks.length}
              isFront={i === 0}
              dragX={dragX}
              rotationSV={rotationSV}
              currentRotation={rotation}
              isActive={track.id === activeTrackId}
              demoPlayingTrackId={demoPlayingTrackId}
              demoProgress={demoProgress}
              disabled={!musicEnabled}
              onToggleDemo={() => handleToggleDemo(track)}
              onSelect={() => handleSelectTrack(track.id)}
            />
          ))
          .reverse()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  frontCard: {
    position: 'relative',
  },
  stackedCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
});
