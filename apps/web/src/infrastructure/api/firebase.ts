// Firebase client initialization with offline persistence
// This file initializes the Firebase Web SDK and enables IndexedDB persistence
// as per TRD-15: The system must utilize the Firestore Web SDK with enableIndexedDbPersistence() active

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase app
const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

// Enable offline persistence for Firestore (IndexedDB)
// This caches active document snapshots locally as per TRD-15
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    // Multiple tabs open, persistence can only be enabled in one tab at a time
    console.warn('Firestore persistence failed: Multiple tabs open. Persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    // The current browser does not support all of the features required for persistence
    console.warn('Firestore persistence failed: Browser does not support persistence.');
  } else {
    // Other error occurred
    console.error('Firestore persistence error:', err);
  }
});

export default app;
