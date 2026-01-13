// Unit tests for authSlice
// Completed TODO: implement reducer/extraReducer coverage without real Firebase.
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Prevent Firebase SDK initialization in unit tests.
vi.mock('../config/firebase', () => ({
  auth: { currentUser: null },
  db: {},
}));

vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  onAuthStateChanged: vi.fn(),
  onIdTokenChanged: vi.fn(),
  GoogleAuthProvider: class GoogleAuthProvider {},
  OAuthProvider: class OAuthProvider {
    constructor() {}
  },
  FacebookAuthProvider: class FacebookAuthProvider {},
  linkWithPopup: vi.fn(),
  unlink: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
}));

import authReducer, {
  setCurrentUser,
  setIdToken,
  setProvidersLinked,
  setError,
  clearAuth,
  signInWithEmail,
  signOut,
  refreshIdToken,
  linkProvider,
  unlinkProvider,
} from './authSlice';

const mockUser = (overrides = {}) => ({
  uid: 'uid_123',
  email: 'user@example.com',
  providerData: [{ providerId: 'password' }],
  ...overrides,
});

describe('authSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the expected initial state', () => {
    const state = authReducer(undefined, { type: 'init' });
    expect(state).toEqual({
      currentUser: null,
      idToken: null,
      providersLinked: [],
      isLoading: false,
      error: null,
      isInitialized: false,
    });
  });

  it('setCurrentUser sets user and clears error', () => {
    const user = mockUser();
    const state = authReducer(
      { ...authReducer(undefined, { type: 'init' }), error: 'some_error' },
      setCurrentUser(user)
    );
    expect(state.currentUser).toBe(user);
    expect(state.error).toBe(null);
  });

  it('setIdToken updates idToken', () => {
    const state = authReducer(undefined, setIdToken('token_abc'));
    expect(state.idToken).toBe('token_abc');
  });

  it('setProvidersLinked updates providersLinked', () => {
    const state = authReducer(undefined, setProvidersLinked(['google.com']));
    expect(state.providersLinked).toEqual(['google.com']);
  });

  it('setError sets error and stops loading', () => {
    const state = authReducer(
      { ...authReducer(undefined, { type: 'init' }), isLoading: true },
      setError('auth/invalid-credential')
    );
    expect(state.error).toBe('auth/invalid-credential');
    expect(state.isLoading).toBe(false);
  });

  it('clearAuth resets auth state (except isInitialized)', () => {
    const populated = {
      ...authReducer(undefined, { type: 'init' }),
      currentUser: mockUser(),
      idToken: 'token',
      providersLinked: ['password', 'google.com'],
      error: 'oops',
      isInitialized: true,
    };
    const state = authReducer(populated, clearAuth());
    expect(state.currentUser).toBe(null);
    expect(state.idToken).toBe(null);
    expect(state.providersLinked).toEqual([]);
    expect(state.error).toBe(null);
    expect(state.isInitialized).toBe(true);
  });

  it('signInWithEmail pending sets loading and clears error', () => {
    const state = authReducer(
      { ...authReducer(undefined, { type: 'init' }), error: 'prev' },
      { type: signInWithEmail.pending.type }
    );
    expect(state.isLoading).toBe(true);
    expect(state.error).toBe(null);
  });

  it('signInWithEmail fulfilled stores user + token and clears loading', () => {
    const user = mockUser();
    const state = authReducer(
      { ...authReducer(undefined, { type: 'init' }), isLoading: true },
      { type: signInWithEmail.fulfilled.type, payload: { user, token: 't1' } }
    );
    expect(state.currentUser).toBe(user);
    expect(state.idToken).toBe('t1');
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(null);
  });

  it('signInWithEmail rejected stores error payload and clears loading', () => {
    const state = authReducer(
      { ...authReducer(undefined, { type: 'init' }), isLoading: true },
      { type: signInWithEmail.rejected.type, payload: 'auth/wrong-password' }
    );
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('auth/wrong-password');
  });

  it('refreshIdToken fulfilled updates idToken', () => {
    const state = authReducer(
      { ...authReducer(undefined, { type: 'init' }), idToken: 'old' },
      { type: refreshIdToken.fulfilled.type, payload: 'new_token' }
    );
    expect(state.idToken).toBe('new_token');
  });

  it('linkProvider fulfilled updates currentUser + providersLinked', () => {
    const user = mockUser({ providerData: [{ providerId: 'password' }] });
    const state = authReducer(
      { ...authReducer(undefined, { type: 'init' }), isLoading: true },
      {
        type: linkProvider.fulfilled.type,
        payload: { user, providers: ['password', 'google.com'] },
      }
    );
    expect(state.currentUser).toBe(user);
    expect(state.providersLinked).toEqual(['password', 'google.com']);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(null);
  });

  it('unlinkProvider fulfilled updates providersLinked', () => {
    const state = authReducer(
      {
        ...authReducer(undefined, { type: 'init' }),
        providersLinked: ['password', 'google.com'],
        isLoading: true,
      },
      {
        type: unlinkProvider.fulfilled.type,
        payload: { providers: ['password'] },
      }
    );
    expect(state.providersLinked).toEqual(['password']);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(null);
  });

  it('signOut fulfilled resets auth fields', () => {
    const populated = {
      ...authReducer(undefined, { type: 'init' }),
      currentUser: mockUser(),
      idToken: 'token',
      providersLinked: ['password', 'google.com'],
      isLoading: true,
      error: 'prev',
    };
    const state = authReducer(populated, { type: signOut.fulfilled.type });
    expect(state.currentUser).toBe(null);
    expect(state.idToken).toBe(null);
    expect(state.providersLinked).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(null);
  });
});
