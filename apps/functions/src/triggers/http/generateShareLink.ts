/**
 * HTTP Trigger: generateShareLink
 * 
 * Creates secure, expiring share links for trip invitations.
 * 
 * Per TRD-226: generateShareLink
 * Per TRD-227: Input: { tripId: string, role: 'EDITOR' | 'VIEWER' }
 * Per TRD-228: Auth: Must verify context.auth exists
 * Per TRD-229: Validation: Must verify user is OWNER of tripId
 * Per TRD-230: Action: Calls TokenService.generateToken
 * Per TRD-231: Output: { url: string, expiry: timestamp }
 * 
 * @module apps/functions/src/triggers/http/generateShareLink
 */

import * as functions from 'firebase-functions';
import { Request, Response } from 'express';
import { verifyToken, AuthenticatedRequest } from '../../utils/auth';
import { tokenService } from '../../services/trip/TokenService';
import { admin } from '../../config';
import { canInvite } from '@roaddoggs/core';
import type { TripMetadata } from '@roaddoggs/core';

/**
 * Request body interface for generateShareLink
 */
interface GenerateShareLinkRequest {
  tripId: string;
  role: 'EDITOR' | 'VIEWER';
  expiryDays?: number; // Optional: number of days until expiry (default: 30)
}

/**
 * Response interface for generateShareLink
 */
interface GenerateShareLinkResponse {
  url: string;
  expiry: { seconds: number; nanoseconds: number }; // Firebase Timestamp format
}

/**
 * HTTP Cloud Function for generating share links
 * 
 * POST /generateShareLink
 * 
 * Request Body:
 * {
 *   tripId: string,
 *   role: 'EDITOR' | 'VIEWER',
 *   expiryDays?: number (optional, default: 30)
 * }
 * 
 * Response:
 * {
 *   url: string,
 *   expiry: { seconds: number, nanoseconds: number }
 * }
 */
export const generateShareLink = functions
  .region('us-central1')
  .runWith({
    timeoutSeconds: 60, // Per TRD-37: HTTP-triggered functions have 60s timeout
    memory: '1GB',
  })
  .https.onRequest(async (req: Request, res: Response) => {
    // Per TRD-228: Verify authentication
    await verifyToken(req as AuthenticatedRequest, res, () => undefined);

    const authReq = req as AuthenticatedRequest;
    if (!authReq.uid) {
      return; // Response already sent by verifyToken
    }

    try {
      // Validate request method
      if (authReq.method !== 'POST') {
        res.status(405).json({
          error: 'METHOD_NOT_ALLOWED',
          message: 'Only POST method is allowed',
        });
        return;
      }

      // Validate request body
      const body = authReq.body as GenerateShareLinkRequest;

      if (!body || !body.tripId || !body.role) {
        res.status(400).json({
          error: 'BAD_REQUEST',
          message: 'Request body must include tripId and role',
        });
        return;
      }

      // Validate role
      if (body.role !== 'EDITOR' && body.role !== 'VIEWER') {
        res.status(400).json({
          error: 'BAD_REQUEST',
          message: 'role must be either "EDITOR" or "VIEWER"',
        });
        return;
      }

      // Validate tripId format (should be a non-empty string)
      if (typeof body.tripId !== 'string' || body.tripId.trim().length === 0) {
        res.status(400).json({
          error: 'BAD_REQUEST',
          message: 'tripId must be a non-empty string',
        });
        return;
      }

      // Validate expiryDays if provided
      const expiryDays = body.expiryDays ?? 30; // Default: 30 days
      if (expiryDays <= 0 || expiryDays > 365) {
        res.status(400).json({
          error: 'BAD_REQUEST',
          message: 'expiryDays must be between 1 and 365',
        });
        return;
      }

      functions.logger.info('[generateShareLink] Processing request', {
        uid: authReq.uid,
        tripId: body.tripId,
        role: body.role,
        expiryDays,
      });

      // Per TRD-229: Verify user is OWNER of tripId
      const tripDoc = await admin
        .firestore()
        .collection('trips')
        .doc(body.tripId)
        .get();

      if (!tripDoc.exists) {
        res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Trip not found',
        });
        return;
      }

      const tripData = tripDoc.data() as TripMetadata;
      
      // Use canInvite to verify ownership (per TRD-229 and TRD-133)
      if (!canInvite({ uid: authReq.uid }, tripData)) {
        res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Only the trip owner can generate share links',
        });
        return;
      }

      // Per TRD-230: Generate token using TokenService
      const tokenResult = tokenService.generateToken();

      // Calculate expiry timestamp
      const now = Date.now();
      const expiryMs = now + expiryDays * 24 * 60 * 60 * 1000; // Add days in milliseconds
      const expiryTimestamp = admin.firestore.Timestamp.fromMillis(expiryMs);

      // Store share link in Firestore
      // Store the hashed token (per TRD-252: hash is stored, not raw token)
      const shareLinkData = {
        tripId: body.tripId,
        ownerId: authReq.uid,
        role: body.role,
        tokenHash: tokenResult.hashedToken, // Store hash, not raw token
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiry: expiryTimestamp,
        used: false,
        usedAt: null,
      };

      await admin
        .firestore()
        .collection('shareLinks')
        .add(shareLinkData);

      functions.logger.info('[generateShareLink] Share link created', {
        tripId: body.tripId,
        role: body.role,
        expiry: expiryTimestamp.toDate().toISOString(),
      });

      // Generate share URL
      // In production, this would use the actual frontend URL
      // For now, we'll construct a URL that can be used by the frontend
      const baseUrl = process.env.FRONTEND_URL || 'https://roaddoggs.app';
      const shareUrl = `${baseUrl}/share/${tokenResult.rawToken}`;

      // Per TRD-231: Return { url, expiry }
      const response: GenerateShareLinkResponse = {
        url: shareUrl,
        expiry: {
          seconds: expiryTimestamp.seconds,
          nanoseconds: expiryTimestamp.nanoseconds,
        },
      };

      res.status(200).json(response);
    } catch (error: any) {
      functions.logger.error('[generateShareLink] Unexpected error', {
        error: error.message,
        stack: error.stack,
        uid: authReq.uid,
      });

      res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred while generating the share link',
      });
    }
  });
