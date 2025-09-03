// Helper functions for mission orders
import type { MissionOrder } from './MissionOrderTypes';

// Status text helpers
export const getStatusText = (status: MissionOrder['status']) => {
  switch (status) {
    case 'pending_finance_review': return 'Pending Finance Review';
    case 'finance_approved': return 'Finance Approved';
    case 'pending_approval': return 'Pending Approval';
    case 'waiting_owner_approval': return 'Waiting Owner Approval';
    case 'pending_client_approval': return 'Pending Client Approval';
    case 'approved': return 'Approved';
    case 'rejected': return 'Rejected';
    case 'owner_rejected': return 'Owner Rejected';
    case 'client_rejected': return 'Client Rejected';
    case 'pending_execution': return 'Pending Execution';
    case 'in_progress': return 'In Progress';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    case 'pending_validation': return 'Pending Validation';
    case 'validated': return 'Validated';
    case 'pending_date_modification': return 'Date Modification Pending';
    default: return status;
  }
};

export const getStatusColor = (status: MissionOrder['status']) => {
  switch (status) {
    case 'pending_finance_review': return 'bg-purple-100 text-purple-800';
    case 'finance_approved': return 'bg-green-100 text-green-800';
    case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
    case 'waiting_owner_approval': return 'bg-orange-100 text-orange-800';
    case 'pending_client_approval': return 'bg-blue-100 text-blue-800';
    case 'approved': return 'bg-green-100 text-green-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    case 'owner_rejected': return 'bg-red-100 text-red-800';
    case 'client_rejected': return 'bg-red-100 text-red-800';
    case 'pending_execution': return 'bg-cyan-100 text-cyan-800';
    case 'in_progress': return 'bg-indigo-100 text-indigo-800';
    case 'completed': return 'bg-blue-100 text-blue-800';
    case 'cancelled': return 'bg-gray-100 text-gray-800';
    case 'pending_validation': return 'bg-orange-100 text-orange-800';
    case 'validated': return 'bg-green-100 text-green-800';
    case 'pending_date_modification': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getMissionTypeText = (type: MissionOrder['type']) => {
  switch (type) {
    case 'extra_day': return 'Extra Day';
    case 'freelance': return 'Freelance Mission';
    case 'service': return 'Service';
    default: return type;
  }
};

// Helper to determine if mission is in crew-actionable state
export const isMissionActionableForCrew = (status: MissionOrder['status']) => {
  return [
    'pending_execution',
    'in_progress',
    'pending_validation',
    'pending_date_modification'
  ].includes(status);
};

// Helper to determine if mission requires crew attention
export const doesMissionRequireCrewAttention = (status: MissionOrder['status']) => {
  return [
    'pending_execution',
    'pending_validation',
    'pending_date_modification'
  ].includes(status);
};

// Helper to get status priority for sorting (higher number = higher priority)
export const getStatusPriority = (status: MissionOrder['status']) => {
  switch (status) {
    case 'pending_execution': return 10; // Highest priority for crew
    case 'pending_validation': return 9;
    case 'pending_date_modification': return 8;
    case 'in_progress': return 7;
    case 'pending_client_approval': return 6;
    case 'waiting_owner_approval': return 5;
    case 'pending_approval': return 4;
    case 'finance_approved': return 3;
    case 'pending_finance_review': return 2;
    case 'approved': return 1;
    case 'validated': return 1;
    case 'completed': return 0;
    case 'cancelled': return 0;
    case 'rejected': return 0;
    case 'owner_rejected': return 0;
    case 'client_rejected': return 0;
    default: return 0;
  }
};

// Helper to format mission duration
export const formatMissionDuration = (startDate: string, endDate: string) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return '1 day';
  }
  return `${diffDays} days`;
};

// Helper to check if mission is starting soon (within 48 hours)
export const isMissionStartingSoon = (startDate: string) => {
  const start = new Date(startDate);
  const now = new Date();
  const diffTime = start.getTime() - now.getTime();
  const diffHours = diffTime / (1000 * 60 * 60);
  
  return diffHours > 0 && diffHours <= 48;
};