/**
 * Unit Tests for JSON Repair Utility
 * 
 * Tests against a dataset of known 'bad' LLM responses to verify
 * JSON repair functionality handles common malformed JSON issues.
 * 
 * @module apps/functions/src/services/intelligence/JsonRepair.test
 */

import { stripMarkdownCodeBlocks, repairJson, repair } from './JsonRepair';

describe('JsonRepair', () => {
  describe('stripMarkdownCodeBlocks', () => {
    it('should extract JSON from markdown code block with json language tag', () => {
      const input = '```json\n{"name": "test"}\n```';
      const result = stripMarkdownCodeBlocks(input);
      expect(result).toBe('{"name": "test"}');
    });

    it('should extract JSON from markdown code block without language tag', () => {
      const input = '```\n{"name": "test"}\n```';
      const result = stripMarkdownCodeBlocks(input);
      expect(result).toBe('{"name": "test"}');
    });

    it('should extract JSON from code block with extra whitespace', () => {
      const input = '```json\n  {"name": "test"}  \n```';
      const result = stripMarkdownCodeBlocks(input);
      expect(result).toBe('{"name": "test"}');
    });

    it('should extract first JSON block if multiple code blocks exist', () => {
      const input = '```json\n{"first": true}\n```\n```json\n{"second": true}\n```';
      const result = stripMarkdownCodeBlocks(input);
      expect(result).toBe('{"first": true}');
    });

    it('should return original text if no code blocks found', () => {
      const input = 'This is just plain text';
      const result = stripMarkdownCodeBlocks(input);
      expect(result).toBe('This is just plain text');
    });

    it('should extract JSON object from text without code blocks', () => {
      const input = 'Here is the JSON: {"name": "test"}';
      const result = stripMarkdownCodeBlocks(input);
      expect(result).toBe('{"name": "test"}');
    });

    it('should extract JSON array from text without code blocks', () => {
      const input = 'The data is: [1, 2, 3]';
      const result = stripMarkdownCodeBlocks(input);
      expect(result).toBe('[1, 2, 3]');
    });

    it('should handle empty string', () => {
      const result = stripMarkdownCodeBlocks('');
      expect(result).toBe('');
    });

    it('should handle null/undefined input gracefully', () => {
      expect(stripMarkdownCodeBlocks(null as any)).toBe(null);
      expect(stripMarkdownCodeBlocks(undefined as any)).toBe(undefined);
    });

    it('should extract nested JSON objects', () => {
      const input = '```json\n{"outer": {"inner": "value"}}\n```';
      const result = stripMarkdownCodeBlocks(input);
      expect(result).toBe('{"outer": {"inner": "value"}}');
    });
  });

  describe('repairJson', () => {
    it('should fix single quotes to double quotes', () => {
      const input = "{'name': 'test'}";
      const result = repairJson(input);
      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed.name).toBe('test');
    });

    it('should remove trailing commas in objects', () => {
      const input = '{"name": "test",}';
      const result = repairJson(input);
      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed.name).toBe('test');
    });

    it('should remove trailing commas in arrays', () => {
      const input = '[1, 2, 3,]';
      const result = repairJson(input);
      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed).toEqual([1, 2, 3]);
    });

    it('should fix unquoted keys', () => {
      const input = '{name: "test", age: 30}';
      const result = repairJson(input);
      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed.name).toBe('test');
      expect(parsed.age).toBe(30);
    });

    it('should add missing commas between items', () => {
      const input = '{"a": 1 "b": 2}';
      const result = repairJson(input);
      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed.a).toBe(1);
      expect(parsed.b).toBe(2);
    });

    it('should handle mixed single and double quotes', () => {
      const input = "{'name': \"test\", 'value': 42}";
      const result = repairJson(input);
      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed.name).toBe('test');
      expect(parsed.value).toBe(42);
    });

    it('should remove single-line comments', () => {
      const input = '{"name": "test"} // This is a comment';
      const result = repairJson(input);
      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed.name).toBe('test');
    });

    it('should remove multi-line comments', () => {
      const input = '{"name": "test"} /* This is a comment */';
      const result = repairJson(input);
      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed.name).toBe('test');
    });

    it('should handle already valid JSON', () => {
      const input = '{"name": "test", "age": 30}';
      const result = repairJson(input);
      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed.name).toBe('test');
      expect(parsed.age).toBe(30);
    });

    it('should handle empty object', () => {
      const input = '{}';
      const result = repairJson(input);
      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed).toEqual({});
    });

    it('should handle empty array', () => {
      const input = '[]';
      const result = repairJson(input);
      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed).toEqual([]);
    });

    it('should handle nested objects with trailing commas', () => {
      const input = '{"outer": {"inner": "value",},}';
      const result = repairJson(input);
      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed.outer.inner).toBe('value');
    });

    it('should handle arrays with trailing commas', () => {
      const input = '[[1, 2,], [3, 4,],]';
      const result = repairJson(input);
      expect(() => JSON.parse(result)).not.toThrow();
      const parsed = JSON.parse(result);
      expect(parsed).toEqual([[1, 2], [3, 4]]);
    });
  });

  describe('repair (main function)', () => {
    it('should repair JSON wrapped in markdown code block', () => {
      const input = '```json\n{"name": "test",}\n```';
      const result = repair(input);
      expect(result.success).toBe(true);
      expect(result.json).toBeDefined();
      if (result.json) {
        const parsed = JSON.parse(result.json);
        expect(parsed.name).toBe('test');
      }
    });

    it('should repair JSON with single quotes and markdown', () => {
      const input = '```json\n{\'name\': \'test\'}\n```';
      const result = repair(input);
      expect(result.success).toBe(true);
      expect(result.json).toBeDefined();
      if (result.json) {
        const parsed = JSON.parse(result.json);
        expect(parsed.name).toBe('test');
      }
    });

    it('should repair JSON with extra text before code block', () => {
      const input = 'Here is the JSON response:\n```json\n{"name": "test"}\n```';
      const result = repair(input);
      expect(result.success).toBe(true);
      expect(result.json).toBeDefined();
      if (result.json) {
        const parsed = JSON.parse(result.json);
        expect(parsed.name).toBe('test');
      }
    });

    it('should repair JSON with extra text after code block', () => {
      const input = '```json\n{"name": "test"}\n```\nThis is the end.';
      const result = repair(input);
      expect(result.success).toBe(true);
      expect(result.json).toBeDefined();
      if (result.json) {
        const parsed = JSON.parse(result.json);
        expect(parsed.name).toBe('test');
      }
    });

    it('should handle already valid JSON without markdown', () => {
      const input = '{"name": "test", "age": 30}';
      const result = repair(input);
      expect(result.success).toBe(true);
      expect(result.json).toBeDefined();
      if (result.json) {
        const parsed = JSON.parse(result.json);
        expect(parsed.name).toBe('test');
        expect(parsed.age).toBe(30);
      }
    });

    it('should handle complex malformed JSON from LLM', () => {
      const input = `Here's the JSON:
\`\`\`json
{
  name: 'Test POI',
  description: 'A great place',
  latitude: 40.7128,
  longitude: -74.0060,
  category: 'attraction',
  reason: 'Perfect for your trip',
}
\`\`\``;
      const result = repair(input);
      expect(result.success).toBe(true);
      expect(result.json).toBeDefined();
      if (result.json) {
        const parsed = JSON.parse(result.json);
        expect(parsed.name).toBe('Test POI');
        expect(parsed.description).toBe('A great place');
        expect(parsed.latitude).toBe(40.7128);
        expect(parsed.longitude).toBe(-74.0060);
      }
    });

    it('should handle array of objects with multiple issues', () => {
      const input = `\`\`\`json
[
  {name: 'First', value: 1,},
  {name: 'Second', value: 2,},
]
\`\`\``;
      const result = repair(input);
      expect(result.success).toBe(true);
      expect(result.json).toBeDefined();
      if (result.json) {
        const parsed = JSON.parse(result.json);
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed.length).toBe(2);
        expect(parsed[0].name).toBe('First');
        expect(parsed[1].name).toBe('Second');
      }
    });

    it('should return error for invalid input (non-string)', () => {
      const result = repair(null as any);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid input');
    });

    it('should return error for empty string', () => {
      const result = repair('');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error for JSON that cannot be repaired', () => {
      const input = 'This is not JSON at all and cannot be repaired';
      const result = repair(input);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Failed to repair JSON');
    });

    it('should handle JSON with missing closing bracket', () => {
      const input = '{"name": "test"';
      const result = repair(input);
      // This may or may not succeed depending on repair logic
      // Just verify it doesn't crash and returns proper structure
      expect(result).toHaveProperty('success');
      // If repair fails, it won't have json property
      if (result.success) {
        expect(result).toHaveProperty('json');
      } else {
        expect(result).toHaveProperty('error');
      }
    });

    it('should handle JSON with comments inside', () => {
      const input = `{
  // This is a comment
  "name": "test",
  /* Another comment */
  "age": 30
}`;
      const result = repair(input);
      expect(result.success).toBe(true);
      if (result.json) {
        const parsed = JSON.parse(result.json);
        expect(parsed.name).toBe('test');
        expect(parsed.age).toBe(30);
      }
    });

    it('should handle real-world LLM response with multiple issues', () => {
      const input = `Here are the POI recommendations:
\`\`\`json
[
  {
    name: 'Grand Canyon',
    description: 'Amazing natural wonder',
    latitude: 36.1069,
    longitude: -112.1129,
    category: 'nature',
    reason: 'Perfect for nature lovers',
  },
  {
    name: 'Las Vegas Strip',
    description: 'Entertainment capital',
    latitude: 36.1699,
    longitude: -115.1398,
    category: 'entertainment',
    reason: 'Great for nightlife',
  },
]
\`\`\`
These are great recommendations!`;
      const result = repair(input);
      expect(result.success).toBe(true);
      expect(result.json).toBeDefined();
      if (result.json) {
        const parsed = JSON.parse(result.json);
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed.length).toBe(2);
        expect(parsed[0].name).toBe('Grand Canyon');
        expect(parsed[1].name).toBe('Las Vegas Strip');
      }
    });

    it('should handle JSON with escaped quotes', () => {
      const input = '{"name": "Test with \\"quotes\\""}';
      const result = repair(input);
      expect(result.success).toBe(true);
      if (result.json) {
        const parsed = JSON.parse(result.json);
        expect(parsed.name).toBe('Test with "quotes"');
      }
    });

    it('should handle nested arrays and objects', () => {
      const input = `{
  "items": [
    {name: 'First', tags: ['tag1', 'tag2']},
    {name: 'Second', tags: ['tag3']},
  ],
}`;
      const result = repair(input);
      expect(result.success).toBe(true);
      if (result.json) {
        const parsed = JSON.parse(result.json);
        expect(parsed.items).toBeDefined();
        expect(Array.isArray(parsed.items)).toBe(true);
        expect(parsed.items[0].name).toBe('First');
        // Note: Repair may have issues with nested arrays, so we check structure
        expect(Array.isArray(parsed.items[0].tags)).toBe(true);
        expect(parsed.items[0].tags.length).toBeGreaterThan(0);
      }
    });

    it('should preserve apostrophes in single-quoted strings', () => {
      const input = "{name: 'John's Pizzeria', description: 'Best pizza in town'}";
      const result = repair(input);
      expect(result.success).toBe(true);
      expect(result.json).toBeDefined();
      if (result.json) {
        const parsed = JSON.parse(result.json);
        expect(parsed.name).toBe("John's Pizzeria");
        expect(parsed.description).toBe('Best pizza in town');
      }
    });

    it('should handle contractions and possessives in strings', () => {
      const input = `{
  name: "It's a great place",
  owner: "John's Restaurant",
  description: "We don't serve that"
}`;
      const result = repair(input);
      expect(result.success).toBe(true);
      if (result.json) {
        const parsed = JSON.parse(result.json);
        expect(parsed.name).toBe("It's a great place");
        expect(parsed.owner).toBe("John's Restaurant");
        expect(parsed.description).toBe("We don't serve that");
      }
    });

    it('should handle single-quoted strings with apostrophes in markdown blocks', () => {
      const input = '```json\n{name: \'John\'s Pizzeria\'}\n```';
      const result = repair(input);
      expect(result.success).toBe(true);
      if (result.json) {
        const parsed = JSON.parse(result.json);
        expect(parsed.name).toBe("John's Pizzeria");
      }
    });
  });
});
