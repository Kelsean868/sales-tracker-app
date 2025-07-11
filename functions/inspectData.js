
const admin = require("firebase-admin");

// Initialize admin SDK
admin.initializeApp({
  projectId: "sales-tracker-v2-b378d",
});

const db = admin.firestore();

const inspectDatabase = async () => {
  console.log("Starting to inspect database structure...");

  const collectionsToInspect = ["leaderboard", "users", "teams", "units"];
  
  for (const collectionName of collectionsToInspect) {
    try {
      console.log(`
--- Inspecting Collection: ${collectionName} ---`);
      const snapshot = await db.collection(collectionName).limit(2).get();
      
      if (snapshot.empty) {
        console.log(`Collection '${collectionName}' is empty or does not exist.`);
        continue;
      }
      
      console.log(`Found ${snapshot.size} document(s) to inspect...`);
      snapshot.forEach(doc => {
        console.log(`
Document ID: ${doc.id}`);
        console.log(JSON.stringify(doc.data(), null, 2));
      });

    } catch (error) => {
      console.error(`
Error inspecting collection '${collectionName}':`, error);
    }
  }

  console.log("
--- Inspection Complete ---");
};

inspectDatabase();
