/**
 * Prompt Builder Service
 * 
 * Constructs AI prompts by combining system prompts with user preferences.
 * Converts UserPreferences to JSON and injects them into the prompt context.
 * 
 * Per TRD-257: Prompt Engineering
 * Per TRD-258: System Prompt must be strictly defined
 * Per TRD-259: System prompt text
 * Per TRD-260: Inject User's Preference JSON string into prompt context
 * 
 * @module apps/functions/src/services/intelligence/PromptBuilder
 */

import { UserPreferences, Budget } from '@roaddoggs/core';

/**
 * System prompt as defined in TRD-259
 * 
 * This prompt instructs the AI to output valid JSON without Markdown formatting.
 */
const SYSTEM_PROMPT = 'You are a travel assistant. You must output valid JSON array matching this schema: [ { name, description, lat, lng, category, reason } ]. Do not include Markdown formatting. Do not include preamble.';

/**
 * Prompt Builder class
 * 
 * Builds complete prompts by combining system prompts with user preferences.
 */
export class PromptBuilder {
  /**
   * Build a complete prompt with system prompt and user preferences
   * 
   * Per TRD-260: Inject User's Preference JSON string into the prompt context
   * 
   * @param preferences - User preferences to inject into the prompt
   * @param routeContext - Optional route context (e.g., route description, waypoints)
   * @returns Complete prompt string ready for AI model
   */
  buildPrompt(preferences: UserPreferences, routeContext?: string): string {
    // Format preferences as JSON string
    const preferencesJson = this.formatPreferences(preferences);
    
    // Build the complete prompt
    let prompt = SYSTEM_PROMPT;
    
    // Add preferences section
    prompt += '\n\nUser Preferences:\n';
    prompt += preferencesJson;
    
    // Add route context if provided
    if (routeContext) {
      prompt += '\n\nRoute Context:\n';
      prompt += routeContext;
    }
    
    // Add instruction to generate recommendations
    prompt += '\n\nGenerate recommendations based on these preferences.';
    
    return prompt;
  }

  /**
   * Format user preferences as a JSON string
   * 
   * Converts UserPreferences object to a JSON string that can be injected
   * into the prompt. Includes all preference fields.
   * 
   * @param preferences - User preferences object
   * @returns JSON string representation of preferences
   */
  formatPreferences(preferences: UserPreferences): string {
    // Build preference instructions from boolean flags
    const preferenceInstructions: string[] = [];
    
    // Convert boolean preferences to human-readable instructions
    if (preferences.nature) {
      preferenceInstructions.push('Focus on nature and outdoor activities (parks, hiking trails, scenic viewpoints, wildlife areas).');
    }
    
    if (preferences.culture) {
      preferenceInstructions.push('Include cultural and historical sites (museums, monuments, historical landmarks, cultural centers).');
    }
    
    if (preferences.foodie) {
      preferenceInstructions.push('Prioritize unique dining experiences and local food scenes (restaurants, food markets, local specialties).');
    }
    
    // Convert budget enum to instruction
    const budgetInstruction = this.formatBudgetPreference(preferences.budget);
    if (budgetInstruction) {
      preferenceInstructions.push(budgetInstruction);
    }
    
    // Add RV profile constraints if present
    if (preferences.rvProfile) {
      const rvInstruction = this.formatRvProfile(preferences.rvProfile);
      if (rvInstruction) {
        preferenceInstructions.push(rvInstruction);
      }
    }
    
    // Create a structured preferences object for JSON
    const preferencesObj = {
      instructions: preferenceInstructions,
      raw: {
        nature: preferences.nature,
        culture: preferences.culture,
        foodie: preferences.foodie,
        budget: preferences.budget,
        rvProfile: preferences.rvProfile,
      },
    };
    
    // Convert to JSON string with pretty formatting for readability
    return JSON.stringify(preferencesObj, null, 2);
  }

  /**
   * Format budget preference as an instruction
   * 
   * @param budget - Budget enum value (LOW | MID | HIGH)
   * @returns Budget instruction string or empty string if not applicable
   */
  private formatBudgetPreference(budget: Budget): string {
    switch (budget) {
      case Budget.LOW:
        return 'Focus on budget-friendly options (free attractions, affordable dining, low-cost activities).';
      case Budget.MID:
        return 'Include a mix of budget-friendly and moderate-cost options.';
      case Budget.HIGH:
        return 'Include premium experiences and higher-end options (fine dining, exclusive attractions, luxury experiences).';
      default:
        return '';
    }
  }

  /**
   * Format RV profile as an instruction
   * 
   * @param rvProfile - RV profile with vehicle constraints
   * @returns RV instruction string
   */
  private formatRvProfile(rvProfile: { height: number; weight: number; fuelType: string }): string {
    const instructions: string[] = [];
    
    instructions.push(`Vehicle constraints: Height ${rvProfile.height}m, Weight ${rvProfile.weight}kg`);
    
    // Add fuel type specific instruction
    if (rvProfile.fuelType === 'ELECTRIC') {
      instructions.push('Requires EV charging stations along the route.');
    } else if (rvProfile.fuelType === 'DIESEL') {
      instructions.push('Requires diesel fuel availability.');
    }
    
    instructions.push('Ensure routes are suitable for large vehicles (check bridge clearances, road restrictions).');
    
    return instructions.join(' ');
  }

  /**
   * Get the system prompt
   * 
   * @returns The system prompt string
   */
  getSystemPrompt(): string {
    return SYSTEM_PROMPT;
  }
}

/**
 * Create a PromptBuilder instance
 * 
 * @returns PromptBuilder instance
 */
export function createPromptBuilder(): PromptBuilder {
  return new PromptBuilder();
}
