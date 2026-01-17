/**
 * Unit Tests for Prompt Builder
 * 
 * Tests PromptBuilder to verify that user preference booleans correctly
 * append instructions to the prompt string.
 * 
 * Per TRD-257: Test prompt engineering logic
 * 
 * @module apps/functions/src/services/intelligence/PromptBuilder.test
 */

import { PromptBuilder, createPromptBuilder } from './PromptBuilder';
import { UserPreferences, Budget, FuelType } from '@roaddoggs/core';

describe('PromptBuilder', () => {
  let promptBuilder: PromptBuilder;

  beforeEach(() => {
    promptBuilder = new PromptBuilder();
  });

  describe('getSystemPrompt', () => {
    it('should return the system prompt from TRD-259', () => {
      const systemPrompt = promptBuilder.getSystemPrompt();
      
      expect(systemPrompt).toContain('You are a travel assistant');
      expect(systemPrompt).toContain('valid JSON array');
      expect(systemPrompt).toContain('name, description, lat, lng, category, reason');
      expect(systemPrompt).toContain('Do not include Markdown formatting');
      expect(systemPrompt).toContain('Do not include preamble');
    });
  });

  describe('formatPreferences', () => {
    it('should include nature instruction when nature is true', () => {
      const preferences: UserPreferences = {
        nature: true,
        culture: false,
        foodie: false,
        budget: Budget.MID,
        rvProfile: null,
      };

      const result = promptBuilder.formatPreferences(preferences);
      const parsed = JSON.parse(result);

      expect(parsed.instructions.some((inst: string) => inst.includes('Focus on nature and outdoor activities'))).toBe(true);
      expect(parsed.raw.nature).toBe(true);
    });

    it('should include culture instruction when culture is true', () => {
      const preferences: UserPreferences = {
        nature: false,
        culture: true,
        foodie: false,
        budget: Budget.MID,
        rvProfile: null,
      };

      const result = promptBuilder.formatPreferences(preferences);
      const parsed = JSON.parse(result);

      expect(parsed.instructions.some((inst: string) => inst.includes('Include cultural and historical sites'))).toBe(true);
      expect(parsed.raw.culture).toBe(true);
    });

    it('should include foodie instruction when foodie is true', () => {
      const preferences: UserPreferences = {
        nature: false,
        culture: false,
        foodie: true,
        budget: Budget.MID,
        rvProfile: null,
      };

      const result = promptBuilder.formatPreferences(preferences);
      const parsed = JSON.parse(result);

      expect(parsed.instructions.some((inst: string) => inst.includes('Prioritize unique dining experiences'))).toBe(true);
      expect(parsed.raw.foodie).toBe(true);
    });

    it('should include all boolean preferences when all are true', () => {
      const preferences: UserPreferences = {
        nature: true,
        culture: true,
        foodie: true,
        budget: Budget.MID,
        rvProfile: null,
      };

      const result = promptBuilder.formatPreferences(preferences);
      const parsed = JSON.parse(result);

      expect(parsed.instructions.length).toBeGreaterThanOrEqual(3);
      expect(parsed.instructions.some((inst: string) => inst.includes('nature'))).toBe(true);
      expect(parsed.instructions.some((inst: string) => inst.includes('cultural'))).toBe(true);
      expect(parsed.instructions.some((inst: string) => inst.includes('dining'))).toBe(true);
    });

    it('should not include boolean preference instructions when false', () => {
      const preferences: UserPreferences = {
        nature: false,
        culture: false,
        foodie: false,
        budget: Budget.MID,
        rvProfile: null,
      };

      const result = promptBuilder.formatPreferences(preferences);
      const parsed = JSON.parse(result);

      expect(parsed.instructions).not.toContain('nature');
      expect(parsed.instructions).not.toContain('cultural');
      expect(parsed.instructions).not.toContain('dining');
      expect(parsed.raw.nature).toBe(false);
      expect(parsed.raw.culture).toBe(false);
      expect(parsed.raw.foodie).toBe(false);
    });

    it('should include LOW budget instruction', () => {
      const preferences: UserPreferences = {
        nature: false,
        culture: false,
        foodie: false,
        budget: Budget.LOW,
        rvProfile: null,
      };

      const result = promptBuilder.formatPreferences(preferences);
      const parsed = JSON.parse(result);

      expect(parsed.instructions.some((inst: string) => inst.includes('budget-friendly options'))).toBe(true);
      expect(parsed.raw.budget).toBe(Budget.LOW);
    });

    it('should include MID budget instruction', () => {
      const preferences: UserPreferences = {
        nature: false,
        culture: false,
        foodie: false,
        budget: Budget.MID,
        rvProfile: null,
      };

      const result = promptBuilder.formatPreferences(preferences);
      const parsed = JSON.parse(result);

      expect(parsed.instructions.some((inst: string) => inst.includes('mix of budget-friendly and moderate-cost'))).toBe(true);
      expect(parsed.raw.budget).toBe(Budget.MID);
    });

    it('should include HIGH budget instruction', () => {
      const preferences: UserPreferences = {
        nature: false,
        culture: false,
        foodie: false,
        budget: Budget.HIGH,
        rvProfile: null,
      };

      const result = promptBuilder.formatPreferences(preferences);
      const parsed = JSON.parse(result);

      expect(parsed.instructions.some((inst: string) => inst.includes('premium experiences'))).toBe(true);
      expect(parsed.raw.budget).toBe(Budget.HIGH);
    });

    it('should include RV profile constraints when rvProfile is present', () => {
      const preferences: UserPreferences = {
        nature: false,
        culture: false,
        foodie: false,
        budget: Budget.MID,
        rvProfile: {
          height: 3.5,
          weight: 5000,
          fuelType: FuelType.GAS,
        },
      };

      const result = promptBuilder.formatPreferences(preferences);
      const parsed = JSON.parse(result);

      expect(parsed.instructions.some((inst: string) => inst.includes('Vehicle constraints'))).toBe(true);
      expect(parsed.instructions.some((inst: string) => inst.includes('3.5m'))).toBe(true);
      expect(parsed.instructions.some((inst: string) => inst.includes('5000kg'))).toBe(true);
      expect(parsed.instructions.some((inst: string) => inst.includes('large vehicles'))).toBe(true);
      expect(parsed.raw.rvProfile).toEqual({
        height: 3.5,
        weight: 5000,
        fuelType: FuelType.GAS,
      });
    });

    it('should include EV charging instruction for ELECTRIC fuel type', () => {
      const preferences: UserPreferences = {
        nature: false,
        culture: false,
        foodie: false,
        budget: Budget.MID,
        rvProfile: {
          height: 3.0,
          weight: 4000,
          fuelType: FuelType.ELECTRIC,
        },
      };

      const result = promptBuilder.formatPreferences(preferences);
      const parsed = JSON.parse(result);

      expect(parsed.instructions.some((inst: string) => inst.includes('EV charging stations'))).toBe(true);
    });

    it('should include diesel instruction for DIESEL fuel type', () => {
      const preferences: UserPreferences = {
        nature: false,
        culture: false,
        foodie: false,
        budget: Budget.MID,
        rvProfile: {
          height: 3.0,
          weight: 4000,
          fuelType: FuelType.DIESEL,
        },
      };

      const result = promptBuilder.formatPreferences(preferences);
      const parsed = JSON.parse(result);

      expect(parsed.instructions.some((inst: string) => inst.includes('diesel fuel'))).toBe(true);
    });

    it('should return valid JSON string', () => {
      const preferences: UserPreferences = {
        nature: true,
        culture: true,
        foodie: true,
        budget: Budget.HIGH,
        rvProfile: {
          height: 3.5,
          weight: 5000,
          fuelType: FuelType.ELECTRIC,
        },
      };

      const result = promptBuilder.formatPreferences(preferences);
      
      // Should be valid JSON
      expect(() => JSON.parse(result)).not.toThrow();
      
      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty('instructions');
      expect(parsed).toHaveProperty('raw');
      expect(Array.isArray(parsed.instructions)).toBe(true);
      expect(typeof parsed.raw).toBe('object');
    });
  });

  describe('buildPrompt', () => {
    it('should include system prompt in built prompt', () => {
      const preferences: UserPreferences = {
        nature: false,
        culture: false,
        foodie: false,
        budget: Budget.MID,
        rvProfile: null,
      };

      const prompt = promptBuilder.buildPrompt(preferences);

      expect(prompt).toContain('You are a travel assistant');
      expect(prompt).toContain('valid JSON array');
    });

    it('should include user preferences section', () => {
      const preferences: UserPreferences = {
        nature: true,
        culture: false,
        foodie: false,
        budget: Budget.MID,
        rvProfile: null,
      };

      const prompt = promptBuilder.buildPrompt(preferences);

      expect(prompt).toContain('User Preferences:');
      expect(prompt).toContain('nature');
    });

    it('should include route context when provided', () => {
      const preferences: UserPreferences = {
        nature: false,
        culture: false,
        foodie: false,
        budget: Budget.MID,
        rvProfile: null,
      };

      const routeContext = 'Route from San Francisco to Los Angeles via Highway 101';
      const prompt = promptBuilder.buildPrompt(preferences, routeContext);

      expect(prompt).toContain('Route Context:');
      expect(prompt).toContain(routeContext);
    });

    it('should not include route context section when not provided', () => {
      const preferences: UserPreferences = {
        nature: false,
        culture: false,
        foodie: false,
        budget: Budget.MID,
        rvProfile: null,
      };

      const prompt = promptBuilder.buildPrompt(preferences);

      expect(prompt).not.toContain('Route Context:');
    });

    it('should include instruction to generate recommendations', () => {
      const preferences: UserPreferences = {
        nature: false,
        culture: false,
        foodie: false,
        budget: Budget.MID,
        rvProfile: null,
      };

      const prompt = promptBuilder.buildPrompt(preferences);

      expect(prompt).toContain('Generate recommendations based on these preferences');
    });

    it('should build complete prompt with all preference types', () => {
      const preferences: UserPreferences = {
        nature: true,
        culture: true,
        foodie: true,
        budget: Budget.HIGH,
        rvProfile: {
          height: 3.5,
          weight: 5000,
          fuelType: FuelType.ELECTRIC,
        },
      };

      const prompt = promptBuilder.buildPrompt(preferences);

      // Should contain system prompt
      expect(prompt).toContain('You are a travel assistant');
      
      // Should contain preferences section
      expect(prompt).toContain('User Preferences:');
      
      // Should contain all preference instructions
      expect(prompt).toContain('nature');
      expect(prompt).toContain('cultural');
      expect(prompt).toContain('dining');
      expect(prompt).toContain('premium experiences');
      expect(prompt).toContain('Vehicle constraints');
      expect(prompt).toContain('EV charging stations');
      
      // Should end with recommendation instruction
      expect(prompt).toContain('Generate recommendations');
    });
  });

  describe('createPromptBuilder', () => {
    it('should create a PromptBuilder instance', () => {
      const builder = createPromptBuilder();
      
      expect(builder).toBeInstanceOf(PromptBuilder);
      expect(builder.getSystemPrompt()).toBeDefined();
    });
  });
});
