/**
 * Firebase Admin initialization and configuration
 */

import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
// Use lazy initialization to avoid blocking during module load
let adminInitialized = false;

function initializeAdmin() {
  if (!adminInitialized && !admin.apps.length) {
    admin.initializeApp();
    adminInitialized = true;
  }
}

// Initialize immediately (but this should be fast)
initializeAdmin();

export { admin };
