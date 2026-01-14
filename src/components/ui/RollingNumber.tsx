// Animated rolling number component - digits roll vertically like an odometer
// Inspired by wheel picker animation pattern

import React, { memo, useEffect, useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';

import type { TextStyle, StyleProp } from 'react-native';
import { springConfigs } from '../../theme/animations';

// Use the rolling spring config from theme for consistency
const ROLLING_SPRING_CONFIG = springConfigs.rolling;

// Extract a specific digit from a number by index (0 = ones, 1 = tens, etc.)
const getDigitByIndex = (value: number, digitIndex: number, maxDigits: number): number => {
  'worklet';
  const paddedValue = Math.abs(value).toString().padStart(maxDigits, '0');
  return parseInt(paddedValue[maxDigits - 1 - digitIndex] ?? '0', 10);
};

interface AnimatedDigitProps {
  index: number;
  value: number;
  height: number;
  width: number;
  fontSize: number;
  textStyle: StyleProp<TextStyle>;
  maxDigits: number;
}

const AnimatedDigit = memo(({
  index,
  value,
  height,
  width,
  fontSize,
  textStyle,
  maxDigits,
}: AnimatedDigitProps) => {
  const animatedValue = useSharedValue(value);

  // Update animated value when prop changes
  useEffect(() => {
    animatedValue.value = value;
  }, [value, animatedValue]);

  // Extract the digit at this position
  const digit = useDerivedValue(() => {
    return getDigitByIndex(animatedValue.value, index, maxDigits);
  }, [index, maxDigits]);

  // Calculate invisible leading digits for centering
  const invisibleDigitsAmount = useDerivedValue(() => {
    const len = Math.abs(animatedValue.value).toString().length;
    return maxDigits - len;
  }, [maxDigits]);

  // Determine if this digit should be visible (hide leading zeros)
  const isVisible = useDerivedValue(() => {
    const digitValue = getDigitByIndex(animatedValue.value, index, maxDigits);
    if (digitValue !== 0) return true;
    return index < maxDigits - invisibleDigitsAmount.value;
  }, [index, maxDigits]);

  // Rolling animation - translate Y to show the correct digit
  const rDigitsStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withSpring(-height * digit.value, ROLLING_SPRING_CONFIG),
        },
      ],
    };
  }, [height]);

  // Opacity and position adjustment for leading zeros
  const rContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isVisible.value ? 1 : 0, { duration: 150 }),
      transform: [
        {
          translateX: withSpring((-width * invisibleDigitsAmount.value) / 2, ROLLING_SPRING_CONFIG),
        },
      ],
    };
  });

  const flattenedTextStyle = useMemo(() => StyleSheet.flatten(textStyle), [textStyle]);

  // Calculate the vertical padding needed to center text within fixed height
  // This ensures consistent baseline across all digits
  const verticalPadding = (height - fontSize) / 2;

  return (
    <Animated.View
      style={[
        {
          height,
          width,
          overflow: 'hidden',
        },
        rContainerStyle,
      ]}
    >
      <Animated.View style={[{ flexDirection: 'column' }, rDigitsStyle]}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <View
            key={num}
            style={{
              height,
              width,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              style={[
                flattenedTextStyle,
                {
                  fontSize,
                  lineHeight: fontSize,
                  textAlign: 'center',
                  includeFontPadding: false,
                  // On Android, explicitly remove padding
                  ...(Platform.OS === 'android' ? { textAlignVertical: 'center' } : {}),
                },
              ]}
            >
              {num}
            </Text>
          </View>
        ))}
      </Animated.View>
    </Animated.View>
  );
});

AnimatedDigit.displayName = 'AnimatedDigit';

export interface RollingNumberProps {
  value: number;
  fontSize?: number;
  color?: string;
  textStyle?: StyleProp<TextStyle>;
  digitHeight?: number;
  digitWidth?: number;
  maxDigits?: number;
  padWithZeros?: boolean;
}

export const RollingNumber = memo(({
  value,
  fontSize = 14,
  color,
  textStyle,
  digitHeight,
  digitWidth,
  maxDigits: maxDigitsProp,
  padWithZeros = false,
}: RollingNumberProps) => {
  // Calculate dimensions based on font size if not provided
  // Height should match typical line-height for baseline alignment
  const height = digitHeight ?? Math.ceil(fontSize * 1.2);
  const width = digitWidth ?? Math.ceil(fontSize * 0.65);

  // Determine max digits needed
  const maxDigits = maxDigitsProp ?? Math.max(2, Math.abs(value).toString().length);

  // Build text style (without fontSize - passed separately for precise control)
  const combinedTextStyle: TextStyle = useMemo(() => ({
    fontWeight: '500',
    ...(color ? { color } : {}),
    ...StyleSheet.flatten(textStyle),
  }), [color, textStyle]);

  return (
    <View style={styles.container}>
      <Animated.View style={styles.digitsRow}>
        {Array.from({ length: maxDigits }).map((_, index) => (
          <AnimatedDigit
            key={index}
            index={index}
            value={value}
            height={height}
            width={width}
            fontSize={fontSize}
            textStyle={combinedTextStyle}
            maxDigits={maxDigits}
          />
        ))}
      </Animated.View>
    </View>
  );
});

RollingNumber.displayName = 'RollingNumber';

// Specialized component for time display (MM:SS or HH:MM:SS)
export interface RollingTimeProps {
  seconds: number;
  fontSize?: number;
  color?: string;
  textStyle?: StyleProp<TextStyle>;
  showHours?: boolean;
}

export const RollingTime = memo(({
  seconds,
  fontSize = 14,
  color,
  textStyle,
  showHours = false,
}: RollingTimeProps) => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  // Use consistent height calculation
  const height = Math.ceil(fontSize * 1.2);
  const width = Math.ceil(fontSize * 0.65);

  // Build text style (without fontSize - passed separately)
  const combinedTextStyle: TextStyle = useMemo(() => ({
    fontWeight: '500',
    ...(color ? { color } : {}),
    ...StyleSheet.flatten(textStyle),
  }), [color, textStyle]);

  // Colon style matches the digit containers for alignment
  const colonStyle: TextStyle = useMemo(() => ({
    ...combinedTextStyle,
    fontSize,
    lineHeight: height,
    height,
    width: width * 0.5,
    textAlign: 'center',
  }), [combinedTextStyle, fontSize, height, width]);

  return (
    <View style={styles.container}>
      <View style={styles.timeRow}>
        {showHours && hours > 0 && (
          <>
            <RollingNumber
              value={hours}
              fontSize={fontSize}
              textStyle={combinedTextStyle}
              digitHeight={height}
              digitWidth={width}
              maxDigits={2}
              padWithZeros
            />
            <Text style={colonStyle}>:</Text>
          </>
        )}
        <RollingNumber
          value={mins}
          fontSize={fontSize}
          textStyle={combinedTextStyle}
          digitHeight={height}
          digitWidth={width}
          maxDigits={2}
          padWithZeros
        />
        <Text style={colonStyle}>:</Text>
        <RollingNumber
          value={secs}
          fontSize={fontSize}
          textStyle={combinedTextStyle}
          digitHeight={height}
          digitWidth={width}
          maxDigits={2}
          padWithZeros
        />
      </View>
    </View>
  );
});

RollingTime.displayName = 'RollingTime';

const styles = StyleSheet.create({
  container: {
    // Removed centering - let parent control alignment
  },
  digitsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
