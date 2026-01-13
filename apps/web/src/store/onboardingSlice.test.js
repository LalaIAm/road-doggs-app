// Unit tests for onboardingSlice
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import onboardingReducer, {
  setCurrentStep,
  updatePreferences,
  setPrivacyConsent,
  setSuggestedPreferences,
  setStatus,
  setError,
  clearError,
  resetOnboarding,
  acceptSuggestedPreferences,
  rejectSuggestedPreferences,
  saveProgressLocally,
  hydrateFromLocal,
} from './onboardingSlice';
import * as localStorageUtils from '../utils/localStorage';

// Mock localStorage utilities
vi.mock('../utils/localStorage', () => ({
  saveOnboardingState: vi.fn(),
  loadOnboardingState: vi.fn(() => null),
  clearOnboardingState: vi.fn(),
}));

describe('onboardingSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        onboarding: onboardingReducer,
      },
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().onboarding;
      expect(state.currentStep).toBe(1);
      expect(state.preferences.routeVibe).toBeNull();
      expect(state.preferences.dailyPace).toBe('moderate');
      expect(state.preferences.interests).toEqual([]);
      expect(state.preferences.vehicleType).toBe('car');
      expect(state.privacyConsent).toBe(false);
      expect(state.status).toBe('idle');
      expect(state.error).toBeNull();
    });
  });

  describe('setCurrentStep', () => {
    it('should update current step', () => {
      store.dispatch(setCurrentStep(3));
      expect(store.getState().onboarding.currentStep).toBe(3);
    });

    it('should clear error when step changes', () => {
      store.dispatch(setError('Some error'));
      store.dispatch(setCurrentStep(2));
      expect(store.getState().onboarding.error).toBeNull();
    });
  });

  describe('updatePreferences', () => {
    it('should update preferences partially', () => {
      store.dispatch(updatePreferences({ routeVibe: 'scenic' }));
      expect(store.getState().onboarding.preferences.routeVibe).toBe('scenic');
    });

    it('should merge preferences without overwriting others', () => {
      store.dispatch(updatePreferences({ routeVibe: 'scenic' }));
      store.dispatch(updatePreferences({ dailyPace: 'relaxed' }));
      const prefs = store.getState().onboarding.preferences;
      expect(prefs.routeVibe).toBe('scenic');
      expect(prefs.dailyPace).toBe('relaxed');
    });

    it('should update interests array', () => {
      store.dispatch(updatePreferences({ interests: ['nature', 'food'] }));
      expect(store.getState().onboarding.preferences.interests).toEqual([
        'nature',
        'food',
      ]);
    });

    it('should update RV details conditionally', () => {
      store.dispatch(
        updatePreferences({
          vehicleType: 'rv',
          rvDetails: { heightClearance: '8-10', totalLength: '20-30' },
        })
      );
      const prefs = store.getState().onboarding.preferences;
      expect(prefs.vehicleType).toBe('rv');
      expect(prefs.rvDetails.heightClearance).toBe('8-10');
      expect(prefs.rvDetails.totalLength).toBe('20-30');
    });

    it('should clear error when preferences update', () => {
      store.dispatch(setError('Some error'));
      store.dispatch(updatePreferences({ routeVibe: 'efficient' }));
      expect(store.getState().onboarding.error).toBeNull();
    });
  });

  describe('setPrivacyConsent', () => {
    it('should update privacy consent', () => {
      store.dispatch(setPrivacyConsent(true));
      expect(store.getState().onboarding.privacyConsent).toBe(true);
    });
  });

  describe('setSuggestedPreferences', () => {
    it('should store AI suggestions', () => {
      const suggestions = { routeVibe: 'scenic', interests: ['nature'] };
      store.dispatch(setSuggestedPreferences(suggestions));
      expect(store.getState().onboarding.suggestedPreferences).toEqual(
        suggestions
      );
    });
  });

  describe('acceptSuggestedPreferences', () => {
    it('should merge suggestions into preferences', () => {
      const suggestions = { routeVibe: 'scenic', interests: ['nature'] };
      store.dispatch(setSuggestedPreferences(suggestions));
      store.dispatch(acceptSuggestedPreferences());
      const prefs = store.getState().onboarding.preferences;
      expect(prefs.routeVibe).toBe('scenic');
      expect(prefs.interests).toEqual(['nature']);
      expect(store.getState().onboarding.suggestedPreferences).toBeNull();
    });

    it('should do nothing if no suggestions', () => {
      const initialState = store.getState().onboarding.preferences;
      store.dispatch(acceptSuggestedPreferences());
      expect(store.getState().onboarding.preferences).toEqual(initialState);
    });
  });

  describe('rejectSuggestedPreferences', () => {
    it('should clear suggestions', () => {
      store.dispatch(setSuggestedPreferences({ routeVibe: 'scenic' }));
      store.dispatch(rejectSuggestedPreferences());
      expect(store.getState().onboarding.suggestedPreferences).toBeNull();
    });
  });

  describe('setStatus', () => {
    it('should update status', () => {
      store.dispatch(setStatus('saving'));
      expect(store.getState().onboarding.status).toBe('saving');
    });
  });

  describe('setError', () => {
    it('should set error and status to error', () => {
      store.dispatch(setError('Test error'));
      const state = store.getState().onboarding;
      expect(state.error).toBe('Test error');
      expect(state.status).toBe('error');
    });
  });

  describe('clearError', () => {
    it('should clear error and reset status from error', () => {
      store.dispatch(setError('Test error'));
      store.dispatch(clearError());
      const state = store.getState().onboarding;
      expect(state.error).toBeNull();
      expect(state.status).toBe('idle');
    });

    it('should not change status if not error', () => {
      store.dispatch(setStatus('saving'));
      store.dispatch(clearError());
      expect(store.getState().onboarding.status).toBe('saving');
    });
  });

  describe('resetOnboarding', () => {
    it('should reset to initial state', () => {
      store.dispatch(setCurrentStep(5));
      store.dispatch(updatePreferences({ routeVibe: 'scenic' }));
      store.dispatch(setPrivacyConsent(true));
      store.dispatch(resetOnboarding());
      const state = store.getState().onboarding;
      expect(state.currentStep).toBe(1);
      expect(state.preferences.routeVibe).toBeNull();
      expect(state.privacyConsent).toBe(false);
      expect(localStorageUtils.clearOnboardingState).toHaveBeenCalled();
    });
  });

  describe('saveProgressLocally', () => {
    it('should save state to localStorage', async () => {
      store.dispatch(setCurrentStep(3));
      store.dispatch(updatePreferences({ routeVibe: 'scenic' }));
      await store.dispatch(saveProgressLocally());
      expect(localStorageUtils.saveOnboardingState).toHaveBeenCalled();
      const callArgs = localStorageUtils.saveOnboardingState.mock.calls[0][0];
      expect(callArgs.currentStep).toBe(3);
      expect(callArgs.preferences.routeVibe).toBe('scenic');
    });

    it('should update lastSavedAt timestamp', async () => {
      await store.dispatch(saveProgressLocally());
      const state = store.getState().onboarding;
      expect(state.lastSavedAt).toBeTruthy();
    });
  });

  describe('hydrateFromLocal', () => {
    it('should load state from localStorage', async () => {
      const savedState = {
        currentStep: 4,
        preferences: { routeVibe: 'efficient', interests: ['food'] },
        privacyConsent: true,
        lastSavedAt: '2025-01-01T00:00:00.000Z',
      };
      localStorageUtils.loadOnboardingState.mockReturnValue(savedState);
      await store.dispatch(hydrateFromLocal());
      const state = store.getState().onboarding;
      expect(state.currentStep).toBe(4);
      expect(state.preferences.routeVibe).toBe('efficient');
      expect(state.preferences.interests).toEqual(['food']);
      expect(state.privacyConsent).toBe(true);
      expect(state.lastSavedAt).toBe('2025-01-01T00:00:00.000Z');
    });

    it('should not update state if localStorage is empty', async () => {
      localStorageUtils.loadOnboardingState.mockReturnValue(null);
      const initialState = store.getState().onboarding;
      await store.dispatch(hydrateFromLocal());
      const state = store.getState().onboarding;
      expect(state.currentStep).toBe(initialState.currentStep);
    });
  });
});