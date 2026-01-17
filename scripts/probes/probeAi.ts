#!/usr/bin/env ts-node
/**
 * Vertex AI Probe Script
 * 
 * Sends a basic prompt to Vertex AI, logs the raw response, and verifies
 * connectivity and authentication.
 * 
 * Per TRD-339: Sends a "Hello World" prompt to Vertex AI
 * Per TRD-340: Asserts response is 200 OK
 * Per TRD-341: Goal: Detect if Google changes API signatures or if Billing is disabled
 * 
 * @module scripts/probes/probeAi
 */

// Note: @google-cloud/vertexai should be installed
// For local testing: npm install --save-dev @google-cloud/vertexai
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
  console.error('   Set it in your .env file or export it before running this script');
  process.exit(1);
}

/**
 * Probe Vertex AI API with a basic "Hello World" prompt
 * Logs the raw response and verifies connectivity and authentication
 */
async function probeVertexAI() {
  try {
    console.log('🧪 Probing Vertex AI API...');
    console.log(`   Project ID: ${VERTEX_AI_PROJECT_ID}`);
    console.log(`   Location: ${VERTEX_AI_LOCATION}`);
    console.log('');

    // Initialize Vertex AI client
    const vertexAI = new VertexAI({
      project: VERTEX_AI_PROJECT_ID,
      location: VERTEX_AI_LOCATION,
    });

    // Get the generative model (using Gemini)
    const model = vertexAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });

    // Send a simple "Hello World" prompt (TRD-339)
    const prompt = 'Hello World';
    console.log(`📤 Sending prompt: "${prompt}"`);
    console.log('');

    const result = await model.generateContent(prompt);
    const response = await result.response;

    // Log raw response data
    console.log('📥 Raw Response Data:');
    console.log('   Response object type:', typeof response);
    console.log('   Response keys:', Object.keys(response));
    console.log('');

    // Extract text content
    const text = response.text();
    console.log('📝 Response Text:');
    console.log(`   "${text}"`);
    console.log('');

    // Verify response is valid (TRD-340: assert response is 200 OK)
    // Note: Vertex AI SDK handles HTTP status internally, so we check for valid response
    if (!text || text.trim().length === 0) {
      console.error('❌ Probe failed: Empty response received');
      console.error('   This may indicate API signature changes or billing issues');
      process.exit(1);
    }

    // Log additional response metadata if available
    if ('usageMetadata' in response) {
      console.log('📊 Usage Metadata:');
      const usage = (response as any).usageMetadata;
      if (usage) {
        console.log('   Prompt token count:', usage.promptTokenCount || 'N/A');
        console.log('   Candidates token count:', usage.candidatesTokenCount || 'N/A');
        console.log('   Total token count:', usage.totalTokenCount || 'N/A');
      }
      console.log('');
    }

    // Verify connectivity and authentication were successful
    console.log('✅ Probe successful!');
    console.log('   ✓ Vertex AI connectivity verified');
    console.log('   ✓ Authentication verified');
    console.log('   ✓ API response received and parsed');
    console.log('   ✓ Response format is valid');
    console.log('');

    // TRD-341: Detect if Google changes API signatures or if Billing is disabled
    // The successful response indicates:
    // - API signatures are correct (response structure matches expected format)
    // - Billing is enabled (API call succeeded)
    // - Authentication credentials are valid

    return true;
  } catch (error: any) {
    console.error('❌ Probe failed:');
    console.error('   Error message:', error.message);
    
    if (error.code) {
      console.error('   Error code:', error.code);
      
      // Common error codes
      if (error.code === 7) {
        console.error('   → Possible cause: Permission denied (check Service Account permissions)');
      } else if (error.code === 8) {
        console.error('   → Possible cause: Resource exhausted (check quotas/billing)');
      } else if (error.code === 16) {
        console.error('   → Possible cause: Unauthenticated (check credentials)');
      }
    }
    
    if (error.status) {
      console.error('   HTTP status:', error.status);
    }
    
    if (error.statusCode) {
      console.error('   HTTP status code:', error.statusCode);
    }
    
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   1. Verify VERTEX_AI_PROJECT_ID is correct');
    console.error('   2. Verify Google Cloud credentials are configured (gcloud auth application-default login)');
    console.error('   3. Verify Vertex AI API is enabled for the project');
    console.error('   4. Verify billing is enabled for the project');
    console.error('   5. Check quotas and rate limits');
    
    // TRD-341: Detect if Google changes API signatures or if Billing is disabled
    // Error handling helps identify:
    // - API signature changes (unexpected error codes/structures)
    // - Billing issues (quota/billing-related errors)
    
    process.exit(1);
  }
}

/**
 * Main probe execution
 */
async function main() {
  console.log('🚀 Starting Vertex AI Probe...\n');
  
  const success = await probeVertexAI();
  
  if (success) {
    console.log('✅ Vertex AI probe completed successfully!');
    process.exit(0);
  } else {
    console.error('❌ Vertex AI probe failed!');
    process.exit(1);
  }
}

// Run probe
main().catch((error) => {
  console.error('💥 Fatal error running Vertex AI probe:', error);
  process.exit(1);
});
