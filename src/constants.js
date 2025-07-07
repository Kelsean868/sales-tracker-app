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

// Correctly named and exported constant for Activity Types
export const ACTIVITY_TYPES = {
    NOTE: 'Note',
    CALL: 'Call',
    MEETING: 'Meeting',
    LUNCH: 'Lunch',
    FFI: 'FFI',
    API: 'API',
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
