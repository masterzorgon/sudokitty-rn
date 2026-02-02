// Analytics utility for tracking user events
// This is a simple implementation that can be expanded to integrate with
// a real analytics service like Amplitude, Mixpanel, or PostHog

type AnalyticsEvent =
  | 'setting_changed'
  | 'feedback_submitted'
  | 'progress_reset'
  | 'external_link_opened'
  | 'paywall_opened';

interface SettingChangedPayload {
  setting: string;
  value: boolean;
}

interface FeedbackSubmittedPayload {
  category: string;
}

interface ExternalLinkPayload {
  destination: string;
}

interface PaywallPayload {
  source: string;
}

type EventPayload = {
  setting_changed: SettingChangedPayload;
  feedback_submitted: FeedbackSubmittedPayload;
  progress_reset: Record<string, never>;
  external_link_opened: ExternalLinkPayload;
  paywall_opened: PaywallPayload;
};

/**
 * Track an analytics event
 * @param event - The event name
 * @param payload - Event-specific data
 */
export function trackEvent<T extends AnalyticsEvent>(
  event: T,
  payload: EventPayload[T]
): void {
  // Log in development
  if (__DEV__) {
    console.log('[Analytics]', event, payload);
  }

  // TODO: Integrate with real analytics service
  // Example integrations:
  //
  // Amplitude:
  // import * as Amplitude from '@amplitude/analytics-react-native';
  // Amplitude.track(event, payload);
  //
  // Mixpanel:
  // import { Mixpanel } from 'mixpanel-react-native';
  // mixpanel.track(event, payload);
  //
  // PostHog:
  // import PostHog from 'posthog-react-native';
  // posthog.capture(event, payload);
}

// Convenience functions for common events

export function trackSettingChanged(setting: string, value: boolean): void {
  trackEvent('setting_changed', { setting, value });
}

export function trackFeedbackSubmitted(category: string): void {
  trackEvent('feedback_submitted', { category });
}

export function trackProgressReset(): void {
  trackEvent('progress_reset', {});
}

export function trackExternalLinkOpened(destination: string): void {
  trackEvent('external_link_opened', { destination });
}

export function trackPaywallOpened(source: string): void {
  trackEvent('paywall_opened', { source });
}
