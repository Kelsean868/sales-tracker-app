/**
 * This file contains the backend Cloud Functions for the application.
 * It now uses the recommended v2 syntax.
 */

const {onCall, HttpsError} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

// =================================================================
// addUser
// =================================================================
exports.addUser = onCall(async (request) => {
  // --- DEBUGGING LOG (FIXED) ---
  console.log("--- addUser function triggered ---");
  console.log("Received data:", request.data);

  // CRITICAL FIX: Extract safe properties before logging
  const callerUID = request.auth ? request.auth.uid : "No auth context";
  console.log("Caller UID:", callerUID);

  // --- Security Check ---
  if (!request.auth) {
    throw new HttpsError(
        "unauthenticated",
        "You must be authenticated to perform this action.",
    );
  }
  const requesterUid = request.auth.uid;
  const userDocRef = admin.firestore().collection("users").doc(requesterUid);

  try {
    const userDoc = await userDocRef.get();
    if (!userDoc.exists || userDoc.data().role !== "super_admin") {
      throw new HttpsError(
          "permission-denied",
          "You must be a Super Admin to create users.",
      );
    }
  } catch (error) {
    console.error("Error verifying permissions:", error);
    throw new HttpsError(
        "internal", "Could not verify admin permissions.",
    );
  }

  const {
    email,
    name,
    role,
  } = request.data;

  // --- Input Validation ---
  if (!email || !name || !role) {
    throw new HttpsError(
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
    console.log("Successfully created new user in Auth:", userRecord.uid);

    // --- Create User Document in Firestore ---
    const newUserDocRef = admin.firestore().collection("users").doc(userRecord.uid);
    await newUserDocRef.set({
      uid: userRecord.uid,
      email: email,
      name: name,
      role: role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("Successfully created user document for:", userRecord.uid);

    const successMessage = `Successfully created user ${name}.`;
    return {
      result: successMessage,
    };
  } catch (error) {
    console.error("Error during user creation process:", error);
    throw new HttpsError(
        "internal", "An error occurred while creating the user.",
    );
  }
});


/**
 * =================================================================
 * editUser
 * =================================================================
 * An "onCall" Cloud Function to securely edit an existing user's role and assignments.
 */
exports.editUser = onCall(async (request) => {
  // --- Security Check ---
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be authenticated.");
  }

  const requesterUid = request.auth.uid;
  const userDocRef = admin.firestore().collection("users").doc(requesterUid);
  try {
    const userDoc = await userDocRef.get();
    if (!userDoc.exists || userDoc.data().role !== "super_admin") {
      throw new HttpsError(
          "permission-denied",
          "You must be a Super Admin to edit users.",
      );
    }
  } catch (error) {
    console.error("Error verifying edit permissions:", error);
    throw new HttpsError("internal", "Could not verify admin permissions.");
  }

  // --- Input Validation ---
  const {uidToEdit, updates} = request.data;
  if (!uidToEdit || !updates) {
    throw new HttpsError(
        "invalid-argument",
        "Please provide a user ID and the data to update.",
    );
  }

  try {
    // --- Update User Document in Firestore ---
    const targetUserDocRef = admin.firestore().collection("users").doc(uidToEdit);
    await targetUserDocRef.update(updates);

    console.log(`Successfully updated user ${uidToEdit}`);
    return {result: `Successfully updated user.`};
  } catch (error) {
    console.error(`Error updating user ${uidToEdit}:`, error);
    throw new HttpsError("internal", "An error occurred while updating the user.");
  }
});
