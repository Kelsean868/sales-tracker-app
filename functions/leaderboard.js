const {onSchedule} = require("firebase-functions/v2/scheduler");
const admin = require('firebase-admin');

// This function will be triggered on a schedule.
exports.scheduledLeaderboardUpdate = onSchedule("every 5 minutes", async (event) => {
    const firestore = admin.firestore();
    const now = new Date();

    // Get all users
    const usersSnap = await firestore.collection('users').get();
    const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calculate start of periods
    const dailyStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weeklyStart = new Date(now);
    weeklyStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    weeklyStart.setHours(0, 0, 0, 0);
    const monthlyStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const periods = {
        daily: dailyStart,
        weekly: weeklyStart,
        monthly: monthlyStart,
    };

    const leaderboardData = {};

    for (const user of users) {
        leaderboardData[user.id] = {
            userId: user.id,
            name: user.name,
            photoURL: user.photoURL || null,
            role: user.role || null,
            managerId: user.managerId || null,
            daily: 0,
            weekly: 0,
            monthly: 0
        };
    }

    // Query activities from the start of the month to cover all periods
    const activitiesSnap = await firestore.collection('activities').where('timestamp', '>=', monthlyStart).get();

    activitiesSnap.forEach(doc => {
        const activity = doc.data();
        if (leaderboardData[activity.userId] && activity.timestamp) {
            const activityDate = activity.timestamp.toDate();
            const points = activity.points || 0;
            
            if (activityDate >= periods.daily) {
                leaderboardData[activity.userId].daily += points;
            }
            if (activityDate >= periods.weekly) {
                leaderboardData[activity.userId].weekly += points;
            }
            // All queried activities are within the month
            leaderboardData[activity.userId].monthly += points;
        }
    });

    // Write aggregated data to the 'leaderboard' collection
    const batch = firestore.batch();
    Object.keys(leaderboardData).forEach(userId => {
        const userLeaderboardRef = firestore.collection('leaderboard').doc(userId);
        batch.set(userLeaderboardRef, leaderboardData[userId], { merge: true });
    });

    await batch.commit();
    console.log('Leaderboard aggregation complete.');
    return null;
});