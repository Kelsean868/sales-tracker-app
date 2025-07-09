const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require('firebase-admin');

const db = admin.firestore();

/**
 * Creates a notification in Firestore.
 * @param {string} userId The ID of the user to notify.
 * @param {string} title The title of the notification.
 * @param {string} body The body text of the notification.
 * @param {string} [link] A link to the relevant item in the app.
 */
const createNotification = (userId, title, body, link = '') => {
    if (!userId) {
        console.error('Cannot create notification without a userId.');
        return null;
    }
    return db.collection('notifications').add({
        userId,
        title,
        body,
        link,
        read: false,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
};

exports.activityNotifications = onDocumentCreated("activities/{activityId}", async (event) => {
    const snap = event.data;
    if (!snap) {
        console.log("No data associated with the event");
        return;
    }
    const activity = snap.data();
    const activityId = event.params.activityId;

    try {
        const userDoc = await db.collection('users').doc(activity.userId).get();
        if (!userDoc.exists) {
            console.log(`User ${activity.userId} not found for activity ${activityId}.`);
            return;
        }
        const user = { id: userDoc.id, ...userDoc.data() };

        // Notification for a newly scheduled task for the user
        if (activity.isScheduled && activity.scheduledTimestamp) {
            const scheduledDate = activity.scheduledTimestamp.toDate().toLocaleDateString();
            const title = 'New Task Scheduled';
            const body = `A new task "${activity.type}: ${activity.details}" is scheduled for ${scheduledDate}.`;
            const link = `/agenda?activity=${activityId}`;
            await createNotification(user.id, title, body, link);
        }

        // Notification for the manager when a policy is sold
        if (activity.type === 'policy_sold') {
            let managerId = null;
            // Simplified hierarchy: team lead -> unit manager -> branch manager
            if (user.teamId) {
                const teamDoc = await db.collection('teams').doc(user.teamId).get();
                if (teamDoc.exists) managerId = teamDoc.data().leadId;
            } else if (user.unitId) {
                 const unitDoc = await db.collection('units').doc(user.unitId).get();
                if (unitDoc.exists) managerId = unitDoc.data().managerId;
            } else if (user.branchId) {
                 const branchDoc = await db.collection('branches').doc(user.branchId).get();
                if (branchDoc.exists) managerId = branchDoc.data().managerId;
            }

            if (managerId && managerId !== user.id) {
                const title = `Policy Sold by ${user.name}`;
                const body = `${user.name} sold a policy, earning ${activity.points || 0} points.`;
                const link = `/reports?user=${user.id}`;
                await createNotification(managerId, title, body, link);
            }
        }
    } catch (error) {
        console.error(`Error in activityNotifications for activity ${activityId}:`, error);
    }
});