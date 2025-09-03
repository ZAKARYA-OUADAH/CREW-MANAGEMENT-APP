import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useNotifications } from './NotificationContext';
import { currencyConfig } from './ConfigurationService';
import { 
  DollarSign, 
  Percent, 
  Calculator, 
  Send, 
  AlertCircle, 
  FileText,
  Settings,
  TrendingUp,
  UserCheck
} from 'lucide-react';

interface FinanceBillingData {
  marginType: 'percentage' | 'fixed';
  marginPercentage: number;
  marginAmount: number;
  additionalFees: {
    name: string;
    amount: number;
  }[];
  billingNotes: string;
  invoiceTerms: string;
  paymentTerms: string;
}

interface FinanceBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mission: any;
  onFinanceApproval: (missionId: string, billingData: FinanceBillingData) => void;
  loading?: boolean;
}

export default function FinanceBillingModal({ 
  isOpen, 
  onClose, 
  mission, 
  onFinanceApproval, 
  loading = false 
}: FinanceBillingModalProps) {
  const { showToast } = useNotifications();

  const [billingData, setBillingData] = useState<FinanceBillingData>({
    marginType: 'percentage',
    marginPercentage: 20,
    marginAmount: 0,
    additionalFees: [],
    billingNotes: '',
    invoiceTerms: 'NET 30',
    paymentTerms: 'Payment due within 30 days of invoice date'
  });

  // Calculate the base cost from mission data
  const getBaseCost = () => {
    if (!mission?.emailData?.fees) return 0;
    return mission.emailData.fees.totalFees || 0;
  };

  const baseCost = getBaseCost();
  const currency = mission?.emailData?.fees?.currency || 'EUR';

  // Calculate margin amount based on type
  const calculateMargin = () => {
    if (billingData.marginType === 'percentage') {
      return (baseCost * billingData.marginPercentage) / 100;
    }
    return billingData.marginAmount;
  };

  // Calculate additional fees total
  const calculateAdditionalFees = () => {
    return billingData.additionalFees.reduce((total, fee) => total + fee.amount, 0);
  };

  // Calculate final total
  const calculateTotal = () => {
    return baseCost + calculateMargin() + calculateAdditionalFees();
  };

  const handleMarginTypeChange = (newType: 'percentage' | 'fixed') => {
    setBillingData(prev => ({
      ...prev,
      marginType: newType,
      // Clear the opposite field when switching
      ...(newType === 'percentage' ? { marginAmount: 0 } : { marginPercentage: 0 })
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    setBillingData(prev => ({ ...prev, [field]: value }));
  };

  const addAdditionalFee = () => {
    setBillingData(prev => ({
      ...prev,
      additionalFees: [...prev.additionalFees, { name: '', amount: 0 }]
    }));
  };

  const updateAdditionalFee = (index: number, field: 'name' | 'amount', value: string | number) => {
    setBillingData(prev => ({
      ...prev,
      additionalFees: prev.additionalFees.map((fee, i) => 
        i === index ? { ...fee, [field]: value } : fee
      )
    }));
  };

  const removeAdditionalFee = (index: number) => {
    setBillingData(prev => ({
      ...prev,
      additionalFees: prev.additionalFees.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    // Validation
    if (billingData.marginType === 'percentage' && billingData.marginPercentage < 0) {
      showToast('error', 'Validation Error', 'Margin percentage cannot be negative');
      return;
    }

    if (billingData.marginType === 'fixed' && billingData.marginAmount < 0) {
      showToast('error', 'Validation Error', 'Margin amount cannot be negative');
      return;
    }

    // Check if additional fees have names
    const hasUnnamedFees = billingData.additionalFees.some(fee => !fee.name.trim());
    if (hasUnnamedFees) {
      showToast('error', 'Validation Error', 'All additional fees must have a name');
      return;
    }

    onFinanceApproval(mission.id, billingData);
  };

  if (!mission) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            <span>Finance Review & Billing Setup</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mission Summary */}
          <Alert className="border-blue-200 bg-blue-50">
            <FileText className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <div className="text-blue-800 text-sm space-y-1">
                <p><strong>Mission:</strong> {mission.id} - {mission.crew?.name} ({mission.crew?.position})</p>
                <p><strong>Aircraft:</strong> {mission.aircraft?.immat} ({mission.aircraft?.type})</p>
                <p><strong>Client:</strong> {mission.emailData?.ownerEmail}</p>
                <p><strong>Duration:</strong> {mission.emailData?.fees?.duration || 0} days</p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Workflow info */}
          <Alert className="border-orange-200 bg-orange-50">
            <UserCheck className="h-4 w-4 text-orange-600" />
            <AlertDescription>
              <div className="text-orange-800 text-sm">
                <p><strong>Next Step:</strong> After finance approval, this mission will move to "Waiting Owner Approval" status for internal review before being sent to the client.</p>
              </div>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Billing Configuration */}
            <div className="space-y-6">
              {/* Base Cost Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Base Cost Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Daily Rate:</span>
                    <span>{currencyConfig[currency]?.symbol}{mission.emailData?.fees?.dailyRate?.toLocaleString() || 0}</span>
                  </div>
                  
                  {mission.emailData?.fees?.totalPerDiem > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Per Diem:</span>
                      <span>{currencyConfig[currency]?.symbol}{mission.emailData?.fees?.totalPerDiem?.toLocaleString() || 0}</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between font-medium">
                    <span>Base Total:</span>
                    <span>{currencyConfig[currency]?.symbol}{baseCost.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Margin Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Margin Configuration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Margin Type Selector */}
                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>Margin Type</span>
                    </Label>
                    <Select value={billingData.marginType} onValueChange={handleMarginTypeChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">
                          <div className="flex items-center space-x-2">
                            <Percent className="h-4 w-4" />
                            <span>Percentage (%)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="fixed">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4" />
                            <span>Fixed Amount ({currencyConfig[currency]?.symbol})</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Margin Value Input */}
                  {billingData.marginType === 'percentage' ? (
                    <div className="space-y-2">
                      <Label htmlFor="marginPercentage" className="flex items-center space-x-2">
                        <Percent className="h-4 w-4" />
                        <span>Margin Percentage (%)</span>
                      </Label>
                      <Input
                        id="marginPercentage"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={billingData.marginPercentage}
                        onChange={(e) => handleInputChange('marginPercentage', parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 20"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="marginAmount" className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4" />
                        <span>Fixed Margin Amount ({currencyConfig[currency]?.symbol})</span>
                      </Label>
                      <Input
                        id="marginAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={billingData.marginAmount}
                        onChange={(e) => handleInputChange('marginAmount', parseFloat(e.target.value) || 0)}
                        placeholder="e.g. 500"
                      />
                    </div>
                  )}

                  {/* Margin Preview */}
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Calculated margin:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {currencyConfig[currency]?.symbol}{calculateMargin().toLocaleString()}
                        </span>
                        <span className="text-gray-500">
                          ({billingData.marginType === 'percentage' ? `${billingData.marginPercentage}%` : 'Fixed'})
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Fees */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Additional Fees</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={addAdditionalFee}>
                      Add Fee
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {billingData.additionalFees.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No additional fees. Click "Add Fee" to include extra charges.
                    </p>
                  ) : (
                    billingData.additionalFees.map((fee, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          placeholder="Fee name (e.g., Handling Fee)"
                          value={fee.name}
                          onChange={(e) => updateAdditionalFee(index, 'name', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Amount"
                          value={fee.amount}
                          onChange={(e) => updateAdditionalFee(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-24"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeAdditionalFee(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Billing Details & Summary */}
            <div className="space-y-6">
              {/* Billing Notes & Terms */}
              <Card>
                <CardHeader>
                  <CardTitle>Billing Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingNotes">Billing Notes</Label>
                    <Textarea
                      id="billingNotes"
                      placeholder="Internal notes about this billing (visible to finance team only)..."
                      value={billingData.billingNotes}
                      onChange={(e) => handleInputChange('billingNotes', e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invoiceTerms">Invoice Terms</Label>
                    <Input
                      id="invoiceTerms"
                      placeholder="e.g., NET 30, NET 15"
                      value={billingData.invoiceTerms}
                      onChange={(e) => handleInputChange('invoiceTerms', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Payment Terms Description</Label>
                    <Textarea
                      id="paymentTerms"
                      placeholder="e.g., Payment due within 30 days of invoice date..."
                      value={billingData.paymentTerms}
                      onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Final Cost Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-800">Final Client Invoice</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Cost:</span>
                      <span>{currencyConfig[currency]?.symbol}{baseCost.toLocaleString()}</span>
                    </div>
                    
                    {calculateMargin() > 0 && (
                      <div className="flex justify-between text-blue-600">
                        <span>Margin ({billingData.marginType === 'percentage' ? `${billingData.marginPercentage}%` : 'Fixed'}):</span>
                        <span>{currencyConfig[currency]?.symbol}{calculateMargin().toLocaleString()}</span>
                      </div>
                    )}

                    {billingData.additionalFees.length > 0 && (
                      <>
                        {billingData.additionalFees.map((fee, index) => (
                          <div key={index} className="flex justify-between text-orange-600">
                            <span>{fee.name}:</span>
                            <span>{currencyConfig[currency]?.symbol}{fee.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between text-lg font-bold text-green-800">
                      <span>Total Client Price:</span>
                      <span>{currencyConfig[currency]?.symbol}{calculateTotal().toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Profit Margin Display */}
                  <div className="p-3 bg-green-50 rounded-lg text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 font-medium">Profit Margin:</span>
                      <div className="text-right">
                        <div className="text-green-800 font-bold">
                          {currencyConfig[currency]?.symbol}{(calculateMargin() + calculateAdditionalFees()).toLocaleString()}
                        </div>
                        <div className="text-xs text-green-600">
                          {((calculateMargin() + calculateAdditionalFees()) / baseCost * 100).toFixed(1)}% of base cost
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Approve & Send to Owner Review
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}