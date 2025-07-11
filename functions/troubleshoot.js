const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { onCall } = require("firebase-functions/v2/https");

// We need to re-import the setCustomUserClaims function to use it here.
// This is a bit of a workaround to avoid circular dependencies.
// In a larger app, this logic might be better placed in a shared utility file.
const setCustomUserClaims = async (uid) => {
  try {
    const userDoc = await admin.firestore().collection("users").doc(uid).get();
    if (!userDoc.exists) {
      console.log(`User document not found for UID: ${uid} in troubleshoot. Skipping claims update.`);
      return;
    }
    const userData = userDoc.data();
    const claims = {
      role: userData.role || "",
      userId: uid,
      uid: uid,
      teamId: userData.teamId || null,
      unitId: userData.unitId || null,
      branchId: userData.branchId || null,
      regionId: userData.regionId || null,
    };
    await admin.auth().setCustomUserClaims(uid, claims);
    console.log(`Custom claims successfully re-applied for user ${uid} via troubleshoot.`);
  } catch (error) {
    // We throw the error here so the client function knows something went wrong.
    console.error(`Error re-applying custom claims for user ${uid} via troubleshoot:`, error);
    throw new functions.https.HttpsError("internal", "Failed to re-apply custom claims.", error.message);
  }
};


// A troubleshooting function to force a refresh of a user's custom claims.
// This version is less destructive and just re-runs the claims-setting logic.
exports.forceRefreshClaims = onCall(async (request) => {
    const { auth, data } = request;
    const { uid } = data;

    if (!auth || (auth.token.role !== "super_admin" && auth.token.role !== "admin")) {
        throw new functions.https.HttpsError("permission-denied", "You must be an admin to call this function.");
    }
    if (!uid) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'uid' argument.");
    }
    
    // We just call our updated setCustomUserClaims function.
    await setCustomUserClaims(uid);

    return { message: "Successfully requested a claims update for user.", uid: uid };
});


// This function remains for debugging if needed, but the primary focus is the claims refresh.
exports.debugAdminDashboard = onCall(async (request) => {
    const { auth } = request;

    if (!auth || (auth.token.role !== "super_admin" && auth.token.role !== "admin")) {
        throw new functions.https.HttpsError("permission-denied", "You must be an admin to call this function.");
    }

    const db = admin.firestore();
    const collectionsToFetch = [
        "leads", "clients", "activities",
        "contacts", "users", "teams",
        "units", "branches", "policies",
    ];

    const results = {};
    const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
    results.runningInProject = projectId;
    
    console.log(`Starting admin dashboard debug process for project: ${projectId}`);

    for (const collectionName of collectionsToFetch) {
        try {
            const snapshot = await db.collection(collectionName).limit(5).get();
            results[collectionName] = {
                status: "success",
                count: snapshot.size,
            };
        } catch (error) {
            results[collectionName] = {
                status: "error",
                error: error.message,
            };
        }
    }

    console.log("Admin dashboard debug process finished.");
    return results;
});
