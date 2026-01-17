// Cypress E2E test configuration
// TODO: Configure Cypress for E2E testing
// Test scenarios:
// - Sign up with email/password
// - Sign in with email/password
// - Sign in with Google SSO
// - Password reset flow
// - Provider linking (link Google to email account)
// - Provider unlinking
// - Profile edit (name, photo upload)
// - Privacy toggle update
// - Error flows (invalid credentials, network errors)
// - Accessibility (keyboard navigation, screen reader)

import { defineConfig } from 'cypress';

export default defineConfig({
  projectId: "ryb3ec",
  viewportHeight: 1080,
  viewportWidth: 1920,
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
  },
});
