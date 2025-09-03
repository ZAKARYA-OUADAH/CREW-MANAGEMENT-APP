import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  getStatusColor, 
  getStatusText, 
  getMissionTypeText,
  type MissionOrder 
} from './MissionOrderService';
import { 
  calculateTotalCompensation, 
  calculateMissionDuration, 
  formatDate, 
  isAutoApproved, 
  getTypeColor 
} from './MissionManagementHelpers';
import { 
  FileText, 
  Eye, 
  Download, 
  Calendar, 
  User, 
  Plane, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  AlertCircle,
  Zap,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  Receipt,
  Mail,
  Clock,
  UserCheck,
  UserX,
  Calculator,
  TrendingUp,
  Send
} from 'lucide-react';
import ClientRejectionDialog from './ClientRejectionDialog';
import ClientApprovalDialog from './ClientApprovalDialog';
import OwnerApprovalModal from './OwnerApprovalModal';

interface MissionCardProps {
  mission: MissionOrder;
  actionLoading: string | null;
  onLegacyApproval: (missionId: string) => void;
  onDateModificationAction: (missionId: string, action: 'approve' | 'reject') => void;
  onClientAction?: (missionId: string, action: 'approve' | 'reject', reason?: string) => void;
  onOwnerAction?: (missionId: string, action: 'approve' | 'reject', reason?: string) => void;
  onFinanceAction?: (missionId: string) => void; // Finance action
  onClientEmailAction?: (missionId: string) => void; // New client email action
}

export default function MissionCard({ 
  mission, 
  actionLoading, 
  onLegacyApproval, 
  onDateModificationAction,
  onClientAction,
  onOwnerAction,
  onFinanceAction,
  onClientEmailAction
}: MissionCardProps) {
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showOwnerApprovalModal, setShowOwnerApprovalModal] = useState(false);
  
  if (!mission || !mission.id) {
    return null; // Skip invalid missions
  }
  
  const compensation = calculateTotalCompensation(mission);
  const duration = calculateMissionDuration(mission.contract?.startDate, mission.contract?.endDate);
  const route = mission.flights && mission.flights.length > 0 
    ? mission.flights.map(f => f?.departure || 'Unknown').concat(mission.flights[mission.flights.length - 1]?.arrival || 'Unknown').join(' → ')
    : 'No flights';
  const autoApproved = isAutoApproved(mission);

  // Handler functions for modal callbacks
  const handleOwnerApprove = (comments?: string) => {
    if (onOwnerAction) {
      onOwnerAction(mission.id, 'approve', comments);
    }
    setShowOwnerApprovalModal(false);
  };

  const handleOwnerReject = (reason: string) => {
    if (onOwnerAction) {
      onOwnerAction(mission.id, 'reject', reason);
    }
    setShowOwnerApprovalModal(false);
  };

  const handleClientApprove = (comments?: string) => {
    if (onClientAction) {
      onClientAction(mission.id, 'approve', comments);
    }
    setShowApprovalDialog(false);
  };

  const handleClientReject = (reason: string) => {
    if (onClientAction) {
      onClientAction(mission.id, 'reject', reason);
    }
    setShowRejectionDialog(false);
  };

  return (
    <>
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <div className="flex items-center space-x-3 flex-wrap">
                  <Badge variant="outline" className="text-sm">{mission.id}</Badge>
                  <Badge className={getStatusColor(mission.status)}>
                    {getStatusText(mission.status)}
                  </Badge>
                  <Badge className={getTypeColor(mission.type)}>
                    {getMissionTypeText(mission.type)}
                  </Badge>
                  
                  {/* Status indicators */}
                  {mission.status === 'pending_approval' && (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      <Mail className="h-3 w-3 mr-1" />
                      Legacy: Manual Approval
                    </Badge>
                  )}

                  {mission.status === 'pending_finance_review' && (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                      <Calculator className="h-3 w-3 mr-1" />
                      Awaiting Finance
                    </Badge>
                  )}

                  {mission.status === 'finance_approved' && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Finance Approved
                    </Badge>
                  )}

                  {mission.status === 'waiting_owner_approval' && (
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Awaiting Owner
                    </Badge>
                  )}

                  {mission.status === 'pending_client_approval' && (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      <Clock className="h-3 w-3 mr-1" />
                      Awaiting Client
                    </Badge>
                  )}

                  {mission.status === 'approved' && mission.clientResponse?.approved && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Client Approved
                    </Badge>
                  )}

                  {mission.status === 'owner_rejected' && (
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                      <UserX className="h-3 w-3 mr-1" />
                      Owner Rejected
                    </Badge>
                  )}

                  {mission.status === 'client_rejected' && (
                    <Badge className="bg-red-100 text-red-800 border-red-200">
                      <UserX className="h-3 w-3 mr-1" />
                      Client Rejected
                    </Badge>
                  )}

                  {mission.status === 'pending_date_modification' && (
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                      <Edit3 className="h-3 w-3 mr-1" />
                      Modification Request
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(`/missions/${mission.id}`, '_blank')}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
                
                {/* Service Invoice button */}
                {mission.type === 'service' && mission.serviceInvoice && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`/missions/${mission.id}/invoice`, '_blank')}
                    className="text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    <Receipt className="h-4 w-4" />
                  </Button>
                )}
                
                {/* Final Order button */}
                {mission.status === 'validated' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`/missions/${mission.id}/final`, '_blank')}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                )}
                
                {/* Legacy mission approval button */}
                {mission.status === 'pending_approval' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onLegacyApproval(mission.id)}
                    disabled={actionLoading === mission.id}
                    className="bg-yellow-600 text-white hover:bg-yellow-700 border-yellow-600"
                  >
                    {actionLoading === mission.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4" />
                        <span>Legacy Approve</span>
                      </div>
                    )}
                  </Button>
                )}

                {/* Finance review action button */}
                {mission.status === 'pending_finance_review' && onFinanceAction && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onFinanceAction(mission.id)}
                    disabled={actionLoading === mission.id}
                    className="text-purple-600 border-purple-200 hover:bg-purple-50"
                  >
                    {actionLoading === mission.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4 mr-1" />
                        Finance Review
                      </>
                    )}
                  </Button>
                )}

                {/* Owner approval action button */}
                {mission.status === 'waiting_owner_approval' && onOwnerAction && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowOwnerApprovalModal(true)}
                    disabled={actionLoading === mission.id}
                    className="text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    {actionLoading === mission.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4 mr-1" />
                        Review
                      </>
                    )}
                  </Button>
                )}

                {/* Client email management action button */}
                {mission.status === 'pending_client_approval' && onClientEmailAction && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onClientEmailAction(mission.id)}
                    disabled={actionLoading === mission.id}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    {actionLoading === mission.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-1" />
                        Manage Email
                      </>
                    )}
                  </Button>
                )}

                {/* Client approval action buttons */}
                {mission.status === 'pending_client_approval' && onClientAction && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowRejectionDialog(true)}
                      disabled={actionLoading === mission.id}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      {actionLoading === mission.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <UserX className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowApprovalDialog(true)}
                      disabled={actionLoading === mission.id}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      {actionLoading === mission.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                    </Button>
                  </>
                )}

                {/* Date modification action buttons */}
                {mission.status === 'pending_date_modification' && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onDateModificationAction(mission.id, 'reject')}
                      disabled={actionLoading === mission.id}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      {actionLoading === mission.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <ThumbsDown className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onDateModificationAction(mission.id, 'approve')}
                      disabled={actionLoading === mission.id}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      {actionLoading === mission.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      ) : (
                        <ThumbsUp className="h-4 w-4" />
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Mission Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-900">{mission.crew?.name || 'Unknown'}</p>
                  <p className="text-gray-500">{mission.crew?.position || 'Unknown'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Plane className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-900">{mission.aircraft?.immat || 'Unknown'}</p>
                  <p className="text-gray-500">{mission.aircraft?.type || 'Unknown'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-900">{duration} day(s)</p>
                  <p className="text-gray-500">
                    {formatDate(mission.contract?.startDate)} - {formatDate(mission.contract?.endDate)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <div>
                  {mission.emailData?.fees && 
                   typeof mission.emailData.fees.totalWithMargin === 'number' && 
                   typeof mission.emailData.fees.totalFees === 'number' && 
                   typeof mission.emailData.fees.margin === 'number' ? (
                    <>
                      <p className="text-gray-900 font-medium">
                        {mission.emailData.fees.totalWithMargin.toFixed(2)} {mission.emailData.fees.currency || 'EUR'} (with margin)
                      </p>
                      <p className="text-gray-500">
                        Base: {mission.emailData.fees.totalFees.toFixed(2)} {mission.emailData.fees.currency || 'EUR'} + Margin: {mission.emailData.fees.margin.toFixed(2)} {mission.emailData.fees.currency || 'EUR'}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-900">{compensation.total.toLocaleString()} {compensation.currency}</p>
                      <p className="text-gray-500">
                        {mission.contract?.salaryAmount || 0} {compensation.currency}/{mission.contract?.salaryType === 'daily' ? 'day' : 'month'}
                        {mission.contract?.hasPerDiem && ` + ${mission.contract.perDiemAmount || 0} per diem`}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Flights */}
            <div className="space-y-2">
              <h4 className="text-sm text-gray-700">Flights:</h4>
              <div className="space-y-1">
                {mission.flights && mission.flights.length > 0 ? mission.flights.map((flight, index) => (
                  <div key={flight?.id || flight?.flight || `flight-${index}`} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">{flight?.flight || 'Unknown'}</Badge>
                      <span>{flight?.departure || 'Unknown'} → {flight?.arrival || 'Unknown'}</span>
                    </div>
                    <div className="text-gray-600">
                      {formatDate(flight?.date)} {flight?.time || 'No time'}
                    </div>
                  </div>
                )) : (
                  <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
                    No flights associated with this mission
                  </div>
                )}
              </div>
            </div>

            {/* Status-specific alerts */}
            {mission.status === 'pending_approval' && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription>
                  <strong className="text-yellow-800">Legacy Mission Pending Approval</strong>
                  <p className="text-yellow-700 text-sm mt-1">
                    This is a legacy mission that requires manual approval. Modern missions are created with email data included.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {mission.status === 'pending_finance_review' && (
              <Alert className="border-purple-200 bg-purple-50">
                <Calculator className="h-4 w-4 text-purple-600" />
                <AlertDescription>
                  <strong className="text-purple-800">Awaiting Finance Review</strong>
                  <p className="text-purple-700 text-sm mt-1">
                    This mission needs finance department review for margin calculation and billing setup. 
                    Client: {mission.emailData?.ownerEmail || 'N/A'} | 
                    Base Cost: {(mission.emailData?.fees?.totalFees || 0).toFixed(2)} {mission.emailData?.fees?.currency || 'EUR'}
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {mission.status === 'waiting_owner_approval' && (
              <Alert className="border-orange-200 bg-orange-50">
                <UserCheck className="h-4 w-4 text-orange-600" />
                <AlertDescription>
                  <strong className="text-orange-800">Awaiting Owner Approval</strong>
                  <p className="text-orange-700 text-sm mt-1">
                    This mission needs owner approval before being sent to the client. 
                    Once approved, it will be forwarded to {mission.emailData?.ownerEmail || 'the client'} for final validation.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            {mission.status === 'pending_client_approval' && (
              <Alert className="border-blue-200 bg-blue-50">
                <Clock className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <strong className="text-blue-800">Awaiting Client Validation</strong>
                  <p className="text-blue-700 text-sm mt-1">
                    Email template generated for client: {mission.emailData?.ownerEmail || 'N/A'}. 
                    Use the "Manage Email" button to send the approval request to the client.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <OwnerApprovalModal
        open={showOwnerApprovalModal}
        onOpenChange={setShowOwnerApprovalModal}
        mission={mission}
        onApprove={handleOwnerApprove}
        onReject={handleOwnerReject}
        isLoading={actionLoading === mission.id}
      />

      <ClientApprovalDialog
        open={showApprovalDialog}
        onOpenChange={setShowApprovalDialog}
        mission={mission}
        onApprove={handleClientApprove}
        isLoading={actionLoading === mission.id}
      />

      <ClientRejectionDialog
        open={showRejectionDialog}
        onOpenChange={setShowRejectionDialog}
        mission={mission}
        onReject={handleClientReject}
        isLoading={actionLoading === mission.id}
      />
    </>
  );
}