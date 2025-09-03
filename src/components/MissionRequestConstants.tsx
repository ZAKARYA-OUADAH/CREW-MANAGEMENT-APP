// Constants for MissionRequestDetail component

export const salaryMatrix = {
  'Captain': {
    'Citation CJ3': { daily: 850, monthly: 18500, currency: 'EUR' },
    'King Air 350': { daily: 750, monthly: 16500, currency: 'EUR' },
    'Phenom 300': { daily: 900, monthly: 19500, currency: 'EUR' }
  },
  'First Officer': {
    'Citation CJ3': { daily: 650, monthly: 14500, currency: 'EUR' },
    'King Air 350': { daily: 550, monthly: 12500, currency: 'EUR' },
    'Phenom 300': { daily: 700, monthly: 15500, currency: 'EUR' }
  },
  'Flight Attendant': {
    'Citation CJ3': { daily: 450, monthly: 10500, currency: 'EUR' },
    'King Air 350': { daily: 400, monthly: 9500, currency: 'EUR' },
    'Phenom 300': { daily: 500, monthly: 11500, currency: 'EUR' }
  }
};

export const perDiemMatrix = {
  'Captain': { amount: 120, currency: 'EUR' },
  'First Officer': { amount: 100, currency: 'EUR' },
  'Flight Attendant': { amount: 80, currency: 'EUR' }
};

export const currencies = [
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'CHF', label: 'CHF - Swiss Franc' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' }
];

export const getRequestTypeTitle = (requestType: string) => {
  switch (requestType) {
    case 'extra_day': return 'Internal Extra Day Assignment';
    case 'freelance': return 'Freelance Mission Contract';
    case 'service': return 'Service Request';
    default: return 'Mission Request';
  }
};

export const getRequestTypeColor = (requestType: string) => {
  switch (requestType) {
    case 'extra_day': return 'bg-blue-100 text-blue-800';
    case 'freelance': return 'bg-green-100 text-green-800';
    case 'service': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};