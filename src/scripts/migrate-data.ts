// Import necessary modules for the script
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env file
config({ path: `.env` });

// --- SCRIPT CONFIGURATION ---
const TARGET_USER_EMAIL = "jaquesebastian0@gmail.com";
// Path to your Firebase Admin SDK service account key
// IMPORTANT: Make sure this file is in your .gitignore
const serviceAccountPath = path.resolve(__dirname, '../../firebase-admin-sdk.json');

// --- INITIALIZE FIREBASE ADMIN SDK ---
try {
  const serviceAccount = require(serviceAccountPath);

  // Check if the app is already initialized to prevent errors
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
  process.exit(1); // Exit script if initialization fails
}

const db = getFirestore();
const auth = admin.auth();

console.log("✅ Firebase Admin SDK initialized successfully.");

// --- MIGRATION LOGIC ---

/**
 * Fetches the user ID (uid) for the specified email address.
 * @param email The user's email.
 * @returns The user's UID.
 */
async function getUserIdByEmail(email: string): Promise<string> {
  try {
    const userRecord = await auth.getUserByEmail(email);
    console.log(`✅ Found user: ${userRecord.displayName} (UID: ${userRecord.uid})`);
    return userRecord.uid;
  } catch (error) {
    console.error(`🔴 ERROR: Could not find user with email '${email}'.`);
    console.error("Please make sure you have created this user in the TaskZenith application first.");
    throw error; // Re-throw to stop the script
  }
}

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
  console.log("🚀 Starting data migration process...");
  
  try {
    const userId = await getUserIdByEmail(TARGET_USER_EMAIL);
    
    // Migrate collections one by one
    await migrateCollection('tasks', userId);
    await migrateCollection('projects', userId);
    
    console.log("\n🎉 --- MIGRATION COMPLETE! --- 🎉");
    console.log("All existing tasks and projects have been successfully linked to the user account.");

  } catch (error) {
    console.error("\n❌ Migration failed. Please check the errors above.");
    process.exit(1); // Exit with an error code
  }
}

// Execute the migration
runMigration();
