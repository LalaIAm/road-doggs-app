// Local storage utilities for onboarding state persistence
const STORAGE_KEY = 'onboarding_state';
const STORAGE_VERSION = 1;

/**
 * Save onboarding state to localStorage
 * @param {Object} state - Onboarding state object
 */
export function saveOnboardingState(state) {
  try {
    const data = {
      ...state,
      version: STORAGE_VERSION,
      lastSavedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save onboarding state to localStorage:', error);
  }
}

/**
 * Load onboarding state from localStorage
 * @returns {Object|null} Onboarding state or null if not found/invalid
 */
export function loadOnboardingState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored);
    
    // Validate version (allow migration in future)
    if (data.version !== STORAGE_VERSION) {
      console.warn('Onboarding state version mismatch, clearing old data');
      clearOnboardingState();
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to load onboarding state from localStorage:', error);
    return null;
  }
}

/**
 * Clear onboarding state from localStorage
 */
export function clearOnboardingState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear onboarding state from localStorage:', error);
  }
}