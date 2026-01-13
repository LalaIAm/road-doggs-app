// Unit tests for analytics utilities
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import analytics, { trackEvent } from './analytics';

describe('analytics utilities', () => {
  let consoleLogSpy;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });

  describe('trackEvent', () => {
    it('should log events in development', () => {
      process.env.NODE_ENV = 'development';
      trackEvent('test_event', { prop: 'value' });
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics]',
        'test_event',
        { prop: 'value' }
      );
    });

    it('should not log in production', () => {
      process.env.NODE_ENV = 'production';
      trackEvent('test_event', { prop: 'value' });
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('analytics.onboardingStarted', () => {
    it('should track onboarding started event', () => {
      process.env.NODE_ENV = 'development';
      analytics.onboardingStarted('user123');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics]',
        'onboarding_started',
        { userId: 'user123' }
      );
    });

    it('should track without userId', () => {
      process.env.NODE_ENV = 'development';
      analytics.onboardingStarted();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics]',
        'onboarding_started',
        {}
      );
    });
  });

  describe('analytics.onboardingStepCompleted', () => {
    it('should track step completion with stepId and userId', () => {
      process.env.NODE_ENV = 'development';
      analytics.onboardingStepCompleted(3, 'user123');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics]',
        'onboarding_step_completed',
        { stepId: 3, userId: 'user123' }
      );
    });

    it('should track without userId', () => {
      process.env.NODE_ENV = 'development';
      analytics.onboardingStepCompleted(2);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics]',
        'onboarding_step_completed',
        { stepId: 2 }
      );
    });
  });

  describe('analytics.onboardingCompleted', () => {
    it('should track completion event', () => {
      process.env.NODE_ENV = 'development';
      analytics.onboardingCompleted('user123');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics]',
        'onboarding_completed',
        { userId: 'user123' }
      );
    });
  });

  describe('analytics.onboardingAbandoned', () => {
    it('should track abandonment with current step', () => {
      process.env.NODE_ENV = 'development';
      analytics.onboardingAbandoned(4, 'user123');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics]',
        'onboarding_abandoned',
        { currentStep: 4, userId: 'user123' }
      );
    });
  });

  describe('analytics.aiRefinementRequested', () => {
    it('should track AI refinement request', () => {
      process.env.NODE_ENV = 'development';
      analytics.aiRefinementRequested('user123');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics]',
        'ai_refinement_requested',
        { userId: 'user123' }
      );
    });
  });

  describe('analytics.aiRefinementSucceeded', () => {
    it('should track AI refinement success', () => {
      process.env.NODE_ENV = 'development';
      analytics.aiRefinementSucceeded('user123');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics]',
        'ai_refinement_succeeded',
        { userId: 'user123' }
      );
    });
  });

  describe('analytics.aiRefinementFailed', () => {
    it('should track AI refinement failure with error', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Network error');
      analytics.aiRefinementFailed(error, 'user123');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics]',
        'ai_refinement_failed',
        { error: 'Network error', userId: 'user123' }
      );
    });

    it('should handle error without message', () => {
      process.env.NODE_ENV = 'development';
      analytics.aiRefinementFailed({}, 'user123');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics]',
        'ai_refinement_failed',
        { error: 'unknown', userId: 'user123' }
      );
    });
  });

  describe('analytics.consentGiven', () => {
    it('should track consent given event', () => {
      process.env.NODE_ENV = 'development';
      analytics.consentGiven('user123');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Analytics]',
        'consent_given',
        { userId: 'user123' }
      );
    });
  });
});