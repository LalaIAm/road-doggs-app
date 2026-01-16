/**
 * Data gathering utilities
 * Collects user data from Firestore for export
 */

import * as admin from 'firebase-admin';

export interface UserExportData {
  user: any;
  trips: any[];
  shareLinks: any[];
  preferences: any;
  auditLog: any[];
  metadata: {
    exportDate: string;
    exportVersion: string;
    totalRecords: number;
  };
}

/**
 * Gathers all user data from Firestore for export
 */
export async function gatherUserData(uid: string): Promise<UserExportData> {
  const db = admin.firestore();
  const batchSize = 500; // Firestore batch limit
  
  // Get user document
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new Error('User not found');
  }
  
  const userData = userDoc.data();
  
  // Get trips (paginated if needed)
  const trips: any[] = [];
  let tripsQuery = db.collection('trips').where('userId', '==', uid).limit(batchSize);
  let tripsSnapshot = await tripsQuery.get();
  
  while (!tripsSnapshot.empty) {
    tripsSnapshot.docs.forEach((doc) => {
      trips.push({ id: doc.id, ...doc.data() });
    });
    
    if (tripsSnapshot.docs.length === batchSize) {
      const lastDoc = tripsSnapshot.docs[tripsSnapshot.docs.length - 1];
      tripsQuery = db
        .collection('trips')
        .where('userId', '==', uid)
        .startAfter(lastDoc)
        .limit(batchSize);
      tripsSnapshot = await tripsQuery.get();
    } else {
      break;
    }
  }
  
  // Get share links
  const shareLinks: any[] = [];
  let shareLinksQuery = db.collection('shareLinks').where('ownerId', '==', uid).limit(batchSize);
  let shareLinksSnapshot = await shareLinksQuery.get();
  
  while (!shareLinksSnapshot.empty) {
    shareLinksSnapshot.docs.forEach((doc) => {
      shareLinks.push({ id: doc.id, ...doc.data() });
    });
    
    if (shareLinksSnapshot.docs.length === batchSize) {
      const lastDoc = shareLinksSnapshot.docs[shareLinksSnapshot.docs.length - 1];
      shareLinksQuery = db
        .collection('shareLinks')
        .where('ownerId', '==', uid)
        .startAfter(lastDoc)
        .limit(batchSize);
      shareLinksSnapshot = await shareLinksQuery.get();
    } else {
      break;
    }
  }
  
  // Get preferences (if stored separately)
  const preferencesDoc = await db.collection('preferences').doc(uid).get();
  const preferences = preferencesDoc.exists ? preferencesDoc.data() : null;
  
  // Get audit log (from user document)
  const auditLog = userData?.auditLog || [];
  
  // Calculate total records
  const totalRecords = 1 + trips.length + shareLinks.length + (preferences ? 1 : 0) + auditLog.length;
  
  return {
    user: {
      // Exclude sensitive fields
      uid: userData?.uid,
      email: userData?.email,
      displayName: userData?.displayName,
      photoURL: userData?.photoURL,
      createdAt: userData?.createdAt,
      updatedAt: userData?.updatedAt,
      preferences: userData?.preferences,
      privacyConsent: userData?.privacyConsent,
      // Explicitly exclude: password, tokens, secrets
    },
    trips,
    shareLinks,
    preferences,
    auditLog,
    metadata: {
      exportDate: new Date().toISOString(),
      exportVersion: '1.0',
      totalRecords,
    },
  };
}
