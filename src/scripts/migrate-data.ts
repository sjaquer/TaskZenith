// Import necessary modules for the script
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env file
config({ path: path.resolve(__dirname, '../../.env') });

// --- SCRIPT CONFIGURATION ---
const SOURCE_USER_ID = "R5nxgOa4MBQ9Zn8DhFpRXseLawi2"; // The user with the WRONG ID that has the data
const TARGET_USER_ID = "R5nxgOa4MBQ9Zn8DhFpRXs0Lawi2"; // The user with the CORRECT ID
const ROOT_COLLECTIONS_TO_MIGRATE = ['config', 'dailyTasks']; // Collections at the root to move
const USER_COLLECTIONS_TO_MIGRATE = ['tasks', 'projects']; // Collections inside the wrong user to move

// IMPORTANT: Make sure this file is in your .gitignore
const serviceAccountPath = path.resolve(__dirname, '../../firebase-admin-sdk.json');

// --- INITIALIZE FIREBASE ADMIN SDK ---
try {
  const serviceAccount = require(serviceAccountPath);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
} catch (error: any) {
  console.error("🔴 ERROR: Could not initialize Firebase Admin SDK.");
  console.error("Please ensure 'firebase-admin-sdk.json' exists in the root directory and is configured correctly.");
  console.error("You can download it from your Firebase project settings > Service accounts.");
  process.exit(1);
}

const db = getFirestore();

console.log("✅ Firebase Admin SDK initialized successfully.");

// --- MIGRATION LOGIC ---

/**
 * Moves all documents from a source collection to a target collection.
 * @param sourceCollectionRef The collection to move documents from.
 * @param targetCollectionRef The collection to move documents to.
 * @param writeBatch A Firestore write batch to queue operations.
 */
async function moveCollection(sourceCollectionRef: FirebaseFirestore.CollectionReference, targetCollectionRef: FirebaseFirestore.CollectionReference, writeBatch: FirebaseFirestore.WriteBatch) {
    const snapshot = await sourceCollectionRef.get();

    if (snapshot.empty) {
        console.log(`🟡 No documents found in '${sourceCollectionRef.path}'. Skipping.`);
        return 0;
    }

    let migratedCount = 0;
    snapshot.docs.forEach(doc => {
        const docData = doc.data();
        const newDocRef = targetCollectionRef.doc(doc.id);
        
        writeBatch.set(newDocRef, docData);
        writeBatch.delete(doc.ref); // Delete the old document

        migratedCount++;
        console.log(`- Queued move for document: ${doc.id} from ${sourceCollectionRef.path} to ${targetCollectionRef.path}`);
    });
    
    return migratedCount;
}


/**
 * Main function to run the entire migration process.
 */
async function runMigration() {
  console.log("🚀 Starting data migration and cleanup process.");
  console.log(`- Source User (Incorrect): ${SOURCE_USER_ID}`);
  console.log(`- Target User (Correct):   ${TARGET_USER_ID}`);
  
  try {
    const writeBatch = db.batch();
    let totalMigrated = 0;

    // 1. Migrate collections from ROOT to the TARGET user
    console.log("\n--- Migrating ROOT collections ---");
    for (const collectionName of ROOT_COLLECTIONS_TO_MIGRATE) {
        const sourceCollectionRef = db.collection(collectionName);
        const targetCollectionRef = db.collection('users').doc(TARGET_USER_ID).collection(collectionName);
        totalMigrated += await moveCollection(sourceCollectionRef, targetCollectionRef, writeBatch);
    }
    
    // 2. Migrate collections from the SOURCE user to the TARGET user
    console.log("\n--- Migrating USER sub-collections ---");
    for (const collectionName of USER_COLLECTIONS_TO_MIGRATE) {
        const sourceCollectionRef = db.collection('users').doc(SOURCE_USER_ID).collection(collectionName);
        const targetCollectionRef = db.collection('users').doc(TARGET_USER_ID).collection(collectionName);
        totalMigrated += await moveCollection(sourceCollectionRef, targetCollectionRef, writeBatch);
    }
    
    if (totalMigrated === 0) {
        console.log("\n🟡 No documents found to migrate. The database might already be organized.");
        console.log("If the incorrect user document still exists, please delete it manually from the Firebase Console.");
        return;
    }
    
    // 3. Delete the now-empty incorrect user document
    const sourceUserDocRef = db.collection('users').doc(SOURCE_USER_ID);
    writeBatch.delete(sourceUserDocRef);
    console.log(`- Queued deletion for incorrect user document: ${SOURCE_USER_ID}`);

    console.log("\nCommitting all changes to the database...");
    await writeBatch.commit();
    
    console.log("\n🎉 --- MIGRATION COMPLETE! --- 🎉");
    console.log(`Successfully migrated ${totalMigrated} documents and cleaned up the old structure.`);

  } catch (error) {
    console.error("\n❌ Migration failed. Please check the errors above.");
    console.error(error);
    process.exit(1); // Exit with an error code
  }
}

// Execute the migration
runMigration();
