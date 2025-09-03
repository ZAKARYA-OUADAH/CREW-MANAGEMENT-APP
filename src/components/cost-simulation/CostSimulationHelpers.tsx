import { AIRCRAFT_TYPES, POSITIONS } from './CostSimulationConstants';
import { ConfigurationService } from '../ConfigurationService';

// Helper function to ensure no negative values
export const ensurePositive = (value: string | number): number => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num) || num < 0 ? 0 : num;
};

export const calculateCosts = (
  formData: { aircraft: string; position: string },
  duration: string,
  paymentMode: string,
  perDiemEnabled: boolean,
  manualMode: boolean,
  manualRates: {
    dailySalary: string;
    dailyPerDiem: string;
    monthlySalary: string;
    lumpSum: string;
  },
  marginEnabled: boolean,
  marginType: 'percentage' | 'fixed', // Nouveau paramètre
  marginPercentage: string,
  marginAmount: string // Nouveau paramètre
) => {
  if (!duration) return null;

  const days = parseInt(duration);
  if (isNaN(days) || days <= 0) return null;

  let dailySalary = 0;
  let dailyPerDiem = 0;
  let totalSalary = 0;
  let totalPerDiem = 0;

  if (manualMode) {
    // Manual mode - use entered values according to payment mode with validation
    if (paymentMode === 'daily') {
      dailySalary = ensurePositive(manualRates.dailySalary);
      dailyPerDiem = perDiemEnabled ? ensurePositive(manualRates.dailyPerDiem) : 0;
      totalSalary = dailySalary * days;
      totalPerDiem = dailyPerDiem * days;
    } else if (paymentMode === 'monthly') {
      const monthlySalary = ensurePositive(manualRates.monthlySalary);
      dailySalary = monthlySalary / 30; // Approximate conversion
      dailyPerDiem = perDiemEnabled ? ensurePositive(manualRates.dailyPerDiem) : 0;
      totalSalary = (monthlySalary / 30) * days;
      totalPerDiem = dailyPerDiem * days;
    } else if (paymentMode === 'lump_sum') {
      const lumpSum = ensurePositive(manualRates.lumpSum);
      totalSalary = lumpSum;
      totalPerDiem = 0;
      dailySalary = lumpSum / days;
      dailyPerDiem = 0;
    }
  } else {
    // Automatic mode - calculate according to scales
    if (!formData.aircraft || !formData.position) return null;

    const aircraftType = ConfigurationService.getAircraftByImmat(formData.aircraft)?.type || 'light_jet';
    const aircraftData = AIRCRAFT_TYPES[aircraftType as keyof typeof AIRCRAFT_TYPES] || AIRCRAFT_TYPES.light_jet;
    const positionData = POSITIONS[formData.position.toLowerCase().replace(' ', '_') as keyof typeof POSITIONS];

    if (!positionData) return null;

    if (paymentMode === 'daily') {
      dailySalary = positionData.baseSalary * aircraftData.coefficient;
      dailyPerDiem = perDiemEnabled ? positionData.perDiem : 0;
      totalSalary = dailySalary * days;
      totalPerDiem = dailyPerDiem * days;
    } else if (paymentMode === 'monthly') {
      const monthlySalary = positionData.monthlySalary * aircraftData.coefficient;
      dailySalary = monthlySalary / 30; // Approximate conversion
      dailyPerDiem = perDiemEnabled ? positionData.perDiem : 0;
      totalSalary = (monthlySalary / 30) * days;
      totalPerDiem = dailyPerDiem * days;
    } else if (paymentMode === 'lump_sum') {
      // For automatic lump sum, use daily salary * duration as base
      const baseLumpSum = (positionData.baseSalary * aircraftData.coefficient) * days;
      totalSalary = baseLumpSum;
      totalPerDiem = 0;
      dailySalary = baseLumpSum / days;
      dailyPerDiem = 0;
    }
  }

  const totalCost = totalSalary + totalPerDiem;

  // Calculate margin based on type
  let calculatedMarginAmount = 0;
  let totalWithMargin = totalCost;
  let profitAmount = 0;

  if (marginEnabled) {
    if (marginType === 'percentage' && marginPercentage) {
      const margin = ensurePositive(marginPercentage);
      const clampedMargin = Math.min(margin, 100); // Ensure margin doesn't exceed 100%
      calculatedMarginAmount = (totalCost * clampedMargin) / 100;
    } else if (marginType === 'fixed' && marginAmount) {
      calculatedMarginAmount = ensurePositive(marginAmount);
    }
    
    totalWithMargin = totalCost + calculatedMarginAmount;
    profitAmount = calculatedMarginAmount;
  }

  return {
    dailySalary: Math.max(0, dailySalary),
    totalSalary: Math.max(0, totalSalary),
    dailyPerDiem: Math.max(0, dailyPerDiem),
    totalPerDiem: Math.max(0, totalPerDiem),
    totalCost: Math.max(0, totalCost),
    paymentMode,
    isManual: manualMode,
    marginAmount: Math.max(0, calculatedMarginAmount),
    totalWithMargin: Math.max(0, totalWithMargin),
    profitAmount: Math.max(0, profitAmount)
  };
};