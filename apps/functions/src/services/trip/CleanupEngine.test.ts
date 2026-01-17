/**
 * Unit Tests for Cleanup Engine
 * 
 * Tests recursive delete logic with mocked Firestore to verify
 * that batching operations correctly handle the 500-operation limit.
 * 
 * Per TRD-240: Test recursive deletion strategy
 * Per TRD-247: Verify pagination when > 500 documents exist
 * 
 * @module apps/functions/src/services/trip/CleanupEngine.test
 */

import { recursiveDelete, deleteTripSubcollections, CleanupEngine } from './CleanupEngine';
import { admin } from '../../config';
import type { CollectionReference, DocumentReference, Query, WriteBatch } from 'firebase-admin/firestore';

// Mock Firebase Admin
jest.mock('../../config', () => ({
  admin: {
    firestore: jest.fn(),
  },
}));

describe('CleanupEngine', () => {
  let mockBatch: jest.Mocked<WriteBatch>;
  let mockCollection: jest.Mocked<CollectionReference>;
  let mockDoc: jest.Mocked<DocumentReference>;
  let mockQuery: jest.Mocked<Query>;
  let mockSnapshot: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock batch
    mockBatch = {
      delete: jest.fn().mockReturnThis(),
      commit: jest.fn().mockResolvedValue(undefined),
    } as any;

    // Mock document reference
    mockDoc = {
      ref: {
        listCollections: jest.fn().mockResolvedValue([]),
      } as any,
      listCollections: jest.fn().mockResolvedValue([]),
    } as any;

    // Mock query
    mockQuery = {
      limit: jest.fn().mockReturnThis(),
      startAfter: jest.fn().mockReturnThis(),
      get: jest.fn(),
    } as any;

    // Mock collection reference
    mockCollection = {
      limit: jest.fn().mockReturnValue(mockQuery),
      doc: jest.fn().mockReturnValue(mockDoc),
      collection: jest.fn().mockReturnValue(mockCollection),
    } as any;

    // Mock Firestore instance
    (admin.firestore as unknown as jest.Mock).mockReturnValue({
      batch: jest.fn().mockReturnValue(mockBatch),
      collection: jest.fn().mockReturnValue(mockCollection),
    });

    // Default empty snapshot
    mockSnapshot = {
      empty: true,
      size: 0,
      docs: [],
    };
  });

  describe('recursiveDelete', () => {
    it('should handle empty collection', async () => {
      mockQuery.get.mockResolvedValue(mockSnapshot);

      await recursiveDelete(mockCollection);

      expect(mockCollection.limit).toHaveBeenCalledWith(500);
      expect(mockBatch.delete).not.toHaveBeenCalled();
      expect(mockBatch.commit).not.toHaveBeenCalled();
    });

    it('should delete single document', async () => {
      const doc1Ref = {
        id: 'doc1',
        listCollections: jest.fn().mockResolvedValue([]),
      } as any;
      
      const doc1 = {
        ref: doc1Ref,
        listCollections: jest.fn().mockResolvedValue([]),
      };

      mockSnapshot = {
        empty: false,
        size: 1,
        docs: [doc1],
      };
      mockQuery.get.mockResolvedValue(mockSnapshot);

      await recursiveDelete(mockCollection);

      expect(mockBatch.delete).toHaveBeenCalledWith(doc1Ref);
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });

    it('should delete multiple documents in single batch', async () => {
      const docs = Array.from({ length: 10 }, (_, i) => {
        const docRef = {
          id: `doc${i}`,
          listCollections: jest.fn().mockResolvedValue([]),
        } as any;
        return {
          ref: docRef,
          listCollections: jest.fn().mockResolvedValue([]),
        };
      });

      mockSnapshot = {
        empty: false,
        size: 10,
        docs,
      };
      mockQuery.get.mockResolvedValue(mockSnapshot);

      await recursiveDelete(mockCollection);

      expect(mockBatch.delete).toHaveBeenCalledTimes(10);
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });

    it('should handle batch limit (500 documents)', async () => {
      const docs = Array.from({ length: 500 }, (_, i) => {
        const docRef = {
          id: `doc${i}`,
          listCollections: jest.fn().mockResolvedValue([]),
        } as any;
        return {
          ref: docRef,
          listCollections: jest.fn().mockResolvedValue([]),
        };
      });

      mockSnapshot = {
        empty: false,
        size: 500,
        docs,
      };
      mockQuery.get.mockResolvedValue(mockSnapshot);

      await recursiveDelete(mockCollection);

      expect(mockBatch.delete).toHaveBeenCalledTimes(500);
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });

    it('should paginate when collection has more than 500 documents', async () => {
      // First page: 500 documents
      const docs1 = Array.from({ length: 500 }, (_, i) => {
        const docRef = {
          id: `doc${i}`,
          listCollections: jest.fn().mockResolvedValue([]),
        } as any;
        return {
          ref: docRef,
          listCollections: jest.fn().mockResolvedValue([]),
        };
      });

      const snapshot1 = {
        empty: false,
        size: 500,
        docs: docs1,
      };

      // Second page: 100 documents
      const docs2 = Array.from({ length: 100 }, (_, i) => {
        const docRef = {
          id: `doc${500 + i}`,
          listCollections: jest.fn().mockResolvedValue([]),
        } as any;
        return {
          ref: docRef,
          listCollections: jest.fn().mockResolvedValue([]),
        };
      });

      const snapshot2 = {
        empty: false,
        size: 100,
        docs: docs2,
      };

      // Third page: empty (end of collection)
      const snapshot3 = {
        empty: true,
        size: 0,
        docs: [],
      };

      mockQuery.get
        .mockResolvedValueOnce(snapshot1 as any)
        .mockResolvedValueOnce(snapshot2 as any)
        .mockResolvedValueOnce(snapshot3 as any);

      await recursiveDelete(mockCollection);

      // Should have called delete 600 times (500 + 100)
      expect(mockBatch.delete).toHaveBeenCalledTimes(600);
      // Should have committed 2 batches (one for each page)
      expect(mockBatch.commit).toHaveBeenCalledTimes(2);
      // Should have used startAfter for pagination
      expect(mockQuery.startAfter).toHaveBeenCalled();
    });

    it('should recursively delete subcollections before parent document', async () => {
      const subcollection1 = {
        limit: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            empty: true,
            size: 0,
            docs: [],
          }),
        }),
      } as any;

      const subcollection2 = {
        limit: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            empty: true,
            size: 0,
            docs: [],
          }),
        }),
      } as any;

      const doc1Ref = {
        id: 'doc1',
        listCollections: jest.fn().mockResolvedValue([subcollection1, subcollection2]),
      } as any;
      
      const doc1 = {
        ref: doc1Ref,
        listCollections: jest.fn().mockResolvedValue([subcollection1, subcollection2]),
      };

      mockSnapshot = {
        empty: false,
        size: 1,
        docs: [doc1],
      };
      mockQuery.get.mockResolvedValue(mockSnapshot);

      await recursiveDelete(mockCollection);

      // Should have listed collections for the document
      expect(doc1.listCollections).toHaveBeenCalled();
      // Should have attempted to delete subcollections (they're empty, so no operations)
      expect(subcollection1.limit).toHaveBeenCalled();
      expect(subcollection2.limit).toHaveBeenCalled();
      // Should have deleted the parent document
      expect(mockBatch.delete).toHaveBeenCalledWith(doc1Ref);
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });

    it('should handle nested subcollections', async () => {
      // Create a nested structure: collection -> doc -> subcollection -> doc
      const nestedDocRef = {
        id: 'nested-doc',
        listCollections: jest.fn().mockResolvedValue([]),
      } as any;
      
      const nestedDoc = {
        ref: nestedDocRef,
        listCollections: jest.fn().mockResolvedValue([]),
      };

      const nestedSubcollection = {
        limit: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            empty: false,
            size: 1,
            docs: [nestedDoc],
          }),
        }),
        doc: jest.fn(),
      } as any;

      // Mock batch for nested deletion
      const nestedBatch = {
        delete: jest.fn().mockReturnThis(),
        commit: jest.fn().mockResolvedValue(undefined),
      } as any;

      (admin.firestore as unknown as jest.Mock).mockReturnValue({
        batch: jest.fn().mockReturnValue(nestedBatch),
        collection: jest.fn().mockReturnValue(mockCollection),
      });

      const parentDocRef = {
        id: 'parent-doc',
        listCollections: jest.fn().mockResolvedValue([nestedSubcollection]),
      } as any;
      
      const parentDoc = {
        ref: parentDocRef,
        listCollections: jest.fn().mockResolvedValue([nestedSubcollection]),
      };

      mockSnapshot = {
        empty: false,
        size: 1,
        docs: [parentDoc],
      };
      mockQuery.get.mockResolvedValue(mockSnapshot);

      await recursiveDelete(mockCollection);

      // Should have processed nested subcollection
      expect(nestedSubcollection.limit).toHaveBeenCalled();
      // Should have deleted nested document
      expect(nestedBatch.delete).toHaveBeenCalledWith(nestedDocRef);
      expect(nestedBatch.commit).toHaveBeenCalled();
      // Should have deleted parent document
      expect(mockBatch.delete).toHaveBeenCalledWith(parentDocRef);
    });
  });

  describe('deleteTripSubcollections', () => {
    it('should delete all trip subcollections', async () => {
      const tripRef = {
        collection: jest.fn().mockReturnValue(mockCollection),
      } as any;

      // Mock empty snapshots for all subcollections
      mockQuery.get.mockResolvedValue(mockSnapshot);

      await deleteTripSubcollections(tripRef);

      // Should have called collection for each subcollection
      expect(tripRef.collection).toHaveBeenCalledWith('waypoints');
      expect(tripRef.collection).toHaveBeenCalledWith('chat');
      expect(tripRef.collection).toHaveBeenCalledWith('expenses');
      expect(tripRef.collection).toHaveBeenCalledTimes(3);
    });

    it('should handle subcollections with documents', async () => {
      const tripRef = {
        collection: jest.fn().mockReturnValue(mockCollection),
      } as any;

      const doc1Ref = {
        id: 'doc1',
        listCollections: jest.fn().mockResolvedValue([]),
      } as any;
      
      const doc1 = {
        ref: doc1Ref,
        listCollections: jest.fn().mockResolvedValue([]),
      };

      const snapshotWithDocs = {
        empty: false,
        size: 1,
        docs: [doc1],
      };

      mockQuery.get.mockResolvedValue(snapshotWithDocs as any);

      await deleteTripSubcollections(tripRef);

      // Should have deleted documents in each subcollection
      expect(mockBatch.delete).toHaveBeenCalledTimes(3); // One doc per subcollection
      expect(mockBatch.commit).toHaveBeenCalledTimes(3); // One commit per subcollection
    });
  });

  describe('CleanupEngine class', () => {
    let cleanupEngine: CleanupEngine;

    beforeEach(() => {
      cleanupEngine = new CleanupEngine();
    });

    it('should delete trip subcollections', async () => {
      const tripId = 'test-trip-id';
      const tripDoc = {
        collection: jest.fn().mockReturnValue(mockCollection),
      } as any;

      (admin.firestore as unknown as jest.Mock).mockReturnValue({
        batch: jest.fn().mockReturnValue(mockBatch),
        collection: jest.fn().mockReturnValue({
          doc: jest.fn().mockReturnValue(tripDoc),
        }),
      });

      mockQuery.get.mockResolvedValue(mockSnapshot);

      await cleanupEngine.deleteTrip(tripId);

      // Should have accessed trips collection
      expect(admin.firestore().collection).toHaveBeenCalledWith('trips');
      // Should have accessed the trip document
      expect(admin.firestore().collection('trips').doc).toHaveBeenCalledWith(tripId);
      // Should have attempted to delete subcollections
      expect(tripDoc.collection).toHaveBeenCalled();
    });

    it('should delete collection by path', async () => {
      const collectionPath = 'trips/trip1/waypoints';
      
      mockQuery.get.mockResolvedValue(mockSnapshot);

      await cleanupEngine.deleteCollection(collectionPath);

      // Should have accessed the collection
      expect(admin.firestore().collection).toHaveBeenCalledWith(collectionPath);
    });
  });
});
