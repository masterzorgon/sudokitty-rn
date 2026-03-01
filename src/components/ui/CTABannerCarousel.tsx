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
import { spacing } from '../../theme';
import { useIsPremium } from '../../stores/premiumStore';
import { CTABannerCard } from './CTABannerCard';
import { PROMO_COPY, usePromoActions, type PromoKey } from './promoConfig';

const PEEK_OFFSET = 8;
const SCALE_STEP = 0.03;
const SWIPE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 800;
const OFFSCREEN_X = 500;
const DRAG_DAMPING = 0.85;
const RANK_ANIM_DURATION = 250;

interface PromoConfig {
  key: PromoKey;
  onPress: () => void;
}

function usePromos(): PromoConfig[] {
  const isPremium = useIsPremium();
  const actions = usePromoActions();

  return useMemo(() => {
    const keys: PromoKey[] = [];
    if (!isPremium) keys.push('techniques');
    keys.push('invite', 'rate');
    return keys.map((key) => ({ key, onPress: actions[key] }));
  }, [isPremium, actions]);
}

function StackedCard({
  promo,
  rank,
  total,
  isFront,
  dragX,
  rotationSV,
  currentRotation,
}: {
  promo: PromoConfig;
  rank: number;
  total: number;
  isFront: boolean;
  dragX: SharedValue<number>;
  rotationSV: SharedValue<number>;
  currentRotation: number;
}) {
  const copy = PROMO_COPY[promo.key];
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
      <CTABannerCard
        badge={copy.badge}
        title={copy.title}
        buttonLabel={copy.buttonLabel}
        onPress={promo.onPress}
        accessibilityLabel={copy.accessibilityLabel}
      />
    </Animated.View>
  );
}

export function CTABannerCarousel() {
  const promos = usePromos();
  const [rotation, setRotation] = useState(0);
  const dragX = useSharedValue(0);
  const rotationSV = useSharedValue(0);
  const swiping = useRef(false);

  const rotatedPromos = useMemo(() => {
    const arr = [...promos];
    for (let i = 0; i < rotation % promos.length; i++) arr.push(arr.shift()!);
    return arr;
  }, [promos, rotation]);

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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (
        _e: GestureResponderEvent,
        gs: PanResponderGestureState,
      ) => Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderMove: (_e, gs) => {
        dragX.value = gs.dx * DRAG_DAMPING;
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

  if (promos.length === 1) {
    const copy = PROMO_COPY[promos[0].key];
    return (
      <View style={styles.wrapper}>
        <CTABannerCard
          badge={copy.badge}
          title={copy.title}
          buttonLabel={copy.buttonLabel}
          onPress={promos[0].onPress}
          accessibilityLabel={copy.accessibilityLabel}
        />
      </View>
    );
  }

  const peekHeight = Math.min(promos.length - 1, 2) * PEEK_OFFSET;

  return (
    <View style={[styles.wrapper, { marginBottom: spacing.lg + peekHeight }]}>
      <View {...panResponder.panHandlers}>
        {rotatedPromos
          .map((promo, i) => (
            <StackedCard
              key={promo.key}
              promo={promo}
              rank={i}
              total={rotatedPromos.length}
              isFront={i === 0}
              dragX={dragX}
              rotationSV={rotationSV}
              currentRotation={rotation}
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
