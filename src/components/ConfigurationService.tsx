// Centralized configuration service for the application
// This service manages all configuration data including aircraft, pricing, currencies, and email templates

export interface Aircraft {
  id: string;
  immat: string;
  type: string;
  manufacturer?: string;
  category?: string;
  maxPassengers?: number;
  range?: number;
  status?: string;
}

export interface PricingMatrix {
  [position: string]: {
    [aircraftType: string]: {
      daily: number;
      monthly: number;
      currency: string;
    };
  };
}

export interface PerDiemMatrix {
  [position: string]: {
    amount: number;
    currency: string;
  };
}

export interface Currency {
  value: string;
  label: string;
  symbol: string;
}

export interface CompanySettings {
  name: string;
  defaultCurrency: string;
  defaultPerDiem: number;
  timezone: string;
  defaultOwnerEmail: string;
  marginPercent: number;
}

// Aircraft configuration - SYNCHRONIZED with database
export const aircraftConfig: Aircraft[] = [
  { 
    id: 'aircraft-001', 
    immat: 'F-HCTA', 
    type: 'Citation CJ3+',
    manufacturer: 'Cessna',
    category: 'Business Jet',
    maxPassengers: 8,
    range: 2040,
    status: 'available'
  },
  { 
    id: 'aircraft-002', 
    immat: 'F-HCTB', 
    type: 'King Air 350',
    manufacturer: 'Beechcraft', 
    category: 'Turboprop',
    maxPassengers: 9,
    range: 1806,
    status: 'available'
  },
  { 
    id: 'aircraft-003', 
    immat: 'F-HCTC', 
    type: 'Phenom 300',
    manufacturer: 'Embraer',
    category: 'Light Jet',
    maxPassengers: 7,
    range: 1971,
    status: 'maintenance'
  },
  // Legacy aircraft for compatibility
  { id: 'AC004', immat: 'F-HDEF', type: 'Citation CJ3' },
  { id: 'AC005', immat: 'F-HGHJ', type: 'King Air 350' }
];

// Pricing matrix - Updated with correct aircraft types
export const pricingMatrix: PricingMatrix = {
  'Captain': {
    'Citation CJ3+': { daily: 850, monthly: 18500, currency: 'EUR' },
    'Citation CJ3': { daily: 850, monthly: 18500, currency: 'EUR' },
    'King Air 350': { daily: 750, monthly: 16500, currency: 'EUR' },
    'Phenom 300': { daily: 900, monthly: 19500, currency: 'EUR' }
  },
  'First Officer': {
    'Citation CJ3+': { daily: 650, monthly: 14500, currency: 'EUR' },
    'Citation CJ3': { daily: 650, monthly: 14500, currency: 'EUR' },
    'King Air 350': { daily: 550, monthly: 12500, currency: 'EUR' },
    'Phenom 300': { daily: 700, monthly: 15500, currency: 'EUR' }
  },
  'Flight Attendant': {
    'Citation CJ3+': { daily: 450, monthly: 10500, currency: 'EUR' },
    'Citation CJ3': { daily: 450, monthly: 10500, currency: 'EUR' },
    'King Air 350': { daily: 400, monthly: 9500, currency: 'EUR' },
    'Phenom 300': { daily: 500, monthly: 11500, currency: 'EUR' }
  },
  'Senior Flight Attendant': {
    'Citation CJ3+': { daily: 550, monthly: 12500, currency: 'EUR' },
    'Citation CJ3': { daily: 550, monthly: 12500, currency: 'EUR' },
    'King Air 350': { daily: 500, monthly: 11500, currency: 'EUR' },
    'Phenom 300': { daily: 600, monthly: 13500, currency: 'EUR' }
  }
};

// Per diem matrix
export const perDiemMatrix: PerDiemMatrix = {
  'Captain': { amount: 120, currency: 'EUR' },
  'First Officer': { amount: 100, currency: 'EUR' },
  'Flight Attendant': { amount: 80, currency: 'EUR' },
  'Senior Flight Attendant': { amount: 90, currency: 'EUR' }
};

// Supported currencies
export const currencyConfig: Currency[] = [
  { value: 'EUR', label: 'EUR - Euro', symbol: '€' },
  { value: 'USD', label: 'USD - US Dollar', symbol: '$' },
  { value: 'GBP', label: 'GBP - British Pound', symbol: '£' },
  { value: 'CHF', label: 'CHF - Swiss Franc', symbol: 'CHF' },
  { value: 'CAD', label: 'CAD - Canadian Dollar', symbol: 'C$' }
];

// Company settings
export const companySettings: CompanySettings = {
  name: 'CrewTech Aviation',
  defaultCurrency: 'EUR',
  defaultPerDiem: 100,
  timezone: 'Europe/Paris',
  defaultOwnerEmail: 'operations@crewtech.fr',
  marginPercent: 20
};

// Position configurations
export const positionConfig = [
  'Captain',
  'First Officer',
  'Flight Attendant',
  'Senior Flight Attendant'
];

// Request type configurations
export const requestTypeConfig = {
  'extra_day': {
    title: 'Internal Extra Day Assignment',
    color: 'bg-blue-100 text-blue-800',
    description: 'Additional day assignment for internal crew member'
  },
  'freelance': {
    title: 'Freelance Mission Contract',
    color: 'bg-green-100 text-green-800',
    description: 'Mission contract for freelance crew member'
  },
  'service': {
    title: 'Service Request',
    color: 'bg-purple-100 text-purple-800',
    description: 'Service-based mission request'
  }
};

// Utility functions
export class ConfigurationService {
  // Aircraft utilities
  static getAircraftById(id: string): Aircraft | undefined {
    return aircraftConfig.find(ac => ac.id === id);
  }

  static getAircraftByImmat(immat: string): Aircraft | undefined {
    return aircraftConfig.find(ac => ac.immat === immat);
  }

  static getAvailableAircraft(): Aircraft[] {
    return aircraftConfig.filter(ac => ac.status !== 'maintenance');
  }

  // Pricing utilities
  static getSalaryRate(position: string, aircraftType: string, type: 'daily' | 'monthly' = 'daily'): number {
    const positionRates = pricingMatrix[position];
    if (!positionRates) return 0;
    
    const aircraftRates = positionRates[aircraftType];
    if (!aircraftRates) return 0;
    
    return aircraftRates[type] || 0;
  }

  static getPerDiem(position: string): number {
    const perDiem = perDiemMatrix[position];
    return perDiem ? perDiem.amount : 0;
  }

  static getCurrencySymbol(currencyCode: string): string {
    const currency = currencyConfig.find(c => c.value === currencyCode);
    return currency ? currency.symbol : currencyCode;
  }

  // Email template generation
  static generateMissionEmailTemplate(data: {
    missionId: string;
    crewName: string;
    aircraft: Aircraft;
    startDate: string;
    endDate: string;
    requestType: string;
  }): { subject: string; message: string } {
    const requestInfo = requestTypeConfig[data.requestType] || requestTypeConfig['freelance'];
    
    const subject = `Mission Order ${data.missionId} - Ready for Approval`;
    
    const message = `Dear Sir/Madam,

Please find attached the mission order ${data.missionId} for your review and approval.

Mission Details:
- Crew: ${data.crewName}
- Aircraft: ${data.aircraft.immat} (${data.aircraft.type})
- Period: ${data.startDate || 'TBD'} to ${data.endDate || 'TBD'}
- Type: ${requestInfo.title}

The mission has been prepared with calculated fees and is ready for your final authorization.

Best regards,
${companySettings.name} Flight Operations Team`;

    return { subject, message };
  }

  // Request type utilities
  static getRequestTypeTitle(requestType: string): string {
    const config = requestTypeConfig[requestType];
    return config ? config.title : 'Mission Request';
  }

  static getRequestTypeColor(requestType: string): string {
    const config = requestTypeConfig[requestType];
    return config ? config.color : 'bg-gray-100 text-gray-800';
  }

  // Settings utilities
  static getDefaultOwnerEmail(): string {
    return companySettings.defaultOwnerEmail;
  }

  static getDefaultCurrency(): string {
    return companySettings.defaultCurrency;
  }

  static getDefaultMarginPercent(): number {
    return companySettings.marginPercent;
  }

  // Validation utilities
  static isValidPosition(position: string): boolean {
    return positionConfig.includes(position);
  }

  static isValidCurrency(currency: string): boolean {
    return currencyConfig.some(c => c.value === currency);
  }

  static isValidAircraftType(aircraftType: string): boolean {
    return aircraftConfig.some(ac => ac.type === aircraftType);
  }
}

// Export legacy constants for backward compatibility
export const salaryMatrix = pricingMatrix;
export const currencies = currencyConfig;

// Export commonly used functions
export const getRequestTypeTitle = ConfigurationService.getRequestTypeTitle;
export const getRequestTypeColor = ConfigurationService.getRequestTypeColor;

// Export aircraft data for backward compatibility
export const aircraftData = aircraftConfig;