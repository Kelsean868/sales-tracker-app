
const admin = require("firebase-admin");

// Initialize admin SDK
admin.initializeApp({
  projectId: "sales-tracker-v2-b378d",
});

const db = admin.firestore();

const seedDatabase = async () => {
  console.log("Starting to seed database...");

  // Get the first user to associate data with
  const usersSnapshot = await db.collection("users").limit(1).get();
  if (usersSnapshot.empty) {
    console.error("Error: No users found in the database. Please create a user before seeding data.");
    return;
  }
  const sampleUser = usersSnapshot.docs[0].data();
  const userId = usersSnapshot.docs[0].id;
  console.log(`Found user: ${sampleUser.name} (${userId}). Assigning new data to this user.`);

  const orgIds = {
    userId: userId,
    teamId: sampleUser.teamId || null,
    unitId: sampleUser.unitId || null,
    branchId: sampleUser.branchId || null,
    regionId: sampleUser.regionId || null,
  };

  const leads = [
    { name: "John Doe Lead", email: "john.lead@example.com", phone: "123-456-7890", status: "New", ...orgIds, createdAt: new Date() },
    { name: "Jane Smith Lead", email: "jane.lead@example.com", phone: "234-567-8901", status: "Contacted", ...orgIds, createdAt: new Date() },
    { name: "Peter Jones Lead", email: "peter.lead@example.com", phone: "345-678-9012", status: "Qualified", ...orgIds, createdAt: new Date() },
  ];

  const clients = [
    { name: "Acme Corp Client", email: "contact@acme.com", phone: "456-789-0123", ...orgIds, createdAt: new Date() },
  ];

  const activities = [
    { type: "Call", details: "Follow up with John Doe", relatedTo: "John Doe Lead", ...orgIds, timestamp: new Date() },
    { type: "Email", details: "Send proposal to Jane Smith", relatedTo: "Jane Smith Lead", ...orgIds, timestamp: new Date() },
  ];

  const batch = db.batch();

  console.log("Adding leads to batch...");
  leads.forEach(lead => {
    const docRef = db.collection("leads").doc();
    batch.set(docRef, lead);
  });

  console.log("Adding clients to batch...");
  clients.forEach(client => {
    const docRef = db.collection("clients").doc();
    batch.set(docRef, client);
  });

  console.log("Adding activities to batch...");
  activities.forEach(activity => {
    const docRef = db.collection("activities").doc();
    batch.set(docRef, activity);
  });

  try {
    await batch.commit();
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error committing batch:", error);
  }
};

seedDatabase();
