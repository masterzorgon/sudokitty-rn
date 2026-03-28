// Animated rolling number component - digits roll vertically like an odometer
// Inspired by wheel picker animation pattern

import React, { memo, useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";

import type { TextStyle, StyleProp } from "react-native";
import { springConfigs } from "../../theme/animations";
import { fontFamilies } from "../../theme/typography";

// Use the rolling spring config from theme for consistency
const ROLLING_SPRING_CONFIG = springConfigs.rolling;

// Extract a specific digit from a number by index (0 = ones, 1 = tens, etc.)
// Rounds so fractional values during count-up animation resolve to stable digits
const getDigitByIndex = (value: number, digitIndex: number, maxDigits: number): number => {
  "worklet";
  const intValue = Math.round(Math.abs(value));
  const paddedValue = intValue.toString().padStart(maxDigits, "0");
  return parseInt(paddedValue[maxDigits - 1 - digitIndex] ?? "0", 10);
};

/** How hidden leading zeros shift the digit strip (default: centered, like timer) */
export type RollingDigitsAlign = "center" | "end";

interface AnimatedDigitProps {
  index: number;
  value: number;
  height: number;
  width: number;
  fontSize: number;
  textStyle: StyleProp<TextStyle>;
  maxDigits: number;
  padWithZeros?: boolean;
  /** Animate value with linear timing on the UI thread (count-up effect) */
  countUp?: boolean;
  digitsAlign: RollingDigitsAlign;
}

const AnimatedDigit = memo(
  ({
    index,
    value,
    height,
    width,
    fontSize,
    textStyle,
    maxDigits,
    padWithZeros = false,
    countUp = false,
    digitsAlign = "center",
  }: AnimatedDigitProps) => {
    const animatedValue = useSharedValue(value);
    const prevValue = useRef(value);

    // Update animated value when prop changes (count-up uses UI-thread withTiming)
    useEffect(() => {
      if (countUp) {
        const delta = value - prevValue.current;
        if (delta > 0) {
          const baseDuration = Math.min(800, Math.max(300, delta * 30));
          const duration = Math.round(baseDuration * 1.08);
          animatedValue.value = withTiming(value, {
            duration,
            easing: Easing.linear,
          });
        } else {
          animatedValue.value = value;
        }
      } else {
        animatedValue.value = value;
      }
      prevValue.current = value;
    }, [value, animatedValue, countUp]);

    // Extract the digit at this position
    const digit = useDerivedValue(() => {
      return getDigitByIndex(animatedValue.value, index, maxDigits);
    }, [index, maxDigits]);

    // Calculate invisible leading digits for centering
    const invisibleDigitsAmount = useDerivedValue(() => {
      const intValue = Math.round(Math.abs(animatedValue.value));
      const len = intValue.toString().length;
      return maxDigits - len;
    }, [maxDigits]);

    // Determine if this digit should be visible (hide leading zeros unless padWithZeros)
    const isVisible = useDerivedValue(() => {
      if (padWithZeros) return true;
      const digitValue = getDigitByIndex(animatedValue.value, index, maxDigits);
      if (digitValue !== 0) return true;
      return index < maxDigits - invisibleDigitsAmount.value;
    }, [index, maxDigits, padWithZeros]);

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
    // When padWithZeros is true, keep fixed position (no translateX shift)
    const rContainerStyle = useAnimatedStyle(() => {
      const inv = invisibleDigitsAmount.value;
      // end: right-align value so ones place stays fixed as digit count grows (header XP + suffix)
      // center: legacy odometer look (timer, etc.)
      const shift = padWithZeros ? 0 : digitsAlign === "end" ? -width * inv : (-width * inv) / 2;
      return {
        opacity: withTiming(isVisible.value ? 1 : 0, { duration: 150 }),
        transform: [
          {
            translateX: padWithZeros ? 0 : withSpring(shift, ROLLING_SPRING_CONFIG),
          },
        ],
      };
    }, [padWithZeros, digitsAlign, width]);

    const flattenedTextStyle = useMemo(() => StyleSheet.flatten(textStyle), [textStyle]);

    return (
      <Animated.View
        style={[
          {
            height,
            width,
            overflow: "hidden",
          },
          rContainerStyle,
        ]}
      >
        <Animated.View style={[{ flexDirection: "column" }, rDigitsStyle]}>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <View
              key={num}
              style={{
                height,
                width,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={[
                  flattenedTextStyle,
                  {
                    fontSize,
                    lineHeight: height,
                    textAlign: "center",
                    includeFontPadding: false,
                    // On Android, explicitly remove padding
                    ...(Platform.OS === "android" ? { textAlignVertical: "center" } : {}),
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
  },
);

AnimatedDigit.displayName = "AnimatedDigit";

export interface RollingNumberProps {
  value: number;
  fontSize?: number;
  color?: string;
  textStyle?: StyleProp<TextStyle>;
  digitHeight?: number;
  digitWidth?: number;
  maxDigits?: number;
  padWithZeros?: boolean;
  /** Animate increases with a linear count-up on the UI thread (no extra JS re-renders) */
  countUp?: boolean;
  /** Right-align digits so length changes don't shift the group relative to a suffix (e.g. "XP") */
  digitsAlign?: RollingDigitsAlign;
}

export const RollingNumber = memo(
  ({
    value,
    fontSize = 14,
    color,
    textStyle,
    digitHeight,
    digitWidth,
    maxDigits: maxDigitsProp,
    padWithZeros = false,
    countUp = false,
    digitsAlign = "center",
  }: RollingNumberProps) => {
    // Calculate dimensions based on font size if not provided
    // Height uses 1.4x multiplier to match typical text line-height for baseline alignment
    const height = digitHeight ?? Math.ceil(fontSize * 1.4);
    const width = digitWidth ?? Math.ceil(fontSize * 0.65);

    // Determine max digits needed
    const maxDigits = maxDigitsProp ?? Math.max(2, Math.abs(value).toString().length);

    // Build text style (without fontSize - passed separately for precise control)
    const combinedTextStyle: TextStyle = useMemo(
      () => ({
        fontFamily: fontFamilies.medium,
        ...(color ? { color } : {}),
        ...StyleSheet.flatten(textStyle),
      }),
      [color, textStyle],
    );

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
              padWithZeros={padWithZeros}
              countUp={countUp}
              digitsAlign={digitsAlign}
            />
          ))}
        </Animated.View>
      </View>
    );
  },
);

RollingNumber.displayName = "RollingNumber";

// Specialized component for time display (MM:SS or HH:MM:SS)
export interface RollingTimeProps {
  seconds: number;
  fontSize?: number;
  color?: string;
  textStyle?: StyleProp<TextStyle>;
  showHours?: boolean;
}

export const RollingTime = memo(
  ({ seconds, fontSize = 14, color, textStyle, showHours = false }: RollingTimeProps) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    // Use consistent height calculation (1.4x to match RollingNumber)
    const height = Math.ceil(fontSize * 1.4);
    const width = Math.ceil(fontSize * 0.65);

    // Build text style (without fontSize - passed separately)
    const combinedTextStyle: TextStyle = useMemo(
      () => ({
        fontFamily: fontFamilies.medium,
        ...(color ? { color } : {}),
        ...StyleSheet.flatten(textStyle),
      }),
      [color, textStyle],
    );

    // Colon style matches the digit containers for alignment
    const colonStyle: TextStyle = useMemo(
      () => ({
        ...combinedTextStyle,
        fontSize,
        lineHeight: height,
        height,
        width: width * 0.5,
        textAlign: "center",
        marginTop: -1, // Slight upward adjustment for optical alignment
      }),
      [combinedTextStyle, fontSize, height, width],
    );

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
  },
);

RollingTime.displayName = "RollingTime";

const styles = StyleSheet.create({
  container: {
    // Removed centering - let parent control alignment
  },
  digitsRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
});
