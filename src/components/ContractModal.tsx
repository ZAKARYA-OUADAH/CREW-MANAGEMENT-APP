import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  DollarSign, 
  Lock, 
  Unlock, 
  Calendar,
  AlertCircle,
  Send
} from 'lucide-react';

// Mock salary matrix based on position and aircraft type
const salaryMatrix = {
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

const perDiemMatrix = {
  'Captain': { amount: 120, currency: 'EUR' },
  'First Officer': { amount: 100, currency: 'EUR' },
  'Flight Attendant': { amount: 80, currency: 'EUR' }
};

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  crew: any;
  aircraft: any;
  requestType: 'extra_day' | 'freelance' | 'service' | null;
  dateRange?: { startDate: string; endDate: string };
  onSubmit: (contractData: any) => void;
}

export default function ContractModal({ 
  isOpen, 
  onClose, 
  crew, 
  aircraft, 
  requestType, 
  dateRange,
  onSubmit 
}: ContractModalProps) {
  const [contractData, setContractData] = useState({
    startDate: dateRange?.startDate || '',
    endDate: dateRange?.endDate || '',
    salaryAmount: 0,
    salaryCurrency: 'EUR',
    salaryType: 'daily',
    hasPerDiem: false,
    perDiemAmount: 0,
    perDiemCurrency: 'EUR',
    salaryLocked: true,
    perDiemLocked: true,
    salaryComment: '',
    perDiemComment: '',
    requestedDocuments: [],
    additionalNotes: ''
  });

  const [missingDocuments] = useState([
    { id: 'medical', name: 'Medical Certificate', required: true },
    { id: 'license', name: 'Pilot License', required: true },
    { id: 'passport', name: 'Passport', required: true },
    { id: 'visa', name: 'Visa', required: false },
    { id: 'insurance', name: 'Insurance Certificate', required: false }
  ]);

  useEffect(() => {
    if (crew && aircraft) {
      const aircraftType = aircraft.type;
      const position = crew.position;
      
      const salaryData = salaryMatrix[position]?.[aircraftType];
      const perDiemData = perDiemMatrix[position];
      
      if (salaryData) {
        setContractData(prev => ({
          ...prev,
          salaryAmount: salaryData.daily,
          salaryCurrency: salaryData.currency,
          salaryType: 'daily'
        }));
      }
      
      if (perDiemData) {
        setContractData(prev => ({
          ...prev,
          perDiemAmount: perDiemData.amount,
          perDiemCurrency: perDiemData.currency
        }));
      }
    }
  }, [crew, aircraft]);

  const handleInputChange = (field: string, value: any) => {
    setContractData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSalaryLock = () => {
    setContractData(prev => ({ 
      ...prev, 
      salaryLocked: !prev.salaryLocked,
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
    if (crew && aircraft) {
      const aircraftType = aircraft.type;
      const position = crew.position;
      const salaryData = salaryMatrix[position]?.[aircraftType];
      
      if (salaryData) {
        setContractData(prev => ({
          ...prev,
          salaryType: type,
          salaryAmount: type === 'daily' ? salaryData.daily : salaryData.monthly
        }));
      }
    }
  };

  const handleDocumentRequest = (docId: string, checked: boolean) => {
    setContractData(prev => ({
      ...prev,
      requestedDocuments: checked 
        ? [...prev.requestedDocuments, docId]
        : prev.requestedDocuments.filter(id => id !== docId)
    }));
  };

  const handleSubmit = () => {
    onSubmit({
      ...contractData,
      crew,
      aircraft,
      requestType
    });
    onClose();
  };

  const getRequestTypeTitle = () => {
    if (!requestType) return 'Mission Request';
    
    switch (requestType) {
      case 'extra_day': return 'Extra Day Request';
      case 'freelance': return 'Freelance Contract';
      case 'service': return 'Service Request';
      default: return 'Mission Request';
    }
  };

  const formatRequestType = (type: string | null) => {
    if (!type) return 'mission request';
    return type.replace('_', ' ');
  };

  const currencies = ['EUR', 'USD', 'GBP'];

  // Don't render modal if essential props are missing
  if (!crew || !aircraft || !requestType) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>{getRequestTypeTitle()} - {crew?.name}</span>
          </DialogTitle>
        </DialogHeader>

        <Accordion type="multiple" defaultValue={["personal", "contract"]} className="w-full">
          {/* Personal Information Section */}
          <AccordionItem value="personal">
            <AccordionTrigger className="text-left">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Personal Information & Documents</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-6">
              {/* Crew Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-lg">{crew?.name}</h4>
                      <p className="text-sm text-gray-600">{crew?.position}</p>
                      <Badge variant="outline" className="mt-1">{crew?.type}</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>john.smith@example.com</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>+33 1 23 45 67 89</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>Paris, France</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Qualifications</span>
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {crew?.qualifications?.map((qual, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {qual}
                      </Badge>
                    ))}
                  </div>
                  
                  {crew?.missing_docs?.length > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800">Missing Documents</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {crew.missing_docs.map((doc, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs text-yellow-700 border-yellow-300">
                            {doc}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Document Requests */}
              <div className="space-y-4">
                <h5 className="flex items-center space-x-2">
                  <Send className="h-4 w-4" />
                  <span>Request Additional Documents</span>
                </h5>
                <p className="text-sm text-gray-600">
                  Select documents to request from the crew member along with this contract.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {missingDocuments.map((doc) => (
                    <div key={doc.id} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={doc.id}
                        checked={contractData.requestedDocuments.includes(doc.id)}
                        onChange={(e) => handleDocumentRequest(doc.id, e.target.checked)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <Label htmlFor={doc.id} className="flex items-center space-x-2">
                        <span>{doc.name}</span>
                        {doc.required && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Contract Details Section */}
          <AccordionItem value="contract">
            <AccordionTrigger className="text-left">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Contract Details</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-6">
              {/* Mission Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h5 className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Mission Period</span>
                  </h5>
                  
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
                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                        min={contractData.startDate}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5>Aircraft & Position</h5>
                  <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Aircraft:</span>
                      <span className="text-sm">{aircraft?.immat} ({aircraft?.type})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Position:</span>
                      <span className="text-sm">{crew?.position}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Request Type:</span>
                      <Badge variant="outline">{formatRequestType(requestType)}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Salary Configuration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Salary Configuration</span>
                  </h5>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSalaryLock}
                    className="flex items-center space-x-1"
                  >
                    {contractData.salaryLocked ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Unlock className="h-4 w-4" />
                    )}
                    <span>{contractData.salaryLocked ? 'Locked' : 'Manual'}</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Payment Type</Label>
                    <Select 
                      value={contractData.salaryType} 
                      onValueChange={handleSalaryTypeChange}
                      disabled={contractData.salaryLocked}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily Rate</SelectItem>
                        <SelectItem value="monthly">Monthly Rate</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={contractData.salaryAmount}
                      onChange={(e) => handleInputChange('salaryAmount', parseFloat(e.target.value))}
                      disabled={contractData.salaryLocked}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select 
                      value={contractData.salaryCurrency} 
                      onValueChange={(value) => handleInputChange('salaryCurrency', value)}
                      disabled={contractData.salaryLocked}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {!contractData.salaryLocked && (
                  <div className="space-y-2">
                    <Label htmlFor="salaryComment">Reason for Manual Override *</Label>
                    <Textarea
                      id="salaryComment"
                      placeholder="Please explain why you're overriding the automatic salary calculation..."
                      value={contractData.salaryComment}
                      onChange={(e) => handleInputChange('salaryComment', e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              <Separator />

              {/* Per Diem Configuration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={contractData.hasPerDiem}
                      onCheckedChange={(checked) => handleInputChange('hasPerDiem', checked)}
                    />
                    <h5>Per Diem Allowance</h5>
                  </div>
                  
                  {contractData.hasPerDiem && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={togglePerDiemLock}
                      className="flex items-center space-x-1"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Daily Per Diem</Label>
                        <Input
                          type="number"
                          value={contractData.perDiemAmount}
                          onChange={(e) => handleInputChange('perDiemAmount', parseFloat(e.target.value))}
                          disabled={contractData.perDiemLocked}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select 
                          value={contractData.perDiemCurrency} 
                          onValueChange={(value) => handleInputChange('perDiemCurrency', value)}
                          disabled={contractData.perDiemLocked}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {currencies.map(currency => (
                              <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {!contractData.perDiemLocked && (
                      <div className="space-y-2">
                        <Label htmlFor="perDiemComment">Reason for Manual Override *</Label>
                        <Textarea
                          id="perDiemComment"
                          placeholder="Please explain why you're overriding the automatic per diem calculation..."
                          value={contractData.perDiemComment}
                          onChange={(e) => handleInputChange('perDiemComment', e.target.value)}
                          required
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              <Separator />

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="additionalNotes">Additional Contract Notes</Label>
                <Textarea
                  id="additionalNotes"
                  placeholder="Any additional terms, conditions, or notes for this contract..."
                  value={contractData.additionalNotes}
                  onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={
              !contractData.startDate || 
              !contractData.endDate || 
              (!contractData.salaryLocked && !contractData.salaryComment) ||
              (contractData.hasPerDiem && !contractData.perDiemLocked && !contractData.perDiemComment)
            }
          >
            Send Contract Request
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}