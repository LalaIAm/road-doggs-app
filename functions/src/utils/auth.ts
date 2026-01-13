/**
 * Authentication and authorization utilities
 * Verifies Firebase ID tokens and extracts user information
 */

import * as admin from 'firebase-admin';
import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  uid?: string;
  user?: admin.auth.DecodedIdToken;
}

/**
 * Verifies Firebase ID token from Authorization header
 * Extracts and attaches uid to request object
 */
export async function verifyToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
      });
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.uid = decodedToken.uid;
    req.user = decodedToken;
    
    next();
  } catch (error: any) {
    console.error('Token verification error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      res.status(401).json({
        error: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired. Please re-authenticate.',
      });
      return;
    }
    
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Invalid authentication token',
    });
  }
}

/**
 * Checks if token was issued recently (within last 5 minutes)
 * Used for high-sensitivity operations like export/deletion
 */
export function requireRecentAuth(req: AuthenticatedRequest): boolean {
  if (!req.user || !req.user.auth_time) {
    return false;
  }
  
  const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300; // 5 minutes in seconds
  return req.user.auth_time >= fiveMinutesAgo;
}

/**
 * Verifies user has given privacy consent
 */
export async function verifyPrivacyConsent(uid: string): Promise<boolean> {
  try {
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return false;
    }
    
    const userData = userDoc.data();
    return userData?.privacyConsent === true || userData?.privacyToggle === true;
  } catch (error) {
    console.error('Error verifying privacy consent:', error);
    return false;
  }
}
