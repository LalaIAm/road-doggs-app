/**
 * Fractional Indexing Algorithms
 * 
 * Fractional indexing utilities for list reordering without re-indexing.
 * Implements (a+b)/2 formula for insertions and precision collapse detection.
 * 
 * @module @roaddoggs/core/logic/fractionalIndexing
 */

/**
 * Precision threshold for collapse detection
 * If delta between consecutive indices drops below this value, re-indexing is required
 * Per TRD-147: threshold is 1e-6
 */
const PRECISION_THRESHOLD = 1e-6;

/**
 * Generate a new index between two existing indices using (a+b)/2 formula
 * 
 * Formula (per TRD-145): i_new = (i_prev + i_next) / 2
 * 
 * Handles boundary cases:
 * - If prevIndex is null/undefined: insert at start (return nextIndex - 1)
 * - If nextIndex is null/undefined: insert at end (return prevIndex + 1)
 * - If both are null/undefined: return 0 (first item in empty list)
 * 
 * @param {number | null | undefined} prevIndex - Previous index (null/undefined for insert at start)
 * @param {number | null | undefined} nextIndex - Next index (null/undefined for insert at end)
 * @returns {number} New index between prevIndex and nextIndex
 * @throws {Error} If both prevIndex and nextIndex are provided but prevIndex >= nextIndex
 */
export function generateIndexBetween(
  prevIndex: number | null | undefined,
  nextIndex: number | null | undefined
): number {
  // Handle insert at start (no previous item)
  if (prevIndex === null || prevIndex === undefined) {
    if (nextIndex === null || nextIndex === undefined) {
      // Empty list: return 0 for first item
      return 0;
    }
    // Insert before nextIndex: return nextIndex - 1
    return nextIndex - 1;
  }

  // Handle insert at end (no next item)
  if (nextIndex === null || nextIndex === undefined) {
    // Insert after prevIndex: return prevIndex + 1
    return prevIndex + 1;
  }

  // Validate that prevIndex < nextIndex
  if (prevIndex >= nextIndex) {
    throw new Error(`Invalid indices: prevIndex (${prevIndex}) must be less than nextIndex (${nextIndex})`);
  }

  // Calculate midpoint using (a+b)/2 formula (TRD-145)
  const newIndex = (prevIndex + nextIndex) / 2;

  // Check if precision collapse is occurring for this insertion
  const delta = nextIndex - prevIndex;
  if (delta < PRECISION_THRESHOLD) {
    // Precision collapse detected: newIndex may equal prevIndex or nextIndex
    // This should trigger re-indexing, but we still return the calculated index
    // The caller should check detectPrecisionCollapse() and handle re-indexing
  }

  return newIndex;
}

/**
 * Detect if precision collapse is occurring in a list of indices
 * 
 * Precision collapse occurs when the difference (delta) between consecutive indices
 * drops below the precision threshold (1e-6 per TRD-147).
 * 
 * @param {number[]} indices - Array of order indices (unsorted)
 * @returns {boolean} True if precision collapse is detected
 */
export function detectPrecisionCollapse(indices: number[]): boolean {
  // Empty array or single item: no collapse possible
  if (indices.length <= 1) {
    return false;
  }

  // Sort indices to check consecutive pairs
  const sortedIndices = [...indices].sort((a, b) => a - b);

  // Check delta between consecutive indices
  for (let i = 0; i < sortedIndices.length - 1; i++) {
    const delta = sortedIndices[i + 1] - sortedIndices[i];
    
    // If any delta is below threshold, precision collapse is detected
    if (delta < PRECISION_THRESHOLD) {
      return true;
    }
  }

  return false;
}

/**
 * Re-index all items to evenly spaced integers (0, 1, 2, 3, ...)
 * 
 * Per TRD-147: When precision collapse is detected, re-index all items
 * to evenly spaced integers to restore precision.
 * 
 * Preserves relative order of items based on their current indices.
 * 
 * @param {number[]} indices - Array of order indices to re-index (unsorted)
 * @returns {number[]} Array of new integer indices in same order as input (0, 1, 2, ..., N-1)
 */
export function reindexToIntegers(indices: number[]): number[] {
  // Empty array: return empty array
  if (indices.length === 0) {
    return [];
  }

  // Single item: return [0]
  if (indices.length === 1) {
    return [0];
  }

  // Create array of [originalIndex, originalPosition] pairs
  // originalPosition is needed to preserve input order in output
  const indexedPairs = indices.map((index, originalPosition) => ({
    index,
    originalPosition,
  }));

  // Sort by original index to determine relative order
  indexedPairs.sort((a, b) => a.index - b.index);

  // Assign new integer indices: 0, 1, 2, 3, ..., N-1
  // Map each sorted pair to its new integer index
  const newIndicesByOriginalPosition = new Map<number, number>();
  indexedPairs.forEach((pair, sortedPosition) => {
    newIndicesByOriginalPosition.set(pair.originalPosition, sortedPosition);
  });

  // Return new indices in same order as input
  return indices.map((_, originalPosition) => {
    return newIndicesByOriginalPosition.get(originalPosition) ?? 0;
  });
}
