import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { useNotifications } from './NotificationContext';
import { getCrewMemberById } from './CrewDataService';
import { createMissionOrder } from './MissionOrderService';
import { 
  ConfigurationService,
  pricingMatrix as salaryMatrix, 
  perDiemMatrix, 
  currencyConfig,
  getRequestTypeTitle,
  getRequestTypeColor,
  companySettings
} from './ConfigurationService';
import { 
  getMissingFields, 
  validateForm, 
  createMissionData 
} from './MissionRequestHelpers';
import MissionRequestCrewSection from './MissionRequestCrewSection';
import { aircraftConfig as aircraftData } from './ConfigurationService';
import { PDFGenerator } from './PDFGenerator';
import { 
  ArrowLeft,
  Plane, 
  Calendar,
  DollarSign, 
  Lock, 
  Unlock, 
  AlertCircle,
  CheckCircle,
  Hash,
  Settings,
  Mail,
  FileText,
  Send,
  Calculator,
  Euro,
  User
} from 'lucide-react';

// Simplified interface for basic mission creation
interface BasicMissionData {
  ownerEmail: string;
  subject: string;
  message: string;
  estimatedCost?: number;
  currency: string;
  duration: number;
}

export default function MissionRequestDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification, showToast } = useNotifications();
  
  // Get data from navigation state - includes cost estimation data
  const { 
    crew: initialCrew, 
    requestType, 
    selectedFlights = [], 
    missionData = {},
    fromCostEstimation = false,
    estimationData = null
  } = location.state || {};
  
  console.log('MissionRequestDetail - Received navigation state:', {
    hasInitialCrew: !!initialCrew,
    requestType,
    selectedFlightsCount: selectedFlights.length,
    selectedFlights: selectedFlights,
    missionData,
    fromCostEstimation,
    estimationData,
    initialCrewFields: initialCrew ? Object.keys(initialCrew) : [],
    allState: location.state
  });
  
  // Get the most up-to-date crew data from the centralized service
  const [crew, setCrew] = useState(null);
  
  // Initialize contract data with better defaults
  const getInitialDates = () => {
    // If mission data has dates, use them
    if (missionData.startDate && missionData.endDate) {
      return { startDate: missionData.startDate, endDate: missionData.endDate };
    }
    
    // If we have flights, use flight dates
    if (selectedFlights && selectedFlights.length > 0) {
      const firstFlight = selectedFlights[0];
      const lastFlight = selectedFlights[selectedFlights.length - 1];
      return { 
        startDate: firstFlight.date || '', 
        endDate: lastFlight.date || firstFlight.date || '' 
      };
    }
    
    // Default to empty
    return { startDate: '', endDate: '' };
  };

  const initialDates = getInitialDates();
  
  // Initialize contract data with cost estimation data if available
  const getInitialContractData = () => {
    const base = {
      startDate: initialDates.startDate,
      endDate: initialDates.endDate,
      salaryAmount: 0,
      salaryCurrency: ConfigurationService.getDefaultCurrency(),
      salaryType: 'daily',
      hasPerDiem: false,
      perDiemAmount: 0,
      perDiemCurrency: ConfigurationService.getDefaultCurrency(),
      salaryLocked: true,
      perDiemLocked: true,
      salaryComment: '',
      perDiemComment: '',
      additionalNotes: '',
      manualOverride: false,
      // Extra day specific fields (admin only)
      ownerApproval: false,
      ownerApprovalComment: ''
    };

    // Pre-fill from cost estimation if available
    if (fromCostEstimation && estimationData) {
      return {
        ...base,
        startDate: estimationData.startDate || base.startDate,
        endDate: estimationData.endDate || base.endDate,
        salaryAmount: estimationData.results?.dailySalary || 0,
        salaryCurrency: estimationData.currency || base.salaryCurrency,
        salaryType: estimationData.paymentMode || base.salaryType,
        hasPerDiem: estimationData.perDiemEnabled && (estimationData.results?.dailyPerDiem || 0) > 0,
        perDiemAmount: estimationData.results?.dailyPerDiem || 0,
        perDiemCurrency: estimationData.currency || base.perDiemCurrency,
        additionalNotes: estimationData.notes || base.additionalNotes,
        manualOverride: estimationData.manualMode || false,
        salaryLocked: !estimationData.manualMode,
        perDiemLocked: !estimationData.manualMode
      };
    }

    return base;
  };

  const [contractData, setContractData] = useState(getInitialContractData());

  // Add state for mission parameters when not pre-filled
  const [missionParams, setMissionParams] = useState({
    selectedAircraft: missionData.aircraft || '',
    hasFlights: selectedFlights && selectedFlights.length > 0
  });

  // Simplified basic mission data for initial creation
  const getInitialBasicMissionData = (): BasicMissionData => {
    const base = {
      ownerEmail: ConfigurationService.getDefaultOwnerEmail(),
      subject: '',
      message: '',
      estimatedCost: 0,
      currency: ConfigurationService.getDefaultCurrency(),
      duration: 1
    };

    // Pre-fill from cost estimation if available
    if (fromCostEstimation && estimationData && estimationData.results) {
      return {
        ...base,
        estimatedCost: estimationData.results.totalWithMargin || estimationData.results.totalCost,
        currency: estimationData.currency,
        duration: estimationData.duration
      };
    }

    return base;
  };

  // State for basic mission data
  const [basicMissionData, setBasicMissionData] = useState<BasicMissionData>(getInitialBasicMissionData());

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load the latest crew data and auto-populate mission parameters
  useEffect(() => {
    if (initialCrew) {
      // Use the passed crew data directly, enriched with any missing data
      const enrichedCrew = {
        ...initialCrew,
        // Ensure all fields are present
        name: initialCrew.name || 'Unknown',
        position: initialCrew.position || 'Unknown',
        type: initialCrew.type || 'freelancer',
        ggid: initialCrew.ggid || 'N/A',
        email: initialCrew.email || '',
        phone: initialCrew.phone || '',
        address: initialCrew.address || '',
        qualifications: initialCrew.qualifications || [],
        emergencyContact: initialCrew.emergencyContact || null,
        licenseNumber: initialCrew.licenseNumber || '',
        medicalExpiry: initialCrew.medicalExpiry || '',
        passportNumber: initialCrew.passportNumber || '',
        missing_docs: initialCrew.missing_docs || []
      };
      
      setCrew(enrichedCrew);
      console.log('Crew data loaded for mission request:', enrichedCrew);
      
      // Auto-populate aircraft from missionData if available
      if (missionData.aircraft) {
        setMissionParams(prev => ({
          ...prev,
          selectedAircraft: missionData.aircraft
        }));
        console.log('Aircraft auto-populated from cost estimation:', missionData.aircraft);
      }
    }
  }, [initialCrew, missionData]);

  // Redirect if no data
  useEffect(() => {
    if (!initialCrew || !requestType) {
      navigate('/mission-request');
    }
  }, [initialCrew, requestType, navigate]);

  // Auto-populate mission data from flights and calculate salary
  useEffect(() => {
    if (crew) {
      let aircraft = null;
      let autoStartDate = contractData.startDate;
      let autoEndDate = contractData.endDate;
      
      // Try to get aircraft from flights first and extract dates
      if (selectedFlights.length > 0) {
        const firstFlight = selectedFlights[0];
        const lastFlight = selectedFlights[selectedFlights.length - 1];
        
        console.log('Auto-populating from flights:', { firstFlight, lastFlight });
        
        // Get aircraft data
        aircraft = ConfigurationService.getAircraftById(firstFlight.aircraftId);
        
        // Auto-populate dates from flights if not already set
        if (!contractData.startDate && firstFlight.date) {
          autoStartDate = firstFlight.date;
        }
        if (!contractData.endDate && lastFlight.date) {
          autoEndDate = lastFlight.date;
        }
        
        // Update mission params to show the aircraft is selected via flights
        if (aircraft) {
          setMissionParams(prev => ({ 
            ...prev, 
            selectedAircraft: aircraft.immat,
            hasFlights: true 
          }));
        }
      } 
      // If no flights, try to get aircraft from mission params
      else if (missionParams.selectedAircraft) {
        console.log('Getting aircraft from mission params:', missionParams.selectedAircraft);
        aircraft = aircraftData.find(ac => ac.immat === missionParams.selectedAircraft);
      }
      
      // Update contract dates if they were auto-extracted
      if ((autoStartDate !== contractData.startDate) || (autoEndDate !== contractData.endDate)) {
        setContractData(prev => ({
          ...prev,
          startDate: autoStartDate,
          endDate: autoEndDate
        }));
      }
      
      console.log('Aircraft found for configuration:', aircraft);
      
      if (aircraft) {
        const salaryData = salaryMatrix[crew.position]?.[aircraft.type];
        const perDiemData = perDiemMatrix[crew.position];
        
        console.log('Salary calculation data:', {
          position: crew.position,
          aircraftType: aircraft.type,
          salaryData,
          perDiemData
        });
        
        // Update salary data
        if (salaryData) {
          setContractData(prev => ({
            ...prev,
            salaryAmount: salaryData.daily || 0,
            salaryCurrency: salaryData.currency || 'EUR',
            salaryType: 'daily',
            hasPerDiem: perDiemData && perDiemData.amount > 0,
            perDiemAmount: perDiemData ? perDiemData.amount : 0,
            perDiemCurrency: perDiemData ? perDiemData.currency : 'EUR'
          }));
        }

        // Initialize email template using ConfigurationService
        const missionId = `MO-${Date.now()}`;
        const emailTemplate = ConfigurationService.generateMissionEmailTemplate({
          missionId,
          crewName: crew.name,
          aircraft,
          startDate: autoStartDate || contractData.startDate,
          endDate: autoEndDate || contractData.endDate,
          requestType
        });
        
        setBasicMissionData(prev => ({
          ...prev,
          subject: emailTemplate.subject,
          message: emailTemplate.message
        }));
      } else {
        console.log('No aircraft available for salary initialization');
      }
    }
  }, [crew, selectedFlights, missionParams.selectedAircraft, requestType]);

  // Calculate mission duration
  const calculateDuration = (): number => {
    if (!contractData.startDate || !contractData.endDate) return 1;
    const start = new Date(contractData.startDate);
    const end = new Date(contractData.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  // Auto-calculate basic estimated cost
  useEffect(() => {
    const duration = calculateDuration();
    let totalSalary = 0;
    
    // Calculate total salary based on payment type
    if (contractData.salaryType === 'lump_sum') {
      totalSalary = contractData.salaryAmount;
    } else {
      totalSalary = contractData.salaryAmount * duration;
    }
    
    const totalPerDiem = contractData.hasPerDiem ? contractData.perDiemAmount * duration : 0;
    const totalFees = totalSalary + totalPerDiem;

    setBasicMissionData(prev => ({
      ...prev,
      estimatedCost: totalFees,
      duration,
      currency: contractData.salaryCurrency
    }));
  }, [contractData]);

  if (!crew || !requestType) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/mission-request')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Mission Requests</span>
            </Button>
          </div>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg text-gray-900 mb-2">Missing Data</h3>
            <p className="text-gray-600 mb-4">
              {!crew ? 'No crew member data available.' : 'No request type specified.'}
            </p>
            <Button onClick={() => navigate('/mission-request')}>
              Return to Mission Requests
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const missingFields = getMissingFields(crew);

  const handleInputChange = (field: string, value: any) => {
    setContractData(prev => ({ ...prev, [field]: value }));
  };

  const handleBasicMissionDataChange = (field: string, value: any) => {
    setBasicMissionData(prev => ({ ...prev, [field]: value }));
  };

  const handleCurrencyChange = (currency: string) => {
    setBasicMissionData(prev => ({ ...prev, currency }));
    setContractData(prev => ({
      ...prev,
      salaryCurrency: currency,
      perDiemCurrency: currency
    }));
  };

  const toggleSalaryLock = () => {
    setContractData(prev => ({ 
      ...prev, 
      salaryLocked: !prev.salaryLocked,
      manualOverride: !prev.salaryLocked,
      salaryComment: prev.salaryLocked ? prev.salaryComment : ''
    }));
  };

  const togglePerDiemLock = () => {
    setContractData(prev => ({ 
      ...prev, 
      perDiemLocked: !prev.perDiemLocked,
      perDiemComment: prev.perDiemLocked ? prev.perDiemComment : ''
    }));
  };

  const handleSalaryTypeChange = (type: string) => {
    let aircraft = null;
    
    // Try to get aircraft from flights first
    if (selectedFlights.length > 0) {
      const firstFlight = selectedFlights[0];
      aircraft = ConfigurationService.getAircraftById(firstFlight.aircraftId);
    } 
    // If no flights, try to get aircraft from mission params
    else if (missionParams.selectedAircraft) {
      aircraft = ConfigurationService.getAircraftByImmat(missionParams.selectedAircraft);
    }
    
    const salaryData = salaryMatrix[crew.position]?.[aircraft?.type];
    
    if (salaryData) {
      let newAmount = 0;
      if (type === 'daily') {
        newAmount = salaryData.daily || 0;
      } else if (type === 'monthly') {
        newAmount = salaryData.monthly || 0;
      } else if (type === 'lump_sum') {
        // For lump sum, calculate a base amount (e.g., daily rate * expected duration or use a default)
        const duration = calculateDuration();
        newAmount = (salaryData.daily || 0) * duration;
      }
      
      setContractData(prev => ({
        ...prev,
        salaryType: type,
        salaryAmount: newAmount
      }));
    }
  };

  const handleMissionParamChange = (field: string, value: any) => {
    setMissionParams(prev => ({ ...prev, [field]: value }));
  };

  const handleNotifyToComplete = () => {
    const missingDocsText = missingFields.map(f => f.label).join(', ');
    
    showToast('info', 'Notification Sent', `Notified ${crew.name} to complete missing profile fields`);
    
    addNotification({
      type: 'warning',
      title: 'Profile Update Required',
      message: `${crew.name} has been notified to complete: ${missingDocsText}`,
      category: 'profile',
      metadata: { crewId: crew.id, missingFields: missingFields.map(f => f.field) }
    });
  };

  const handlePreviewPDF = () => {
    // Get aircraft data
    let aircraft = null;
    if (selectedFlights.length > 0) {
      const firstFlight = selectedFlights[0];
      aircraft = ConfigurationService.getAircraftById(firstFlight.aircraftId);
    } else if (missionParams.selectedAircraft) {
      aircraft = ConfigurationService.getAircraftByImmat(missionParams.selectedAircraft);
    }

    // Create mock mission data for PDF preview
    const mockMission = {
      id: `MO-PREVIEW`,
      crew,
      aircraft,
      contract: contractData,
      type: requestType
    };

    // Create basic email data for preview
    const basicEmailData = {
      ownerEmail: basicMissionData.ownerEmail,
      subject: basicMissionData.subject,
      message: basicMissionData.message,
      fees: {
        dailyRate: contractData.salaryAmount,
        perDiem: contractData.perDiemAmount,
        duration: basicMissionData.duration,
        totalSalary: basicMissionData.estimatedCost,
        totalPerDiem: contractData.hasPerDiem ? contractData.perDiemAmount * basicMissionData.duration : 0,
        totalFees: basicMissionData.estimatedCost,
        margin: 0, // No margin in basic mode
        totalWithMargin: basicMissionData.estimatedCost,
        currency: basicMissionData.currency
      },
      marginPercent: 0 // No margin in basic mode
    };

    PDFGenerator.generateMissionPDF(mockMission, basicEmailData);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Validation for basic mission data
      if (!basicMissionData.ownerEmail) {
        showToast('error', 'Validation Error', 'Client email address is required');
        setIsSubmitting(false);
        return;
      }

      // Debug form validation
      const formValidation = validateForm(contractData, requestType);
      console.log('Form validation debug:', {
        isValid: formValidation,
        contractData,
        requestType,
        basicMissionData,
        validationDetails: {
          hasStartDate: !!contractData.startDate,
          hasEndDate: !!contractData.endDate,
          hasOwnerEmail: !!basicMissionData.ownerEmail,
          salaryLocked: contractData.salaryLocked,
          manualOverride: contractData.manualOverride,
          salaryComment: contractData.salaryComment,
          hasPerDiem: contractData.hasPerDiem,
          perDiemLocked: contractData.perDiemLocked,
          perDiemComment: contractData.perDiemComment,
          ownerApproval: contractData.ownerApproval,
          ownerApprovalComment: contractData.ownerApprovalComment
        }
      });

      if (!formValidation) {
        console.error('Form validation failed - showing detailed errors');
        const missingItems = [];
        if (!contractData.startDate) missingItems.push('Start Date');
        if (!contractData.endDate) missingItems.push('End Date');
        if (!contractData.salaryLocked && !contractData.salaryComment) missingItems.push('Salary override reason');
        if (contractData.hasPerDiem && !contractData.perDiemLocked && !contractData.perDiemComment) missingItems.push('Per diem override reason');
        if (requestType === 'extra_day' && contractData.ownerApproval && !contractData.ownerApprovalComment) missingItems.push('Owner approval details');
        
        showToast('error', 'Validation Error', `Missing required fields: ${missingItems.join(', ')}`);
        setIsSubmitting(false);
        return;
      }
      
      // Get aircraft data from flights or mission params
      let aircraft = null;
      if (selectedFlights.length > 0) {
        const firstFlight = selectedFlights[0];
        aircraft = ConfigurationService.getAircraftById(firstFlight.aircraftId);
      } else if (missionParams.selectedAircraft) {
        aircraft = ConfigurationService.getAircraftByImmat(missionParams.selectedAircraft);
      }
      
      console.log('Creating mission with data:', {
        requestType,
        crew: crew ? { id: crew.id, name: crew.name } : null,
        aircraft: aircraft ? { id: aircraft.id, immat: aircraft.immat } : null,
        selectedFlights: selectedFlights.length,
        contractData,
        missionParams,
        basicMissionData
      });
      
      // Validation: ensure we have aircraft selection
      if (!aircraft) {
        showToast('error', 'Validation Error', 'Please select an aircraft for this mission');
        setIsSubmitting(false);
        return;
      }
      
      const missionData = createMissionData(requestType, crew, aircraft, selectedFlights, contractData);
      
      // Create basic email data for mission creation
      const basicEmailData = {
        ownerEmail: basicMissionData.ownerEmail,
        subject: basicMissionData.subject,
        message: basicMissionData.message,
        fees: {
          dailyRate: contractData.salaryAmount,
          perDiem: contractData.perDiemAmount,
          duration: basicMissionData.duration,
          totalSalary: basicMissionData.estimatedCost,
          totalPerDiem: contractData.hasPerDiem ? contractData.perDiemAmount * basicMissionData.duration : 0,
          totalFees: basicMissionData.estimatedCost,
          margin: 0, // Will be handled by finance department
          totalWithMargin: basicMissionData.estimatedCost, // Will be updated by finance
          currency: basicMissionData.currency
        },
        marginPercent: 0 // Will be handled by finance department
      };

      // Add email data to the mission
      const enhancedMissionData = {
        ...missionData,
        emailData: basicEmailData,
        status: 'pending_finance_review' // New status for finance review
      };
      
      console.log('Final mission data to submit:', enhancedMissionData);
      
      // Log owner approval info for admin audit (only if extra_day)
      if (requestType === 'extra_day') {
        console.log('Extra Day Mission - Owner Approval Status:', {
          ownerApproval: contractData.ownerApproval,
          ownerApprovalComment: contractData.ownerApprovalComment,
          crewId: crew.id,
          crewName: crew.name
        });
      }
      
      // Create mission via API
      const createdMission = await createMissionOrder(enhancedMissionData);
      
      if (createdMission) {
        // If this was created from a cost estimation, log the connection
        if (fromCostEstimation && estimationData) {
          console.log('Mission created from estimation:', estimationData.id, 'New mission:', createdMission.id);
        }

        // Show additional warning if crew has missing documents
        if (crew.has_missing_docs || (crew.missing_docs && crew.missing_docs.length > 0)) {
          showToast('warning', 'Mission Created with Warnings', 
            `Mission created successfully, but ${crew.name} has missing documents. Consider following up to complete the profile.`);
        }

        // Success message for finance review workflow
        showToast('success', 'Mission Created - Pending Finance Review', `${getRequestTypeTitle(requestType)} has been created and is pending finance review for margin calculation and client approval.`);
        
        addNotification({
          type: 'info',
          title: 'Mission Created - Pending Finance Review',
          message: `${getRequestTypeTitle(requestType)} for ${crew.name} has been created and is awaiting finance department review. Client: ${basicMissionData.ownerEmail}. Estimated cost: ${basicMissionData.estimatedCost.toFixed(2)} ${basicMissionData.currency}${crew.has_missing_docs ? ' (Note: Crew has incomplete documentation)' : ''}`,
          category: 'mission',
          metadata: { 
            missionOrderId: createdMission.id, 
            requestType, 
            ownerEmail: basicMissionData.ownerEmail,
            estimatedAmount: basicMissionData.estimatedCost,
            status: 'pending_finance_review',
            crewHasMissingDocs: crew.has_missing_docs || (crew.missing_docs && crew.missing_docs.length > 0)
          }
        });

        // Trigger mission order update event
        window.dispatchEvent(new CustomEvent('missionOrderUpdated'));

        // Navigate back to mission request page
        navigate('/mission-request');
      }
      
    } catch (error) {
      console.error('Mission creation error:', error);
      showToast('error', 'Error', `Failed to create mission: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    const baseValidation = validateForm(contractData, requestType);
    // Also check that we have an aircraft selected and owner email
    const hasAircraft = (selectedFlights.length > 0) || missionParams.selectedAircraft;
    const hasOwnerEmail = !!basicMissionData.ownerEmail;
    return baseValidation && hasAircraft && hasOwnerEmail;
  };
  
  const primaryAircraft = selectedFlights.length > 0 
    ? ConfigurationService.getAircraftById(selectedFlights[0].aircraftId) 
    : ConfigurationService.getAircraftByImmat(missionParams.selectedAircraft);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/mission-request')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Mission Requests</span>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-2xl text-gray-900">New Mission Request</h1>
            <Badge className={getRequestTypeColor(requestType)}>
              {getRequestTypeTitle(requestType)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Enhanced workflow notice */}
      {fromCostEstimation ? (
        <Alert className="border-green-200 bg-green-50">
          <Calculator className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <p className="text-green-800 text-sm">
              <strong>Created from Cost Estimation:</strong> This mission has been pre-filled with data from your cost estimation. 
              {estimationData?.status === 'draft' ? 'The estimation status will change from Draft to Active once crew is assigned.' : ''}
              Review the details and assign crew members to complete the mission creation.
            </p>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-blue-200 bg-blue-50">
          <DollarSign className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <p className="text-blue-800 text-sm">
              <strong>New Finance Workflow:</strong> After creation, missions are sent to the finance department for margin calculation and billing setup. 
              The client will only receive the request after finance validation.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Mission & Crew Information */}
        <div className="space-y-6">
          {/* Mission Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plane className="h-5 w-5" />
                <span>Mission Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary Aircraft Display */}
              {primaryAircraft && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2">
                    <Plane className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Primary Aircraft: {primaryAircraft.immat} ({primaryAircraft.type})
                    </span>
                  </div>
                  {missionParams.hasFlights && (
                    <p className="text-xs text-blue-600 mt-1">
                      Assigned via flight selection
                    </p>
                  )}
                </div>
              )}

              {/* Aircraft Selection (if no flights) */}
              {!missionParams.hasFlights && (
                <div className="space-y-2">
                  <Label htmlFor="aircraft">Aircraft</Label>
                  <Select 
                    value={missionParams.selectedAircraft} 
                    onValueChange={(value) => handleMissionParamChange('selectedAircraft', value)}
                  >
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
                </div>
              )}

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={contractData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={contractData.endDate}
                    min={contractData.startDate || undefined}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                  />
                </div>
              </div>

              {/* Duration Display */}
              <div className="p-2 bg-gray-50 rounded text-sm">
                <span className="text-gray-600">Duration: </span>
                <span className="font-medium">{calculateDuration()} days</span>
              </div>
            </CardContent>
          </Card>

          {/* Crew Information */}
          <MissionRequestCrewSection 
            crew={crew}
            missingFields={missingFields}
            onNotifyToComplete={handleNotifyToComplete}
          />
        </div>

        {/* Right Column - Contract & Basic Client Information */}
        <div className="space-y-6">
          {/* Contract Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Contract Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Currency Selection */}
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={basicMissionData.currency} onValueChange={handleCurrencyChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(currencyConfig).map(([code, config]) => (
                      <SelectItem key={code} value={code}>
                        {config.symbol} {config.name} ({code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Salary Configuration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base">Salary Configuration</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSalaryLock}
                    className="flex items-center space-x-2"
                  >
                    {contractData.salaryLocked ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Unlock className="h-4 w-4" />
                    )}
                    <span>{contractData.salaryLocked ? 'Locked' : 'Manual'}</span>
                  </Button>
                </div>

                {/* Salary Type */}
                <div className="space-y-2">
                  <Label htmlFor="salaryType">Payment Type</Label>
                  <Select value={contractData.salaryType} onValueChange={handleSalaryTypeChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily Rate</SelectItem>
                      <SelectItem value="monthly">Monthly Rate</SelectItem>
                      <SelectItem value="lump_sum">Lump Sum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Salary Amount */}
                <div className="space-y-2">
                  <Label htmlFor="salaryAmount">
                    {contractData.salaryType === 'daily' ? 'Daily' : 
                     contractData.salaryType === 'monthly' ? 'Monthly' : 'Total'} Salary
                  </Label>
                  <Input
                    id="salaryAmount"
                    type="number"
                    step="0.01"
                    value={contractData.salaryAmount}
                    onChange={(e) => handleInputChange('salaryAmount', parseFloat(e.target.value) || 0)}
                    disabled={contractData.salaryLocked}
                  />
                </div>

                {/* Salary Override Comment */}
                {!contractData.salaryLocked && (
                  <div className="space-y-2">
                    <Label htmlFor="salaryComment">Reason for Manual Override</Label>
                    <Textarea
                      id="salaryComment"
                      placeholder="Explain why manual salary entry is needed..."
                      value={contractData.salaryComment}
                      onChange={(e) => handleInputChange('salaryComment', e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Per Diem Configuration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hasPerDiem"
                      checked={contractData.hasPerDiem}
                      onCheckedChange={(checked) => handleInputChange('hasPerDiem', checked)}
                    />
                    <Label htmlFor="hasPerDiem">Include Per Diem</Label>
                  </div>
                  {contractData.hasPerDiem && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={togglePerDiemLock}
                      className="flex items-center space-x-2"
                    >
                      {contractData.perDiemLocked ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Unlock className="h-4 w-4" />
                      )}
                      <span>{contractData.perDiemLocked ? 'Locked' : 'Manual'}</span>
                    </Button>
                  )}
                </div>

                {contractData.hasPerDiem && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="perDiemAmount">Daily Per Diem</Label>
                      <Input
                        id="perDiemAmount"
                        type="number"
                        step="0.01"
                        value={contractData.perDiemAmount}
                        onChange={(e) => handleInputChange('perDiemAmount', parseFloat(e.target.value) || 0)}
                        disabled={contractData.perDiemLocked}
                      />
                    </div>

                    {!contractData.perDiemLocked && (
                      <div className="space-y-2">
                        <Label htmlFor="perDiemComment">Reason for Manual Override</Label>
                        <Textarea
                          id="perDiemComment"
                          placeholder="Explain why manual per diem entry is needed..."
                          value={contractData.perDiemComment}
                          onChange={(e) => handleInputChange('perDiemComment', e.target.value)}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Estimated Cost Summary */}
              <Separator />
              <div className="space-y-3">
                <Label className="text-base">Estimated Cost (Before Finance Review)</Label>
                
                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-800 font-medium">Base Estimated Cost:</span>
                    <span className="text-yellow-800 font-bold text-lg">
                      {currencyConfig[basicMissionData.currency]?.symbol}
                      {basicMissionData.estimatedCost.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    Final client pricing will be determined by finance department
                  </p>
                </div>
              </div>

              {/* Basic Client Information */}
              <Separator />
              <div className="space-y-4">
                <Label className="text-base">Client Information</Label>
                
                <div className="space-y-2">
                  <Label htmlFor="ownerEmail" className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>Client Email Address</span>
                  </Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    value={basicMissionData.ownerEmail}
                    onChange={(e) => handleBasicMissionDataChange('ownerEmail', e.target.value)}
                    placeholder="client@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="additionalNotes">Additional Notes</Label>
                  <Textarea
                    id="additionalNotes"
                    placeholder="Any special requirements or notes for this mission..."
                    value={contractData.additionalNotes}
                    onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                  />
                </div>
              </div>

              {/* Extra Day Request Fields */}
              {requestType === 'extra_day' && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Hash className="h-4 w-4 text-orange-500" />
                      <Label className="text-base text-orange-800">Extra Day Request (Admin Approval Required)</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="ownerApproval"
                        checked={contractData.ownerApproval}
                        onCheckedChange={(checked) => handleInputChange('ownerApproval', checked)}
                      />
                      <Label htmlFor="ownerApproval">Pre-approved by Owner</Label>
                    </div>

                    {contractData.ownerApproval && (
                      <div className="space-y-2">
                        <Label htmlFor="ownerApprovalComment">Owner Approval Details</Label>
                        <Textarea
                          id="ownerApprovalComment"
                          placeholder="Describe the owner approval process and any conditions..."
                          value={contractData.ownerApprovalComment}
                          onChange={(e) => handleInputChange('ownerApprovalComment', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              onClick={handlePreviewPDF}
              variant="outline"
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              Preview PDF
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid() || isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit to Finance
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}