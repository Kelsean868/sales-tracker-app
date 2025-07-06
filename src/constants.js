import React from 'react';
import { TrendingUp, Zap, Target, Moon } from 'lucide-react';

export const firebaseConfig = {
  apiKey: "AIzaSyCf7Ev0nCJ-bZn23xLxKuWeUeZ9_082au4",
  authDomain: "sales-tracker-v2-b378d.firebaseapp.com",
  projectId: "sales-tracker-v2-b378d",
  storageBucket: "sales-tracker-v2-b378d.appspot.com",
  messagingSenderId: "859629513373",
  appId: "1:859629513373:web:348c574ab854c393ba0274",
  measurementId: "G-FCBL089CL3"
};

export const appId = 'default-sales-tracker';

export const USER_ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    REGIONAL_MANAGER: 'REGIONAL_MANAGER',
    BRANCH_MANAGER: 'BRANCH_MANAGER',
    UNIT_MANAGER: 'UNIT_MANAGER',
    TEAM_LEAD: 'TEAM_LEAD',
    SALES_PERSON: 'SALES_PERSON',
};

export const LEAD_STAGES = ['Prospect', 'Qualified', 'FFI Scheduled', 'Application Submitted', 'Closed'];
export const LEAD_SOURCES = ['Referral', 'Cold Call', 'Online Research', 'Walk-in', 'Canvassing', 'Orphan', 'Online Ad', 'Center of Influence'];
export const LEAD_TEMPERATURES = ['Hot', 'Warm', 'Cold'];
export const CONTACT_CATEGORIES = ['General', 'Center of Influence', 'Friend', 'Family', 'Colleague'];
export const POLICY_STATUSES = ['Active', 'Lapsed', 'Surrendered'];

export const LEAD_TEMPERATURE_COLORS = {
    Hot: 'bg-red-500',
    Warm: 'bg-yellow-500',
    Cold: 'bg-blue-500',
};
export const POLICY_STATUS_COLORS = {
    Active: 'bg-green-500',
    Lapsed: 'bg-yellow-500',
    Surrendered: 'bg-red-500',
};

export const activityTypes = {
    "Prospecting & Contacts": [{ name: "New Contact (Prospect/Suspect)", points: 1, summaryKey: 'telephoneContacts' }, { name: "New Contact (Existing Client)", points: 2, summaryKey: 'telephoneContacts' }, { name: "New Contact (Orphan)", points: 2, summaryKey: 'telephoneContacts' }, { name: "New Contact (Prequalified Referral)", points: 3, summaryKey: 'telephoneContacts' }, { name: "Appointment Booked (FFI, CI, Service)", points: 3, summaryKey: 'appointmentsBooked' }, { name: "Prospecting Email/Letter Sent", points: 1, summaryKey: 'prospectingActivities' }, { name: "Gained Prospect from Social Media/Email/Seminar", points: 2, summaryKey: 'prospectingActivities' }, { name: "Prospecting Call", points: 1, summaryKey: 'prospectingCalls' }, ],
    "Marketing & Events": [{ name: "Seminar Booked (>5 attendees)", points: 4, summaryKey: 'prospectingActivities' }, { name: "Conducted Seminar (>5 attendees, >5 prospects)", points: 10, summaryKey: 'prospectingActivities' }, { name: "Active Event Participation (>10 prospects)", points: 10, summaryKey: 'prospectingActivities' }, { name: "Post Marketing/Sales Material on Social Media", points: 5, summaryKey: 'prospectingActivities' }, ],
    "Sales Process": [{ name: "New Prequalified Referral Earned", points: 3, summaryKey: 'referrals' }, { name: "Existing Client Called for New Business", points: 5 }, { name: "Conducted Fact Find Interview (FFI)", points: 3, summaryKey: 'ffiConducted' }, { name: "Presented Solution/Proposal/Quote", points: 3, summaryKey: 'presentations' }, { name: "Conducted Closing Interview (>5 close attempts)", points: 5, summaryKey: 'ciConducted' }, { name: "Sale Closed (Apps filled, premium collected)", points: 5, requiresApi: true, summaryKey: 'sales' }, { name: "Booked Medical for New Prospect", points: 3 }, { name: "Submitted Completed Apps to CRO", points: 10, summaryKey: 'applications' }, { name: "Submitted All Outstanding Requirements (Policy Issued)", points: 15 }, ],
    "Client & Policy Management": [{ name: "Delivered New Policy (<30 days)", points: 5, summaryKey: 'serviceActivities' }, { name: "Submitted Salary Deductions/ACH", points: 6, summaryKey: 'serviceActivities' }, { name: "Submitted Service Review Form (Orphan)", points: 5, summaryKey: 'serviceActivities' }, { name: "Completed Annual Review (New Fact-Finder)", points: 5, summaryKey: 'serviceActivities' }, { name: "Upsell/Conversion/Premium Increase", points: 6, summaryKey: 'serviceActivities' }, { name: "Submitted Client Service Forms (<48 hrs)", points: 3, summaryKey: 'serviceActivities' }, { name: "Conserved a Policy (Prevented Surrender/Lapse)", points: 10, summaryKey: 'serviceActivities' }, { name: "Reinstated a Lapsed Policy", points: 10, summaryKey: 'serviceActivities' }, { name: "Paid Outstanding Premiums to Prevent Lapse", points: 5, summaryKey: 'serviceActivities' }, ],
    "Professional Development": [{ name: "Attended Insurance/Sales Training", points: 6 }, ],
};
export const bonusChecks = (completedActivities) => {
    const bonuses = [];
    const contactCount = completedActivities.filter(act => act.category === "Prospecting & Contacts").reduce((sum, act) => sum + (act.count || 1), 0);
    if (contactCount >= 15) bonuses.push({ name: "Contacted 15+ People", points: 10 });
    const ffiCount = completedActivities.filter(act => act.type === "Conducted Fact Find Interview (FFI)").reduce((sum, act) => sum + (act.count || 1), 0);
    const ciCount = completedActivities.filter(act => act.type === "Conducted Closing Interview (>5 close attempts)").reduce((sum, act) => sum + (act.count || 1), 0);
    if (ffiCount >= 3 && ciCount >= 2) bonuses.push({ name: "Conducted 3+ FFI & 2+ CI", points: 25 });
    if (completedActivities.some(act => act.type === "Sale Closed (Apps filled, premium collected)" && act.api >= 12000)) bonuses.push({ name: "Closed Client with >$12k API", points: 10 });
    return bonuses;
};
export const getAchievement = (points) => {
    if (points >= 70) return { level: "Superhuman", icon: <TrendingUp className="w-8 h-8 text-cyan-400" /> };
    if (points >= 60) return { level: "Excellent", icon: <Zap className="w-8 h-8 text-green-400" /> };
    if (points >= 50) return { level: "Good", icon: <Target className="w-8 h-8 text-blue-400" /> };
    return { level: "Unproductive", icon: <Moon className="w-8 h-8 text-gray-500" /> };
};
