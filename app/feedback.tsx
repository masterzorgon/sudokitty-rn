import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Device from "expo-device";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";

import { colors, useColors } from "../src/theme/colors";
import { typography } from "../src/theme/typography";
import { spacing, borderRadius } from "../src/theme";
import { BackButton } from "../src/components/ui/BackButton";
import { BottomActionBar } from "../src/components/ui/Layout";
import { SkeuButton, SKEU_VARIANTS } from "../src/components/ui/Skeuomorphic";
import { playFeedback } from "../src/utils/feedback";
import { trackFeedbackSubmitted } from "../src/utils/analytics";
import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";
import { supabase } from "../src/lib/supabase";

/** Maps Edge Function invoke errors to short, user-facing copy. */
async function messageFromFeedbackInvokeError(error: unknown): Promise<string> {
  if (error instanceof FunctionsFetchError) {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  if (error instanceof FunctionsRelayError) {
    return "Couldn't reach the server. Please try again in a moment.";
  }
  if (error instanceof FunctionsHttpError) {
    const res = error.context as Response;
    const contentType = res.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
      try {
        const body = (await res.json()) as { error?: string };
        if (typeof body?.error === "string" && body.error.length > 0) {
          return body.error;
        }
      } catch {
        // use status fallbacks below
      }
    }
    const status = res.status;
    if (status === 400) {
      return "Something was wrong with your request. Check the form and try again.";
    }
    if (status >= 500) {
      return "We couldn't send your feedback right now. Please try again in a moment.";
    }
    return "Something went wrong while sending your feedback. Please try again.";
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Something went wrong while sending your feedback. Please try again.";
}

// Feedback categories
type FeedbackCategory = "bug" | "suggestion" | "compliment" | "other";

interface CategoryOption {
  id: FeedbackCategory;
  label: string;
}

const CATEGORIES: CategoryOption[] = [
  { id: "bug", label: "Issue / bug" },
  { id: "suggestion", label: "Suggestion" },
  { id: "compliment", label: "Compliment" },
  { id: "other", label: "Other" },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Dropdown component
interface DropdownProps {
  label: string;
  value: FeedbackCategory;
  options: CategoryOption[];
  onSelect: (value: FeedbackCategory) => void;
  disabled?: boolean;
}

function Dropdown({ label, value, options, onSelect, disabled }: DropdownProps) {
  const c = useColors();
  const [isOpen, setIsOpen] = useState(false);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (disabled) setIsOpen(false);
  }, [disabled]);

  const selectedOption = options.find((o) => o.id === value);

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  const handlePress = () => {
    if (disabled) return;
    playFeedback("tap");
    setIsOpen(true);
  };

  const handleSelect = (option: CategoryOption) => {
    playFeedback("tap");
    onSelect(option.id);
    setIsOpen(false);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <>
      <AnimatedPressable
        style={[styles.dropdown, animatedStyle, disabled && styles.inputDisabled]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <Text style={[styles.dropdownText, !selectedOption && styles.dropdownPlaceholder]}>
          {selectedOption?.label || "Select a reason"}
        </Text>
        <Feather name="chevron-down" size={20} color={colors.textSecondary} />
      </AnimatedPressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          playFeedback("tap");
          setIsOpen(false);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            playFeedback("tap");
            setIsOpen(false);
          }}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.modalOption,
                    item.id === value && { backgroundColor: c.cellSelected },
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      item.id === value && { color: c.accent, fontFamily: "Pally-Bold" },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.id === value && <Feather name="check" size={20} color={c.accent} />}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export default function FeedbackScreen() {
  const c = useColors();
  const router = useRouter();
  const submitLockRef = useRef(false);
  const [category, setCategory] = useState<FeedbackCategory>("bug");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate email format
  const isValidEmail = (emailStr: string) => {
    if (!emailStr.trim()) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr.trim());
  };

  const canSubmit = message.trim().length > 10 && isValidEmail(email);

  const getDeviceInfo = useCallback(() => {
    const appVersion = Constants.expoConfig?.version ?? "1.0.0";
    const buildNumber =
      Constants.expoConfig?.ios?.buildNumber ?? Constants.expoConfig?.android?.versionCode ?? "1";
    const osName = Platform.OS;
    const osVersion = Platform.Version;
    const deviceModel = Device.modelName ?? "Unknown";
    const deviceBrand = Device.brand ?? "Unknown";

    return {
      appVersion,
      buildNumber,
      osName,
      osVersion: String(osVersion),
      deviceModel,
      deviceBrand,
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || submitLockRef.current) return;
    submitLockRef.current = true;
    setIsSubmitting(true);
    playFeedback("tapHeavy");

    const deviceInfo = getDeviceInfo();

    try {
      const feedbackPayload = {
        category,
        email: email.trim() || undefined,
        message: message.trim(),
        deviceInfo,
        timestamp: new Date().toISOString(),
      };

      const { data, error: fnError } = await supabase.functions.invoke("send-feedback", {
        body: feedbackPayload,
      });

      if (fnError) {
        const msg = await messageFromFeedbackInvokeError(fnError);
        Alert.alert("Couldn't send feedback", msg, [{ text: "OK" }]);
        return;
      }

      const payload = data as { success?: boolean; error?: string } | null;
      if (payload?.success === false) {
        const msg =
          typeof payload.error === "string" && payload.error.length > 0
            ? payload.error
            : "Something went wrong while sending your feedback. Please try again.";
        Alert.alert("Couldn't send feedback", msg, [{ text: "OK" }]);
        return;
      }

      trackFeedbackSubmitted(category);

      Alert.alert(
        "Thank you!",
        "Your feedback has been sent. We really appreciate you taking the time to help us improve!",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
      );
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      const msg = await messageFromFeedbackInvokeError(error);
      Alert.alert("Couldn't send feedback", msg, [{ text: "OK" }]);
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  }, [canSubmit, category, email, message, getDeviceInfo, router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.cream }]} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <BackButton disabled={isSubmitting} />
          <Text style={styles.title}>Send Feedback</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Reason Dropdown */}
          <View style={styles.section}>
            <Text style={styles.label}>Reason for reaching out</Text>
            <Dropdown
              label="Select a Reason"
              value={category}
              options={CATEGORIES}
              onSelect={setCategory}
              disabled={isSubmitting}
            />
          </View>

          {/* Email Input */}
          <View style={styles.section}>
            <Text style={styles.label}>
              Email address <Text style={styles.labelOptional}>(optional)</Text>
            </Text>
            <TextInput
              style={[
                styles.textInputSingle,
                email.length > 0 && !isValidEmail(email) && styles.inputError,
              ]}
              placeholder="your@email.com"
              placeholderTextColor={colors.textLight}
              value={email}
              onChangeText={setEmail}
              maxLength={254}
              editable={!isSubmitting}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {email.length > 0 && !isValidEmail(email) && (
              <Text style={styles.errorText}>Please enter a valid email address</Text>
            )}
          </View>

          {/* Message Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={styles.textInputMulti}
              placeholder="Share your thoughts, ideas, or report an issue..."
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
              maxLength={2000}
              editable={!isSubmitting}
            />
            <Text style={styles.charCount}>{message.length} / 2000 characters</Text>
          </View>

          {/* Device Info Note */}
          <View style={[styles.infoNote, { backgroundColor: c.cellSelected }]}>
            <Feather name="info" size={16} color={colors.textSecondary} style={styles.infoIcon} />
            <Text style={styles.infoText}>
              We&apos;ll include device info (app version, OS) to help us understand and fix any
              issues.
            </Text>
          </View>
        </ScrollView>

        {/* Submit Button — same SkeuButton shell while loading (disabled + spinner inside) */}
        <BottomActionBar style={styles.footer}>
          <View accessibilityState={{ busy: isSubmitting }}>
            <SkeuButton
              onPress={handleSubmit}
              variant={isSubmitting || !canSubmit ? "disabled" : "primary"}
              borderRadius={borderRadius.lg}
              disabled={!canSubmit || isSubmitting}
              feedbackId="tapHeavy"
              contentStyle={styles.ctaButtonContent}
              accessibilityLabel={isSubmitting ? "Sending feedback" : "Send Feedback"}
              testID="send-feedback-button"
              showHighlight={false}
            >
              {isSubmitting ? (
                <View style={styles.ctaLoadingInner}>
                  <ActivityIndicator color={c.accent} />
                  <Text style={styles.loadingText}>Sending…</Text>
                </View>
              ) : (
                <Text
                  style={[
                    styles.ctaButtonLabel,
                    { color: SKEU_VARIANTS[canSubmit ? "primary" : "disabled"].textColor },
                  ]}
                >
                  Send Feedback
                </Text>
              )}
            </SkeuButton>
          </View>
        </BottomActionBar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  title: {
    ...typography.headline,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodyMedium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  labelOptional: {
    ...typography.caption,
    color: colors.textLight,
    fontFamily: "Pally-Regular",
  },
  // Dropdown styles
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 48,
  },
  dropdownText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  dropdownPlaceholder: {
    color: colors.textLight,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    width: "100%",
    maxWidth: 340,
    maxHeight: 400,
    overflow: "hidden",
  },
  modalTitle: {
    ...typography.headline,
    color: colors.textPrimary,
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gridLine,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gridLine,
  },
  modalOptionText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  // Input styles
  textInputSingle: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 48,
    ...typography.body,
    color: colors.textPrimary,
  },
  textInputMulti: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 150,
    ...typography.body,
    color: colors.textPrimary,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  inputError: {
    borderWidth: 1,
    borderColor: colors.errorText,
  },
  errorText: {
    ...typography.small,
    color: colors.errorText,
    marginTop: spacing.xs,
  },
  charCount: {
    ...typography.small,
    color: colors.textLight,
    textAlign: "right",
    marginTop: spacing.xs,
  },
  infoNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  infoIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  infoText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    paddingTop: spacing.md,
  },
  ctaLoadingInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  ctaButtonContent: {
    paddingVertical: 15,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButtonLabel: {
    ...typography.button,
    fontFamily: "Pally-Bold",
    fontSize: 17,
  },
});
