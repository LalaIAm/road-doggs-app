// Redux store configuration with offline persistence
import { configureStore, combineReducers, createListenerMiddleware } from '@reduxjs/toolkit';
import { persistStore, persistReducer, PersistConfig } from 'redux-persist';
import localforage from 'localforage';
import authReducer from '../store/authSlice';
import profileReducer from '../store/profileSlice';
import onboardingReducer from '../store/onboardingSlice';
import { api } from '../store/api';

// Placeholder reducers for future slices (will be implemented in later phases)
// These are temporary empty reducers to satisfy the store structure requirements
const tripReducer = (state = { trips: [], currentTrip: null, isLoading: false }, action: any) => state;
const waypointsReducer = (state = { ids: [], entities: {} }, action: any) => state;
const uiReducer = (state = { sidebarOpen: false, theme: 'light' }, action: any) => state;
const offlineReducer = (state = { 
  queue: [], 
  status: 'IDLE', // IDLE | OFFLINE | PENDING_WRITES | SYNCING | ERROR
  networkStatus: typeof navigator !== 'undefined' ? navigator.onLine : true,
  lastSyncAt: null,
  error: null
}, action: any) => state;

// Root reducer
const rootReducer = combineReducers({
  auth: authReducer,
  profile: profileReducer,
  onboarding: onboardingReducer,
  trip: tripReducer,
  waypoints: waypointsReducer,
  ui: uiReducer,
  offline: offlineReducer,
  [api.reducerPath]: api.reducer,
});

// Redux Persist configuration
const persistConfig: PersistConfig<ReturnType<typeof rootReducer>> = {
  key: 'root',
  storage: localforage,
  whitelist: ['offline'], // Only persist offline slice as per TRD-162
  // Transform to handle Firebase Timestamps if needed in the future
};

// Create listener middleware for side effects (e.g., Sync) as per TRD-159
export const listenerMiddleware = createListenerMiddleware();

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure serializable check middleware to ignore Firebase Timestamps
// as per TRD-158, and redux-persist actions which contain functions
const serializableCheck = {
  ignoredActions: [
    // Redux-persist actions that contain functions
    'persist/PERSIST',
    'persist/REHYDRATE',
    'persist/REGISTER',
    'persist/PAUSE',
    'persist/PURGE',
    'persist/FLUSH',
    // Actions that may contain Firebase Timestamps
    'auth/setCurrentUser',
    'auth/initialize/fulfilled',
    'profile/setProfile',
  ],
  ignoredActionPaths: [
    'meta.arg',
    'payload.timestamp',
    'payload.createdAt',
    'payload.updatedAt',
    'payload.metadata',
    'register', // redux-persist register function
    'rehydrate', // redux-persist rehydrate function
  ],
  ignoredPaths: [
    'auth.currentUser.metadata',
    'auth.currentUser.metadata.creationTime',
    'auth.currentUser.metadata.lastSignInTime',
    'profile.profile.createdAt',
    'profile.profile.updatedAt',
  ],
};

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck,
    })
      .concat(api.middleware)
      .prepend(listenerMiddleware.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Create persistor
export const persistor = persistStore(store);

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
