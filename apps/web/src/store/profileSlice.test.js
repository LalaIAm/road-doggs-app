// Unit tests for profileSlice
// Completed TODO: implement reducer coverage.
import { describe, it, expect } from 'vitest';

import profileReducer, {
  setProfile,
  setLoading,
  setError,
  setUploadProgress,
  clearProfile,
  updateProfileField,
} from './profileSlice';

describe('profileSlice', () => {
  it('returns the expected initial state', () => {
    const state = profileReducer(undefined, { type: 'init' });
    expect(state).toEqual({
      profile: null,
      isLoading: false,
      error: null,
      uploadProgress: 0,
    });
  });

  it('setProfile stores profile and clears error', () => {
    const state = profileReducer(
      { ...profileReducer(undefined, { type: 'init' }), error: 'prev' },
      setProfile({ name: 'Alex' })
    );
    expect(state.profile).toEqual({ name: 'Alex' });
    expect(state.error).toBe(null);
  });

  it('setLoading toggles isLoading', () => {
    const state1 = profileReducer(undefined, setLoading(true));
    const state2 = profileReducer(state1, setLoading(false));
    expect(state1.isLoading).toBe(true);
    expect(state2.isLoading).toBe(false);
  });

  it('setError stores error and clears loading', () => {
    const state = profileReducer(
      { ...profileReducer(undefined, { type: 'init' }), isLoading: true },
      setError('profile/not-found')
    );
    expect(state.error).toBe('profile/not-found');
    expect(state.isLoading).toBe(false);
  });

  it('setUploadProgress updates uploadProgress', () => {
    const state = profileReducer(undefined, setUploadProgress(42));
    expect(state.uploadProgress).toBe(42);
  });

  it('updateProfileField merges fields when profile exists', () => {
    const start = profileReducer(undefined, setProfile({ name: 'Alex', city: 'SF' }));
    const state = profileReducer(start, updateProfileField({ city: 'NYC' }));
    expect(state.profile).toEqual({ name: 'Alex', city: 'NYC' });
  });

  it('updateProfileField is a no-op when profile is null', () => {
    const start = profileReducer(undefined, { type: 'init' });
    const state = profileReducer(start, updateProfileField({ city: 'NYC' }));
    expect(state.profile).toBe(null);
  });

  it('clearProfile resets profile, error, and uploadProgress', () => {
    const populated = {
      profile: { name: 'Alex' },
      isLoading: false,
      error: 'prev',
      uploadProgress: 99,
    };
    const state = profileReducer(populated, clearProfile());
    expect(state.profile).toBe(null);
    expect(state.error).toBe(null);
    expect(state.uploadProgress).toBe(0);
  });
});
