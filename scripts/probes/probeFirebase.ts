#!/usr/bin/env ts-node
/**
 * Firebase Probe Script
 * 
 * Uses Firebase Admin SDK to write/read a document to Firestore to verify
 * Service Account credentials and Emulator connectivity.
 * 
 * Per task requirements: Verify Service Account credentials and Emulator connectivity.
 * 
 * @module scripts/probes/probeFirebase
 */

// Note: firebase-admin should be installed
// For local testing: npm install --save-dev firebase-admin

let admin: any;

// Environment variables
const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
const USE_EMULATOR = process.env.FIREBASE_EMULATOR === 'true' || process.env.USE_FIREBASE_EMULATOR === 'true';
const FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase(): void {
  console.log('🔧 Initializing Firebase Admin SDK...');
  
  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      console.log('   Firebase Admin already initialized');
      console.log('');
      return;
    }
    
    // Initialize with default credentials or service account
    // Firebase Admin SDK will automatically use:
    // 1. GOOGLE_APPLICATION_CREDENTIALS environment variable (service account JSON)
    // 2. gcloud application-default credentials
    // 3. GCE metadata service (if running on GCE)
    
    const app = admin.initializeApp({
      projectId: FIREBASE_PROJECT_ID,
    });
    
    console.log('   ✓ Firebase Admin initialized');
    if (FIREBASE_PROJECT_ID) {
      console.log(`   Project ID: ${FIREBASE_PROJECT_ID}`);
    }
    console.log('');
    
    // Configure Firestore emulator if needed
    if (USE_EMULATOR) {
      console.log('🔧 Configuring Firestore Emulator...');
      console.log(`   Emulator Host: ${FIRESTORE_EMULATOR_HOST}`);
      
      // Connect to emulator
      process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_EMULATOR_HOST;
      
      console.log('   ✓ Firestore Emulator configured');
      console.log('');
    }
  } catch (error: any) {
    console.error('❌ Error initializing Firebase Admin:');
    console.error('   ', error.message);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   1. Set GOOGLE_APPLICATION_CREDENTIALS to path of service account JSON');
    console.error('   2. Or run: gcloud auth application-default login');
    console.error('   3. Or set FIREBASE_PROJECT_ID environment variable');
    console.error('   4. For emulator: Set FIREBASE_EMULATOR=true and start emulator');
    console.error('');
    throw error;
  }
}

/**
 * Write a test document to Firestore
 */
async function writeTestDocument(): Promise<string> {
  console.log('📝 Writing test document to Firestore...');
  
  try {
    const db = admin.firestore();
    const testCollection = 'probe_test';
    const testDocId = `test_${Date.now()}`;
    
    const testData = {
      probeId: testDocId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      message: 'Firebase probe test document',
      testData: {
        string: 'test value',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: {
          nested: 'value',
        },
      },
    };
    
    console.log(`   Collection: ${testCollection}`);
    console.log(`   Document ID: ${testDocId}`);
    console.log('');
    
    const docRef = db.collection(testCollection).doc(testDocId);
    await docRef.set(testData);
    
    console.log('   ✓ Document written successfully');
    console.log('');
    
    return testDocId;
  } catch (error: any) {
    console.error('❌ Error writing document:');
    console.error('   ', error.message);
    
    if (error.code === 7) {
      console.error('   → Possible cause: Permission denied (check Firestore security rules)');
    } else if (error.code === 16) {
      console.error('   → Possible cause: Unauthenticated (check Service Account credentials)');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   → Possible cause: Firestore emulator not running');
      console.error('      Start it with: firebase emulators:start --only firestore');
    }
    
    console.error('');
    throw error;
  }
}

/**
 * Read the test document from Firestore
 */
async function readTestDocument(docId: string): Promise<any> {
  console.log('📖 Reading test document from Firestore...');
  
  try {
    const db = admin.firestore();
    const testCollection = 'probe_test';
    
    console.log(`   Collection: ${testCollection}`);
    console.log(`   Document ID: ${docId}`);
    console.log('');
    
    const docRef = db.collection(testCollection).doc(docId);
    const docSnapshot = await docRef.get();
    
    if (!docSnapshot.exists) {
      throw new Error('Document does not exist after write');
    }
    
    const data = docSnapshot.data();
    
    console.log('   ✓ Document read successfully');
    console.log('   Document data:');
    console.log('     Probe ID:', data?.probeId);
    console.log('     Timestamp:', data?.timestamp?.toDate?.() || data?.timestamp);
    console.log('     Message:', data?.message);
    console.log('     Test Data:', JSON.stringify(data?.testData, null, 2));
    console.log('');
    
    return data;
  } catch (error: any) {
    console.error('❌ Error reading document:');
    console.error('   ', error.message);
    console.error('');
    throw error;
  }
}

/**
 * Clean up test document
 */
async function cleanupTestDocument(docId: string): Promise<void> {
  console.log('🧹 Cleaning up test document...');
  
  try {
    const db = admin.firestore();
    const testCollection = 'probe_test';
    
    const docRef = db.collection(testCollection).doc(docId);
    await docRef.delete();
    
    console.log('   ✓ Test document deleted');
    console.log('');
  } catch (error: any) {
    // Don't fail the probe if cleanup fails
    console.log('   ⚠️  Warning: Could not delete test document');
    console.log('      ', error.message);
    console.log('');
  }
}

/**
 * Verify Service Account credentials
 */
function verifyCredentials(): void {
  console.log('🔐 Verifying Service Account credentials...');
  console.log('');
  
  try {
    const app = admin.app();
    const projectId = app.options.projectId;
    
    if (!projectId) {
      throw new Error('Project ID not configured');
    }
    
    console.log('   ✓ Project ID configured:', projectId);
    
    // Try to get Firestore instance (will fail if credentials are invalid)
    const db = admin.firestore();
    console.log('   ✓ Firestore instance accessible');
    
    if (USE_EMULATOR) {
      console.log('   ✓ Using Firestore Emulator');
      console.log(`   Emulator Host: ${FIRESTORE_EMULATOR_HOST}`);
    } else {
      console.log('   ✓ Using production Firestore');
    }
    
    console.log('');
  } catch (error: any) {
    console.error('❌ Credential verification failed:');
    console.error('   ', error.message);
    console.error('');
    throw error;
  }
}

/**
 * Main probe function
 */
async function probeFirebase() {
  try {
    console.log('🧪 Probing Firebase (Firestore)...');
    
    if (USE_EMULATOR) {
      console.log('   Mode: Emulator');
      console.log(`   Emulator Host: ${FIRESTORE_EMULATOR_HOST}`);
    } else {
      console.log('   Mode: Production');
      if (FIREBASE_PROJECT_ID) {
        console.log(`   Project ID: ${FIREBASE_PROJECT_ID}`);
      }
    }
    console.log('');
    
    // Initialize Firebase
    initializeFirebase();
    
    // Verify credentials
    verifyCredentials();
    
    // Write test document
    const docId = await writeTestDocument();
    
    // Read test document
    const data = await readTestDocument(docId);
    
    // Verify data integrity
    if (data.probeId !== docId) {
      throw new Error('Data integrity check failed: probeId mismatch');
    }
    
    if (!data.testData || data.testData.string !== 'test value') {
      throw new Error('Data integrity check failed: testData mismatch');
    }
    
    console.log('✅ Data integrity verified');
    console.log('');
    
    // Cleanup
    await cleanupTestDocument(docId);
    
    // Success summary
    console.log('✅ Probe successful!');
    console.log('   ✓ Firebase Admin SDK initialized');
    console.log('   ✓ Service Account credentials verified');
    if (USE_EMULATOR) {
      console.log('   ✓ Firestore Emulator connectivity verified');
    } else {
      console.log('   ✓ Production Firestore connectivity verified');
    }
    console.log('   ✓ Write operation successful');
    console.log('   ✓ Read operation successful');
    console.log('   ✓ Data integrity verified');
    console.log('');
    
    return true;
  } catch (error: any) {
    console.error('❌ Probe failed:');
    console.error('   Error message:', error.message);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   1. Verify GOOGLE_APPLICATION_CREDENTIALS points to valid service account JSON');
    console.error('   2. Or run: gcloud auth application-default login');
    console.error('   3. Verify FIREBASE_PROJECT_ID is set correctly');
    console.error('   4. For emulator: Set FIREBASE_EMULATOR=true');
    console.error('   5. Start emulator: firebase emulators:start --only firestore');
    console.error('   6. Verify Firestore security rules allow write/read');
    console.error('   7. Check network connectivity');
    console.error('');
    
    process.exit(1);
  }
}

/**
 * Main probe execution
 */
async function main() {
  // Import firebase-admin
  try {
    admin = await import('firebase-admin');
  } catch (error) {
    console.error('❌ Error: firebase-admin package not found');
    console.error('   Install it with: npm install --save-dev firebase-admin');
    process.exit(1);
  }

  console.log('🚀 Starting Firebase Probe...\n');
  
  const success = await probeFirebase();
  
  if (success) {
    console.log('✅ Firebase probe completed successfully!');
    process.exit(0);
  } else {
    console.error('❌ Firebase probe failed!');
    process.exit(1);
  }
}

// Run probe
main().catch((error) => {
  console.error('💥 Fatal error running Firebase probe:', error);
  process.exit(1);
});
