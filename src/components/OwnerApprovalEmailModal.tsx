import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Mail, 
  Copy, 
  Send,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Plane,
  DollarSign
} from 'lucide-react';
import type { MissionOrder } from './MissionOrderService';

interface OwnerApprovalEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mission: MissionOrder;
  onEmailSent: () => void;
  onOwnerApprovalDecision: (decision: 'approved' | 'rejected', comments?: string) => void;
  isLoading: boolean;
}

export default function OwnerApprovalEmailModal({
  open,
  onOpenChange,
  mission,
  onEmailSent,
  onOwnerApprovalDecision,
  isLoading
}: OwnerApprovalEmailModalProps) {
  const [emailSent, setEmailSent] = useState(false);
  const [ownerDecision, setOwnerDecision] = useState<'approved' | 'rejected' | null>(null);
  const [ownerComments, setOwnerComments] = useState('');
  const [activeTab, setActiveTab] = useState<'email' | 'decision'>('email');

  const handleEmailSend = () => {
    // Simulate sending email
    setEmailSent(true);
    onEmailSent();
  };

  const handleOwnerDecision = () => {
    if (ownerDecision) {
      onOwnerApprovalDecision(ownerDecision, ownerComments || undefined);
      handleClose();
    }
  };

  const handleClose = () => {
    setEmailSent(false);
    setOwnerDecision(null);
    setOwnerComments('');
    setActiveTab('email');
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

  const copyEmailToClipboard = () => {
    const emailContent = mission.clientApprovalEmailTemplate?.bodyText || '';
    navigator.clipboard.writeText(emailContent);
  };

  if (!mission) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <span>Client Approval Workflow - {mission.id}</span>
          </DialogTitle>
          <DialogDescription>
            Manage the client approval process: send email template manually and track owner approval decision.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('email')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'email' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Email Template</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('decision')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'decision' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Owner Approval</span>
              </div>
            </button>
          </div>

          {/* Mission Summary */}
          <Alert className="border-blue-200 bg-blue-50">
            <User className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <div className="text-blue-800 text-sm space-y-1">
                <p><strong>Mission:</strong> {mission.id} - {mission.crew?.name} ({mission.crew?.position})</p>
                <p><strong>Aircraft:</strong> {mission.aircraft?.immat} ({mission.aircraft?.type})</p>
                <p><strong>Client:</strong> {mission.emailData?.ownerEmail}</p>
                <p><strong>Amount:</strong> {(mission.emailData?.fees?.totalWithMargin || 0).toFixed(2)} {mission.emailData?.fees?.currency || 'EUR'}</p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Email Template Tab */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-5 w-5" />
                      <span>Client Approval Email Template</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {emailSent && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Email Sent
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">To:</Label>
                      <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                        {mission.emailData?.ownerEmail || 'No email address'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Subject:</Label>
                      <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                        {mission.clientApprovalEmailTemplate?.subject || `Mission Order Approval Required - ${mission.id}`}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email Content:</Label>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg border text-sm max-h-64 overflow-y-auto">
                      {mission.clientApprovalEmailTemplate?.bodyText ? (
                        <pre className="whitespace-pre-wrap font-sans">
                          {mission.clientApprovalEmailTemplate.bodyText}
                        </pre>
                      ) : (
                        <div className="text-gray-500 italic">
                          Email template will be generated when the mission moves to client approval status.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={copyEmailToClipboard}
                      disabled={!mission.clientApprovalEmailTemplate?.bodyText}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Email
                    </Button>
                    <Button
                      onClick={handleEmailSend}
                      disabled={emailSent || !mission.clientApprovalEmailTemplate?.bodyText}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {emailSent ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Email Sent
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Email to Client
                        </>
                      )}
                    </Button>
                  </div>

                  {emailSent && (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Email has been sent to {mission.emailData?.ownerEmail}. You can now track the owner approval decision in the next tab.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Owner Approval Decision Tab */}
          {activeTab === 'decision' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>Owner Approval Decision</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Eye className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium text-gray-900">Track Client Response</p>
                      <p className="text-gray-700 text-sm mt-1">
                        Once you receive the client's decision via email or phone, record their approval or rejection here.
                      </p>
                    </AlertDescription>
                  </Alert>

                  {/* Current Decision Status */}
                  {mission.ownerApprovalDecision && (
                    <Alert className={
                      mission.ownerApprovalDecision === 'approved' 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                    }>
                      {mission.ownerApprovalDecision === 'approved' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <AlertDescription className={
                        mission.ownerApprovalDecision === 'approved' 
                          ? 'text-green-800' 
                          : 'text-red-800'
                      }>
                        <p className="font-medium">
                          Current Status: {mission.ownerApprovalDecision === 'approved' ? 'Client Approved' : 'Client Rejected'}
                        </p>
                        {mission.clientComments && (
                          <p className="text-sm mt-1">Comments: {mission.clientComments}</p>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Decision Input */}
                  {!mission.ownerApprovalDecision && (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Client Decision:</Label>
                        <div className="mt-2 flex space-x-3">
                          <Button
                            variant={ownerDecision === 'approved' ? 'default' : 'outline'}
                            onClick={() => setOwnerDecision('approved')}
                            className={ownerDecision === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'text-green-600 border-green-200 hover:bg-green-50'}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Client Approved
                          </Button>
                          <Button
                            variant={ownerDecision === 'rejected' ? 'default' : 'outline'}
                            onClick={() => setOwnerDecision('rejected')}
                            className={ownerDecision === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 'text-red-600 border-red-200 hover:bg-red-50'}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Client Rejected
                          </Button>
                        </div>
                      </div>

                      {ownerDecision && (
                        <div>
                          <Label htmlFor="owner-comments" className="text-sm font-medium text-gray-700">
                            Client Comments (Optional):
                          </Label>
                          <Textarea
                            id="owner-comments"
                            placeholder={
                              ownerDecision === 'approved' 
                                ? "Add any comments from the client about the approval..."
                                : "Add the client's reason for rejection..."
                            }
                            value={ownerComments}
                            onChange={(e) => setOwnerComments(e.target.value)}
                            rows={3}
                            className="mt-2"
                          />
                        </div>
                      )}

                      {ownerDecision && (
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setOwnerDecision(null);
                              setOwnerComments('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleOwnerDecision}
                            disabled={isLoading}
                            className={
                              ownerDecision === 'approved' 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-red-600 hover:bg-red-700'
                            }
                          >
                            {isLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Processing...
                              </>
                            ) : (
                              <>
                                {ownerDecision === 'approved' ? (
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                ) : (
                                  <XCircle className="h-4 w-4 mr-2" />
                                )}
                                Confirm {ownerDecision === 'approved' ? 'Approval' : 'Rejection'}
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}