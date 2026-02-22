// Feedback screen for user feedback submission
// Includes dropdown reason selector, name, email, message, and Resend integration

import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Pressable } from 'react-native';

import { colors, useColors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';
import { spacing, borderRadius } from '../src/theme';
import { BackButton } from '../src/components/ui/BackButton';
import { SkeuButton, SKEU_VARIANTS } from '../src/components/ui/Skeuomorphic';
import * as Haptics from 'expo-haptics';
import { triggerHaptic, ImpactFeedbackStyle } from '../src/utils/haptics';
import { trackFeedbackSubmitted } from '../src/utils/analytics';
import { supabase } from '../src/lib/supabase';

// Feedback categories
type FeedbackCategory = 'issue' | 'suggestion' | 'compliment' | 'other';

interface CategoryOption {
  id: FeedbackCategory;
  label: string;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'issue', label: 'issue / bug' },
  { id: 'suggestion', label: 'suggestion' },
  { id: 'compliment', label: 'compliment' },
  { id: 'other', label: 'other' },
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

  const selectedOption = options.find((o) => o.id === value);

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 100 });
  };

  const handlePress = () => {
    if (disabled) return;
    triggerHaptic(ImpactFeedbackStyle.Light);
    setIsOpen(true);
  };

  const handleSelect = (option: CategoryOption) => {
    triggerHaptic(ImpactFeedbackStyle.Light);
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
          {selectedOption?.label || 'select a reason'}
        </Text>
        <Feather name="chevron-down" size={20} color={colors.textSecondary} />
      </AnimatedPressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsOpen(false)}>
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
                      item.id === value && { color: c.accent, fontFamily: 'Pally-Bold' },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.id === value && (
                    <Feather name="check" size={20} color={c.accent} />
                  )}
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
  const [category, setCategory] = useState<FeedbackCategory>('issue');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate email format
  const isValidEmail = (emailStr: string) => {
    if (!emailStr.trim()) return true; // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr.trim());
  };

  const canSubmit =
    message.trim().length > 10 &&
    name.trim().length > 0 &&
    isValidEmail(email);

  const getDeviceInfo = useCallback(() => {
    const appVersion = Constants.expoConfig?.version ?? '1.0.0';
    const buildNumber =
      Constants.expoConfig?.ios?.buildNumber ??
      Constants.expoConfig?.android?.versionCode ??
      '1';
    const osName = Platform.OS;
    const osVersion = Platform.Version;
    const deviceModel = Device.modelName ?? 'Unknown';
    const deviceBrand = Device.brand ?? 'Unknown';

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
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    triggerHaptic(ImpactFeedbackStyle.Medium);

    const deviceInfo = getDeviceInfo();

    try {
      const feedbackPayload = {
        category,
        name: name.trim(),
        email: email.trim() || undefined,
        message: message.trim(),
        deviceInfo,
        timestamp: new Date().toISOString(),
      };

      // Send via Supabase Edge Function → Resend
      const { error: fnError } = await supabase.functions.invoke('send-feedback', {
        body: feedbackPayload,
      });

      if (fnError) throw fnError;

      // Track analytics event
      trackFeedbackSubmitted(category);

      // Success
      Alert.alert(
        'thank you!',
        'your feedback has been sent. we really appreciate you taking the time to help us improve!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      Alert.alert(
        'oops!',
        'something went wrong while sending your feedback. please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, isSubmitting, category, name, email, message, getDeviceInfo, router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.cream }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.title}>send feedback</Text>
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
            <Text style={styles.label}>reason for reaching out</Text>
            <Dropdown
              label="select a reason"
              value={category}
              options={CATEGORIES}
              onSelect={setCategory}
              disabled={isSubmitting}
            />
          </View>

          {/* Email Input */}
          <View style={styles.section}>
            <Text style={styles.label}>
              email address{' '}
              <Text style={styles.labelOptional}>(optional)</Text>
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
            <Text style={styles.label}>message</Text>
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
            <Text style={styles.charCount}>
              {message.length} / 2000 characters
            </Text>
          </View>

          {/* Device Info Note */}
          <View style={[styles.infoNote, { backgroundColor: c.cellSelected }]}>
            <Feather
              name="info"
              size={16}
              color={colors.textSecondary}
              style={styles.infoIcon}
            />
            <Text style={styles.infoText}>
              We'll include device info (app version, OS) to help us understand
              and fix any issues.
            </Text>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          {isSubmitting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={c.accent} />
              <Text style={styles.loadingText}>sending...</Text>
            </View>
          ) : (
            <SkeuButton
              onPress={handleSubmit}
              variant={canSubmit ? 'primary' : 'disabled'}
              borderRadius={borderRadius.lg}
              disabled={!canSubmit}
              hapticStyle={Haptics.ImpactFeedbackStyle.Medium}
              contentStyle={styles.ctaButtonContent}
              accessibilityLabel="Send Feedback"
              testID="send-feedback-button"
              showHighlight={false}
            >
              <Text style={[styles.ctaButtonLabel, { color: SKEU_VARIANTS[canSubmit ? 'primary' : 'disabled'].textColor }]}>
                send feedback
              </Text>
            </SkeuButton>
          )}
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontFamily: 'Pally-Regular',
  },
  // Dropdown styles
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 340,
    maxHeight: 400,
    overflow: 'hidden',
  },
  modalTitle: {
    ...typography.headline,
    color: colors.textPrimary,
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.gridLine,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  ctaButtonContent: {
    paddingVertical: 15,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonLabel: {
    ...typography.button,
    fontFamily: 'Pally-Bold',
    fontSize: 17,
  },
});
