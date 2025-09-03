import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar, 
  Plane, 
  DollarSign,
  Settings
} from 'lucide-react';
import type { MissionOrder } from './MissionOrderService';

interface OwnerApprovalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mission: MissionOrder;
  onApprove: (comments?: string) => void;
  onReject: (reason: string) => void;
  isLoading: boolean;
}

export default function OwnerApprovalModal({
  open,
  onOpenChange,
  mission,
  onApprove,
  onReject,
  isLoading
}: OwnerApprovalModalProps) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [comments, setComments] = useState('');
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (action === 'approve') {
      onApprove(comments || undefined);
    } else if (action === 'reject') {
      onReject(reason);
    }
    handleClose();
  };

  const handleClose = () => {
    setAction(null);
    setComments('');
    setReason('');
    onOpenChange(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDuration = () => {
    if (!mission.contract?.startDate || !mission.contract?.endDate) return 1;
    const start = new Date(mission.contract.startDate);
    const end = new Date(mission.contract.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const totalCompensation = () => {
    if (!mission.contract) return 0;
    const duration = calculateDuration();
    const salary = mission.contract.salaryType === 'daily' 
      ? (mission.contract.salaryAmount || 0) * duration
      : (mission.contract.salaryAmount || 0);
    const perDiem = mission.contract.hasPerDiem 
      ? (mission.contract.perDiemAmount || 0) * duration 
      : 0;
    return salary + perDiem;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-orange-600" />
            <span>Owner Approval Required</span>
          </DialogTitle>
          <DialogDescription>
            Review this mission and decide whether to approve or reject it. The crew will be notified of your decision.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mission Summary */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-sm">{mission.id}</Badge>
              <Badge className="bg-orange-100 text-orange-800">
                Waiting Owner Approval
              </Badge>
            </div>

            {/* Mission Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium">{mission.crew?.name || 'Unknown'}</p>
                  <p className="text-gray-500">{mission.crew?.position || 'Unknown'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Plane className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium">{mission.aircraft?.immat || 'Unknown'}</p>
                  <p className="text-gray-500">{mission.aircraft?.type || 'Unknown'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium">{calculateDuration()} day(s)</p>
                  <p className="text-gray-500">
                    {formatDate(mission.contract?.startDate)} - {formatDate(mission.contract?.endDate)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium">
                    {totalCompensation().toLocaleString()} {mission.contract?.salaryCurrency || 'EUR'}
                  </p>
                  <p className="text-gray-500">
                    {mission.contract?.salaryAmount || 0} {mission.contract?.salaryCurrency || 'EUR'}/{mission.contract?.salaryType === 'daily' ? 'day' : 'month'}
                    {mission.contract?.hasPerDiem && ` + ${mission.contract.perDiemAmount || 0} per diem`}
                  </p>
                </div>
              </div>
            </div>

            {/* Contract Notes */}
            {mission.contract?.additionalNotes && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <Label className="text-sm font-medium text-gray-700">Contract Notes:</Label>
                <p className="text-sm text-gray-600 mt-1">{mission.contract.additionalNotes}</p>
              </div>
            )}

            {/* Email Info */}
            {mission.emailData && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <Label className="text-sm font-medium text-blue-700">Client Information:</Label>
                <div className="text-sm text-blue-600 mt-1">
                  <p>Owner: {mission.emailData.ownerEmail}</p>
                  {mission.emailData.fees && (
                    <p>Total with margin: {mission.emailData.fees.totalWithMargin?.toFixed(2)} {mission.emailData.fees.currency} ({mission.emailData.marginPercent}% margin)</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {!action && (
            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium text-gray-900">Decision Required</p>
                <p className="text-gray-700 text-sm mt-1">
                  If you approve, the mission will be sent to the client for final validation. 
                  If you reject, the crew will be notified that the mission cannot proceed.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Selection */}
          {!action && (
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setAction('reject')}
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject Mission
              </Button>
              <Button
                onClick={() => setAction('approve')}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Mission
              </Button>
            </div>
          )}

          {/* Approval Form */}
          {action === 'approve' && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Approving Mission:</strong> This mission will be sent to the client ({mission.emailData?.ownerEmail}) for final validation.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="approval-comments">Comments (Optional)</Label>
                <Textarea
                  id="approval-comments"
                  placeholder="Add any comments about this approval..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setAction(null)}>
                  Back
                </Button>
                <Button 
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Approval
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Rejection Form */}
          {action === 'reject' && (
            <div className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Rejecting Mission:</strong> The crew ({mission.crew?.name}) will be notified that this mission has been rejected.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Please explain why this mission is being rejected..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setAction(null)}>
                  Back
                </Button>
                <Button 
                  onClick={handleConfirm}
                  disabled={isLoading || !reason.trim()}
                  variant="destructive"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Confirm Rejection
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}