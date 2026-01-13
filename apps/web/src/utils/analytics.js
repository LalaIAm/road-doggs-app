// Analytics event emitter - pluggable wrapper for analytics service
// Can be wired to actual analytics service later (e.g., Google Analytics, Mixpanel)

/**
 * Track an analytics event
 * @param {string} eventName - Event name (e.g., 'onboarding_started')
 * @param {Object} properties - Event properties (e.g., { stepId: 2, userId: '...' })
 */
export function trackEvent(eventName, properties = {}) {
  // For now, log to console. Can be wired to actual analytics service later.
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', eventName, properties);
  }

  // TODO: Wire to actual analytics service
  // Example: window.gtag?.('event', eventName, properties);
  // Example: window.mixpanel?.track(eventName, properties);
}

/**
 * Analytics helper object with specific event tracking methods
 */
export const analytics = {
  /**
   * Track onboarding lifecycle events
   */
  onboardingStarted: (userId) => {
    trackEvent('onboarding_started', userId ? { userId } : {});
  },

  onboardingStepCompleted: (stepId, userId) => {
    trackEvent('onboarding_step_completed', {
      stepId,
      ...(userId ? { userId } : {}),
    });
  },

  onboardingCompleted: (userId) => {
    trackEvent('onboarding_completed', userId ? { userId } : {});
  },

  onboardingAbandoned: (currentStep, userId) => {
    trackEvent('onboarding_abandoned', {
      currentStep,
      ...(userId ? { userId } : {}),
    });
  },

  /**
   * Track AI refinement events
   */
  aiRefinementRequested: (userId) => {
    trackEvent('ai_refinement_requested', userId ? { userId } : {});
  },

  aiRefinementSucceeded: (userId) => {
    trackEvent('ai_refinement_succeeded', userId ? { userId } : {});
  },

  aiRefinementFailed: (error, userId) => {
    trackEvent('ai_refinement_failed', {
      error: error?.message || 'unknown',
      ...(userId ? { userId } : {}),
    });
  },

  /**
   * Track consent events
   */
  consentGiven: (userId) => {
    trackEvent('consent_given', userId ? { userId } : {});
  },
};

export default analytics;