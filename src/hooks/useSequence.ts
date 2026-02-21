// Generic reusable multi-step sequence hook
// Domain-agnostic: can drive technique tutorials, onboarding, or any linear flow

import { useState, useCallback, useMemo } from 'react';

export interface SequenceConfig {
  totalSteps: number;
  onComplete?: () => void;
  onStepChange?: (step: number) => void;
}

export interface SequenceState {
  currentStep: number;
  totalSteps: number;
  isFirst: boolean;
  isLast: boolean;
  next: () => void;
  previous: () => void;
  goTo: (step: number) => void;
  reset: () => void;
}

export function useSequence({ totalSteps, onComplete, onStepChange }: SequenceConfig): SequenceState {
  const [currentStep, setCurrentStep] = useState(0);

  const next = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev >= totalSteps - 1) {
        onComplete?.();
        return prev;
      }
      const nextStep = prev + 1;
      onStepChange?.(nextStep);
      return nextStep;
    });
  }, [totalSteps, onComplete, onStepChange]);

  const previous = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev <= 0) return prev;
      const nextStep = prev - 1;
      onStepChange?.(nextStep);
      return nextStep;
    });
  }, [onStepChange]);

  const goTo = useCallback((step: number) => {
    const clamped = Math.max(0, Math.min(step, totalSteps - 1));
    setCurrentStep(clamped);
    onStepChange?.(clamped);
  }, [totalSteps, onStepChange]);

  const reset = useCallback(() => {
    setCurrentStep(0);
    onStepChange?.(0);
  }, [onStepChange]);

  return useMemo(() => ({
    currentStep,
    totalSteps,
    isFirst: currentStep === 0,
    isLast: currentStep === totalSteps - 1,
    next,
    previous,
    goTo,
    reset,
  }), [currentStep, totalSteps, next, previous, goTo, reset]);
}
