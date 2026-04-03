import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";

import { colors, useColors } from "../../theme/colors";
import { fontFamilies } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme";
import { SkeuButton } from "../ui/Skeuomorphic";
import { SheetWrapper, type SheetWrapperRef } from "../ui/Sheet/SheetWrapper";
import { playFeedback } from "../../utils/feedback";

export interface SelectionSheetLayoutRef {
  close: (callback?: () => void) => void;
}

export interface SelectionSheetLayoutProps {
  visible: boolean;
  onDismiss: () => void;
  pills: { icon: React.ReactNode; label: string }[];
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  buttonActive: boolean;
  buttonLoading?: boolean;
  activeButtonContent: React.ReactNode;
  inactiveButtonLabel: string;
  onButtonPress: () => void;
  /** When true, button shows insufficientFundsButtonContent with primary + sheen instead of disabled */
  insufficientFunds?: boolean;
  insufficientFundsButtonContent?: React.ReactNode;
  onInsufficientFundsPress?: () => void;
}

export const SelectionSheetLayout = forwardRef<SelectionSheetLayoutRef, SelectionSheetLayoutProps>(
  function SelectionSheetLayout(
    {
      visible,
      onDismiss,
      pills,
      title,
      subtitle,
      children,
      buttonActive,
      buttonLoading = false,
      activeButtonContent,
      inactiveButtonLabel,
      onButtonPress,
      insufficientFunds = false,
      insufficientFundsButtonContent,
      onInsufficientFundsPress,
    },
    ref,
  ) {
    const c = useColors();
    const sheetRef = useRef<SheetWrapperRef>(null);

    useImperativeHandle(
      ref,
      () => ({
        close: (cb) => sheetRef.current?.close(cb),
      }),
      [],
    );

    return (
      <SheetWrapper
        ref={sheetRef}
        visible={visible}
        onDismiss={onDismiss}
        containerStyle={{ backgroundColor: c.cream }}
      >
        {/* Balance pills */}
        <View style={styles.pillRow}>
          {pills.map((pill, i) => (
            <View key={i} style={[styles.pill, { backgroundColor: c.gridLine + "60" }]}>
              {pill.icon}
              <Text style={[styles.pillText, { color: c.textPrimary }]}>{pill.label}</Text>
            </View>
          ))}
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>{subtitle}</Text>
        ) : null}

        {/* Selection content */}
        <View style={styles.content}>{children}</View>

        {/* Action button */}
        <SkeuButton
          onPress={
            insufficientFunds && onInsufficientFundsPress ? onInsufficientFundsPress : onButtonPress
          }
          variant={buttonActive || insufficientFunds ? "primary" : "disabled"}
          sheen={buttonActive || insufficientFunds}
          disabled={(!buttonActive && !insufficientFunds) || buttonLoading}
          borderRadius={borderRadius.lg}
          style={styles.button}
          contentStyle={styles.buttonContent}
          accessibilityLabel={buttonActive ? undefined : inactiveButtonLabel}
        >
          {buttonLoading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : buttonActive ? (
            activeButtonContent
          ) : insufficientFunds && insufficientFundsButtonContent ? (
            insufficientFundsButtonContent
          ) : (
            <Text style={styles.inactiveText}>{inactiveButtonLabel}</Text>
          )}
        </SkeuButton>

        {/* No thanks */}
        <Pressable
          onPress={() => {
            playFeedback("tap");
            sheetRef.current?.close(onDismiss);
          }}
          style={styles.noThanks}
        >
          <Text style={[styles.noThanksText, { color: c.textSecondary }]}>No Thanks</Text>
        </Pressable>
      </SheetWrapper>
    );
  },
);

export const selectionSheetStyles = StyleSheet.create({
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  buttonText: {
    fontFamily: fontFamilies.bold,
    fontSize: 16,
    color: colors.white,
  },
  buttonSeparator: {
    fontFamily: fontFamilies.bold,
    fontSize: 16,
    color: "rgba(255,255,255,0.6)",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  /** Match store mochi tiles: 10px inset from tile edge */
  mochiPackIconTile: {
    padding: 10,
    overflow: "hidden",
  },
  mochiPackIconImageInner: {
    width: 28,
    height: 28,
  },
});

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: "row",
    alignSelf: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  pillText: {
    fontFamily: fontFamilies.bold,
    fontSize: 16,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 18,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  content: {
    width: "100%",
    marginBottom: spacing.md,
  },
  button: {
    width: "100%",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
  },
  inactiveText: {
    fontFamily: fontFamilies.bold,
    fontSize: 16,
    color: colors.textSecondary,
  },
  noThanks: {
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
    alignSelf: "center",
  },
  noThanksText: {
    fontFamily: fontFamilies.bold,
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
