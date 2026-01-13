// Onboarding Page - Main container with step navigation
import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  setCurrentStep,
  updatePreferences,
  setPrivacyConsent,
  setSuggestedPreferences,
  setStatus,
  setError,
  clearError,
  saveProgressLocally,
  hydrateFromLocal,
  acceptSuggestedPreferences,
  rejectSuggestedPreferences,
} from '../store/onboardingSlice';
import {
  useSavePreferencesMutation,
  useRefinePreferencesWithAIMutation,
} from '../store/onboardingApi';
import analytics from '../utils/analytics';
import ProgressBar from '../components/onboarding/ProgressBar';
import WelcomeStep from '../components/onboarding/WelcomeStep';
import TravelStyleStep from '../components/onboarding/TravelStyleStep';
import InterestsStep from '../components/onboarding/InterestsStep';
import ConstraintsStep from '../components/onboarding/ConstraintsStep';
import CollaborationStep from '../components/onboarding/CollaborationStep';
import AIRefinementStep from '../components/onboarding/AIRefinementStep';
import CompletionStep from '../components/onboarding/CompletionStep';

const TOTAL_STEPS = 7;

function OnboardingPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const stepContentRef = useRef(null);

  // Redux state
  const currentUser = useSelector((state) => state.auth.currentUser);
  const idToken = useSelector((state) => state.auth.idToken);
  const {
    currentStep,
    preferences,
    privacyConsent,
    suggestedPreferences,
    status,
    error,
  } = useSelector((state) => state.onboarding);

  // RTK Query mutations
  const [savePreferences, { isLoading: isSaving }] = useSavePreferencesMutation();
  const [refineWithAI, { isLoading: isRefining }] = useRefinePreferencesWithAIMutation();

  // Hydrate from local storage on mount
  useEffect(() => {
    dispatch(hydrateFromLocal());
    analytics.onboardingStarted(currentUser?.uid);
  }, [dispatch, currentUser?.uid]);

  // Auto-save to local storage on step/preference change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(saveProgressLocally());
    }, 1000);

    return () => clearTimeout(timer);
  }, [dispatch, currentStep, preferences, privacyConsent]);

  // Track step completion
  useEffect(() => {
    if (currentStep > 1 && currentStep < TOTAL_STEPS) {
      analytics.onboardingStepCompleted(currentStep, currentUser?.uid);
    }
  }, [currentStep, currentUser?.uid]);

  // Track abandonment on unmount if not completed
  useEffect(() => {
    return () => {
      if (status !== 'completed') {
        analytics.onboardingAbandoned(currentStep, currentUser?.uid);
      }
    };
  }, [status, currentStep, currentUser?.uid]);

  // Focus management for accessibility
  useEffect(() => {
    if (stepContentRef.current) {
      const firstFocusable = stepContentRef.current.querySelector(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, [currentStep]);

  const handleNext = () => {
    // Validation for required fields
    if (currentStep === 2 && !preferences.routeVibe) {
      dispatch(setError('Please select a route vibe'));
      return;
    }

    if (currentStep < TOTAL_STEPS) {
      dispatch(clearError());
      dispatch(setCurrentStep(currentStep + 1));
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      dispatch(clearError());
      dispatch(setCurrentStep(currentStep - 1));
    }
  };

  const handleSkip = () => {
    if (
      window.confirm(
        "Are you sure? We can't customize your route without these details."
      )
    ) {
      navigate('/');
    }
  };

  const handleSaveAndExit = async () => {
    if (!currentUser) {
      // Save locally and redirect to sign-in
      dispatch(saveProgressLocally());
      navigate('/signin', { state: { from: '/onboarding' } });
      return;
    }

    try {
      dispatch(setStatus('saving'));
      const travelPreferences = {
        ...preferences,
        lastUpdatedAt: new Date().toISOString(),
      };

      await savePreferences({
        userId: currentUser.uid,
        travelPreferences,
        privacyConsent,
      }).unwrap();

      dispatch(setStatus('completed'));
      navigate('/profile');
    } catch (err) {
      dispatch(setError(err.data || 'Failed to save preferences'));
      dispatch(setStatus('error'));
    }
  };

  const handleComplete = async () => {
    if (!currentUser) {
      navigate('/signin', { state: { from: '/onboarding' } });
      return;
    }

    try {
      dispatch(setStatus('saving'));
      dispatch(clearError());

      const travelPreferences = {
        ...preferences,
        lastUpdatedAt: new Date().toISOString(),
      };

      await savePreferences({
        userId: currentUser.uid,
        travelPreferences,
        privacyConsent,
      }).unwrap();

      dispatch(setStatus('completed'));
      analytics.onboardingCompleted(currentUser.uid);

      // Small delay before redirect for better UX
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (err) {
      dispatch(setError(err.data || 'Failed to save preferences'));
      dispatch(setStatus('error'));
    }
  };

  const handleRefineWithAI = async (text) => {
    if (!privacyConsent) {
      dispatch(setError('Privacy consent is required for AI refinement'));
      return;
    }

    if (!idToken) {
      dispatch(setError('Authentication required for AI refinement'));
      navigate('/signin', { state: { from: '/onboarding' } });
      return;
    }

    try {
      dispatch(setStatus('ai-refining'));
      dispatch(clearError());
      analytics.aiRefinementRequested(currentUser?.uid);

      const result = await refineWithAI({
        preferences,
        aiRefinementText: text || preferences.aiRefinementText,
        idToken,
      }).unwrap();

      dispatch(setSuggestedPreferences(result));
      dispatch(setStatus('idle'));
      analytics.aiRefinementSucceeded(currentUser?.uid);
    } catch (err) {
      dispatch(setError(err.data || 'AI refinement failed. You can continue without it.'));
      dispatch(setStatus('error'));
      analytics.aiRefinementFailed(err, currentUser?.uid);
    }
  };

  const handleAcceptSuggestions = () => {
    dispatch(acceptSuggestedPreferences());
    dispatch(setError(null));
  };

  const handleRejectSuggestions = () => {
    dispatch(rejectSuggestedPreferences());
  };

  const handleConsentChange = (consented) => {
    dispatch(setPrivacyConsent(consented));
    if (consented) {
      analytics.consentGiven(currentUser?.uid);
    }
  };

  const handlePlanTrip = () => {
    navigate('/');
  };

  const handleEditPreferences = () => {
    navigate('/profile');
  };

  const isStepValid = () => {
    if (currentStep === 2) {
      return !!preferences.routeVibe;
    }
    return true;
  };

  const renderStep = () => {
    const commonProps = {
      onUpdate: (partial) => dispatch(updatePreferences(partial)),
      error: error,
    };

    switch (currentStep) {
      case 1:
        return <WelcomeStep onNext={handleNext} />;
      case 2:
        return (
          <TravelStyleStep
            {...commonProps}
            preferences={preferences}
          />
        );
      case 3:
        return (
          <InterestsStep
            {...commonProps}
            preferences={preferences}
          />
        );
      case 4:
        return (
          <ConstraintsStep
            {...commonProps}
            preferences={preferences}
          />
        );
      case 5:
        return (
          <CollaborationStep
            {...commonProps}
            preferences={preferences}
          />
        );
      case 6:
        return (
          <AIRefinementStep
            {...commonProps}
            preferences={preferences}
            privacyConsent={privacyConsent}
            aiRefinementText={preferences.aiRefinementText}
            suggestedPreferences={suggestedPreferences}
            onConsentChange={handleConsentChange}
            onRefineWithAI={handleRefineWithAI}
            isLoading={isRefining}
            onAcceptSuggestions={handleAcceptSuggestions}
            onRejectSuggestions={handleRejectSuggestions}
          />
        );
      case 7:
        return (
          <CompletionStep
            onPlanTrip={handlePlanTrip}
            onEditPreferences={handleEditPreferences}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-sand bg-map-pattern flex flex-col items-center justify-between py-6">
      {/* Header */}
      <header className="w-full max-w-2xl px-6 flex items-center justify-between mb-8 z-10">
        <div className="flex items-center gap-2">
          <i className="ph-fill ph-map-trifold text-2xl text-moss" aria-hidden="true" />
          <span className="font-display font-semibold text-lg text-charcoal">
            RoadDoggs
          </span>
        </div>

        <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />

        {(currentStep > 1 && currentStep < TOTAL_STEPS) && (
          <button
            onClick={handleSkip}
            className="text-sm font-medium text-gray-500 hover:text-moss transition-colors focus:outline-none focus:ring-2 focus:ring-moss/20 rounded"
            aria-label="Skip onboarding for now"
          >
            Skip for now
          </button>
        )}
      </header>

      {/* Main Content */}
      <main
        className="w-full flex-1 flex flex-col justify-center max-w-2xl px-6 relative z-10"
        ref={stepContentRef}
      >
        {renderStep()}
      </main>

      {/* Footer Controls */}
      {(currentStep > 1 && currentStep < TOTAL_STEPS) && (
        <footer className="w-full max-w-2xl px-6 pb-6 pt-4 flex justify-between items-center z-10">
          <button
            onClick={handleBack}
            className="px-6 py-3 rounded-xl text-gray-500 font-medium hover:bg-white/50 transition-colors flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-moss/20"
            aria-label="Go to previous step"
          >
            <i className="ph-bold ph-arrow-left" aria-hidden="true" /> Back
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleSaveAndExit}
              disabled={isSaving}
              className="px-6 py-3 rounded-xl text-gray-600 font-medium hover:bg-white/50 transition-colors border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-moss/20"
              aria-label="Save progress and exit"
            >
              {isSaving ? 'Saving...' : 'Save & Exit'}
            </button>

            <button
              onClick={handleNext}
              disabled={!isStepValid() || isSaving}
              className="bg-charcoal text-white px-8 py-3.5 rounded-full font-medium hover:bg-black transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-moss/50"
              aria-label={
                currentStep === TOTAL_STEPS - 1
                  ? 'Finish setup'
                  : 'Continue to next step'
              }
            >
              {currentStep === TOTAL_STEPS - 1 ? (
                <>
                  Finish Setup <i className="ph-bold ph-check" aria-hidden="true" />
                </>
              ) : (
                <>
                  Continue{' '}
                  <i className="ph-bold ph-arrow-right" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}

export default OnboardingPage;