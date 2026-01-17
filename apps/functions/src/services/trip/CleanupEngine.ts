/**
 * Cleanup Engine Service
 * 
 * Implements recursive deletion strategy for Firestore documents and subcollections.
 * Handles Firestore's 500-operation batch limit by paginating through large collections.
 * 
 * Per TRD-240: Recursive deletion strategy
 * Per TRD-241-247: Logic for querying, batching, and pagination
 * 
 * @module apps/functions/src/services/trip/CleanupEngine
 */

import { admin } from '../../config';
import { DocumentReference, CollectionReference, Query } from 'firebase-admin/firestore';

const BATCH_SIZE_LIMIT = 500; // Firestore batch operation limit per TRD-247

/**
 * Recursively delete all documents in a collection and their subcollections
 * 
 * @param collectionRef - Reference to the collection to delete
 * @param batchSize - Maximum number of operations per batch (default: 500)
 * @returns Promise that resolves when all documents are deleted
 * 
 * Per TRD-241-247: Query collection, create batches, iterate and commit
 * Per TRD-247: Handle pagination when > 500 documents exist
 */
export async function recursiveDelete(
  collectionRef: CollectionReference,
  batchSize: number = BATCH_SIZE_LIMIT
): Promise<void> {
  let hasMore = true;
  let lastDoc: DocumentReference | null = null;

  while (hasMore) {
    // Build query with pagination
    // Per TRD-242: Query collection
    let query: Query = collectionRef.limit(batchSize);
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    // Execute query
    const snapshot = await query.get();

    if (snapshot.empty) {
      hasMore = false;
      break;
    }

    // Per TRD-243: Create a WriteBatch
    const batch = admin.firestore().batch();
    let operationCount = 0;

    // Process each document
    // Per TRD-244: Iterate and add delete operations to batch
    for (const doc of snapshot.docs) {
      // Delete all subcollections recursively first
      // This ensures subcollections are deleted before parent documents
      // Each recursive call handles its own batching independently
      const subcollections = await doc.ref.listCollections();
      for (const subcollection of subcollections) {
        await recursiveDelete(subcollection, batchSize);
      }

      // Add delete operation to batch
      // Per TRD-244: Add delete operations to batch
      batch.delete(doc.ref);
      operationCount++;

      // Track last document for pagination
      lastDoc = doc.ref;

      // Per TRD-247: Handle pagination if > 500 documents exist
      // If we've reached the batch limit, commit and break to query next page
      if (operationCount >= batchSize) {
        await batch.commit();
        break; // Exit for loop, will continue while loop with next page
      }
    }

    // Per TRD-245: Commit batch if there are remaining operations
    // (This handles the case where we processed all docs but didn't hit the limit)
    if (operationCount > 0 && operationCount < batchSize) {
      await batch.commit();
    }

    // Check if there are more documents to process
    // Per TRD-247: Handle pagination if > 500 documents exist
    hasMore = snapshot.size === batchSize;
  }
}

/**
 * Delete all subcollections of a trip document
 * 
 * This is a convenience function that deletes the standard subcollections
 * for a trip: waypoints, chat, and expenses.
 * 
 * Per TRD-246: Repeat for chat and expenses sub-collections
 * 
 * @param tripRef - Reference to the trip document
 * @returns Promise that resolves when all subcollections are deleted
 */
export async function deleteTripSubcollections(tripRef: DocumentReference): Promise<void> {
  const subcollections = ['waypoints', 'chat', 'expenses'];

  // Delete each subcollection
  for (const subcollectionName of subcollections) {
    const subcollectionRef = tripRef.collection(subcollectionName);
    await recursiveDelete(subcollectionRef);
  }
}

/**
 * Cleanup Engine class
 * 
 * Provides a structured interface for cleanup operations
 */
export class CleanupEngine {
  /**
   * Delete a trip and all its subcollections
   * 
   * @param tripId - The ID of the trip to delete
   * @returns Promise that resolves when deletion is complete
   */
  async deleteTrip(tripId: string): Promise<void> {
    const tripRef = admin.firestore().collection('trips').doc(tripId);
    
    // Delete all subcollections first
    await deleteTripSubcollections(tripRef);
    
    // Note: The trip document itself is already deleted by the trigger
    // This function is called after the document deletion event
  }

  /**
   * Recursively delete a collection and all its subcollections
   * 
   * @param collectionPath - Path to the collection (e.g., 'trips/{tripId}/waypoints')
   * @returns Promise that resolves when deletion is complete
   */
  async deleteCollection(collectionPath: string): Promise<void> {
    const collectionRef = admin.firestore().collection(collectionPath);
    await recursiveDelete(collectionRef);
  }
}
