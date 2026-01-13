// Onboarding state slice with local persistence
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  saveOnboardingState,
  loadOnboardingState,
  clearOnboardingState,
} from '../utils/localStorage';

const initialState = {
  currentStep: 1,
  preferences: {
    routeVibe: null, // 'scenic' | 'efficient' | 'balanced'
    dailyPace: 'moderate', // 'relaxed' | 'moderate' | 'packed'
    interests: [], // string[] - multi-select
    vehicleType: 'car', // 'car' | 'ev' | 'rv'
    rvDetails: {
      heightClearance: null,
      totalLength: null,
    },
    budgetComfort: 2, // 1-3 (thrifty/balanced/splurge)
    collaboration: null, // 'solo' | 'friends' | 'family'
    isMainPlanner: false,
    aiRefinementText: '', // optional
  },
  privacyConsent: false,
  suggestedPreferences: null, // from AI refinement
  status: 'idle', // 'idle' | 'saving' | 'ai-refining' | 'completed' | 'error'
  lastSavedAt: null,
  error: null,
};

// Async thunk to save progress locally
export const saveProgressLocally = createAsyncThunk(
  'onboarding/saveProgressLocally',
  async (_, { getState }) => {
    const state = getState().onboarding;
    saveOnboardingState({
      currentStep: state.currentStep,
      preferences: state.preferences,
      privacyConsent: state.privacyConsent,
      suggestedPreferences: state.suggestedPreferences,
    });
    return { lastSavedAt: new Date().toISOString() };
  }
);

// Async thunk to hydrate from local storage
export const hydrateFromLocal = createAsyncThunk(
  'onboarding/hydrateFromLocal',
  async () => {
    const savedState = loadOnboardingState();
    if (savedState) {
      return {
        currentStep: savedState.currentStep || 1,
        preferences: savedState.preferences || initialState.preferences,
        privacyConsent: savedState.privacyConsent || false,
        suggestedPreferences: savedState.suggestedPreferences || null,
        lastSavedAt: savedState.lastSavedAt || null,
      };
    }
    return null;
  }
);

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    setCurrentStep: (state, action) => {
      state.currentStep = action.payload;
      state.error = null;
    },
    updatePreferences: (state, action) => {
      state.preferences = {
        ...state.preferences,
        ...action.payload,
      };
      state.error = null;
    },
    setPrivacyConsent: (state, action) => {
      state.privacyConsent = action.payload;
    },
    setSuggestedPreferences: (state, action) => {
      state.suggestedPreferences = action.payload;
    },
    setStatus: (state, action) => {
      state.status = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.status = 'error';
    },
    clearError: (state) => {
      state.error = null;
      if (state.status === 'error') {
        state.status = 'idle';
      }
    },
    resetOnboarding: (state) => {
      Object.assign(state, initialState);
      clearOnboardingState();
    },
    acceptSuggestedPreferences: (state) => {
      if (state.suggestedPreferences) {
        state.preferences = {
          ...state.preferences,
          ...state.suggestedPreferences,
        };
        state.suggestedPreferences = null;
      }
    },
    rejectSuggestedPreferences: (state) => {
      state.suggestedPreferences = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveProgressLocally.fulfilled, (state, action) => {
        state.lastSavedAt = action.payload.lastSavedAt;
      })
      .addCase(hydrateFromLocal.fulfilled, (state, action) => {
        if (action.payload) {
          state.currentStep = action.payload.currentStep;
          state.preferences = action.payload.preferences;
          state.privacyConsent = action.payload.privacyConsent;
          state.suggestedPreferences = action.payload.suggestedPreferences;
          state.lastSavedAt = action.payload.lastSavedAt;
        }
      });
  },
});

export const {
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
} = onboardingSlice.actions;

export default onboardingSlice.reducer;