// Constants for mission management
export const mockPayMatrix = [
  { position: 'Captain', aircraft: 'Citation CJ3', dailyRate: 850, perDiem: 120 },
  { position: 'First Officer', aircraft: 'Citation CJ3', dailyRate: 650, perDiem: 100 },
  { position: 'Flight Attendant', aircraft: 'Citation CJ3', dailyRate: 450, perDiem: 80 },
  { position: 'Captain', aircraft: 'Falcon 2000EX', dailyRate: 920, perDiem: 130 },
  { position: 'Flight Attendant', aircraft: 'Falcon 2000EX', dailyRate: 500, perDiem: 85 }
];

export const statusFilterOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'pending_finance_review', label: 'Pending Finance Review' },
  { value: 'finance_approved', label: 'Finance Approved' },
  { value: 'pending_approval', label: 'Pending Approval (Legacy)' },
  { value: 'waiting_owner_approval', label: 'Waiting Owner Approval' },
  { value: 'pending_client_approval', label: 'Pending Client Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'owner_rejected', label: 'Owner Rejected' },
  { value: 'client_rejected', label: 'Client Rejected' },
  { value: 'pending_validation', label: 'Pending Validation' },
  { value: 'validated', label: 'Validated' },
  { value: 'pending_date_modification', label: 'Date Modification Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

export const typeFilterOptions = [
  { value: 'all', label: 'All Types' },
  { value: 'extra_day', label: 'Extra Day' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'service', label: 'Service' }
];