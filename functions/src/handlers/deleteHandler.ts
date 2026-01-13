/**
 * Deletion handler - HTTP endpoints for account deletion
 */

import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { verifyToken, requireRecentAuth, verifyPrivacyConsent, AuthenticatedRequest } from '../utils/auth';
import { createJob, updateJobStatus, getJob, hasActiveJob } from '../utils/jobStatus';
import { auditActions } from '../utils/audit';
import { sendDeletionCompletionEmail } from '../utils/email';
import { deleteFilesByPrefix } from '../utils/storage';

const BATCH_SIZE = 500; // Firestore batch write limit

/**
 * POST /v1/auth/delete/start
 * Starts an account deletion job for the authenticated user
 */
export async function deleteStart(req: Request, res: Response): Promise<void> {
  // Verify authentication
  await new Promise<void>((resolve) => {
    verifyToken(req as AuthenticatedRequest, res, () => resolve());
  });
  
  const authReq = req as AuthenticatedRequest;
  if (!authReq.uid) {
    return;
  }
  
  const uid = authReq.uid;
  
  try {
    // Require recent authentication for high-sensitivity operation
    if (!requireRecentAuth(authReq)) {
      res.status(403).json({
        error: 'REAUTH_REQUIRED',
        message: 'Recent authentication required. Please sign in again.',
      });
      return;
    }
    
    // Verify privacy consent
    const hasConsent = await verifyPrivacyConsent(uid);
    if (!hasConsent) {
      res.status(403).json({
        error: 'CONSENT_REQUIRED',
        message: 'Privacy consent required to delete account',
      });
      return;
    }
    
    // Check if user is already marked for deletion
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData?.deletedAt) {
        res.status(400).json({
          error: 'ALREADY_DELETED',
          message: 'Account is already marked for deletion',
        });
        return;
      }
    }
    
    // Check for active deletion job (idempotency)
    const hasActive = await hasActiveJob(uid, 'deletion');
    if (hasActive) {
      const jobsRef = admin.firestore().collection('jobs');
      const activeJob = await jobsRef
        .where('uid', '==', uid)
        .where('type', '==', 'deletion')
        .where('status', 'in', ['pending', 'in_progress'])
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
      
      if (!activeJob.empty) {
        const jobId = activeJob.docs[0].id;
        res.status(200).json({
          jobId,
          message: 'Deletion job already in progress',
          status: 'pending',
        });
        return;
      }
    }
    
    // Mark user for deletion (two-stage deletion)
    await admin.firestore().collection('users').doc(uid).update({
      deletionRequestedAt: admin.firestore.Timestamp.now(),
    });
    
    // Create new job
    const jobId = await createJob(uid, 'deletion');
    
    // Log audit entry
    await auditActions.deletionRequested(uid, jobId);
    
    // Start background processing
    processDeletionJob(uid, jobId).catch((error) => {
      console.error(`Deletion job ${jobId} failed:`, error);
    });
    
    res.status(202).json({
      jobId,
      message: 'Deletion job started',
      status: 'pending',
    });
  } catch (error: any) {
    console.error('Error starting deletion job:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to start deletion job',
    });
  }
}

/**
 * GET /v1/auth/delete/:jobId/status
 * Returns deletion job status
 */
export async function deleteStatus(req: Request, res: Response): Promise<void> {
  // Verify authentication
  await new Promise<void>((resolve) => {
    verifyToken(req as AuthenticatedRequest, res, () => resolve());
  });
  
  const authReq = req as AuthenticatedRequest;
  if (!authReq.uid) {
    return;
  }
  
  const uid = authReq.uid;
  const jobId = req.params.jobId;
  
  try {
    const job = await getJob(jobId);
    
    if (!job) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Deletion job not found',
      });
      return;
    }
    
    // Verify job belongs to user
    if (job.uid !== uid) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'Access denied',
      });
      return;
    }
    
    const response: any = {
      jobId: job.jobId,
      status: job.status,
      createdAt: job.createdAt.toDate().toISOString(),
      updatedAt: job.updatedAt.toDate().toISOString(),
    };
    
    if (job.startedAt) {
      response.startedAt = job.startedAt.toDate().toISOString();
    }
    
    if (job.completedAt) {
      response.completedAt = job.completedAt.toDate().toISOString();
    }
    
    if (job.error) {
      response.error = job.error;
    }
    
    if (job.status === 'completed' && job.result) {
      response.result = job.result;
    }
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error getting deletion status:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get deletion status',
    });
  }
}

/**
 * Background processing for deletion job
 * Implements two-stage deletion with ordered cleanup
 */
async function processDeletionJob(uid: string, jobId: string): Promise<void> {
  const collectionsCleared: string[] = [];
  let filesDeleted = 0;
  
  try {
    await updateJobStatus(jobId, 'in_progress');
    await auditActions.deletionStep(uid, jobId, 'started');
    
    // Step 1: Delete user's trips
    await auditActions.deletionStep(uid, jobId, 'deleting_trips');
    const tripsDeleted = await deleteUserTrips(uid);
    collectionsCleared.push('trips');
    await auditActions.deletionStep(uid, jobId, 'trips_deleted', { count: tripsDeleted });
    
    // Step 2: Delete share links
    await auditActions.deletionStep(uid, jobId, 'deleting_share_links');
    const shareLinksDeleted = await deleteUserShareLinks(uid);
    collectionsCleared.push('shareLinks');
    await auditActions.deletionStep(uid, jobId, 'share_links_deleted', { count: shareLinksDeleted });
    
    // Step 3: Delete preferences
    await auditActions.deletionStep(uid, jobId, 'deleting_preferences');
    await deleteUserPreferences(uid);
    collectionsCleared.push('preferences');
    await auditActions.deletionStep(uid, jobId, 'preferences_deleted');
    
    // Step 4: Delete Cloud Storage files (profile photos, exports)
    await auditActions.deletionStep(uid, jobId, 'deleting_storage_files');
    filesDeleted += await deleteFilesByPrefix(`users/${uid}/`);
    filesDeleted += await deleteFilesByPrefix(`exports/${uid}/`);
    await auditActions.deletionStep(uid, jobId, 'storage_files_deleted', { count: filesDeleted });
    
    // Step 5: Anonymize or delete user document (keep minimal audit trail)
    await auditActions.deletionStep(uid, jobId, 'anonymizing_user_document');
    await anonymizeUserDocument(uid);
    await auditActions.deletionStep(uid, jobId, 'user_document_anonymized');
    
    // Step 6: Delete Firebase Auth user
    await auditActions.deletionStep(uid, jobId, 'deleting_auth_user');
    try {
      await admin.auth().deleteUser(uid);
    } catch (error: any) {
      // Auth user might already be deleted, log but continue
      console.warn(`Could not delete auth user ${uid}:`, error.message);
    }
    await auditActions.deletionStep(uid, jobId, 'auth_user_deleted');
    
    // Mark deletion as complete
    await updateJobStatus(jobId, 'completed', {
      result: {
        filesDeleted,
        collectionsCleared,
      },
    });
    
    await auditActions.deletionCompleted(uid, jobId);
    
    // Send completion email (before auth deletion, if possible)
    try {
      await sendDeletionCompletionEmail(uid);
    } catch (error) {
      console.warn('Could not send deletion email:', error);
    }
  } catch (error: any) {
    console.error(`Deletion job ${jobId} error:`, error);
    
    await updateJobStatus(jobId, 'failed', {
      error: error.message || 'Unknown error',
    });
    
    await auditActions.deletionFailed(uid, jobId, error.message || 'Unknown error');
    
    // Don't mark as deleted if deletion failed
    throw error;
  }
}

/**
 * Deletes all trips owned by user (batched)
 */
async function deleteUserTrips(uid: string): Promise<number> {
  const db = admin.firestore();
  let deleted = 0;
  
  let query = db.collection('trips').where('userId', '==', uid).limit(BATCH_SIZE);
  let snapshot = await query.get();
  
  while (!snapshot.empty) {
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deleted++;
    });
    await batch.commit();
    
    if (snapshot.docs.length === BATCH_SIZE) {
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      query = db
        .collection('trips')
        .where('userId', '==', uid)
        .startAfter(lastDoc)
        .limit(BATCH_SIZE);
      snapshot = await query.get();
    } else {
      break;
    }
  }
  
  return deleted;
}

/**
 * Deletes all share links owned by user
 */
async function deleteUserShareLinks(uid: string): Promise<number> {
  const db = admin.firestore();
  let deleted = 0;
  
  let query = db.collection('shareLinks').where('ownerId', '==', uid).limit(BATCH_SIZE);
  let snapshot = await query.get();
  
  while (!snapshot.empty) {
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deleted++;
    });
    await batch.commit();
    
    if (snapshot.docs.length === BATCH_SIZE) {
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];
      query = db
        .collection('shareLinks')
        .where('ownerId', '==', uid)
        .startAfter(lastDoc)
        .limit(BATCH_SIZE);
      snapshot = await query.get();
    } else {
      break;
    }
  }
  
  return deleted;
}

/**
 * Deletes user preferences document
 */
async function deleteUserPreferences(uid: string): Promise<void> {
  const db = admin.firestore();
  await db.collection('preferences').doc(uid).delete().catch((error) => {
    // Ignore if document doesn't exist
    if (error.code !== 5) { // NOT_FOUND
      throw error;
    }
  });
}

/**
 * Anonymizes user document (keeps minimal audit trail)
 */
async function anonymizeUserDocument(uid: string): Promise<void> {
  const db = admin.firestore();
  const userRef = db.collection('users').doc(uid);
  
  await userRef.update({
    email: null,
    displayName: null,
    photoURL: null,
    preferences: null,
    profilePhotoUrl: null,
    privacyConsent: false,
    privacyToggle: false,
    deletedAt: admin.firestore.Timestamp.now(),
    // Keep: uid, createdAt (for audit), auditLog (for compliance)
  });
}
