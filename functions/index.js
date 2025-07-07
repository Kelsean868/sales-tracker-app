/**
 * This file contains the backend Cloud Functions for the application.
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * =================================================================
 * addUser
 * =================================================================
 * An "onCall" Cloud Function to securely create a new user.
 */
exports.addUser = functions.https.onCall(async (data, context) => {
  // --- DEBUGGING LOG ---
  functions.logger.log("--- addUser function triggered ---");
  functions.logger.log("Received data:", data);
  // THIS IS THE FIX: We log the UID safely, not the entire auth object.
  functions.logger.log("Caller UID:", context.auth ? context.auth.uid : "No auth context.");

  // --- Security Check ---
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "You must be authenticated to perform this action.",
    );
  }

  const requesterUid = context.auth.uid;
  const userDocRef = admin.firestore().collection("users").doc(requesterUid);
  try {
    const userDoc = await userDocRef.get();
    if (!userDoc.exists || userDoc.data().role !== "super_admin") {
      throw new functions.https.HttpsError(
          "permission-denied",
          "You must be a Super Admin to create users.",
      );
    }
  } catch (error) {
    functions.logger.error("Error verifying permissions:", error);
    throw new functions.https.HttpsError(
        "internal", "Could not verify admin permissions.",
    );
  }


  const {email, name, role} = data;

  // --- Input Validation ---
  if (!email || !name || !role) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Please provide an email, name, and role.",
    );
  }

  try {
    // --- Create User in Firebase Authentication ---
    const userRecord = await admin.auth().createUser({
      email: email,
      displayName: name,
      password: "tempPassword" + Math.random().toString(36).slice(-8),
    });

    functions.logger.log("Successfully created new user in Auth:", userRecord.uid);

    // --- Create User Document in Firestore ---
    const newUserDocRef = admin.firestore().collection("users").doc(userRecord.uid);
    await newUserDocRef.set({
      uid: userRecord.uid,
      email: email,
      name: name,
      role: role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const successMessage = `Successfully created user ${name}.`;
    return {result: successMessage};
  } catch (error) {
    functions.logger.error("Error during user creation process:", error);
    throw new functions.https.HttpsError(
        "internal", "An error occurred while creating the user.",
    );
  }
});
