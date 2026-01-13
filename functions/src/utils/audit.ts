/**
 * Audit logging utilities
 * Appends structured audit entries to user's auditLog array in Firestore
 */

import * as admin from 'firebase-admin';

export interface AuditEntry {
  action: string;
  jobId?: string;
  timestamp: admin.firestore.Timestamp;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  note?: string;
  metadata?: Record<string, any>;
}

/**
 * Appends an audit entry to the user's auditLog array
 */
export async function appendAuditLog(
  uid: string,
  entry: Omit<AuditEntry, 'timestamp'>
): Promise<void> {
  try {
    const userRef = admin.firestore().collection('users').doc(uid);
    const timestamp = admin.firestore.Timestamp.now();
    
    const auditEntry: AuditEntry = {
      ...entry,
      timestamp,
    };
    
    await userRef.update({
      auditLog: admin.firestore.FieldValue.arrayUnion(auditEntry),
    });
    
    // Also log to function logs for operational monitoring (without PII)
    console.log('Audit log entry:', {
      uid,
      action: entry.action,
      jobId: entry.jobId,
      status: entry.status,
      timestamp: timestamp.toDate().toISOString(),
    });
  } catch (error) {
    console.error('Error appending audit log:', error);
    // Don't throw - audit logging failures shouldn't break the operation
  }
}

/**
 * Creates audit entries for common operations
 */
export const auditActions = {
  exportRequested: (uid: string, jobId: string) =>
    appendAuditLog(uid, {
      action: 'exportRequested',
      jobId,
      status: 'pending',
      note: 'User data export job created',
    }),
  
  exportInProgress: (uid: string, jobId: string) =>
    appendAuditLog(uid, {
      action: 'exportInProgress',
      jobId,
      status: 'in_progress',
      note: 'Export job processing',
    }),
  
  exportCompleted: (uid: string, jobId: string, metadata?: Record<string, any>) =>
    appendAuditLog(uid, {
      action: 'exportCompleted',
      jobId,
      status: 'completed',
      note: 'Export job completed successfully',
      metadata,
    }),
  
  exportFailed: (uid: string, jobId: string, error: string) =>
    appendAuditLog(uid, {
      action: 'exportFailed',
      jobId,
      status: 'failed',
      note: `Export job failed: ${error}`,
    }),
  
  deletionRequested: (uid: string, jobId: string) =>
    appendAuditLog(uid, {
      action: 'deletionRequested',
      jobId,
      status: 'pending',
      note: 'Account deletion job created',
    }),
  
  deletionStep: (uid: string, jobId: string, step: string, metadata?: Record<string, any>) =>
    appendAuditLog(uid, {
      action: `deletionStep:${step}`,
      jobId,
      status: 'in_progress',
      note: `Deletion step: ${step}`,
      metadata,
    }),
  
  deletionCompleted: (uid: string, jobId: string) =>
    appendAuditLog(uid, {
      action: 'deletionCompleted',
      jobId,
      status: 'completed',
      note: 'Account deletion completed successfully',
    }),
  
  deletionFailed: (uid: string, jobId: string, error: string) =>
    appendAuditLog(uid, {
      action: 'deletionFailed',
      jobId,
      status: 'failed',
      note: `Account deletion failed: ${error}`,
    }),
};
