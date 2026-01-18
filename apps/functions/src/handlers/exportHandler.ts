/**
 * Export handler - HTTP endpoints for data export
 */

import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import archiver from 'archiver';
import { verifyToken, requireRecentAuth, verifyPrivacyConsent, AuthenticatedRequest } from '../utils/auth';
import { createJob, updateJobStatus, getJob, hasActiveJob } from '../utils/jobStatus';
import { gatherUserData } from '../utils/dataGatherer';
import { getEncryptionKey, encrypt } from '../utils/encryption';
import { createStorageAdapter } from '../adapters/storage/StorageAdapter';
import { auditActions } from '../utils/audit';
import { sendExportCompletionEmail } from '../utils/email';

/**
 * POST /v1/auth/export/start
 * Starts an export job for the authenticated user
 */
export async function exportStart(req: Request, res: Response): Promise<void> {
  // Verify authentication
  await new Promise<void>((resolve) => {
    verifyToken(req as AuthenticatedRequest, res, () => resolve());
  });
  
  const authReq = req as AuthenticatedRequest;
  if (!authReq.uid) {
    return; // Response already sent by verifyToken
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
        message: 'Privacy consent required to export data',
      });
      return;
    }
    
    // Check for active export job (idempotency)
    const hasActive = await hasActiveJob(uid, 'export');
    if (hasActive) {
      // Return existing job ID if one exists
      const jobsRef = admin.firestore().collection('jobs');
      const activeJob = await jobsRef
        .where('uid', '==', uid)
        .where('type', '==', 'export')
        .where('status', 'in', ['pending', 'in_progress'])
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
      
      if (!activeJob.empty) {
        const jobId = activeJob.docs[0].id;
        res.status(200).json({
          jobId,
          message: 'Export job already in progress',
          status: 'pending',
        });
        return;
      }
    }
    
    // Create new job
    const jobId = await createJob(uid, 'export');
    
    // Log audit entry
    await auditActions.exportRequested(uid, jobId);
    
    // Start background processing (fire and forget)
    processExportJob(uid, jobId).catch((error) => {
      console.error(`Export job ${jobId} failed:`, error);
    });
    
    res.status(202).json({
      jobId,
      message: 'Export job started',
      status: 'pending',
    });
  } catch (error: any) {
    console.error('Error starting export job:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to start export job',
    });
  }
}

/**
 * GET /v1/auth/export/:jobId/status
 * Returns export job status and download URLs if completed
 */
export async function exportStatus(req: Request, res: Response): Promise<void> {
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
        message: 'Export job not found',
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
    
    if (job.status === 'completed' && job.result?.downloadUrls) {
      response.downloadUrls = job.result.downloadUrls;
    }
    
    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error getting export status:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to get export status',
    });
  }
}

/**
 * Background processing for export job
 */
async function processExportJob(uid: string, jobId: string): Promise<void> {
  try {
    await updateJobStatus(jobId, 'in_progress');
    await auditActions.exportInProgress(uid, jobId);
    
    // Gather user data
    const exportData = await gatherUserData(uid);
    
    // Initialize storage adapter
    const storageAdapter = createStorageAdapter();
    
    // Create JSON export
    const jsonData = JSON.stringify(exportData, null, 2);
    const jsonPath = `exports/${uid}/${jobId}/data.json`;
    
    // Encrypt data before uploading
    const encryptionKey = getEncryptionKey();
    const encryptedJsonData = encrypt(jsonData, encryptionKey);
    await storageAdapter.uploadFile(
      jsonPath,
      Buffer.from(encryptedJsonData, 'base64'),
      {
        contentType: 'application/json',
        encrypted: true,
      }
    );
    
    // Create ZIP archive (optional, for larger exports)
    const zipBuffer = await createZipArchive(exportData);
    const encryptedZipData = encrypt(zipBuffer, encryptionKey);
    const zipPath = `exports/${uid}/${jobId}/data.zip`;
    await storageAdapter.uploadFile(
      zipPath,
      Buffer.from(encryptedZipData, 'base64'),
      {
        contentType: 'application/zip',
        encrypted: true,
      }
    );
    
    // Generate signed URLs (15 minutes TTL per TRD-272)
    const jsonUrl = await storageAdapter.generateSignedUrl(jsonPath, {
      expirationMinutes: 15,
    });
    const zipUrl = await storageAdapter.generateSignedUrl(zipPath, {
      expirationMinutes: 15,
    });
    
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    
    // Update job with results
    await updateJobStatus(jobId, 'completed', {
      result: {
        downloadUrls: [
          {
            url: jsonUrl,
            expiresAt,
            filename: 'data.json',
          },
          {
            url: zipUrl,
            expiresAt,
            filename: 'data.zip',
          },
        ],
      },
    });
    
    await auditActions.exportCompleted(uid, jobId, {
      filesGenerated: 2,
      totalRecords: exportData.metadata.totalRecords,
    });
    
    // Send completion email
    await sendExportCompletionEmail(uid, jobId);
  } catch (error: any) {
    console.error(`Export job ${jobId} error:`, error);
    
    await updateJobStatus(jobId, 'failed', {
      error: error.message || 'Unknown error',
    });
    
    await auditActions.exportFailed(uid, jobId, error.message || 'Unknown error');
  }
}

/**
 * Creates a ZIP archive from export data
 */
async function createZipArchive(data: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.on('data', (chunk: Buffer) => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);
    
    archive.append(JSON.stringify(data, null, 2), { name: 'data.json' });
    archive.finalize();
  });
}
