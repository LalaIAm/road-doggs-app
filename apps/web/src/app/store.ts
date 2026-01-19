// Redux store configuration with offline persistence
import { configureStore, combineReducers, createListenerMiddleware } from '@reduxjs/toolkit';
import { persistStore, persistReducer, PersistConfig } from 'redux-persist';
import localforage from 'localforage';
import authReducer from '../store/authSlice';
import profileReducer from '../store/profileSlice';
import onboardingReducer from '../store/onboardingSlice';
import { api } from '../store/api';
import tripReducer from './slices/tripSlice';
import waypointsReducer from './slices/waypointsSlice';
import uiReducer from './slices/uiSlice';
import offlineReducer from './slices/offlineSlice';

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

// Initialize Sync Manager after store is created
let syncManager: any = null;

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

// Initialize Sync Manager
// Import dynamically to avoid circular dependencies
if (typeof window !== 'undefined') {
  import('./sync/SyncManager').then(({ SyncManager }) => {
    syncManager = new SyncManager(store);
    
    // Set up action listener for actions with meta.sync === true
    // As per TRD-174-176: Route actions to Firestore SDK or queue
    listenerMiddleware.startListening({
      predicate: (action, currentState, previousState) => {
        // Check if action has meta.sync === true
        return (action as any).meta?.sync === true;
      },
      effect: async (action, listenerApi) => {
        const state = listenerApi.getState() as RootState;
        const { networkStatus, status } = state.offline;
        
        // Create SyncAction from the dispatched action
        const syncAction: any = {
          id: `sync-${Date.now()}-${Math.random()}`,
          type: (action as any).meta.syncType || 'UPDATE_TRIP',
          payload: action.payload,
          timestamp: Date.now(),
          retryCount: 0,
        };
        
        // As per TRD-175: If IDLE, send directly to Firestore SDK
        if (status === 'IDLE' && networkStatus) {
          try {
            const { executeSyncAction } = await import('./sync/firestoreOperations');
            await executeSyncAction(syncAction);
            // Success - action was synced immediately
          } catch (error: any) {
            // If direct sync fails, add to queue
            if (syncManager) {
              syncManager.addToSyncQueue(syncAction);
            }
          }
        } else {
          // As per TRD-176: If OFFLINE or SYNCING, serialize and push to queue
          if (syncManager) {
            syncManager.addToSyncQueue(syncAction);
          }
        }
      },
    });
  });
}

// Export sync manager for external access if needed
export { syncManager };

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
