// This file centralizes constants used throughout the application.

// User Roles
export const USER_ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    REGIONAL_MANAGER: 'regional_manager',
    BRANCH_MANAGER: 'branch_manager',
    UNIT_MANAGER: 'unit_manager',
    TEAM_LEAD: 'team_lead',
    SALES_PERSON: 'sales_person',
};

// --- NEW: Detailed Activity Points System ---
export const ACTIVITY_POINTS_SYSTEM = {
  "Prospecting & Contacts": [
    { "name": "New Contact (Prospect/Suspect)", "points": 1, "summaryKey": "new_contacts" },
    { "name": "New Contact (Existing Client)", "points": 2, "summaryKey": "new_contacts" },
    { "name": "New Contact (Orphan)", "points": 2, "summaryKey": "new_contacts" },
    { "name": "New Contact (Prequalified Referral)", "points": 3, "summaryKey": "new_contacts" },
    { "name": "Appointment Booked (FFI, CI, Service)", "points": 3, "summaryKey": "appointments_booked" },
    { "name": "Prospecting Email/Letter Sent", "points": 1, "summaryKey": "prospecting_outreach" },
    { "name": "Gained Prospect from Social Media/Email/Seminar", "points": 2, "summaryKey": "new_prospects" },
    { "name": "Prospecting Call (Old)", "points": 1, "summaryKey": "prospecting_calls_old" },
    { "name": "Prospecting Call (New)", "points": 1, "summaryKey": "prospecting_calls_new" }
  ],
  "Marketing & Events": [
    { "name": "Seminar Booked (>5 attendees)", "points": 4, "summaryKey": "seminars_booked" },
    { "name": "Conducted Seminar (>5 attendees, >5 prospects)", "points": 10, "summaryKey": "seminars_conducted" },
    { "name": "Active Event Participation (>10 prospects)", "points": 10, "summaryKey": "events_participated" },
    { "name": "Post Marketing/Sales Material on Social Media", "points": 5, "summaryKey": "social_media_posts" }
  ],
  "Sales Process": [
    { "name": "New Prequalified Referral Earned", "points": 3, "summaryKey": "referrals_earned" },
    { "name": "Existing Client Called for New Business", "points": 5, "summaryKey": "client_outreach" },
    { "name": "Conducted Fact Find Interview (FFI)", "points": 3, "summaryKey": "ffi_conducted" },
    { "name": "Presented Solution/Proposal/Quote", "points": 3, "summaryKey": "solutions_presented" },
    { "name": "Conducted Closing Interview (>5 close attempts)", "points": 5, "summaryKey": "closing_interviews_conducted" },
    { "name": "Sale Closed (Apps filled, premium collected)", "points": 5, "summaryKey": "sales_closed" },
    { "name": "Booked Medical for New Prospect", "points": 3, "summaryKey": "medicals_booked" },
    { "name": "Submitted Completed Apps to CRO", "points": 10, "summaryKey": "apps_submitted" },
    { "name": "Submitted All Outstanding Requirements (Policy Issued)", "points": 15, "summaryKey": "requirements_submitted" }
  ],
  "Client & Policy Management": [
    { "name": "Delivered New Policy (<30 days)", "points": 5, "summaryKey": "policies_delivered" },
    { "name": "Submitted Salary Deductions/ACH", "points": 6, "summaryKey": "payment_forms_submitted" },
    { "name": "Submitted Service Review Form (Orphan)", "points": 5, "summaryKey": "service_reviews_submitted" },
    { "name": "Completed Annual Review (New Fact-Finder)", "points": 5, "summaryKey": "annual_reviews_completed" },
    { "name": "Upsell/Conversion/Premium Increase", "points": 6, "summaryKey": "upsells" },
    { "name": "Submitted Client Service Forms (<48 hrs)", "points": 3, "summaryKey": "service_forms_submitted" },
    { "name": "Conserved a Policy (Prevented Surrender/Lapse)", "points": 10, "summaryKey": "policies_conserved" },
    { "name": "Reinstated a Lapsed Policy", "points": 10, "summaryKey": "policies_reinstated" },
    { "name": "Paid Outstanding Premiums to Prevent Lapse", "points": 5, "summaryKey": "premiums_paid" }
  ],
  "Training": [
    { "name": "Attended Insurance/Sales Training", "points": 6, "summaryKey": "training_attended" }
  ]
};

export const REPORT_SUMMARY_CATEGORIES = {
    "Prospecting Activities (other than calls)": [
        { "label": "Prospecting emails sent", "key": "prospecting_outreach" },
        { "label": "Seminars Booked", "key": "seminars_booked" },
        { "label": "Seminars Conducted", "key": "seminars_conducted" },
        { "label": "Trade shows Booked", "key": "trade_shows_booked" },
        { "label": "Trade shows Attended", "key": "trade_shows_attended" },
        { "label": "Social Media Posts", "key": "social_media_posts" },
        { "label": "Time spent Cold Canvasing", "key": "time_spent_cold_canvasing", "isTime": true },
        { "label": "Time spent Online Prospecting", "key": "time_spent_online_prospecting", "isTime": true },
    ],
    "Prospecting Calls": [
        { "label": "Total", "key": "prospecting_calls" },
        { "label": "Old", "key": "prospecting_calls_old" },
        { "label": "New", "key": "prospecting_calls_new" },
    ],
    "Appointments": [
        { "label": "Booked", "key": "appointments_booked" },
        { "label": "Cancelled/Postponed", "key": "appointments_cancelled" },
        { "label": "Conducted", "key": "appointments_conducted" },
    ],
    "FFI (Fact Find Interviews)": [
        { "label": "Booked", "key": "ffi_booked" },
        { "label": "Conducted", "key": "ffi_conducted" },
    ],
    "Solutions": [
        { "label": "Presented", "key": "solutions_presented" },
    ],
    "Closing Interviews": [
        { "label": "Booked", "key": "closing_interviews_booked" },
        { "label": "Conducted", "key": "closing_interviews_conducted" },
        { "label": "Postponed/Cancelled", "key": "closing_interviews_cancelled" },
    ],
    "Sales": [
        { "label": "Potential Sales where Prospect/s agree to buy (in the future months)", "key": "sales_agreed_future" },
        { "label": "Potential Sales where Prospect/s agree to buy (within the current month)", "key": "sales_agreed_now" },
        { "label": "API Potential of new sales (no cash collected)", "key": "api_potential_no_cash" },
        { "label": "API of New sales (cash collected)", "key": "api_cash_collected", "isCurrency": true },
        { "label": "Sales made with cash collected", "key": "sales_with_cash" },
        { "label": "Number of Applications", "key": "apps_submitted" },
        { "label": "Number of New Clients", "key": "new_clients" },
    ],
    "New Names": [
        { "label": "Referrals", "key": "referrals_earned" },
        { "label": "Names from Seminars Conducted", "key": "names_from_seminars" },
        { "label": "Names from Trade shows", "key": "names_from_trade_shows" },
        { "label": "Names from Cold Canvasing", "key": "names_from_cold_canvasing" },
        { "label": "Names from Online Prospecting", "key": "names_from_online_prospecting" },
        { "label": "Names from Social Media Posts", "key": "names_from_social_media" },
        { "label": "Names from Other", "key": "names_from_other" },
    ],
    "Servicing Activities": [
        { "label": "Premium Arrears Collected", "key": "premiums_paid" },
        { "label": "Reinstatements Completed", "key": "policies_reinstated" },
        { "label": "Orphans Adopted", "key": "service_reviews_submitted" },
        { "label": "Other", "key": "other_servicing_activities" },
    ],
    "Training": [
      { "label": "Attended Insurance/Sales Training", "key": "training_attended" }
    ]
};

// Lead Pipeline Stages
export const LEAD_STAGES = {
    NEW: 'New',
    CONTACTED: 'Contacted',
    QUALIFIED: 'Qualified',
    PROPOSAL: 'Proposal Sent',
    NEGOTIATION: 'Negotiation',
    CLOSED_WON: 'Closed Won',
    CLOSED_LOST: 'Closed Lost',
};

// Lead Temperature
export const LEAD_TEMPERATURES = {
    HOT: 'Hot',
    WARM: 'Warm',
    COLD: 'Cold',
};

// Colors for Lead Temperatures
export const LEAD_TEMPERATURE_COLORS = {
    [LEAD_TEMPERATURES.HOT]: 'bg-red-500',
    [LEAD_TEMPERATURES.WARM]: 'bg-yellow-500',
    [LEAD_TEMPERATURES.COLD]: 'bg-blue-500',
};

// Policy Statuses
export const POLICY_STATUSES = {
    ACTIVE: 'Active',
    LAPSED: 'Lapsed',
    CANCELLED: 'Cancelled',
    PENDING: 'Pending',
};

// Colors for Policy Statuses
export const POLICY_STATUS_COLORS = {
    [POLICY_STATUSES.ACTIVE]: 'bg-green-500',
    [POLICY_STATUSES.LAPSED]: 'bg-yellow-500',
    [POLICY_STATUSES.CANCELLED]: 'bg-red-500',
    [POLICY_STATUSES.PENDING]: 'bg-blue-500',
};
