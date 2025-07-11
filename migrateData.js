
const admin = require("firebase-admin");

// Initialize admin SDK for the script
admin.initializeApp({
  projectId: "sales-tracker-v2-b378d",
});

const db = admin.firestore();

const migrateData = async () => {
  console.log("Starting data migration...");

  const usersSnapshot = await db.collection("users").get();
  if (usersSnapshot.empty) {
    console.log("No users found. Nothing to migrate.");
    return;
  }

  console.log(`Found ${usersSnapshot.size} users to process.`);

  // Define which subcollections to migrate to top-level collections
  const collectionsToMigrate = ["leads", "clients", "contacts", "policies"];
  const migrationPromises = [];

  for (const userDoc of usersSnapshot.docs) {
    console.log(`
Processing user: ${userDoc.id} (${userDoc.data().name})`);
    
    for (const collectionName of collectionsToMigrate) {
      const subcollectionRef = userDoc.ref.collection(collectionName);
      const topLevelCollectionRef = db.collection(collectionName);
      
      const subcollectionSnapshot = await subcollectionRef.get();
      
      if (subcollectionSnapshot.empty) {
        console.log(`  - No documents found in subcollection '${collectionName}'. Skipping.`);
        continue;
      }
      
      console.log(`  - Found ${subcollectionSnapshot.size} documents in '${collectionName}'. Migrating...`);
      
      subcollectionSnapshot.forEach(doc => {
        const docData = doc.data();
        // Create a new document in the top-level collection
        const promise = topLevelCollectionRef.doc(doc.id).set(docData);
        migrationPromises.push(promise);
        console.log(`    - Queued migration for ${collectionName}/${doc.id}`);
      });
    }
  }

  if (migrationPromises.length === 0) {
    console.log("
No data found to migrate. Exiting.");
    return;
  }

  console.log(`
Waiting for all ${migrationPromises.length} migration operations to complete...`);
  
  try {
    await Promise.all(migrationPromises);
    console.log("✅ Data migration completed successfully!");
    console.log("Your data is now in top-level collections. Please check your app.");
  } catch (error) {
    console.error("🔥 An error occurred during migration:", error);
  }
};

migrateData();
