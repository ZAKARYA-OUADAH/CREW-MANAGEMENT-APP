// Aircraft types and their coefficients
export const AIRCRAFT_TYPES = {
  'light_jet': { name: 'Light Jet', coefficient: 1.0 },
  'mid_jet': { name: 'Mid-Size Jet', coefficient: 1.2 },
  'heavy_jet': { name: 'Heavy Jet', coefficient: 1.5 },
  'ultra_long': { name: 'Ultra Long Range', coefficient: 1.8 },
  'helicopter': { name: 'Helicopter', coefficient: 0.9 }
};

// Positions and their base daily salaries
export const POSITIONS = {
  'captain': { name: 'Captain', baseSalary: 800, perDiem: 150, monthlySalary: 16000 },
  'first_officer': { name: 'First Officer', baseSalary: 600, perDiem: 120, monthlySalary: 12000 },
  'flight_engineer': { name: 'Flight Engineer', baseSalary: 500, perDiem: 100, monthlySalary: 10000 },
  'cabin_crew': { name: 'Cabin Crew', baseSalary: 350, perDiem: 80, monthlySalary: 7000 },
  'purser': { name: 'Chief Flight Attendant', baseSalary: 450, perDiem: 100, monthlySalary: 9000 }
};

// Payment modes
export const PAYMENT_MODES = {
  'daily': { name: 'Daily', description: 'Calculation based on daily rate' },
  'monthly': { name: 'Monthly', description: 'Calculation based on prorated monthly salary' },
  'lump_sum': { name: 'Lump Sum', description: 'Fixed total amount for the entire mission' }
};

// Currency options
export const CURRENCIES = {
  'EUR': { symbol: '€', name: 'Euro' },
  'USD': { symbol: '$', name: 'US Dollar' },
  'GBP': { symbol: '£', name: 'British Pound' }
};