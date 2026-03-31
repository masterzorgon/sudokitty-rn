import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  PanResponder,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  type SharedValue,
} from "react-native-reanimated";

import { BACKING_TRACKS, type BackingTrackDef } from "../../constants/backingTracks";
import { useOwnedTracksStore } from "../../stores/ownedTracksStore";
import { useMusicEnabled } from "../../stores/settingsStore";
import { playFeedback } from "../../utils/feedback";
import { spacing } from "../../theme";
import { swipeGesture } from "../../theme/animations";
import { MusicTrackCard } from "./MusicTrackCard";

const PEEK_OFFSET = 8;
const SCALE_STEP = 0.03;
const {
  threshold: SWIPE_THRESHOLD,
  velocityThreshold: VELOCITY_THRESHOLD,
  offscreenX: OFFSCREEN_X,
  frictionPower: FRICTION_POWER,
  frictionScale: FRICTION_SCALE,
} = swipeGesture;
const RANK_ANIM_DURATION = 200;

function StackedTrackCard({
  track,
  rank,
  total,
  isFront,
  dragX,
  rotationSV,
  currentRotation,
  isActive,
  disabled,
  selectionLocked,
  onRankAnimationStart,
  onRankAnimationEnd,
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
  disabled?: boolean;
  selectionLocked: boolean;
  onRankAnimationStart: () => void;
  onRankAnimationEnd: () => void;
  onSelect: () => void;
}) {
  const animRank = useSharedValue(rank);
  const prevRankRef = useRef(rank);

  useEffect(() => {
    if (prevRankRef.current !== rank) {
      if (rank < prevRankRef.current) {
        onRankAnimationStart();
        animRank.value = withTiming(
          rank,
          {
            duration: RANK_ANIM_DURATION,
            easing: Easing.out(Easing.cubic),
          },
          () => {
            "worklet";
            runOnJS(onRankAnimationEnd)();
          },
        );
      } else {
        animRank.value = rank;
      }
      prevRankRef.current = rank;
    }
  }, [rank, animRank, onRankAnimationStart, onRankAnimationEnd]);

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
        disabled={disabled}
        selectionLocked={selectionLocked}
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

  /** Stable signature when persisted store adds tracks (hydration) or ownership changes. */
  const ownedSignature = useMemo(() => [...ownedTrackIds].sort().join("|"), [ownedTrackIds]);

  const [rotation, setRotation] = useState(initialRotation);

  const dragX = useSharedValue(0);
  const rotationSV = useSharedValue(initialRotation);

  // Keep deck order aligned with active track + owned list. Must also reset rotationSV: StackedTrackCard
  // uses `rotationSV.value === currentRotation` for the front card; if we only setRotation() after a
  // swipe, rotationSV stays high and the front card gets opacity 0 (looks like cards "disappear").
  useEffect(() => {
    setRotation(initialRotation);
    rotationSV.value = initialRotation;
  }, [initialRotation, ownedSignature]);

  const rotatedTracks = useMemo(() => {
    if (ownedTracks.length === 0) return [];
    const arr = [...ownedTracks];
    for (let i = 0; i < rotation % ownedTracks.length; i++) arr.push(arr.shift()!);
    return arr;
  }, [ownedTracks, rotation]);

  const swiping = useRef(false);
  const rankAnimLockRef = useRef(0);
  const [rankAnimating, setRankAnimating] = useState(false);

  const onRankAnimationStart = useCallback(() => {
    rankAnimLockRef.current += 1;
    setRankAnimating(true);
  }, []);

  const onRankAnimationEnd = useCallback(() => {
    rankAnimLockRef.current -= 1;
    if (rankAnimLockRef.current <= 0) {
      rankAnimLockRef.current = 0;
      setRankAnimating(false);
    }
  }, []);

  const advanceState = useCallback(() => {
    playFeedback("carouselSwipe");
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

  const handleSelectTrack = useCallback(
    (trackId: string) => {
      playFeedback("tap");
      setActiveTrack(trackId);
    },
    [setActiveTrack],
  );

  const horizontalSwipeActivated = (_e: GestureResponderEvent, gs: PanResponderGestureState) =>
    Math.abs(gs.dx) > 6 && Math.abs(gs.dx) > Math.abs(gs.dy) * 0.85;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: horizontalSwipeActivated,
      onMoveShouldSetPanResponder: horizontalSwipeActivated,
      onPanResponderMove: (_e, gs) => {
        const sign = gs.dx >= 0 ? 1 : -1;
        dragX.value = sign * Math.pow(Math.abs(gs.dx), FRICTION_POWER) * FRICTION_SCALE;
      },
      onPanResponderRelease: (_e, gs) => {
        if (swiping.current) return;

        const shouldDismiss =
          Math.abs(gs.dx) > SWIPE_THRESHOLD || Math.abs(gs.vx) > VELOCITY_THRESHOLD / 1000;

        if (shouldDismiss) {
          swiping.current = true;
          const direction = gs.dx > 0 ? 1 : -1;
          dragX.value = withTiming(
            direction * OFFSCREEN_X,
            { duration: 200, easing: Easing.out(Easing.quad) },
            () => {
              "worklet";
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
          disabled={!musicEnabled}
          onSelect={() => handleSelectTrack(track.id)}
        />
      </View>
    );
  }

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
              disabled={!musicEnabled}
              selectionLocked={rankAnimating}
              onRankAnimationStart={onRankAnimationStart}
              onRankAnimationEnd={onRankAnimationEnd}
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
    position: "relative",
  },
  stackedCard: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
  },
});
