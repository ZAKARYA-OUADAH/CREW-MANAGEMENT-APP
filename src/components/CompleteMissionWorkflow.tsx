import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import MissionWorkflowManager from './MissionWorkflowManager';
import CrewAssignmentPanel from './CrewAssignmentPanel';
import MissionExecutionPanel from './MissionExecutionPanel';
import { MissionWorkflowService } from './MissionWorkflowService';
import { useSupabaseData } from './SupabaseDataProvider';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner@2.0.3';
import { 
  ArrowLeft,
  Plane, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  DollarSign,
  Calendar,
  RefreshCw,
  Settings,
  Eye,
  Mail,
  Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MissionWorkflowData {
  mission: any;
  quote: any;
  assignments: any[];
  workflowStatus: any;
  clientInfo: any;
}

export default function CompleteMissionWorkflow() {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { missions, clients } = useSupabaseData();
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('workflow');
  const [workflowData, setWorkflowData] = useState<MissionWorkflowData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load complete workflow data
  const loadWorkflowData = async () => {
    try {
      setLoading(true);
      
      // Find mission in existing data
      const mission = missions.find(m => m.id === missionId);
      if (!mission) {
        toast.error('Mission not found');
        navigate('/manage-missions');
        return;
      }

      // Load workflow-specific data
      const [
        assignments,
        workflowStatus
      ] = await Promise.all([
        MissionWorkflowService.getMissionAssignments(missionId!, user?.access_token),
        MissionWorkflowService.getMissionWorkflowStatus(user?.access_token)
      ]);

      // Find client info
      const clientInfo = clients.find(c => c.name === mission.client) || null;

      // For demo purposes, create a mock quote if client approved
      const mockQuote = mission.validation_status === 'validated' ? {
        id: `quote_${missionId}`,
        mission_id: missionId,
        client_id: clientInfo?.id || 'unknown',
        client_approved: true,
        total_amount: mission.estimated_cost || 5000,
        currency: 'EUR',
        created_at: new Date().toISOString()
      } : null;

      setWorkflowData({
        mission,
        quote: mockQuote,
        assignments: assignments || [],
        workflowStatus: workflowStatus?.find(w => w.mission_id === missionId) || null,
        clientInfo
      });

    } catch (error) {
      console.error('Error loading workflow data:', error);
      toast.error('Failed to load mission workflow data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (missionId) {
      loadWorkflowData();
    }
  }, [missionId, missions, clients]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWorkflowData();
    setRefreshing(false);
    toast.success('Workflow data refreshed');
  };

  const handleStatusChange = (newStatus: string) => {
    if (workflowData) {
      setWorkflowData(prev => ({
        ...prev!,
        mission: { ...prev!.mission, status: newStatus }
      }));
    }
  };

  const handleAssignmentsUpdate = () => {
    // Reload assignments when they're updated
    loadWorkflowData();
  };

  // Get workflow progress
  const getWorkflowProgress = () => {
    if (!workflowData) return 0;
    
    let completedSteps = 0;
    const totalSteps = 8; // Total workflow steps
    
    // Step 1: Mission Request
    if (workflowData.mission) completedSteps++;
    
    // Step 2: Quote
    if (workflowData.quote) completedSteps++;
    
    // Step 3: Client Approval
    if (workflowData.quote?.client_approved) completedSteps++;
    
    // Step 4: Assignments
    if (workflowData.assignments.length > 0) completedSteps++;
    
    // Step 5: Contracts
    if (workflowData.quote?.client_approved && workflowData.assignments.length > 0) completedSteps++;
    
    // Step 6: Execution
    if (workflowData.mission.status === 'in_progress' || workflowData.mission.status === 'completed') completedSteps++;
    
    // Step 7: Invoicing (simplified check)
    if (workflowData.mission.status === 'completed') completedSteps++;
    
    // Step 8: Final Validation
    if (workflowData.mission.validation_status === 'validated') completedSteps++;
    
    return (completedSteps / totalSteps) * 100;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getValidationColor = (status: string) => {
    switch (status) {
      case 'validated':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <RefreshCw className="h-8 w-8 mx-auto animate-spin text-blue-600 mb-4" />
            <p>Loading mission workflow...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!workflowData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-red-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Mission Not Found</h3>
            <p className="text-gray-600 mb-4">The requested mission could not be loaded.</p>
            <Button onClick={() => navigate('/manage-missions')}>
              Return to Mission Management
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = getWorkflowProgress();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/manage-missions')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Missions</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {workflowData.mission.mission_number}
            </h1>
            <p className="text-gray-600">{workflowData.mission.client}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Mission Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plane className="h-5 w-5" />
              <span>Mission Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Flight Details */}
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-gray-500">FLIGHT DETAILS</h3>
                <div className="space-y-2">
                  <p className="font-semibold">{workflowData.mission.aircraft_type}</p>
                  <div className="text-sm text-gray-600">
                    <p>{workflowData.mission.departure?.airport} → {workflowData.mission.arrival?.airport}</p>
                    <p>{new Date(workflowData.mission.departure?.date).toLocaleDateString()}</p>
                    <p>{workflowData.mission.departure?.time} - {workflowData.mission.arrival?.time}</p>
                  </div>
                </div>
              </div>

              {/* Status & Progress */}
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-gray-500">STATUS & PROGRESS</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(workflowData.mission.status)}>
                      {workflowData.mission.status?.replace('_', ' ')}
                    </Badge>
                    <Badge className={getValidationColor(workflowData.mission.validation_status)}>
                      {workflowData.mission.validation_status || 'pending'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Workflow Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="w-full" />
                  </div>
                </div>
              </div>

              {/* Financial */}
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-gray-500">FINANCIAL</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Budget:</span>
                    <span>{workflowData.mission.budget?.toLocaleString() || 'N/A'}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated:</span>
                    <span>{workflowData.mission.estimated_cost?.toLocaleString() || 'N/A'}€</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Quote Total:</span>
                    <span>{workflowData.quote?.total_amount?.toLocaleString() || 'TBD'}€</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Client</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="font-semibold">{workflowData.mission.client}</p>
                {workflowData.clientInfo && (
                  <p className="text-sm text-gray-600">{workflowData.clientInfo.contact_name}</p>
                )}
              </div>
              
              {workflowData.clientInfo && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-3 w-3 text-gray-400" />
                    <span>{workflowData.clientInfo.contact_email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-3 w-3 text-gray-400" />
                    <span>{workflowData.clientInfo.contact_phone}</span>
                  </div>
                </div>
              )}
              
              <div className="pt-2 border-t">
                {workflowData.quote?.client_approved ? (
                  <div className="flex items-center space-x-2 text-green-800 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span>Quote Approved</span>
                  </div>
                ) : workflowData.quote ? (
                  <div className="flex items-center space-x-2 text-blue-800 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>Awaiting Approval</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-gray-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>Quote Pending</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Management */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workflow" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Workflow</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Assignments</span>
          </TabsTrigger>
          <TabsTrigger value="execution" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Execution</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Documents</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workflow">
          <MissionWorkflowManager
            missionId={missionId!}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>

        <TabsContent value="assignments">
          <CrewAssignmentPanel
            missionId={missionId!}
            onAssignmentsUpdate={handleAssignmentsUpdate}
          />
        </TabsContent>

        <TabsContent value="execution">
          <MissionExecutionPanel
            missionId={missionId!}
            mission={workflowData.mission}
            assignments={workflowData.assignments}
          />
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents & Contracts</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Document management system will be integrated here. This will include:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Mission orders and assignment letters</li>
                    <li>Zero-hour contracts for freelancers</li>
                    <li>Client quotes and approvals</li>
                    <li>Invoice documents and receipts</li>
                    <li>Final mission documentation</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-sm">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {!workflowData.quote && (
              <Button size="sm" onClick={() => setActiveTab('workflow')}>
                Create Quote
              </Button>
            )}
            
            {workflowData.quote && !workflowData.quote.client_approved && (
              <Button size="sm" variant="outline" onClick={() => setActiveTab('workflow')}>
                Send Approval Link
              </Button>
            )}
            
            {workflowData.assignments.length === 0 && (
              <Button size="sm" onClick={() => setActiveTab('assignments')}>
                Assign Crew
              </Button>
            )}
            
            {workflowData.mission.status === 'confirmed' && (
              <Button size="sm" onClick={() => setActiveTab('execution')}>
                Start Mission
              </Button>
            )}
            
            {workflowData.mission.status === 'in_progress' && (
              <Button size="sm" onClick={() => setActiveTab('execution')}>
                Monitor Execution
              </Button>
            )}
            
            <Button size="sm" variant="outline">
              <Eye className="h-3 w-3 mr-1" />
              View Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}