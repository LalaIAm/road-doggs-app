/**
 * JSON Repair Utility
 * 
 * Repairs malformed JSON strings from LLM responses.
 * Handles stripping Markdown code blocks and fixing common JSON syntax errors.
 * 
 * Per TRD-263: If the output JSON is malformed, the service must attempt to repair it
 * using a JSON repair library (e.g., jsonrepair).
 * 
 * @module apps/functions/src/services/intelligence/JsonRepair
 */

/**
 * Strip Markdown code blocks from LLM response
 * 
 * Extracts JSON content from code fences like:
 * - ```json ... ```
 * - ``` ... ```
 * 
 * @param {string} text - Raw LLM response text (may include Markdown wrappers)
 * @returns {string} Extracted JSON string (or original text if no code blocks found)
 */
export function stripMarkdownCodeBlocks(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Match code blocks: ```json ... ``` or ``` ... ```
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/g;
  const matches = [...text.matchAll(codeBlockRegex)];

  // If code blocks found, extract first match
  if (matches.length > 0) {
    const extracted = matches[0][1]?.trim() || '';
    return extracted;
  }

  // If no code blocks, look for JSON objects/arrays at start
  // Try to find first { or [ in the string
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');

  if (firstBrace !== -1 || firstBracket !== -1) {
    const startIndex = firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)
      ? firstBrace
      : firstBracket;

    // Try to find matching closing brace/bracket
    const jsonPart = extractJsonBlock(text, startIndex);
    if (jsonPart) {
      return jsonPart.trim();
    }
  }

  // Return original text if no extraction possible
  return text.trim();
}

/**
 * Extract JSON block starting at given index
 * Handles nested braces/brackets to find complete JSON object/array
 * 
 * @param {string} text - Text to search in
 * @param {number} startIndex - Index where JSON block starts
 * @returns {string | null} Extracted JSON block or null if not found
 */
function extractJsonBlock(text: string, startIndex: number): string | null {
  const openChar = text[startIndex];
  const closeChar = openChar === '{' ? '}' : ']';

  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === openChar) {
        depth++;
      } else if (char === closeChar) {
        depth--;
        if (depth === 0) {
          // Found matching closing brace/bracket
          return text.substring(startIndex, i + 1);
        }
      }
    }
  }

  return null; // No matching closing brace/bracket found
}

/**
 * Repair common JSON syntax errors
 * 
 * Fixes:
 * - Single quotes → Double quotes
 * - Trailing commas
 * - Missing commas between items
 * - Basic unquoted keys
 * 
 * @param {string} jsonString - Potentially malformed JSON string
 * @returns {string} Repaired JSON string
 */
export function repairJson(jsonString: string): string {
  if (!jsonString || typeof jsonString !== 'string') {
    return jsonString;
  }

  let repaired = jsonString.trim();

  // Step 1: Handle trailing commas
  // Remove trailing commas before } or ]
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

  // Step 2: Replace single quotes with double quotes (for keys and string values)
  // This is tricky because we need to avoid replacing quotes inside strings
  // For now, use a simple approach that works for most cases
  repaired = repaired.replace(/'/g, '"');

  // Step 3: Add missing commas between items
  // Pattern: "value" followed by "key" or } followed by "key"
  repaired = repaired.replace(/(")\s*(")/g, '$1,$2'); // Between string values
  repaired = repaired.replace(/(\d)\s*(")/g, '$1,$2'); // Between number and string
  repaired = repaired.replace(/(")\s*(\d)/g, '$1,$2'); // Between string and number
  repaired = repaired.replace(/(\})\s*(")/g, '$1,$2'); // Between object end and string key
  repaired = repaired.replace(/(\])\s*(")/g, '$1,$2'); // Between array end and string key
  repaired = repaired.replace(/(")\s*(\{)/g, '$1,$2'); // Between string and object start
  repaired = repaired.replace(/(")\s*(\[)/g, '$1,$2'); // Between string and array start

  // Step 4: Fix basic unquoted keys (word:value pattern)
  // Only fix simple keys that are valid identifiers
  repaired = repaired.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

  // Step 5: Fix missing commas after closing braces/brackets
  repaired = repaired.replace(/([}\]"])\s*(")/g, '$1,$2');
  repaired = repaired.replace(/([}\]"])\s*(\d)/g, '$1,$2');

  // Step 6: Remove comments (basic support)
  repaired = repaired.replace(/\/\/.*$/gm, ''); // Single-line comments
  repaired = repaired.replace(/\/\*[\s\S]*?\*\//g, ''); // Multi-line comments

  return repaired.trim();
}

/**
 * Repair malformed JSON from LLM response
 * 
 * Combines Markdown stripping and JSON repair to handle common LLM response issues.
 * 
 * @param {string} jsonResponse - Raw LLM response string (may include Markdown wrappers)
 * @returns {{ success: boolean; json?: string; error?: string }} Result object with success status, repaired JSON, and optional error
 */
export function repair(jsonResponse: string): {
  success: boolean;
  json?: string;
  error?: string;
} {
  try {
    if (!jsonResponse || typeof jsonResponse !== 'string') {
      return {
        success: false,
        error: 'Invalid input: jsonResponse must be a non-empty string',
      };
    }

    // Step 1: Strip Markdown code blocks
    let extracted = stripMarkdownCodeBlocks(jsonResponse);

    // Step 2: Try to parse as-is first (might already be valid JSON)
    try {
      JSON.parse(extracted);
      // Already valid JSON, return as-is
      return {
        success: true,
        json: extracted,
      };
    } catch (parseError) {
      // Not valid JSON, proceed with repair
    }

    // Step 3: Repair common JSON syntax errors
    let repaired = repairJson(extracted);

    // Step 4: Validate repaired JSON
    try {
      JSON.parse(repaired);
      // Repair successful
      return {
        success: true,
        json: repaired,
      };
    } catch (parseError: any) {
      // Repair failed
      return {
        success: false,
        error: `Failed to repair JSON: ${parseError.message}`,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: `Unexpected error during JSON repair: ${error.message}`,
    };
  }
}
