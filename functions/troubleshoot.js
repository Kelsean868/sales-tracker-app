const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { onCall } = require("firebase-functions/v2/https");

// A troubleshooting function to force a refresh of a user's custom claims.
exports.forceRefreshClaims = onCall(async (request) => {
    const {auth, data} = request;
    const {uid} = data;
    if (!auth || (auth.token.role !== "super_admin" && auth.token.role !== "admin")) {
        throw new functions.https.HttpsError("permission-denied", "You must be an admin to call this function.");
    }
    if (!uid) {
        throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'uid' argument.");
    }
    try {
        await admin.auth().revokeRefreshTokens(uid);
        await admin.auth().updateUser(uid, {}); // Trigger a token refresh hint
        return { message: "Successfully requested a claims refresh for user.", uid: uid };
    } catch (error) {
        console.error("Error forcing claims refresh:", error);
        throw new functions.https.HttpsError("internal", "Could not force claims refresh.");
    }
});

// A more advanced troubleshooting function to debug the getAdminDashboardData flow.
// It checks each collection individually and reports the status.
exports.debugAdminDashboard = onCall(async (request) => {
    const { auth } = request;

    // Secure this function to only be callable by admins
    if (!auth || (auth.token.role !== "super_admin" && auth.token.role !== "admin")) {
        throw new functions.https.HttpsError(
            "permission-denied",
            "You must be an admin to call this function."
        );
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
    
    // This will be logged in the Firebase Functions console, not the browser.
    console.log(`Starting admin dashboard debug process for project: ${projectId}`);

    for (const collectionName of collectionsToFetch) {
        try {
            console.log(`Attempting to fetch collection: ${collectionName}`);
            const snapshot = await db.collection(collectionName).limit(5).get();
            results[collectionName] = {
                status: "success",
                count: snapshot.size,
            };
            console.log(`Successfully fetched ${snapshot.size} documents from ${collectionName}.`);
        } catch (error) {
            console.error(`Error fetching collection '${collectionName}':`, error);
            results[collectionName] = {
                status: "error",
                error: error.message,
                code: error.code,
            };
            // Continue to the next collection to get a full report
        }
    }

    console.log("Admin dashboard debug process finished.");
    // This result is returned to the browser.
    return results;
});
