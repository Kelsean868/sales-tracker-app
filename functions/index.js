const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {onCall} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");

admin.initializeApp();

// --- User Management Functions ---
exports.addUser = onCall(async (request) => {
  const {data, auth} = request;
  if (!auth) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }
  const callerUid = auth.uid;
  const userRecord = await admin.firestore().collection("users").doc(callerUid).get();
  if (!userRecord.exists || userRecord.data().role !== "super_admin") {
    throw new functions.https.HttpsError("permission-denied", "Only super admins can add new users.");
  }
  const {email, password, name, role, branch, unit} = data;
  try {
    const userAuth = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
    });
    await admin.firestore().collection("users").doc(userAuth.uid).set({
      name: name,
      email: email,
      role: role,
      branch: branch,
      unit: unit,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
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
  const callerUid = auth.uid;
  const userRecord = await admin.firestore().collection("users").doc(callerUid).get();
  if (!userRecord.exists || userRecord.data().role !== "super_admin") {
    throw new functions.https.HttpsError("permission-denied", "Only super admins can edit users.");
  }
  const {uid, name, role, branch, unit} = data;
  try {
    await admin.firestore().collection("users").doc(uid).update({
      name: name,
      role: role,
      branch: branch,
      unit: unit,
    });
    return {result: `User ${name} updated successfully.`};
  } catch (error) {
    console.error("Error updating user:", error);
    throw new functions.https.HttpsError("internal", "Error updating user.", error);
  }
});

// --- Goal Update Functions ---
exports.updateGoalOnActivityLog = onDocumentCreated("users/{userId}/activities/{activityId}", async (event) => {
  const snap = event.data;
  if (!snap) return;
  const activity = snap.data();
  const {userId, type, points = 0} = activity;
  if (!userId) return null;
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

exports.updateGoalOnLeadAdd = onDocumentCreated("users/{userId}/leads/{leadId}", async (event) => {
  const snap = event.data;
  if (!snap) return;
  const lead = snap.data();
  const userId = lead.userId;
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

exports.updateGoalOnPolicyAdd = onDocumentCreated("users/{userId}/policies/{policyId}", async (event) => {
  const snap = event.data;
  if (!snap) return;
  const policy = snap.data();
  const {agentId: userId, premium = 0} = policy;
  if (!userId) return null;
  const goalsRef = admin.firestore().collection("goals").where("userId", "==", userId).where("status", "==", "active");
  const goalsSnapshot = await goalsRef.get();
  if (goalsSnapshot.empty) return null;
  const batch = admin.firestore().batch();
  goalsSnapshot.forEach((doc) => {
    const progress = doc.data().progress || {};
    progress["policies"] = (progress["policies"] || 0) + 1;
    progress["premium"] = (progress["premium"] || 0) + premium;
    batch.update(doc.ref, {progress});
  });
  return batch.commit();
});

// --- Search Utility Functions ---
exports.processNewLead = onDocumentCreated("users/{userId}/leads/{leadId}", (event) => {
  const leadData = event.data.data();
  if (leadData && leadData.name) {
    return event.data.ref.update({
      name_lowercase: leadData.name.toLowerCase(),
    });
  }
  return null;
});

exports.processNewClient = onDocumentCreated("users/{userId}/clients/{clientId}", (event) => {
  const clientData = event.data.data();
  if (clientData && clientData.name) {
    return event.data.ref.update({
      name_lowercase: clientData.name.toLowerCase(),
    });
  }
  return null;
});

// --- Search Function ---
exports.universalSearch = onCall(async (request) => {
  const {data, auth} = request;
  if (!auth) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }
  const searchTerm = data.searchTerm.toLowerCase();
  if (!searchTerm || searchTerm.length < 2) {
    throw new functions.https.HttpsError("invalid-argument", "Search term must be at least 2 characters long.");
  }
  const uid = auth.uid;
  const userDoc = await admin.firestore().collection("users").doc(uid).get();
  if (!userDoc.exists) {
    throw new functions.https.HttpsError("not-found", "User not found.");
  }
  const userData = userDoc.data();
  const {role, unitId, branchId} = userData;
  const db = admin.firestore();
  const results = {
    leads: [],
    clients: [],
    policies: [],
  };
  const allLeadsSnapshot = await db.collectionGroup("leads").get();
  allLeadsSnapshot.forEach((doc) => {
    const lead = doc.data();
    if (lead.name_lowercase && lead.name_lowercase.startsWith(searchTerm)) {
      if (role === "super_admin" || role === "admin" ||
         (role === "branch_manager" && lead.branchId === branchId) ||
         (role === "unit_manager" && lead.unitId === unitId) ||
         (role === "sales_person" && lead.userId === uid)) {
        results.leads.push({id: doc.id, ...lead});
      }
    }
  });
  const allClientsSnapshot = await db.collectionGroup("clients").get();
  allClientsSnapshot.forEach((doc) => {
    const client = doc.data();
    if (client.name_lowercase && client.name_lowercase.startsWith(searchTerm)) {
      if (role === "super_admin" || role === "admin" ||
         (role === "branch_manager" && client.branchId === branchId) ||
         (role === "unit_manager" && client.unitId === unitId) ||
         (role === "sales_person" && client.userId === uid)) {
        results.clients.push({id: doc.id, ...client});
      }
    }
  });
  const allPoliciesSnapshot = await db.collectionGroup("policies").get();
  allPoliciesSnapshot.forEach((doc) => {
    const policy = doc.data();
    if (policy.policyNumber && policy.policyNumber.toLowerCase().startsWith(searchTerm)) {
      if (role === "super_admin" || role === "admin" ||
         (role === "branch_manager" && policy.branchId === branchId) ||
         (role === "unit_manager" && policy.unitId === unitId) ||
         (role === "sales_person" && policy.agentId === uid)) {
        results.policies.push({id: doc.id, ...policy});
      }
    }
  });
  return results;
});

// --- Admin Data Fetching Function ---
exports.getAdminDashboardData = onCall(async (request) => {
  const {auth} = request;
  if (!auth) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }
  const userDoc = await admin.firestore().collection("users").doc(auth.uid).get();
  if (!userDoc.exists || userDoc.data().role !== "super_admin") {
    throw new functions.https.HttpsError("permission-denied", "You must be a super admin to call this function.");
  }
  const db = admin.firestore();
  const collectionsToFetch = ["leads", "clients", "activities", "contacts", "users", "teams", "units", "branches"];
  const promises = collectionsToFetch.map((col) => db.collectionGroup(col).get());
  const [
    leadsSnapshot,
    clientsSnapshot,
    activitiesSnapshot,
    contactsSnapshot,
    usersSnapshot,
    teamsSnapshot,
    unitsSnapshot,
    branchesSnapshot,
  ] = await Promise.all(promises);
  const extractData = (snapshot) => snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
  return {
    leads: extractData(leadsSnapshot),
    clients: extractData(clientsSnapshot),
    activities: extractData(activitiesSnapshot),
    contacts: extractData(contactsSnapshot),
    allUsers: extractData(usersSnapshot),
    teams: extractData(teamsSnapshot),
    units: extractData(unitsSnapshot),
    branches: extractData(branchesSnapshot),
  };
});
