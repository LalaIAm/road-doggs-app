/**
 * Job status tracking utilities
 * Manages job documents in Firestore for async operations
 */

import * as admin from 'firebase-admin';

export type JobStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface JobDocument {
  jobId: string;
  uid: string;
  type: 'export' | 'deletion';
  status: JobStatus;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  startedAt?: admin.firestore.Timestamp;
  completedAt?: admin.firestore.Timestamp;
  error?: string;
  result?: {
    downloadUrls?: Array<{ url: string; expiresAt: string; filename: string }>;
    filesDeleted?: number;
    collectionsCleared?: string[];
  };
  metadata?: Record<string, any>;
}

/**
 * Creates a new job document
 */
export async function createJob(
  uid: string,
  type: 'export' | 'deletion',
  metadata?: Record<string, any>
): Promise<string> {
  const db = admin.firestore();
  const jobId = `${type}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const now = admin.firestore.Timestamp.now();
  
  const jobDoc: JobDocument = {
    jobId,
    uid,
    type,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    metadata,
  };
  
  await db.collection('jobs').doc(jobId).set(jobDoc);
  
  return jobId;
}

/**
 * Updates job status
 */
export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  updates?: Partial<JobDocument>
): Promise<void> {
  const db = admin.firestore();
  const jobRef = db.collection('jobs').doc(jobId);
  
  const updateData: any = {
    status,
    updatedAt: admin.firestore.Timestamp.now(),
  };
  
  if (status === 'in_progress' && !updates?.startedAt) {
    updateData.startedAt = admin.firestore.Timestamp.now();
  }
  
  if (status === 'completed' || status === 'failed') {
    updateData.completedAt = admin.firestore.Timestamp.now();
  }
  
  if (updates) {
    Object.assign(updateData, updates);
  }
  
  await jobRef.update(updateData);
}

/**
 * Gets job document
 */
export async function getJob(jobId: string): Promise<JobDocument | null> {
  const db = admin.firestore();
  const jobDoc = await db.collection('jobs').doc(jobId).get();
  
  if (!jobDoc.exists) {
    return null;
  }
  
  return jobDoc.data() as JobDocument;
}

/**
 * Checks if user has an active job of given type
 */
export async function hasActiveJob(
  uid: string,
  type: 'export' | 'deletion'
): Promise<boolean> {
  const db = admin.firestore();
  const activeJobs = await db
    .collection('jobs')
    .where('uid', '==', uid)
    .where('type', '==', type)
    .where('status', 'in', ['pending', 'in_progress'])
    .limit(1)
    .get();
  
  return !activeJobs.empty;
}
