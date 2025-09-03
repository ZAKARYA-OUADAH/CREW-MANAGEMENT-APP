import React from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Euro, Calendar, CreditCard } from 'lucide-react';
import { CURRENCIES } from './CostSimulationConstants';

interface ManualInputsProps {
  paymentMode: string;
  currency: string;
  perDiemEnabled: boolean;
  manualRates: {
    dailySalary: string;
    dailyPerDiem: string;
    monthlySalary: string;
    lumpSum: string;
  };
  onManualRatesChange: (rates: Partial<{ dailySalary: string; dailyPerDiem: string; monthlySalary: string; lumpSum: string }>) => void;
}

export default function ManualInputs({ 
  paymentMode, 
  currency, 
  perDiemEnabled, 
  manualRates, 
  onManualRatesChange 
}: ManualInputsProps) {
  if (paymentMode === 'daily') {
    return (
      <>
        <div className="space-y-2">
          <Label htmlFor="manual-salary" className="flex items-center space-x-2">
            <Euro className="h-4 w-4" />
            <span>Daily Salary ({CURRENCIES[currency as keyof typeof CURRENCIES]?.symbol})</span>
          </Label>
          <Input
            id="manual-salary"
            type="number"
            min="0"
            step="10"
            value={manualRates.dailySalary}
            onChange={(e) => onManualRatesChange({ dailySalary: e.target.value })}
            placeholder="e.g. 750"
          />
        </div>

        {perDiemEnabled && (
          <div className="space-y-2">
            <Label htmlFor="manual-perdiem" className="flex items-center space-x-2">
              <Euro className="h-4 w-4" />
              <span>Daily Per Diem ({CURRENCIES[currency as keyof typeof CURRENCIES]?.symbol})</span>
            </Label>
            <Input
              id="manual-perdiem"
              type="number"
              min="0"
              step="5"
              value={manualRates.dailyPerDiem}
              onChange={(e) => onManualRatesChange({ dailyPerDiem: e.target.value })}
              placeholder="e.g. 120"
            />
          </div>
        )}
      </>
    );
  } else if (paymentMode === 'monthly') {
    return (
      <>
        <div className="space-y-2">
          <Label htmlFor="manual-monthly-salary" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Monthly Salary ({CURRENCIES[currency as keyof typeof CURRENCIES]?.symbol})</span>
          </Label>
          <Input
            id="manual-monthly-salary"
            type="number"
            min="0"
            step="100"
            value={manualRates.monthlySalary}
            onChange={(e) => onManualRatesChange({ monthlySalary: e.target.value })}
            placeholder="e.g. 15000"
          />
        </div>

        {perDiemEnabled && (
          <div className="space-y-2">
            <Label htmlFor="manual-perdiem-monthly" className="flex items-center space-x-2">
              <Euro className="h-4 w-4" />
              <span>Daily Per Diem ({CURRENCIES[currency as keyof typeof CURRENCIES]?.symbol})</span>
            </Label>
            <Input
              id="manual-perdiem-monthly"
              type="number"
              min="0"
              step="5"
              value={manualRates.dailyPerDiem}
              onChange={(e) => onManualRatesChange({ dailyPerDiem: e.target.value })}
              placeholder="e.g. 120"
            />
          </div>
        )}
      </>
    );
  } else if (paymentMode === 'lump_sum') {
    return (
      <div className="space-y-2">
        <Label htmlFor="manual-lump-sum" className="flex items-center space-x-2">
          <CreditCard className="h-4 w-4" />
          <span>Total Lump Sum ({CURRENCIES[currency as keyof typeof CURRENCIES]?.symbol})</span>
        </Label>
        <Input
          id="manual-lump-sum"
          type="number"
          min="0"
          step="100"
          value={manualRates.lumpSum}
          onChange={(e) => onManualRatesChange({ lumpSum: e.target.value })}
          placeholder="e.g. 5000"
        />
      </div>
    );
  }

  return null;
}