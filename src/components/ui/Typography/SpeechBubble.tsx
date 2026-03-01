// SpeechBubble - Reusable speech bubble with seamless outline including pointer
// Uses SVG path for a continuous border across the entire silhouette

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ViewStyle, TextStyle, LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '../../../theme/colors';
import { typography, fontFamilies } from '../../../theme/typography';

type PointerDirection = 'up' | 'down' | 'left' | 'right';

const BORDER_RADIUS = 16;
const POINTER_WIDTH = 16;
const POINTER_HEIGHT = 10;
const STROKE_WIDTH = 1.5;
const STROKE_COLOR = '#d0c8c4';
const FILL_COLOR = colors.cardBackground;

export interface SpeechBubbleProps {
  text: string;
  pointerDirection: PointerDirection;
  pointerPosition?: number;
  maxLines?: number;
  scrollable?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

function buildPath(
  w: number,
  h: number,
  direction: PointerDirection,
  position: number,
): string {
  const s = STROKE_WIDTH / 2;
  const r = BORDER_RADIUS;
  const pw = POINTER_WIDTH;
  const ph = POINTER_HEIGHT;
  const half = pw / 2;

  if (direction === 'up') {
    const top = s;
    const bottom = h - s;
    const left = s;
    const right = w - s;
    const bodyTop = ph + s;
    const cx = Math.max(left + r + half, Math.min(right - r - half, w * position));
    return [
      `M ${left + r} ${bodyTop}`,
      `L ${cx - half} ${bodyTop}`,
      `L ${cx} ${top}`,
      `L ${cx + half} ${bodyTop}`,
      `L ${right - r} ${bodyTop}`,
      `Q ${right} ${bodyTop} ${right} ${bodyTop + r}`,
      `L ${right} ${bottom - r}`,
      `Q ${right} ${bottom} ${right - r} ${bottom}`,
      `L ${left + r} ${bottom}`,
      `Q ${left} ${bottom} ${left} ${bottom - r}`,
      `L ${left} ${bodyTop + r}`,
      `Q ${left} ${bodyTop} ${left + r} ${bodyTop}`,
      'Z',
    ].join(' ');
  }

  if (direction === 'down') {
    const top = s;
    const bottom = h - s;
    const left = s;
    const right = w - s;
    const bodyBottom = bottom - ph;
    const cx = Math.max(left + r + half, Math.min(right - r - half, w * position));
    return [
      `M ${left + r} ${top}`,
      `L ${right - r} ${top}`,
      `Q ${right} ${top} ${right} ${top + r}`,
      `L ${right} ${bodyBottom - r}`,
      `Q ${right} ${bodyBottom} ${right - r} ${bodyBottom}`,
      `L ${cx + half} ${bodyBottom}`,
      `L ${cx} ${bottom}`,
      `L ${cx - half} ${bodyBottom}`,
      `L ${left + r} ${bodyBottom}`,
      `Q ${left} ${bodyBottom} ${left} ${bodyBottom - r}`,
      `L ${left} ${top + r}`,
      `Q ${left} ${top} ${left + r} ${top}`,
      'Z',
    ].join(' ');
  }

  if (direction === 'left') {
    const top = s;
    const bottom = h - s;
    const left = s;
    const right = w - s;
    const bodyLeft = ph + s;
    const cy = Math.max(top + r + half, Math.min(bottom - r - half, h * position));
    return [
      `M ${bodyLeft + r} ${top}`,
      `L ${right - r} ${top}`,
      `Q ${right} ${top} ${right} ${top + r}`,
      `L ${right} ${bottom - r}`,
      `Q ${right} ${bottom} ${right - r} ${bottom}`,
      `L ${bodyLeft + r} ${bottom}`,
      `Q ${bodyLeft} ${bottom} ${bodyLeft} ${bottom - r}`,
      `L ${bodyLeft} ${cy + half}`,
      `L ${left} ${cy}`,
      `L ${bodyLeft} ${cy - half}`,
      `L ${bodyLeft} ${top + r}`,
      `Q ${bodyLeft} ${top} ${bodyLeft + r} ${top}`,
      'Z',
    ].join(' ');
  }

  // right
  const top = s;
  const bottom = h - s;
  const left = s;
  const right = w - s;
  const bodyRight = right - ph;
  const cy = Math.max(top + r + half, Math.min(bottom - r - half, h * position));
  return [
    `M ${left + r} ${top}`,
    `L ${bodyRight - r} ${top}`,
    `Q ${bodyRight} ${top} ${bodyRight} ${top + r}`,
    `L ${bodyRight} ${cy - half}`,
    `L ${right} ${cy}`,
    `L ${bodyRight} ${cy + half}`,
    `L ${bodyRight} ${bottom - r}`,
    `Q ${bodyRight} ${bottom} ${bodyRight - r} ${bottom}`,
    `L ${left + r} ${bottom}`,
    `Q ${left} ${bottom} ${left} ${bottom - r}`,
    `L ${left} ${top + r}`,
    `Q ${left} ${top} ${left + r} ${top}`,
    'Z',
  ].join(' ');
}

function getContentPadding(direction: PointerDirection) {
  return {
    paddingTop: direction === 'up' ? POINTER_HEIGHT + 12 : 12,
    paddingBottom: direction === 'down' ? POINTER_HEIGHT + 12 : 12,
    paddingLeft: direction === 'left' ? POINTER_HEIGHT + 20 : 20,
    paddingRight: direction === 'right' ? POINTER_HEIGHT + 20 : 20,
  };
}

export function SpeechBubble({
  text,
  pointerDirection,
  pointerPosition = 0.5,
  maxLines,
  scrollable = false,
  style,
  textStyle,
}: SpeechBubbleProps) {
  const [size, setSize] = useState({ w: 0, h: 0 });

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  }, []);

  const contentPadding = getContentPadding(pointerDirection);

  const textContent = scrollable ? (
    <ScrollView showsVerticalScrollIndicator={false} bounces={false} style={styles.scroll}>
      <Text style={[styles.text, textStyle]}>{text}</Text>
    </ScrollView>
  ) : (
    <Text style={[styles.text, textStyle]} numberOfLines={maxLines}>{text}</Text>
  );

  return (
    <View style={[styles.wrapper, style]} onLayout={onLayout}>
      {size.w > 0 && size.h > 0 && (
        <Svg
          width={size.w}
          height={size.h}
          style={styles.svg}
        >
          <Path
            d={buildPath(size.w, size.h, pointerDirection, pointerPosition)}
            fill={FILL_COLOR}
            stroke={STROKE_COLOR}
            strokeWidth={STROKE_WIDTH}
          />
        </Svg>
      )}
      <View style={contentPadding}>
        {textContent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'visible',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  text: {
    fontFamily: fontFamilies.semibold,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  scroll: {
    flexGrow: 0,
  },
});
