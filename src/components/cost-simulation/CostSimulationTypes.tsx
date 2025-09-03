export interface CostEstimation {
  id: string;
  status: 'draft' | 'finalized';
  aircraft: string;
  position: string;
  startDate: string;
  endDate: string;
  duration: number;
  paymentMode: string;
  currency: string;
  perDiemEnabled: boolean;
  notes: string;
  manualMode: boolean;
  manualRates: {
    dailySalary?: number;
    dailyPerDiem?: number;
    monthlySalary?: number;
    lumpSum?: number;
  };
  marginEnabled: boolean;
  marginType: 'percentage' | 'fixed'; // Nouveau champ pour type de marge
  marginPercentage: number; // Utilisé quand marginType = 'percentage'
  marginAmount: number; // Utilisé quand marginType = 'fixed'
  results: {
    dailySalary: number;
    totalSalary: number;
    dailyPerDiem: number;
    totalPerDiem: number;
    totalCost: number;
    marginAmount?: number;
    totalWithMargin?: number;
    profitAmount?: number;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CostCalculationResults {
  dailySalary: number;
  totalSalary: number;
  dailyPerDiem: number;
  totalPerDiem: number;
  totalCost: number;
  paymentMode: string;
  isManual: boolean;
  marginAmount?: number;
  totalWithMargin?: number;
  profitAmount?: number;
}