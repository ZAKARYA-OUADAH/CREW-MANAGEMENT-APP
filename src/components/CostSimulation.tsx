import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { 
  Calculator, 
  Plane, 
  User, 
  Clock, 
  Euro, 
  Settings, 
  CreditCard, 
  TrendingUp, 
  DollarSign,
  Send,
  FileText,
  CheckCircle,
  ArrowRight,
  Save,
  Percent
} from 'lucide-react';
import { useNotifications } from './NotificationContext';
import { ConfigurationService, aircraftConfig as aircraftData } from './ConfigurationService';

// Import refactored modules
import { AIRCRAFT_TYPES, POSITIONS, PAYMENT_MODES, CURRENCIES } from './cost-simulation/CostSimulationConstants';
import { CostEstimation, CostCalculationResults } from './cost-simulation/CostSimulationTypes';
import { calculateCosts } from './cost-simulation/CostSimulationHelpers';
import ManualInputs from './cost-simulation/ManualInputs';
import EstimationList from './cost-simulation/EstimationList';
import CrewSelectionModal from './CrewSelectionModal';

export default function CostSimulation() {
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  // Mission Request compatible fields
  const [formData, setFormData] = useState({
    aircraft: '',
    position: '',
    startDate: '',
    endDate: '',
    notes: ''
  });

  // Cost simulation specific fields
  const [duration, setDuration] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<string>('daily');
  const [currency, setCurrency] = useState<string>('EUR');
  const [perDiemEnabled, setPerDiemEnabled] = useState(true);
  const [manualMode, setManualMode] = useState(false);
  const [manualRates, setManualRates] = useState({
    dailySalary: '',
    dailyPerDiem: '',
    monthlySalary: '',
    lumpSum: ''
  });
  
  // Margin functionality - Updated with type support
  const [marginEnabled, setMarginEnabled] = useState(false);
  const [marginType, setMarginType] = useState<'percentage' | 'fixed'>('percentage');
  const [marginPercentage, setMarginPercentage] = useState<string>('20');
  const [marginAmount, setMarginAmount] = useState<string>('');

  // Saved estimations
  const [savedEstimations, setSavedEstimations] = useState<CostEstimation[]>([]);
  const [currentEstimation, setCurrentEstimation] = useState<CostEstimation | null>(null);

  const [results, setResults] = useState<CostCalculationResults | null>(null);
  
  // Crew selection modal state
  const [showCrewSelection, setShowCrewSelection] = useState(false);

  // Constants for localStorage key
  const ESTIMATIONS_KEY = 'cost_simulation_saved_estimations';

  // Load saved estimations from localStorage on component mount
  useEffect(() => {
    try {
      const savedEstimationsData = localStorage.getItem(ESTIMATIONS_KEY);
      if (savedEstimationsData) {
        const estimations = JSON.parse(savedEstimationsData);
        // Migration: Add default values for new fields if they don't exist
        const migratedEstimations = estimations.map((est: any) => ({
          ...est,
          marginType: est.marginType || 'percentage',
          marginAmount: est.marginAmount || 0
        }));
        setSavedEstimations(migratedEstimations);
      }
    } catch (error) {
      console.error('[CostSimulation] Error loading saved estimations:', error);
    }
  }, []);

  // Save estimations to localStorage when they change
  useEffect(() => {
    if (savedEstimations.length > 0) {
      localStorage.setItem(ESTIMATIONS_KEY, JSON.stringify(savedEstimations));
    }
  }, [savedEstimations]);

  // Auto-calculate duration when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setDuration(diffDays.toString());
    }
  }, [formData.startDate, formData.endDate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const performCalculation = () => {
    const result = calculateCosts(
      formData,
      duration,
      paymentMode,
      perDiemEnabled,
      manualMode,
      manualRates,
      marginEnabled,
      marginType,
      marginPercentage,
      marginAmount
    );
    setResults(result);
  };

  useEffect(() => {
    performCalculation();
  }, [formData.aircraft, formData.position, duration, paymentMode, manualMode, manualRates, marginEnabled, marginType, marginPercentage, marginAmount, perDiemEnabled]);

  const saveDraftEstimation = () => {
    if (!results) {
      showToast('error', 'Error', 'Please calculate costs first');
      return;
    }

    // Check if we're updating an existing draft or creating a new one
    const isUpdatingExistingDraft = currentEstimation && currentEstimation.status === 'draft';

    const estimation: CostEstimation = {
      id: isUpdatingExistingDraft ? currentEstimation.id : Date.now().toString(),
      status: 'draft',
      aircraft: formData.aircraft,
      position: formData.position,
      startDate: formData.startDate,
      endDate: formData.endDate,
      duration: parseInt(duration) || 0,
      paymentMode,
      currency,
      perDiemEnabled,
      notes: formData.notes,
      manualMode,
      manualRates: {
        dailySalary: manualRates.dailySalary ? parseFloat(manualRates.dailySalary) : undefined,
        dailyPerDiem: manualRates.dailyPerDiem ? parseFloat(manualRates.dailyPerDiem) : undefined,
        monthlySalary: manualRates.monthlySalary ? parseFloat(manualRates.monthlySalary) : undefined,
        lumpSum: manualRates.lumpSum ? parseFloat(manualRates.lumpSum) : undefined,
      },
      marginEnabled,
      marginType,
      marginPercentage: parseFloat(marginPercentage) || 0,
      marginAmount: parseFloat(marginAmount) || 0,
      results,
      createdAt: isUpdatingExistingDraft ? currentEstimation.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (isUpdatingExistingDraft) {
      // Update existing draft
      setSavedEstimations(prev => 
        prev.map(est => est.id === currentEstimation.id ? estimation : est)
      );
      setCurrentEstimation(estimation);
      showToast('success', 'Updated', 'Draft estimation updated successfully and form cleared');
    } else {
      // Create new draft
      setSavedEstimations(prev => [...prev, estimation]);
      setCurrentEstimation(estimation);
      showToast('success', 'Saved', 'New draft estimation created and form cleared');
    }
    
    // Clear the form after saving as draft
    resetForm();
  };

  const finalizeEstimation = () => {
    if (!currentEstimation) {
      saveDraftEstimation();
      return;
    }

    const finalizedEstimation = {
      ...currentEstimation,
      status: 'finalized' as const,
      updatedAt: new Date().toISOString()
    };

    setSavedEstimations(prev => 
      prev.map(est => est.id === currentEstimation.id ? finalizedEstimation : est)
    );
    setCurrentEstimation(finalizedEstimation);
    showToast('success', 'Success', 'Cost estimation finalized');
  };

  const createMissionFromEstimation = () => {
    if (!currentEstimation || !currentEstimation.results) {
      showToast('error', 'Error', 'Please save estimation first');
      return;
    }

    // Open crew selection modal instead of navigating directly
    setShowCrewSelection(true);
  };

  const loadEstimation = (estimation: CostEstimation) => {
    setFormData({
      aircraft: estimation.aircraft,
      position: estimation.position,
      startDate: estimation.startDate,
      endDate: estimation.endDate,
      notes: estimation.notes
    });
    setDuration(estimation.duration.toString());
    setPaymentMode(estimation.paymentMode);
    setCurrency(estimation.currency);
    setPerDiemEnabled(estimation.perDiemEnabled);
    setManualMode(estimation.manualMode);
    setManualRates({
      dailySalary: estimation.manualRates.dailySalary?.toString() || '',
      dailyPerDiem: estimation.manualRates.dailyPerDiem?.toString() || '',
      monthlySalary: estimation.manualRates.monthlySalary?.toString() || '',
      lumpSum: estimation.manualRates.lumpSum?.toString() || ''
    });
    setMarginEnabled(estimation.marginEnabled);
    setMarginType(estimation.marginType || 'percentage'); // Migration support
    setMarginPercentage(estimation.marginPercentage.toString());
    setMarginAmount(estimation.marginAmount?.toString() || '');
    setResults(estimation.results);
    setCurrentEstimation(estimation);
    
    const actionText = estimation.status === 'draft' ? 'Draft loaded for editing' : 'Estimation loaded';
    showToast('success', 'Success', actionText);
  };

  const duplicateAsNewEstimation = () => {
    if (!currentEstimation) return;
    
    // Keep the form data but clear the current estimation reference
    setCurrentEstimation(null);
    showToast('info', 'Ready to Create', 'Form data preserved. Save as Draft will create a new estimation.');
  };

  const deleteEstimation = (estimationId: string) => {
    setSavedEstimations(prev => {
      const updated = prev.filter(est => est.id !== estimationId);
      // Update localStorage immediately
      localStorage.setItem(ESTIMATIONS_KEY, JSON.stringify(updated));
      return updated;
    });
    
    if (currentEstimation?.id === estimationId) {
      setCurrentEstimation(null);
    }
    showToast('success', 'Success', 'Estimation deleted');
  };

  const resetForm = () => {
    // If working on an existing draft, ask for confirmation
    if (currentEstimation && currentEstimation.status === 'draft') {
      const confirmed = window.confirm(
        'You are currently editing a draft estimation. Are you sure you want to reset the form? This will clear all your changes.'
      );
      if (!confirmed) {
        return;
      }
    }

    setFormData({ aircraft: '', position: '', startDate: '', endDate: '', notes: '' });
    setDuration('');
    setPaymentMode('daily');
    setCurrency('EUR');
    setPerDiemEnabled(true);
    setManualMode(false);
    setManualRates({ dailySalary: '', dailyPerDiem: '', monthlySalary: '', lumpSum: '' });
    setMarginEnabled(false);
    setMarginType('percentage');
    setMarginPercentage('20');
    setMarginAmount('');
    setResults(null);
    setCurrentEstimation(null);
    
    showToast('success', 'Form Reset', 'All fields have been cleared');
  };

  const handleCrewSelected = (selectedCrew: any) => {
    if (!currentEstimation || !currentEstimation.results) {
      showToast('error', 'Error', 'No estimation data available');
      return;
    }

    // Close the modal first
    setShowCrewSelection(false);

    // Navigate to mission request with pre-filled data and selected crew
    navigate('/mission-request/new', {
      state: {
        fromCostEstimation: true,
        estimationData: currentEstimation,
        crew: selectedCrew,
        requestType: 'freelance', // Default to freelance, can be adjusted based on crew type
        missionData: {
          aircraft: currentEstimation.aircraft,
          position: currentEstimation.position,
          startDate: currentEstimation.startDate,
          endDate: currentEstimation.endDate,
          notes: currentEstimation.notes,
          duration: currentEstimation.duration,
          paymentMode: currentEstimation.paymentMode,
          currency: currentEstimation.currency,
          estimatedCost: currentEstimation.results.totalWithMargin || currentEstimation.results.totalCost
        }
      }
    });
  };

  const switchToManualMode = () => {
    if (results && !results.isManual) {
      if (paymentMode === 'daily') {
        setManualRates(prev => ({
          ...prev,
          dailySalary: Math.max(0, results.dailySalary).toString(),
          dailyPerDiem: Math.max(0, results.dailyPerDiem).toString()
        }));
      } else if (paymentMode === 'monthly') {
        setManualRates(prev => ({
          ...prev,
          monthlySalary: Math.max(0, results.dailySalary * 30).toString(),
          dailyPerDiem: Math.max(0, results.dailyPerDiem).toString()
        }));
      } else if (paymentMode === 'lump_sum') {
        setManualRates(prev => ({
          ...prev,
          lumpSum: Math.max(0, results.totalSalary).toString()
        }));
      }
    }
    setManualMode(true);
  };

  // Function to handle margin type change
  const handleMarginTypeChange = (newType: 'percentage' | 'fixed') => {
    setMarginType(newType);
    // Clear the opposite field when switching types
    if (newType === 'percentage') {
      setMarginAmount('');
    } else {
      setMarginPercentage('');
    }
  };

  const selectedAircraft = ConfigurationService.getAircraftByImmat(formData.aircraft);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Calculator className="h-8 w-8 text-primary" />
          <div>
            <h1>Cost Estimation & Mission Planning</h1>
            <p className="text-muted-foreground">
              Estimate crew costs and create missions seamlessly
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {currentEstimation && (
            <Badge variant={currentEstimation.status === 'draft' ? 'secondary' : 'default'}>
              {currentEstimation.status === 'draft' ? (
                <>
                  <FileText className="h-3 w-3 mr-1" />
                  Draft
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Finalized
                </>
              )}
            </Badge>
          )}
        </div>
      </div>

      {/* Saved Estimations */}
      <EstimationList
        savedEstimations={savedEstimations}
        currentEstimation={currentEstimation}
        onLoadEstimation={loadEstimation}
        onDeleteEstimation={deleteEstimation}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mission Details & Cost Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Mission Details & Cost Parameters</span>
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="manual-mode" className="text-sm font-normal">
                  Manual mode
                </Label>
                <Switch
                  id="manual-mode"
                  checked={manualMode}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      switchToManualMode();
                    } else {
                      setManualMode(false);
                      setManualRates({ dailySalary: '', dailyPerDiem: '', monthlySalary: '', lumpSum: '' });
                    }
                  }}
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Aircraft Registration */}
            <div className="space-y-2">
              <Label htmlFor="aircraft">Aircraft Registration</Label>
              <Select value={formData.aircraft} onValueChange={(value) => handleInputChange('aircraft', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an aircraft" />
                </SelectTrigger>
                <SelectContent>
                  {aircraftData.map(aircraft => (
                    <SelectItem key={aircraft.id} value={aircraft.immat}>
                      <div className="flex items-center space-x-2">
                        <span>{aircraft.immat}</span>
                        <span className="text-xs text-gray-500">({aircraft.type})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAircraft && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  <Plane className="h-4 w-4" />
                  <span>{selectedAircraft.type}</span>
                </div>
              )}
            </div>

            {/* Position Required */}
            <div className="space-y-2">
              <Label htmlFor="position">Position Required</Label>
              <Select value={formData.position} onValueChange={(value) => handleInputChange('position', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Captain">Captain</SelectItem>
                  <SelectItem value="First Officer">First Officer</SelectItem>
                  <SelectItem value="Flight Attendant">Flight Attendant</SelectItem>
                  <SelectItem value="Senior Flight Attendant">Senior Flight Attendant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mission Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  min={formData.startDate || undefined}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                />
              </div>
            </div>

            {/* Duration (auto-calculated) */}
            <div className="space-y-2">
              <Label htmlFor="duration" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Duration (days)</span>
              </Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Auto-calculated from dates"
              />
            </div>

            {/* Payment Configuration */}
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment-mode" className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Payment Mode</span>
                </Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a payment mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_MODES).map(([key, data]) => (
                      <SelectItem key={key} value={key}>
                        {data.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CURRENCIES).map(([key, data]) => (
                      <SelectItem key={key} value={key}>
                        {data.symbol} {data.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Per Diem Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Euro className="h-4 w-4" />
                <Label htmlFor="per-diem-enabled">Include Per Diem</Label>
              </div>
              <Switch
                id="per-diem-enabled"
                checked={perDiemEnabled}
                onCheckedChange={setPerDiemEnabled}
              />
            </div>

            {/* Manual Mode Inputs */}
            {manualMode && (
              <>
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-start space-x-2">
                    <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Manual Mode Enabled
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        Enter {paymentMode === 'daily' ? 'daily' : paymentMode === 'monthly' ? 'monthly' : 'lump sum'} rates directly.
                      </p>
                    </div>
                  </div>
                </div>

                <ManualInputs
                  paymentMode={paymentMode}
                  currency={currency}
                  perDiemEnabled={perDiemEnabled}
                  manualRates={manualRates}
                  onManualRatesChange={(rates) => setManualRates(prev => ({ ...prev, ...rates }))}
                />
              </>
            )}

            {/* Margin section - Updated with type selector */}
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <Label htmlFor="margin-enabled">Client Billing with Margin</Label>
                </div>
                <Switch
                  id="margin-enabled"
                  checked={marginEnabled}
                  onCheckedChange={setMarginEnabled}
                />
              </div>

              {marginEnabled && (
                <div className="space-y-4">
                  {/* Margin Type Selector */}
                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>Margin Type</span>
                    </Label>
                    <Select value={marginType} onValueChange={handleMarginTypeChange}>
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
                            <span>Fixed Amount ({CURRENCIES[currency as keyof typeof CURRENCIES]?.symbol})</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Margin Value Input */}
                  {marginType === 'percentage' ? (
                    <div className="space-y-2">
                      <Label htmlFor="margin-percentage" className="flex items-center space-x-2">
                        <Percent className="h-4 w-4" />
                        <span>Margin Percentage (%)</span>
                      </Label>
                      <Input
                        id="margin-percentage"
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={marginPercentage}
                        onChange={(e) => setMarginPercentage(e.target.value)}
                        placeholder="e.g. 20"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="margin-amount" className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4" />
                        <span>Fixed Margin Amount ({CURRENCIES[currency as keyof typeof CURRENCIES]?.symbol})</span>
                      </Label>
                      <Input
                        id="margin-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={marginAmount}
                        onChange={(e) => setMarginAmount(e.target.value)}
                        placeholder={`e.g. 500`}
                      />
                    </div>
                  )}

                  {/* Margin calculation preview */}
                  {results && results.totalCost > 0 && (
                    <div className="p-3 bg-gray-50 rounded-lg text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Current margin:</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {CURRENCIES[currency as keyof typeof CURRENCIES]?.symbol}
                            {(results.marginAmount || 0).toLocaleString()}
                          </span>
                          <span className="text-gray-500">
                            ({marginType === 'percentage' ? `${marginPercentage}%` : 'Fixed'})
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Special requirements or instructions..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </div>

            {/* Working on existing estimation indicator */}
            {currentEstimation && currentEstimation.status === 'draft' && (
              <div className="flex items-center space-x-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200">
                <FileText className="h-4 w-4 text-amber-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Editing Draft Estimation
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Changes will update the existing draft
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex space-x-2 pt-4">
              <Button onClick={performCalculation} className="flex-1">
                <Calculator className="h-4 w-4 mr-2" />
                Calculate
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Euro className="h-5 w-5" />
              <span>Cost Estimate</span>
              {results?.isManual && (
                <Badge variant="secondary" className="ml-2">
                  Manual
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results ? (
              <div className="space-y-6">
                {/* Base Cost Breakdown */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-600">Daily Salary</span>
                    <span className="font-medium">
                      {CURRENCIES[currency as keyof typeof CURRENCIES]?.symbol}
                      {results.dailySalary.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-600">Total Salary ({duration} days)</span>
                    <span className="font-medium">
                      {CURRENCIES[currency as keyof typeof CURRENCIES]?.symbol}
                      {results.totalSalary.toLocaleString()}
                    </span>
                  </div>

                  {perDiemEnabled && results.totalPerDiem > 0 && (
                    <>
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-gray-600">Daily Per Diem</span>
                        <span className="font-medium">
                          {CURRENCIES[currency as keyof typeof CURRENCIES]?.symbol}
                          {results.dailyPerDiem.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center py-2 border-b">
                        <span className="text-sm text-gray-600">Total Per Diem ({duration} days)</span>
                        <span className="font-medium">
                          {CURRENCIES[currency as keyof typeof CURRENCIES]?.symbol}
                          {results.totalPerDiem.toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between items-center py-3 border-b-2 border-gray-300">
                    <span className="font-medium">Base Total Cost</span>
                    <span className="font-bold text-lg">
                      {CURRENCIES[currency as keyof typeof CURRENCIES]?.symbol}
                      {results.totalCost.toLocaleString()}
                    </span>
                  </div>

                  {/* Margin Information */}
                  {marginEnabled && results.marginAmount && results.marginAmount > 0 && (
                    <>
                      <div className="flex justify-between items-center py-2 border-b bg-blue-50 px-3 rounded">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-blue-700">
                            Margin ({marginType === 'percentage' ? `${marginPercentage}%` : 'Fixed'})
                          </span>
                        </div>
                        <span className="font-medium text-blue-700">
                          {CURRENCIES[currency as keyof typeof CURRENCIES]?.symbol}
                          {results.marginAmount.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-3 border-b-2 border-green-500 bg-green-50 px-3 rounded">
                        <span className="font-bold text-green-800">Client Total (with Margin)</span>
                        <span className="font-bold text-xl text-green-800">
                          {CURRENCIES[currency as keyof typeof CURRENCIES]?.symbol}
                          {(results.totalWithMargin || results.totalCost).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Action Buttons for Saving */}
                <div className="flex flex-col space-y-2 pt-4">
                  <Button 
                    onClick={saveDraftEstimation} 
                    variant="outline"
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {currentEstimation && currentEstimation.status === 'draft' ? 'Update Draft' : 'Save as Draft'}
                  </Button>
                  
                  {currentEstimation && (
                    <>
                      <Button 
                        onClick={finalizeEstimation}
                        variant="default"
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Finalize Estimation
                      </Button>
                      
                      <Button 
                        onClick={createMissionFromEstimation}
                        variant="default"
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Create Mission
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Calculator className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Enter mission details to calculate costs</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Crew Selection Modal */}
      <CrewSelectionModal
        isOpen={showCrewSelection}
        onClose={() => setShowCrewSelection(false)}
        onCrewSelected={handleCrewSelected}
        missionData={{
          aircraft: formData.aircraft,
          position: formData.position,
          startDate: formData.startDate,
          endDate: formData.endDate
        }}
      />
    </div>
  );
}