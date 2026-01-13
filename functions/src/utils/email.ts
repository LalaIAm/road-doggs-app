/**
 * Email notification service
 * Sends transactional emails for export and deletion completion
 */

import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid if API key is available
const sendGridApiKey = process.env.SENDGRID_API_KEY;
if (sendGridApiKey) {
  sgMail.setApiKey(sendGridApiKey);
}

/**
 * Gets user email from Firestore
 */
async function getUserEmail(uid: string): Promise<string | null> {
  try {
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return null;
    }
    return userDoc.data()?.email || null;
  } catch (error) {
    console.error('Error fetching user email:', error);
    return null;
  }
}

/**
 * Sends export completion email
 */
export async function sendExportCompletionEmail(
  uid: string,
  jobId: string
): Promise<void> {
  try {
    const email = await getUserEmail(uid);
    if (!email) {
      console.warn(`No email found for user ${uid}, skipping email notification`);
      return;
    }

    if (!sendGridApiKey) {
      console.warn('SENDGRID_API_KEY not configured, skipping email');
      return;
    }

    const templateId = process.env.SENDGRID_EXPORT_TEMPLATE_ID;
    if (!templateId) {
      console.warn('SENDGRID_EXPORT_TEMPLATE_ID not configured, skipping email');
      return;
    }

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@roaddoggs.com',
      subject: 'Your RoadDoggs data export is ready',
      templateId: templateId as string,
      dynamicTemplateData: {
        jobId,
        downloadUrl: `${process.env.FRONTEND_URL}/export/${jobId}`,
      },
    } as any;

    await sgMail.send(msg);
    console.log(`Export completion email sent to ${email} for job ${jobId}`);
  } catch (error: any) {
    console.error('Error sending export completion email:', error);
    // Don't throw - email failures shouldn't break the operation
    // Retry logic can be implemented at a higher level if needed
  }
}

/**
 * Sends deletion completion email
 */
export async function sendDeletionCompletionEmail(uid: string): Promise<void> {
  try {
    const email = await getUserEmail(uid);
    if (!email) {
      console.warn(`No email found for user ${uid}, skipping email notification`);
      return;
    }

    if (!sendGridApiKey) {
      console.warn('SENDGRID_API_KEY not configured, skipping email');
      return;
    }

    const templateId = process.env.SENDGRID_DELETION_TEMPLATE_ID;
    if (!templateId) {
      console.warn('SENDGRID_DELETION_TEMPLATE_ID not configured, skipping email');
      return;
    }

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@roaddoggs.com',
      subject: 'Your RoadDoggs account has been deleted',
      templateId: templateId as string,
      dynamicTemplateData: {
        confirmationMessage: 'Your account and all associated data have been permanently deleted.',
      },
    } as any;

    await sgMail.send(msg);
    console.log(`Deletion completion email sent to ${email}`);
  } catch (error: any) {
    console.error('Error sending deletion completion email:', error);
    // Don't throw - email failures shouldn't break the operation
  }
}
