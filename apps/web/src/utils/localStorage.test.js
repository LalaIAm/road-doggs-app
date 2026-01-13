// Unit tests for localStorage utilities
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveOnboardingState,
  loadOnboardingState,
  clearOnboardingState,
} from './localStorage';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('localStorage utilities', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('saveOnboardingState', () => {
    it('should save state to localStorage', () => {
      const state = {
        currentStep: 3,
        preferences: { routeVibe: 'scenic' },
        privacyConsent: true,
      };
      saveOnboardingState(state);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'onboarding_state',
        expect.stringContaining('"currentStep":3')
      );
    });

    it('should add version and timestamp', () => {
      const state = { currentStep: 2 };
      saveOnboardingState(state);
      const savedData = JSON.parse(
        localStorageMock.setItem.mock.calls[0][1]
      );
      expect(savedData.version).toBe(1);
      expect(savedData.lastSavedAt).toBeTruthy();
    });

    it('should handle errors gracefully', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const state = { currentStep: 1 };
      expect(() => saveOnboardingState(state)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('loadOnboardingState', () => {
    it('should load state from localStorage', () => {
      const state = {
        currentStep: 4,
        preferences: { routeVibe: 'efficient' },
        version: 1,
        lastSavedAt: '2025-01-01T00:00:00.000Z',
      };
      localStorageMock.setItem('onboarding_state', JSON.stringify(state));
      const loaded = loadOnboardingState();
      expect(loaded).toEqual(state);
      expect(localStorageMock.getItem).toHaveBeenCalledWith('onboarding_state');
    });

    it('should return null if no data exists', () => {
      const loaded = loadOnboardingState();
      expect(loaded).toBeNull();
    });

    it('should return null and clear if version mismatch', () => {
      const state = {
        currentStep: 2,
        version: 2, // Different version
        lastSavedAt: '2025-01-01T00:00:00.000Z',
      };
      localStorageMock.setItem('onboarding_state', JSON.stringify(state));
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const loaded = loadOnboardingState();
      expect(loaded).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('onboarding_state');
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle invalid JSON gracefully', () => {
      localStorageMock.setItem('onboarding_state', 'invalid json');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const loaded = loadOnboardingState();
      expect(loaded).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle errors gracefully', () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const loaded = loadOnboardingState();
      expect(loaded).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('clearOnboardingState', () => {
    it('should remove state from localStorage', () => {
      localStorageMock.setItem('onboarding_state', JSON.stringify({}));
      clearOnboardingState();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('onboarding_state');
    });

    it('should handle errors gracefully', () => {
      localStorageMock.removeItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => clearOnboardingState()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});