const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {onCall} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");

admin.initializeApp();

// ... (other functions remain the same)

exports.universalSearch = onCall(async (request) => {
  const {data, auth} = request;
  if (!auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be authenticated.");
  }

  const searchTerm = (data.searchTerm || "").toLowerCase();
  if (!searchTerm || searchTerm.length < 2) {
    throw new functions.https.HttpsError("invalid-argument", "Search term must be at least 2 characters long.");
  }

  const db = admin.firestore();
  const results = {leads: [], clients: [], policies: []};

  const searchCollections = {
    leads: "name_lowercase",
    clients: "name_lowercase",
    policies: "policyNumber_lowercase",
  };

  const searchPromises = Object.entries(searchCollections).map(async ([collectionName, fieldName]) => {
    const snapshot = await db.collection(collectionName)
        .where(fieldName, ">=", searchTerm)
        .where(fieldName, "<=", searchTerm + "\uf8ff")
        .limit(15)
        .get();

    snapshot.forEach((doc) => {
      results[collectionName].push({id: doc.id, ...doc.data()});
    });
  });

  await Promise.all(searchPromises);
  return results;
});

// ... (other functions remain the same)
