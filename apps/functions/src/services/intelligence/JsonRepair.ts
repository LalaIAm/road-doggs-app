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
 * Convert single-quoted strings to double-quoted strings
 * Preserves apostrophes inside strings (e.g., "John's" stays as "John's")
 * 
 * Bug Fix: When inside a single-quoted string, we preserve all characters including apostrophes.
 * Only when we see a single quote followed by a character that suggests the string is ending
 * (comma, closing brace, colon, whitespace, etc.) do we treat it as a closing quote.
 * 
 * @param {string} jsonString - JSON string that may contain single-quoted strings
 * @returns {string} JSON string with single-quoted strings converted to double-quoted
 */
function convertSingleQuotedStrings(jsonString: string): string {
  let result = '';
  let i = 0;
  let inDoubleQuotedString = false;
  let inSingleQuotedString = false;
  let escapeNext = false;

  while (i < jsonString.length) {
    const char = jsonString[i];
    const nextChar = i + 1 < jsonString.length ? jsonString[i + 1] : '';

    if (escapeNext) {
      result += char;
      escapeNext = false;
      i++;
      continue;
    }

    if (char === '\\') {
      result += char;
      escapeNext = true;
      i++;
      continue;
    }

    // Handle double-quoted strings (preserve as-is)
    if (char === '"' && !inSingleQuotedString) {
      inDoubleQuotedString = !inDoubleQuotedString;
      result += char;
      i++;
      continue;
    }

    // Handle single-quoted strings
    if (char === "'" && !inDoubleQuotedString) {
      if (!inSingleQuotedString) {
        // Opening single quote - replace with double quote
        result += '"';
        inSingleQuotedString = true;
      } else {
        // We're inside a single-quoted string and see a single quote
        // Check if this is a closing quote or an apostrophe inside the string
        // It's a closing quote if followed by: comma, closing brace/bracket, colon, whitespace, or end of string
        const isClosingQuote = /[,}\]\s:]/.test(nextChar) || i === jsonString.length - 1;
        
        if (isClosingQuote) {
          // Closing single quote - replace with double quote
          result += '"';
          inSingleQuotedString = false;
        } else {
          // Apostrophe inside the string (e.g., "John's"), preserve it
          result += "'";
        }
      }
      i++;
      continue;
    }

    // Inside single-quoted string, preserve all characters (including apostrophes)
    if (inSingleQuotedString) {
      result += char;
      i++;
      continue;
    }

    // Outside strings, preserve character
    result += char;
    i++;
  }

  // If we ended with an unclosed single-quoted string, close it
  if (inSingleQuotedString) {
    result += '"';
  }

  return result;
}

/**
 * Repair common JSON syntax errors
 * 
 * Fixes:
 * - Single quotes → Double quotes (preserving apostrophes inside strings)
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

  // Step 2: Convert single-quoted strings to double-quoted strings
  // This preserves apostrophes inside strings (e.g., "John's" stays as "John's")
  repaired = convertSingleQuotedStrings(repaired);

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
  // Bug Fix: Only remove comments that are outside of strings
  repaired = removeCommentsOutsideStrings(repaired);

  return repaired.trim();
}

/**
 * Remove comments from JSON string, but only outside of string literals
 * 
 * Bug Fix: Prevents removal of // sequences inside strings (like URLs)
 * 
 * @param {string} jsonString - JSON string that may contain comments
 * @returns {string} JSON string with comments removed (only outside strings)
 */
function removeCommentsOutsideStrings(jsonString: string): string {
  let result = '';
  let i = 0;
  let inString = false;
  let stringChar: string | null = null; // Track which quote type started the string
  let escapeNext = false;

  while (i < jsonString.length) {
    const char = jsonString[i];
    const nextChar = i + 1 < jsonString.length ? jsonString[i + 1] : '';

    if (escapeNext) {
      result += char;
      escapeNext = false;
      i++;
      continue;
    }

    if (char === '\\') {
      result += char;
      escapeNext = true;
      i++;
      continue;
    }

    // Track string boundaries
    if ((char === '"' || char === "'") && !inString) {
      inString = true;
      stringChar = char;
      result += char;
      i++;
      continue;
    }

    if (inString && char === stringChar) {
      inString = false;
      stringChar = null;
      result += char;
      i++;
      continue;
    }

    // Inside strings, preserve everything (including // and /*)
    if (inString) {
      result += char;
      i++;
      continue;
    }

    // Outside strings, check for comments
    // Single-line comment: // followed by rest of line
    if (char === '/' && nextChar === '/' && !inString) {
      // Skip to end of line
      while (i < jsonString.length && jsonString[i] !== '\n' && jsonString[i] !== '\r') {
        i++;
      }
      // Preserve the newline if present
      if (i < jsonString.length && (jsonString[i] === '\n' || jsonString[i] === '\r')) {
        // Skip newline (don't add to result)
        i++;
      }
      continue;
    }

    // Multi-line comment: /* ... */
    if (char === '/' && nextChar === '*' && !inString) {
      // Skip /* and find matching */
      i += 2; // Skip '/*'
      while (i < jsonString.length - 1) {
        if (jsonString[i] === '*' && jsonString[i + 1] === '/') {
          i += 2; // Skip '*/'
          break;
        }
        i++;
      }
      continue;
    }

    // Not a comment, preserve character
    result += char;
    i++;
  }

  return result;
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
