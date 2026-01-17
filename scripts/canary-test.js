#!/usr/bin/env node
/**
 * Canary Test Script for External API Health Checks
 * 
 * This script performs smoke tests against external APIs to detect:
 * - API signature changes
 * - Billing/quota issues
 * - Service availability
 * 
 * Currently tests: Vertex AI
 * Future: Google Maps, Open Charge Map
 */

// Note: @google-cloud/vertexai will be installed in CI
// For local testing, run: npm install --save-dev @google-cloud/vertexai
let VertexAI;
try {
  const vertexAIModule = await import('@google-cloud/vertexai');
  VertexAI = vertexAIModule.VertexAI;
} catch (error) {
  console.error('❌ Error: @google-cloud/vertexai package not found');
  console.error('   Install it with: npm install --save-dev @google-cloud/vertexai');
  process.exit(1);
}

const VERTEX_AI_PROJECT_ID = process.env.VERTEX_AI_PROJECT_ID;
const VERTEX_AI_LOCATION = process.env.VERTEX_AI_LOCATION || 'us-central1';

if (!VERTEX_AI_PROJECT_ID) {
  console.error('❌ Error: VERTEX_AI_PROJECT_ID environment variable is required');
  process.exit(1);
}

/**
 * Test Vertex AI API with a simple "Hello World" prompt
 * @returns {Promise<boolean>} true if test passes, false otherwise
 */
async function testVertexAI() {
  try {
    console.log('🧪 Testing Vertex AI API...');
    console.log(`   Project: ${VERTEX_AI_PROJECT_ID}`);
    console.log(`   Location: ${VERTEX_AI_LOCATION}`);

    // Initialize Vertex AI client
    const vertexAI = new VertexAI({
      project: VERTEX_AI_PROJECT_ID,
      location: VERTEX_AI_LOCATION,
    });

    // Get the generative model (using Gemini)
    const model = vertexAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });

    // Send a simple "Hello World" prompt
    const prompt = 'Hello World';
    console.log(`   Sending prompt: "${prompt}"`);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Validate response
    if (!text || text.trim().length === 0) {
      console.error('❌ Vertex AI test failed: Empty response received');
      return false;
    }

    console.log('✅ Vertex AI test passed');
    console.log(`   Response preview: ${text.substring(0, 100)}...`);
    return true;
  } catch (error) {
    console.error('❌ Vertex AI test failed:', error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    if (error.status) {
      console.error(`   HTTP status: ${error.status}`);
    }
    return false;
  }
}

/**
 * Main test runner
 */
async function runCanaryTests() {
  console.log('🚀 Starting Canary Tests...\n');

  const results = {
    vertexAI: false,
  };

  // Test Vertex AI
  results.vertexAI = await testVertexAI();

  console.log('\n📊 Test Results:');
  console.log(`   Vertex AI: ${results.vertexAI ? '✅ PASS' : '❌ FAIL'}`);

  // Determine overall status
  const allPassed = Object.values(results).every((result) => result === true);

  if (allPassed) {
    console.log('\n✅ All canary tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some canary tests failed!');
    process.exit(1);
  }
}

// Run tests
runCanaryTests().catch((error) => {
  console.error('💥 Fatal error running canary tests:', error);
  process.exit(1);
});
