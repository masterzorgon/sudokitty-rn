import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Share,
  Alert,
  PanResponder,
  type ImageStyle,
  type ViewStyle,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';
import { Image, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { useColors } from '../../theme/colors';
import { typography, fontFamilies } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme';
import { swipeGesture } from '../../theme/animations';
import { SkeuCard, SkeuButton } from './Skeuomorphic';
import { playFeedback } from '../../utils/feedback';
import { useEffectivePremium } from '../../stores/premiumStore';
import { useAppRatedStore, useHasRated } from '../../stores/appRatedStore';
import { presentPaywallAlways } from '../../lib/revenueCat';

const MochiStarsImg = require('../../../assets/images/mochi/mochi-stars.png');
const MochiShareImg = require('../../../assets/images/mochi/mochi-share.png');
const MochiTechniquesImg = require('../../../assets/images/mochi/mochi-techniques.png');

type PromoKey = 'techniques' | 'invite' | 'rate';

const SHARE_MESSAGE = 'Check out SudoKitty — an app that helps you master sudoku!';
/** iOS App Store URL — replace idXXXXXXXXX with your app’s Apple ID from App Store Connect */
const IOS_APP_STORE_URL = 'https://apps.apple.com/app/sudokitty/idXXXXXXXXX';

interface PromoCopyEntry {
  badge: string;
  title: string;
  buttonLabel: string | React.ReactNode;
  accessibilityLabel: string;
  image?: number;
  imageComponent?: React.ReactNode;
  imageStyle?: ImageStyle;
  imageContainerStyle?: ViewStyle;
}

const PROMO_COPY: Record<PromoKey, PromoCopyEntry> = {
  techniques: {
    badge: 'SUDOKU TECHNIQUES',
    title: 'Level up your solving skills',
    buttonLabel: 'Unlock All Techniques',
    accessibilityLabel: 'Unlock all sudoku techniques',
    image: MochiTechniquesImg,
    imageStyle: {
      width: 100,
      height: 100,
    },
    imageContainerStyle: {
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginRight: spacing.sm,
    },
  },
  invite: {
    badge: 'INVITE FRIENDS',
    title: 'Give Sudokitty to friends',
    buttonLabel: 'Share the Love',
    accessibilityLabel: 'Invite friends and earn 100 mochis',
    image: MochiShareImg,
    imageStyle: {
      width: 105,
      height: 105,
    },
    imageContainerStyle: {
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginRight: spacing.sm,
    },
  },
  rate: {
    badge: 'RATE SUDOKITTY',
    title: 'Help other Sudokitty fans',
    buttonLabel: 'Rate the App',
    accessibilityLabel: 'Rate SudoKitty on the App Store',
    image: MochiStarsImg,
  },
};

function usePromoActions(): Record<PromoKey, () => void> {
  const handleTechniques = useCallback(async () => {
    await presentPaywallAlways();
  }, []);

  const handleInvite = useCallback(async () => {
    try {
      await Share.share({
        message: `${SHARE_MESSAGE} ${IOS_APP_STORE_URL}`,
        url: IOS_APP_STORE_URL,
        title: 'Sudokitty',
      });
    } catch { /* user cancelled */ }
  }, []);

  const handleRate = useCallback(async () => {
    try {
      const StoreReview = await import('expo-store-review');
      await StoreReview.requestReview();
    } catch {
      Alert.alert('Thanks!', 'Please rate us on the App Store.');
    }

    setTimeout(() => {
      Alert.alert(
        'Did you leave a review?',
        'We would love to hear your feedback!',
        [
          {
            text: 'Not yet',
            style: 'cancel',
          },
          {
            text: 'Yes, I did!',
            onPress: () => useAppRatedStore.getState().setRated(true),
          },
        ],
      );
    }, 2 * 60 * 1000);
  }, []);

  return { techniques: handleTechniques, invite: handleInvite, rate: handleRate };
}

interface CTABannerCardProps {
  badge: string;
  title: string;
  buttonLabel: string | React.ReactNode;
  onPress: () => void;
  image?: ImageSource | number;
  imageComponent?: React.ReactNode;
  imageStyle?: ImageStyle;
  imageContainerStyle?: ViewStyle;
  accessibilityLabel?: string;
  style?: ViewStyle;
  blurStyle?: object;
}

function CTABannerCard({
  badge,
  title,
  buttonLabel,
  onPress,
  image = MochiStarsImg,
  imageComponent,
  imageStyle,
  imageContainerStyle,
  accessibilityLabel,
  style,
  blurStyle,
}: CTABannerCardProps) {
  const c = useColors();

  return (
    <SkeuCard
      borderRadius={borderRadius.lg}
      contentStyle={cardStyles.card}
      style={style}
      accessibilityLabel={accessibilityLabel ?? badge}
    >
      <LinearGradient
        colors={[c.boardBackground, c.accentLight + '10', c.buttonPrimary + '40']}
        locations={[1, 0.55, 0]}
        style={cardStyles.gradientOverlay}
        pointerEvents="none"
      />

      <View style={cardStyles.row}>
        <View style={cardStyles.textArea}>
          <Text style={[cardStyles.badge, { color: c.mochiPillText, backgroundColor: c.mochiPillBorder + '40' }]}>
            {badge}
          </Text>
          <Text style={[cardStyles.title, { color: c.textPrimary }]}>
            {title}
          </Text>
        </View>
        <View style={[cardStyles.imageArea, imageContainerStyle]}>
          {imageComponent ?? <Image source={image} style={[cardStyles.mochiImage, imageStyle]} contentFit="contain" />}
        </View>
      </View>
      <SkeuButton
        onPress={() => { playFeedback('tap'); onPress(); }}
        variant="primary"
        sheen
        borderRadius={borderRadius.md}
        contentStyle={cardStyles.btnContent}
        style={cardStyles.btn}
        accessibilityLabel={typeof buttonLabel === 'string' ? buttonLabel : undefined}
      >
        {typeof buttonLabel === 'string' ? (
          <Text style={cardStyles.btnText}>{buttonLabel}</Text>
        ) : (
          buttonLabel
        )}
      </SkeuButton>

      {blurStyle !== undefined && (
        <Animated.View style={[StyleSheet.absoluteFill, blurStyle]} pointerEvents="none">
          <BlurView
            intensity={12}
            tint="regular"
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.23)' }]}
          />
        </Animated.View>
      )}
    </SkeuCard>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    overflow: 'hidden',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.lg,
    margin: -spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textArea: {
    flex: 1,
    marginRight: spacing.md,
  },
  badge: {
    fontFamily: fontFamilies.bold,
    fontSize: 12,
    letterSpacing: 1,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.headline,
    marginBottom: spacing.xs,
  },
  imageArea: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  mochiImage: {
    width: 120,
    height: 120,
    marginRight: spacing.xl + spacing.sm,
    marginBottom: -spacing.md - spacing.sm,
  },
  btn: {
    marginTop: 0,
  },
  btnContent: {
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    fontFamily: fontFamilies.bold,
    fontSize: 13,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

const PEEK_OFFSET = 8;
const SCALE_STEP = 0.03;
const { threshold: SWIPE_THRESHOLD, velocityThreshold: VELOCITY_THRESHOLD, offscreenX: OFFSCREEN_X, frictionPower: FRICTION_POWER, frictionScale: FRICTION_SCALE } = swipeGesture;
const RANK_ANIM_DURATION = 250;

interface PromoConfig {
  key: PromoKey;
  onPress: () => void;
}

function usePromos(filter?: PromoKey[]): PromoConfig[] {
  const isPremium = useEffectivePremium();
  const hasRated = useHasRated();
  const actions = usePromoActions();

  return useMemo(() => {
    const keys: PromoKey[] = [];
    if (!isPremium) keys.push('techniques');
    keys.push('invite');
    if (!hasRated) keys.push('rate');

    const visible = filter ? keys.filter((k) => filter.includes(k)) : keys;
    return visible.map((key) => ({ key, onPress: actions[key] }));
  }, [isPremium, hasRated, actions, filter]);
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

  const blurStyle = useAnimatedStyle(() => {
    const isCurrentFront = isFront && rotationSV.value === currentRotation;
    const opacity = isCurrentFront
      ? interpolate(Math.abs(dragX.value), [0, OFFSCREEN_X * 0.3], [0, 1], Extrapolation.CLAMP)
      : 0;
    return { opacity };
  });

  return (
    <Animated.View style={[isFront ? styles.frontCard : styles.stackedCard, animStyle]}>
      <CTABannerCard
        badge={copy.badge}
        title={copy.title}
        buttonLabel={copy.buttonLabel}
        onPress={promo.onPress}
        accessibilityLabel={copy.accessibilityLabel}
        image={copy.image}
        imageComponent={copy.imageComponent}
        imageStyle={copy.imageStyle}
        imageContainerStyle={copy.imageContainerStyle}
        blurStyle={blurStyle}
      />
    </Animated.View>
  );
}

export function CTABannerCarousel({ promos: filter }: { promos?: PromoKey[] } = {}) {
  const promos = usePromos(filter);
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

  if (promos.length === 0) return null;

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
          image={copy.image}
          imageComponent={copy.imageComponent}
          imageStyle={copy.imageStyle}
          imageContainerStyle={copy.imageContainerStyle}
        />
      </View>
    );
  }

  const peekHeight = Math.min(promos.length - 1, 2) * PEEK_OFFSET;

  return (
    <View style={[styles.wrapper, { marginBottom: peekHeight }]}>
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
