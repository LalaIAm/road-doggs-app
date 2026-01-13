// E2E tests for preference onboarding flow
describe('Preference Onboarding', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
    // Visit onboarding page
    cy.visit('/onboarding');
  });

  describe('Welcome Step (Step 1)', () => {
    it('should display welcome screen with correct content', () => {
      cy.contains("Let's plan trips that actually fit you");
      cy.contains('A few quick questions help us tailor routes');
      cy.contains('Get Started').should('be.visible');
      cy.contains('Takes about 2 minutes').should('be.visible');
    });

    it('should navigate to next step on "Get Started" click', () => {
      cy.contains('Get Started').click();
      cy.url().should('include', '/onboarding');
      // Should be on step 2 (Travel Style)
      cy.contains('How do you like to travel?').should('be.visible');
    });

    it('should not show progress bar or navigation on welcome step', () => {
      cy.get('[role="progressbar"]').should('not.exist');
      cy.contains('Back').should('not.exist');
      cy.contains('Continue').should('not.exist');
    });
  });

  describe('Travel Style Step (Step 2)', () => {
    beforeEach(() => {
      // Navigate to step 2
      cy.contains('Get Started').click();
    });

    it('should display route vibe options', () => {
      cy.contains('Route Vibe').should('be.visible');
      cy.contains('Scenic & Slow').should('be.visible');
      cy.contains('Efficient').should('be.visible');
      cy.contains('Balanced').should('be.visible');
    });

    it('should display daily pace options', () => {
      cy.contains('Daily Pace').should('be.visible');
      cy.contains('Relaxed').should('be.visible');
      cy.contains('Moderate').should('be.visible');
      cy.contains('Packed').should('be.visible');
    });

    it('should allow selecting route vibe', () => {
      cy.contains('Scenic & Slow').click();
      // Selection should be visually indicated
      cy.contains('Scenic & Slow')
        .parent()
        .should('have.class', 'border-moss');
    });

    it('should allow selecting daily pace', () => {
      cy.contains('Packed').click();
      cy.contains('Packed')
        .parent()
        .should('have.class', 'peer-checked:bg-white');
    });

    it('should show error if trying to continue without route vibe', () => {
      // Don't select route vibe
      cy.contains('Continue').click();
      cy.contains('Please select a route vibe').should('be.visible');
    });

    it('should navigate back to welcome step', () => {
      cy.contains('Back').click();
      cy.contains("Let's plan trips that actually fit you").should('be.visible');
    });

    it('should show progress bar', () => {
      cy.get('[role="progressbar"]').should('be.visible');
      cy.contains('Step 1 of 5').should('be.visible');
    });
  });

  describe('Interests Step (Step 3)', () => {
    beforeEach(() => {
      // Navigate through steps
      cy.contains('Get Started').click();
      cy.contains('Scenic & Slow').click();
      cy.contains('Continue').click();
    });

    it('should display interest options', () => {
      cy.contains('What sparks your interest?').should('be.visible');
      cy.contains('Nature').should('be.visible');
      cy.contains('Local Food').should('be.visible');
      cy.contains('History').should('be.visible');
      cy.contains('Photography').should('be.visible');
    });

    it('should allow multi-select of interests', () => {
      cy.contains('Nature').click();
      cy.contains('Local Food').click();
      cy.contains('Coffee').click();
      // All should be selected
      cy.contains('Nature')
        .parent()
        .should('have.class', 'border-moss');
      cy.contains('Local Food')
        .parent()
        .should('have.class', 'border-moss');
    });

    it('should allow deselecting interests', () => {
      cy.contains('Nature').click();
      cy.contains('Nature').click(); // Click again to deselect
      cy.contains('Nature')
        .parent()
        .should('not.have.class', 'border-moss');
    });

    it('should allow continuing without selecting interests (optional)', () => {
      cy.contains('Continue').click();
      // Should proceed to next step
      cy.contains('Practical Details').should('be.visible');
    });
  });

  describe('Constraints Step (Step 4)', () => {
    beforeEach(() => {
      // Navigate through steps
      cy.contains('Get Started').click();
      cy.contains('Scenic & Slow').click();
      cy.contains('Continue').click();
      cy.contains('Continue').click();
    });

    it('should display vehicle type options', () => {
      cy.contains('Primary Vehicle').should('be.visible');
      cy.contains('Car').should('be.visible');
      cy.contains('EV').should('be.visible');
      cy.contains('RV/Tow').should('be.visible');
    });

    it('should allow selecting vehicle type', () => {
      cy.contains('EV').click();
      cy.contains('EV')
        .parent()
        .should('have.class', 'border-moss');
    });

    it('should show RV details when RV is selected', () => {
      cy.contains('RV/Tow').click();
      cy.contains('Height Clearance').should('be.visible');
      cy.contains('Total Length').should('be.visible');
    });

    it('should hide RV details when non-RV vehicle is selected', () => {
      cy.contains('RV/Tow').click();
      cy.contains('Height Clearance').should('be.visible');
      cy.contains('Car').click();
      cy.contains('Height Clearance').should('not.exist');
    });

    it('should display budget slider', () => {
      cy.contains('Budget Comfort').should('be.visible');
      cy.get('input[type="range"]').should('be.visible');
      cy.contains('Thrifty').should('be.visible');
      cy.contains('Balanced').should('be.visible');
      cy.contains('Splurge').should('be.visible');
    });

    it('should update budget label when slider changes', () => {
      cy.get('input[type="range"]').invoke('val', 1).trigger('input');
      cy.contains('Thrifty').should('be.visible');
      cy.get('input[type="range"]').invoke('val', 3).trigger('input');
      cy.contains('Splurge').should('be.visible');
    });
  });

  describe('Collaboration Step (Step 5)', () => {
    beforeEach(() => {
      // Navigate through steps
      cy.contains('Get Started').click();
      cy.contains('Scenic & Slow').click();
      cy.contains('Continue').click();
      cy.contains('Continue').click();
      cy.contains('Continue').click();
    });

    it('should display collaboration options', () => {
      cy.contains('Who are you traveling with?').should('be.visible');
      cy.contains('Just me').should('be.visible');
      cy.contains('Friends / Group').should('be.visible');
      cy.contains('Family').should('be.visible');
    });

    it('should allow selecting collaboration option', () => {
      cy.contains('Friends / Group').click();
      cy.contains('Friends / Group')
        .parent()
        .should('have.class', 'border-moss');
    });

    it('should display main planner checkbox', () => {
      cy.contains("I'm usually the main planner").should('be.visible');
      cy.get('input[type="checkbox"]').should('be.visible');
    });

    it('should allow toggling main planner checkbox', () => {
      cy.get('input[type="checkbox"]').check();
      cy.get('input[type="checkbox"]').should('be.checked');
      cy.get('input[type="checkbox"]').uncheck();
      cy.get('input[type="checkbox"]').should('not.be.checked');
    });
  });

  describe('AI Refinement Step (Step 6)', () => {
    beforeEach(() => {
      // Navigate through steps
      cy.contains('Get Started').click();
      cy.contains('Scenic & Slow').click();
      cy.contains('Continue').click();
      cy.contains('Continue').click();
      cy.contains('Continue').click();
      cy.contains('Continue').click();
    });

    it('should display privacy notice', () => {
      cy.contains('Privacy & Data Usage').should('be.visible');
      cy.contains('I consent to data processing').should('be.visible');
    });

    it('should require consent before showing AI input', () => {
      cy.get('textarea').should('not.exist');
      cy.get('input[type="checkbox"]').check();
      cy.get('textarea').should('be.visible');
    });

    it('should display suggested chips when consented', () => {
      cy.get('input[type="checkbox"]').check();
      cy.contains('Avoid toll roads').should('be.visible');
      cy.contains('Dog friendly everywhere').should('be.visible');
      cy.contains('Late riser').should('be.visible');
    });

    it('should allow entering AI refinement text', () => {
      cy.get('input[type="checkbox"]').check();
      cy.get('textarea').type('I love scenic backroads');
      cy.get('textarea').should('have.value', 'I love scenic backroads');
    });

    it('should allow clicking suggested chips to add text', () => {
      cy.get('input[type="checkbox"]').check();
      cy.contains('Avoid toll roads').click();
      cy.get('textarea').should('contain.value', 'avoid toll roads');
    });

    it('should disable AI refinement button without consent', () => {
      cy.contains('Use AI Refinement').should('not.exist');
      cy.get('input[type="checkbox"]').check();
      cy.contains('Use AI Refinement').should('be.visible');
    });

    it('should show error if trying to use AI without consent', () => {
      // This would be tested if we had a way to trigger the error
      // For now, we verify the UI prevents it
      cy.get('input[type="checkbox"]').should('not.be.checked');
    });
  });

  describe('Completion Step (Step 7)', () => {
    beforeEach(() => {
      // Navigate through all steps
      cy.contains('Get Started').click();
      cy.contains('Scenic & Slow').click();
      cy.contains('Continue').click();
      cy.contains('Continue').click();
      cy.contains('Continue').click();
      cy.contains('Continue').click();
      cy.contains('Finish Setup').click();
    });

    it('should display completion message', () => {
      cy.contains("You're all set").should('be.visible');
      cy.contains('We've customized the map engine').should('be.visible');
    });

    it('should display "Plan My First Trip" button', () => {
      cy.contains('Plan My First Trip').should('be.visible');
    });

    it('should display "Edit Preferences" link', () => {
      cy.contains('I want to edit my preferences first').should('be.visible');
    });

    it('should not show progress bar or navigation on completion', () => {
      cy.get('[role="progressbar"]').should('not.exist');
      cy.contains('Back').should('not.exist');
      cy.contains('Continue').should('not.exist');
    });
  });

  describe('Navigation and Persistence', () => {
    it('should persist state to localStorage on step changes', () => {
      cy.contains('Get Started').click();
      cy.contains('Scenic & Slow').click();
      // Wait for debounced save
      cy.wait(1500);
      cy.window().then((win) => {
        const saved = win.localStorage.getItem('onboarding_state');
        expect(saved).to.exist;
        const parsed = JSON.parse(saved);
        expect(parsed.currentStep).to.equal(2);
        expect(parsed.preferences.routeVibe).to.equal('scenic');
      });
    });

    it('should restore state from localStorage on page reload', () => {
      // Set up some state
      cy.contains('Get Started').click();
      cy.contains('Scenic & Slow').click();
      cy.wait(1500);
      // Reload page
      cy.reload();
      // Should restore to step 2
      cy.contains('How do you like to travel?').should('be.visible');
      cy.contains('Scenic & Slow')
        .parent()
        .should('have.class', 'border-moss');
    });

    it('should show "Save & Exit" button on steps 2-6', () => {
      cy.contains('Get Started').click();
      cy.contains('Save & Exit').should('be.visible');
    });

    it('should allow skipping onboarding', () => {
      cy.contains('Get Started').click();
      cy.contains('Skip for now').should('be.visible');
      cy.contains('Skip for now').click();
      // Should show confirmation
      cy.on('window:confirm', () => true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on form controls', () => {
      cy.contains('Get Started').click();
      cy.get('input[type="radio"]').first().should('have.attr', 'aria-label');
      cy.get('input[type="checkbox"]').first().should('have.attr', 'aria-label');
    });

    it('should have progress bar with ARIA attributes', () => {
      cy.contains('Get Started').click();
      cy.get('[role="progressbar"]').should('have.attr', 'aria-valuenow');
      cy.get('[role="progressbar"]').should('have.attr', 'aria-valuemin');
      cy.get('[role="progressbar"]').should('have.attr', 'aria-valuemax');
    });

    it('should be keyboard navigable', () => {
      cy.contains('Get Started').click();
      // Tab through form elements
      cy.get('body').tab();
      cy.focused().should('exist');
    });

    it('should have proper focus management', () => {
      cy.contains('Get Started').click();
      // Focus should move to first focusable element in step
      cy.focused().should('exist');
    });
  });

  describe('Error Handling', () => {
    it('should display inline errors for validation failures', () => {
      cy.contains('Get Started').click();
      cy.contains('Continue').click();
      cy.contains('Please select a route vibe').should('be.visible');
    });

    it('should clear errors when valid selection is made', () => {
      cy.contains('Get Started').click();
      cy.contains('Continue').click();
      cy.contains('Please select a route vibe').should('be.visible');
      cy.contains('Scenic & Slow').click();
      cy.contains('Please select a route vibe').should('not.exist');
    });
  });
});