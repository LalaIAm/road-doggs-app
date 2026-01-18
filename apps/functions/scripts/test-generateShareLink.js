/**
 * Test script for generateShareLink function
 * 
 * This script helps test the generateShareLink HTTP trigger using the Firebase Emulator.
 * 
 * Usage:
 *   1. Start the emulator: npm run serve (in apps/functions)
 *   2. Run this script: node scripts/test-generateShareLink.js
 * 
 * Prerequisites:
 *   - Firebase emulator running on port 5001
 *   - A test user authenticated in the emulator
 *   - A test trip document in Firestore with the test user as owner
 */

const https = require('https');
const http = require('http');

const PROJECT_ID = 'road-doggs-app';
const EMULATOR_HOST = 'localhost';
const EMULATOR_PORT = 5001;
const FUNCTION_REGION = 'us-central1';
const FUNCTION_NAME = 'generateShareLink';

// Test configuration
const TEST_CONFIG = {
  // You'll need to create a test user and get their ID token
  // Use Firebase Auth emulator UI at http://localhost:4000
  userId: 'test-user-123',
  tripId: 'test-trip-123',
  role: 'EDITOR',
  expiryDays: 30,
};

/**
 * Make a request to the Firebase emulator
 */
function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Test generateShareLink function
 */
async function testGenerateShareLink(idToken) {
  const url = `/${PROJECT_ID}/${FUNCTION_REGION}/${FUNCTION_NAME}`;
  
  const options = {
    hostname: EMULATOR_HOST,
    port: EMULATOR_PORT,
    path: url,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
  };
  
  const requestBody = {
    tripId: TEST_CONFIG.tripId,
    role: TEST_CONFIG.role,
    expiryDays: TEST_CONFIG.expiryDays,
  };
  
  console.log('\n📤 Testing generateShareLink...');
  console.log('Request:', JSON.stringify(requestBody, null, 2));
  
  try {
    const response = await makeRequest(options, requestBody);
    
    console.log('\n📥 Response:');
    console.log(`Status: ${response.statusCode}`);
    console.log('Body:', JSON.stringify(response.body, null, 2));
    
    if (response.statusCode === 200) {
      console.log('\n✅ SUCCESS: Function returned 200 OK');
      
      // Verify response structure
      if (response.body.url && response.body.expiry) {
        console.log('✅ Response structure is correct');
        console.log(`   URL: ${response.body.url}`);
        console.log(`   Expiry: ${new Date(response.body.expiry.seconds * 1000).toISOString()}`);
      } else {
        console.log('❌ Response structure is missing required fields');
      }
    } else {
      console.log(`\n❌ FAILED: Function returned ${response.statusCode}`);
      if (response.body.error) {
        console.log(`   Error: ${response.body.error}`);
        console.log(`   Message: ${response.body.message}`);
      }
    }
    
    return response;
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    throw error;
  }
}

/**
 * Main test function
 */
async function main() {
  console.log('🧪 Testing generateShareLink Function');
  console.log('=====================================\n');
  
  console.log('⚠️  IMPORTANT: Before running this test:');
  console.log('   1. Start Firebase emulator: npm run serve');
  console.log('   2. Create a test user in Auth emulator UI (http://localhost:4000)');
  console.log('   3. Create a test trip in Firestore with the test user as ownerId');
  console.log('   4. Get the ID token from the Auth emulator');
  console.log('   5. Update TEST_CONFIG in this script with your test data\n');
  
  // Check if ID token is provided
  const idToken = process.argv[2];
  
  if (!idToken) {
    console.log('❌ Error: ID token required');
    console.log('\nUsage: node scripts/test-generateShareLink.js <id-token>');
    console.log('\nTo get an ID token:');
    console.log('  1. Open Firebase Emulator UI: http://localhost:4000');
    console.log('  2. Go to Authentication tab');
    console.log('  3. Create a test user or use existing one');
    console.log('  4. Copy the ID token from the user details');
    process.exit(1);
  }
  
  // Test the function
  try {
    await testGenerateShareLink(idToken);
    console.log('\n✅ Test completed');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { testGenerateShareLink };
