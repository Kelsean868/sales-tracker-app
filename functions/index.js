const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {onCall} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");

admin.initializeApp();

// Import all function modules
const leaderboard = require('./leaderboard');
const notifications = require('./notifications');
const troubleshoot = require('./troubleshoot');

const setCustomUserClaims = async (uid) => {
  try {
    const userDoc = await admin.firestore().collection("users").doc(uid).get();
    if (!userDoc.exists) {
      console.log(`User document not found for UID: ${uid}. Skipping claims update.`);
      return;
    }
    const userData = userDoc.data();
    const claims = {
      role: userData.role || "",
      userId: uid,
      teamId: userData.teamId || null,
      unitId: userData.unitId || null,
      branchId: userData.branchId || null,
      regionId: userData.regionId || null,
    };
    await admin.auth().setCustomUserClaims(uid, claims);
    console.log(`Custom claims set for user ${uid}:`, claims);
  } catch (error) {
    console.error(`Error setting custom claims for user ${uid}:`, error);
  }
};

exports.addUser = onCall(async (request) => {
  const {data, auth} = request;
  if (!auth) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  const {email, password, name, role, teamId, unitId, branchId, regionId} = data;
  try {
    const userAuth = await admin.auth().createUser({email, password, displayName: name});
    const userData = {
      name, email, role,
      teamId: teamId || null,
      unitId: unitId || null,
      branchId: branchId || null,
      regionId: regionId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await admin.firestore().collection("users").doc(userAuth.uid).set(userData);
    await setCustomUserClaims(userAuth.uid);
    return {result: `User ${email} created successfully.`};
  } catch (error) {
    console.error("Error creating new user:", error);
    throw new functions.https.HttpsError("internal", "Error creating new user.", error);
  }
});

exports.editUser = onCall(async (request) => {
  const {data, auth} = request;
  if (!auth) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }
  const {uidToEdit, updates} = data;
  try {
    await admin.firestore().collection("users").doc(uidToEdit).update(updates);
    await setCustomUserClaims(uidToEdit);
    return {result: `User updated successfully.`};
  } catch (error) {
    console.error("Error updating user:", error);
    throw new functions.https.HttpsError("internal", "Error updating user.", error);
  }
});

exports.updateGoalOnActivityLog = onDocumentCreated("activities/{activityId}", async (event) => {
  const activity = event.data.data();
  const {userId, type, points = 0} = activity;
  if (!userId || !type) return null;

  const goalsRef = admin.firestore().collection("goals").where("userId", "==", userId).where("status", "==", "active");
  const goalsSnapshot = await goalsRef.get();
  if (goalsSnapshot.empty) return null;

  const batch = admin.firestore().batch();
  goalsSnapshot.forEach((doc) => {
    const progress = doc.data().progress || {};
    progress[type] = (progress[type] || 0) + 1;
    progress["points"] = (progress["points"] || 0) + points;
    batch.update(doc.ref, {progress});
  });
  return batch.commit();
});

exports.updateGoalOnLeadAdd = onDocumentCreated("leads/{leadId}", async (event) => {
  const lead = event.data.data();
  const {userId} = lead;
  if (!userId) return null;

  const goalsRef = admin.firestore().collection("goals").where("userId", "==", userId).where("status", "==", "active");
  const goalsSnapshot = await goalsRef.get();
  if (goalsSnapshot.empty) return null;

  const batch = admin.firestore().batch();
  goalsSnapshot.forEach((doc) => {
    const progress = doc.data().progress || {};
    progress["leads"] = (progress["leads"] || 0) + 1;
    batch.update(doc.ref, {progress});
  });
  return batch.commit();
});

exports.updateGoalOnPolicyAdd = onDocumentCreated("policies/{policyId}", async (event) => {
  const policy = event.data.data();
  const {userId, premium = 0} = policy;
  if (!userId) return null;

  const goalsRef = admin.firestore().collection("goals").where("userId", "==", userId).where("status", "==", "active");
  const goalsSnapshot = await goalsRef.get();
  if (goalsSnapshot.empty) return null;

  const batch = admin.firestore().batch();
  goalsSnapshot.forEach((doc) => {
    const progress = doc.data().progress || {};
    progress["policies"] = (progress["policies"] || 0) + 1;
    progress["premium"] = (progress["premium"] || 0) + Number(premium);
    batch.update(doc.ref, {progress});
  });
  return batch.commit();
});

const createLowercaseNameTrigger = (collectionName) => {
  return onDocumentCreated(`${collectionName}/{docId}`, (event) => {
    const data = event.data.data();
    if (data && data.name) {
      return event.data.ref.update({
        name_lowercase: data.name.toLowerCase(),
      });
    }
    return null;
  });
};

exports.processNewLead = createLowercaseNameTrigger("leads");
exports.processNewClient = createLowercaseNameTrigger("clients");
exports.processNewContact = createLowercaseNameTrigger("contacts");

exports.convertToClient = onCall(async (request) => {
  const {data, auth} = request;
  if (!auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be authenticated.");
  }
  const {leadId} = data;
  if (!leadId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing 'leadId'.");
  }

  const db = admin.firestore();
  const leadRef = db.collection("leads").doc(leadId);
  const leadDoc = await leadRef.get();

  if (!leadDoc.exists) {
    throw new functions.https.HttpsError("not-found", "Lead not found.");
  }
  const leadData = leadDoc.data();

  if (leadData.status === "Converted") {
    throw new functions.https.HttpsError("failed-precondition", "Lead already converted.");
  }

  const clientData = {
    name: leadData.name,
    email: leadData.email,
    phone: leadData.phone,
    dob: leadData.dob || null,
    userId: leadData.userId,
    teamId: leadData.teamId,
    unitId: leadData.unitId,
    branchId: leadData.branchId,
    regionId: leadData.regionId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    convertedFromLead: leadId,
  };

  try {
    const clientRef = await db.collection("clients").add(clientData);
    await leadRef.update({status: "Converted", convertedToClientId: clientRef.id});
    return {result: `Successfully converted lead to client with ID: ${clientRef.id}`};
  } catch (error) {
    console.error("Error converting lead to client:", error);
    throw new functions.https.HttpsError("internal", "Could not convert lead to client.", error);
  }
});

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
    policies: "policyNumber",
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

exports.getAdminDashboardData = onCall(async (request) => {
  const { auth } = request;
  if (!auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be authenticated.");
  }
  
  const claims = auth.token;
  if (claims.role !== "super_admin" && claims.role !== "admin") {
    throw new functions.https.HttpsError("permission-denied", "You must be an admin to call this function.");
  }

  const db = admin.firestore();
  const collectionsToFetch = [
    "leads", "clients", "activities",
    "contacts", "users", "teams",
    "units", "branches", "policies",
  ];
  
  const data = {};
  
  for (const collectionName of collectionsToFetch) {
    try {
      const snapshot = await db.collection(collectionName).get();
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      
      if (collectionName === "users") {
        data["allUsers"] = docs;
      } else {
        data[collectionName] = docs;
      }
    } catch (error) {
      if (collectionName === "users") {
        data["allUsers"] = [];
      } else {
        data[collectionName] = [];
      }
    }
  }
  
  return data;
});

exports.createOrgUnit = onCall(async (request) => {
    const { data, auth } = request;
    if (!auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be authenticated.");
    }
  
    const claims = auth.token;
    const managementRoles = ['super_admin', 'admin', 'regional_manager', 'branch_manager', 'unit_manager'];
    
    if (!managementRoles.includes(claims.role)) {
      throw new functions.https.HttpsError("permission-denied", "Insufficient permissions to create organizational units.");
    }
  
    const { name, type, parentId } = data;
    
    if (!name || !type) {
      throw new functions.https.HttpsError("invalid-argument", "Name and type are required.");
    }
  
    const validTypes = ['region', 'branch', 'unit', 'team'];
    if (!validTypes.includes(type)) {
      throw new functions.https.HttpsError("invalid-argument", "Invalid organizational unit type.");
    }
  
    try {
      const orgData = {
        name,
        type,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: auth.uid,
      };
  
      // Add parent relationship if provided
      if (parentId) {
        switch (type) {
          case 'branch':
            orgData.regionId = parentId;
            break;
          case 'unit':
            orgData.branchId = parentId;
            break;
          case 'team':
            orgData.unitId = parentId;
            break;
        }
      }
  
      const docRef = await admin.firestore().collection(`${type}s`).add(orgData);
      return { result: `${type} created successfully`, id: docRef.id };
    } catch (error) {
      console.error("Error creating organizational unit:", error);
      throw new functions.https.HttpsError("internal", "Failed to create organizational unit.", error);
    }
  });
  
  // Assign users to organizational units
  exports.assignUserToOrgUnit = onCall(async (request) => {
    const { data, auth } = request;
    if (!auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be authenticated.");
    }
  
    const claims = auth.token;
    const managementRoles = ['super_admin', 'admin', 'regional_manager', 'branch_manager', 'unit_manager'];
    
    if (!managementRoles.includes(claims.role)) {
      throw new functions.https.HttpsError("permission-denied", "Insufficient permissions to assign users.");
    }
  
    const { userId, orgAssignments } = data;
    
    if (!userId || !orgAssignments) {
      throw new functions.https.HttpsError("invalid-argument", "User ID and organizational assignments are required.");
    }
  
    try {
      const updateData = {
        ...orgAssignments,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: auth.uid,
      };
  
      await admin.firestore().collection("users").doc(userId).update(updateData);
      await setCustomUserClaims(userId); // Update custom claims
      
      return { result: "User assigned successfully" };
    } catch (error) {
      console.error("Error assigning user to organizational unit:", error);
      throw new functions.https.HttpsError("internal", "Failed to assign user.", error);
    }
  });
  
  // Get organizational hierarchy
  exports.getOrgHierarchy = onCall(async (request) => {
    const { auth } = request;
    if (!auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be authenticated.");
    }
  
    try {
      const collections = ['regions', 'branches', 'units', 'teams'];
      const hierarchy = {};
      
      for (const collection of collections) {
        const snapshot = await admin.firestore().collection(collection).get();
        hierarchy[collection] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      
      return hierarchy;
    } catch (error) {
      console.error("Error getting organizational hierarchy:", error);
      throw new functions.https.HttpsError("internal", "Failed to get organizational hierarchy.", error);
    }
  });

// Export leaderboard and notification functions
exports.scheduledLeaderboardUpdate = leaderboard.scheduledLeaderboardUpdate;
exports.activityNotifications = notifications.activityNotifications;

// Export troubleshooting functions
exports.forceRefreshClaims = troubleshoot.forceRefreshClaims;
exports.debugAdminDashboard = troubleshoot.debugAdminDashboard;
