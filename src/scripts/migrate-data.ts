// Import necessary modules for the script
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env file
config({ path: path.resolve(__dirname, '../../.env') });

// --- SCRIPT CONFIGURATION ---
// The specific User ID to which the data will be migrated.
const TARGET_USER_ID = "R5nxgOa4MBQ9Zn8DhFpRXseLawi2"; 
// Path to your Firebase Admin SDK service account key
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
 * Migrates documents from a root collection to a user's subcollection.
 * @param rootCollectionName The name of the collection at the root (e.g., 'tasks').
 * @param userId The UID of the target user.
 */
async function migrateCollection(rootCollectionName: string, userId: string) {
  console.log(`\n--- Migrating collection: '${rootCollectionName}' ---`);
  
  const rootCollectionRef = db.collection(rootCollectionName);
  const snapshot = await rootCollectionRef.get();

  if (snapshot.empty) {
    console.log(`🟡 No documents found in '${rootCollectionName}'. Skipping.`);
    return;
  }

  console.log(`Found ${snapshot.size} documents to migrate.`);

  const userSubCollectionRef = db.collection('users').doc(userId).collection(rootCollectionName);
  const writeBatch = db.batch();
  let migratedCount = 0;

  for (const doc of snapshot.docs) {
    const docData = doc.data();
    
    // Check if the document already has a userId to avoid re-migration
    if (docData.userId) {
        console.log(`- Skipping document ${doc.id} (already has userId: ${docData.userId})`);
        continue;
    }

    const newData = {
      ...docData,
      userId: userId, // Add the user ID
    };
    
    // Set the new document in the user's subcollection
    const newDocRef = userSubCollectionRef.doc(doc.id);
    writeBatch.set(newDocRef, newData);

    // Delete the old document from the root
    writeBatch.delete(doc.ref);
    
    migratedCount++;
    console.log(`- Queued migration for document: ${doc.id}`);
  }
  
  if (migratedCount === 0) {
      console.log("✅ No new documents needed migration.");
      return;
  }

  console.log("Committing changes to database...");
  await writeBatch.commit();
  console.log(`✅ Successfully migrated ${migratedCount} documents from '${rootCollectionName}'.`);
}


/**
 * Main function to run the entire migration process.
 */
async function runMigration() {
  console.log("🚀 Starting data migration process for user:", TARGET_USER_ID);
  
  try {
    // Migrate collections one by one
    await migrateCollection('tasks', TARGET_USER_ID);
    await migrateCollection('projects', TARGET_USER_ID);
    
    console.log("\n🎉 --- MIGRATION COMPLETE! --- 🎉");
    console.log("All existing tasks and projects have been successfully linked to the user account.");

  } catch (error) {
    console.error("\n❌ Migration failed. Please check the errors above.");
    process.exit(1); // Exit with an error code
  }
}

// Execute the migration
runMigration();
