import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Mail, 
  FileText, 
  Send, 
  Calculator,
  Euro,
  User,
  Plane,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from './LanguageProvider';
import { MissionOrder } from './MissionOrderTypes';
import { PDFGenerator } from './PDFGenerator';

interface PayMatrixRate {
  position: string;
  aircraft: string;
  dailyRate: number;
  perDiem: number;
}

interface MissionApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  mission: MissionOrder;
  onApprove: (emailData: EmailData) => Promise<void>;
  payMatrix: PayMatrixRate[];
}

export interface EmailData {
  ownerEmail: string;
  subject: string;
  message: string;
  fees: {
    dailyRate: number;
    perDiem: number;
    duration: number;
    totalSalary: number;
    totalPerDiem: number;
    totalFees: number;
    currency: string;
  };
}

export default function MissionApprovalModal({
  isOpen,
  onClose,
  mission,
  onApprove,
  payMatrix
}: MissionApprovalModalProps) {
  const { t } = useTranslation();
  const [emailData, setEmailData] = useState<EmailData>({
    ownerEmail: '',
    subject: `Mission Order ${mission.id} - Approval Required`,
    message: `Dear Sir/Madam,

Please find attached the mission order ${mission.id} for your review and approval.

Mission Details:
- Crew: ${mission.crew?.name || 'N/A'}
- Aircraft: ${mission.aircraft?.immat || 'N/A'} (${mission.aircraft?.type || 'N/A'})
- Period: ${mission.contract?.startDate || 'N/A'} to ${mission.contract?.endDate || 'N/A'}
- Type: ${mission.type}

The mission has been prepared and is awaiting your final authorization.

Best regards,
Flight Operations Team`,
    fees: {
      dailyRate: 0,
      perDiem: 0,
      duration: 1,
      totalSalary: 0,
      totalPerDiem: 0,
      totalFees: 0,
      currency: 'EUR'
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate mission duration
  const calculateDuration = (): number => {
    if (!mission.contract?.startDate || !mission.contract?.endDate) return 1;
    const start = new Date(mission.contract.startDate);
    const end = new Date(mission.contract.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  // Find matching rate in pay matrix
  const findPayMatrixRate = (): PayMatrixRate | null => {
    const crewPosition = mission.crew?.position?.toLowerCase();
    const aircraftType = mission.aircraft?.type?.toLowerCase();

    return payMatrix.find(rate => 
      rate.position.toLowerCase().includes(crewPosition || '') ||
      rate.aircraft.toLowerCase().includes(aircraftType || '')
    ) || payMatrix[0] || null;
  };

  // Auto-calculate fees based on pay matrix
  React.useEffect(() => {
    const duration = calculateDuration();
    const rate = findPayMatrixRate();
    
    if (rate) {
      const totalSalary = rate.dailyRate * duration;
      const totalPerDiem = rate.perDiem * duration;
      const totalFees = totalSalary + totalPerDiem;

      setEmailData(prev => ({
        ...prev,
        fees: {
          dailyRate: rate.dailyRate,
          perDiem: rate.perDiem,
          duration,
          totalSalary,
          totalPerDiem,
          totalFees,
          currency: mission.contract?.salaryCurrency || 'EUR'
        }
      }));
    }
  }, [mission, payMatrix]);

  const handleSubmit = async () => {
    if (!emailData.ownerEmail) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate PDF preview
      PDFGenerator.generateMissionPDF(mission, emailData);
      
      await onApprove(emailData);
      onClose();
    } catch (error) {
      console.error('Error approving mission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreviewPDF = () => {
    PDFGenerator.generateMissionPDF(mission, emailData);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Approve Mission & Send PDF</span>
            <Badge variant="outline">{mission.id}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mission Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">{mission.crew?.name || 'Unknown'}</p>
                <p className="text-xs text-gray-500">{mission.crew?.position || 'Unknown'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Plane className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">{mission.aircraft?.immat || 'Unknown'}</p>
                <p className="text-xs text-gray-500">{mission.aircraft?.type || 'Unknown'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">{emailData.fees.duration} jour(s)</p>
                <p className="text-xs text-gray-500">
                  {mission.contract?.startDate ? formatDate(mission.contract.startDate) : 'N/A'} - {mission.contract?.endDate ? formatDate(mission.contract.endDate) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Fee Calculation */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5" />
              <h3 className="text-lg font-medium">Fee Calculation (from Pay Matrix)</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg">
              <div>
                <Label className="text-xs text-gray-600">Daily Rate</Label>
                <div className="flex items-center space-x-1">
                  <Input
                    type="number"
                    value={emailData.fees.dailyRate}
                    onChange={(e) => setEmailData(prev => {
                      const dailyRate = parseFloat(e.target.value) || 0;
                      const totalSalary = dailyRate * prev.fees.duration;
                      const totalFees = totalSalary + prev.fees.totalPerDiem;
                      return {
                        ...prev,
                        fees: {
                          ...prev.fees,
                          dailyRate,
                          totalSalary,
                          totalFees
                        }
                      };
                    })}
                    className="text-sm"
                  />
                  <Euro className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">Per Diem</Label>
                <div className="flex items-center space-x-1">
                  <Input
                    type="number"
                    value={emailData.fees.perDiem}
                    onChange={(e) => setEmailData(prev => {
                      const perDiem = parseFloat(e.target.value) || 0;
                      const totalPerDiem = perDiem * prev.fees.duration;
                      const totalFees = prev.fees.totalSalary + totalPerDiem;
                      return {
                        ...prev,
                        fees: {
                          ...prev.fees,
                          perDiem,
                          totalPerDiem,
                          totalFees
                        }
                      };
                    })}
                    className="text-sm"
                  />
                  <Euro className="h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-600">Duration</Label>
                <Input
                  type="number"
                  value={emailData.fees.duration}
                  onChange={(e) => setEmailData(prev => {
                    const duration = parseInt(e.target.value) || 1;
                    const totalSalary = prev.fees.dailyRate * duration;
                    const totalPerDiem = prev.fees.perDiem * duration;
                    const totalFees = totalSalary + totalPerDiem;
                    return {
                      ...prev,
                      fees: {
                        ...prev.fees,
                        duration,
                        totalSalary,
                        totalPerDiem,
                        totalFees
                      }
                    };
                  })}
                  className="text-sm"
                />
              </div>

              <div>
                <Label className="text-xs text-gray-600">Total Fees</Label>
                <div className="flex items-center space-x-1">
                  <div className="text-lg font-bold text-green-600">
                    {emailData.fees.totalFees.toFixed(2)}
                  </div>
                  <span className="text-sm text-gray-500">{emailData.fees.currency}</span>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Salary ({emailData.fees.duration} days × {emailData.fees.dailyRate}€):</span>
                <span>{emailData.fees.totalSalary.toFixed(2)} {emailData.fees.currency}</span>
              </div>
              <div className="flex justify-between">
                <span>Per Diem ({emailData.fees.duration} days × {emailData.fees.perDiem}€):</span>
                <span>{emailData.fees.totalPerDiem.toFixed(2)} {emailData.fees.currency}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>Total:</span>
                <span>{emailData.fees.totalFees.toFixed(2)} {emailData.fees.currency}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Email Details */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <h3 className="text-lg font-medium">Email Details</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="ownerEmail" className="flex items-center space-x-1">
                  <span>Owner Email Address</span>
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  placeholder="owner@example.com"
                  value={emailData.ownerEmail}
                  onChange={(e) => setEmailData(prev => ({ ...prev, ownerEmail: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={emailData.subject}
                  onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="message">Email Message</Label>
                <Textarea
                  id="message"
                  rows={8}
                  value={emailData.message}
                  onChange={(e) => setEmailData(prev => ({ ...prev, message: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {!emailData.ownerEmail && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please enter the owner's email address to continue.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            variant="outline" 
            onClick={handlePreviewPDF}
            disabled={!emailData.ownerEmail || isSubmitting}
            className="flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Preview PDF</span>
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!emailData.ownerEmail || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Approving & Sending...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Send className="h-4 w-4" />
                <span>Approve & Send PDF</span>
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}