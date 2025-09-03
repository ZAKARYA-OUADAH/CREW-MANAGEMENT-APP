import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { MissionWorkflowService } from './MissionWorkflowService';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner@2.0.3';
import { 
  FileText, 
  DollarSign, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Send, 
  Eye, 
  Download,
  Upload,
  RefreshCw,
  Plane,
  Mail,
  FileCheck,
  Receipt
} from 'lucide-react';

interface MissionWorkflowManagerProps {
  missionId: string;
  onStatusChange?: (newStatus: string) => void;
}

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  icon: React.ReactNode;
}

export default function MissionWorkflowManager({ missionId, onStatusChange }: MissionWorkflowManagerProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Workflow data
  const [mission, setMission] = useState<any>(null);
  const [quote, setQuote] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [workflowStatus, setWorkflowStatus] = useState<any>(null);

  // UI states
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [quoteItems, setQuoteItems] = useState<any[]>([]);

  // Define workflow steps
  const getWorkflowSteps = (): WorkflowStep[] => [
    {
      id: 'request',
      title: 'Mission Request',
      description: 'Mission request created',
      status: mission ? 'completed' : 'pending',
      icon: <Plane className="h-4 w-4" />
    },
    {
      id: 'quote',
      title: 'Devis/Quote',
      description: quote ? 'Quote created and sent to client' : 'Create quote for client approval',
      status: quote ? (quote.client_approved ? 'completed' : 'in_progress') : 'pending',
      icon: <FileText className="h-4 w-4" />
    },
    {
      id: 'approval',
      title: 'Client Approval',
      description: quote?.client_approved ? 'Client approved the quote' : 'Waiting for client approval',
      status: quote?.client_approved ? 'completed' : (quote ? 'in_progress' : 'pending'),
      icon: <CheckCircle className="h-4 w-4" />
    },
    {
      id: 'assignments',
      title: 'Crew Assignments',
      description: `${assignments.length} crew member(s) assigned`,
      status: assignments.length > 0 ? 'completed' : 'pending',
      icon: <Users className="h-4 w-4" />
    },
    {
      id: 'contracts',
      title: 'Contracts & Orders',
      description: 'Generate mission orders and zero-hour contracts',
      status: quote?.client_approved && assignments.length > 0 ? 'completed' : 'pending',
      icon: <FileCheck className="h-4 w-4" />
    },
    {
      id: 'execution',
      title: 'Mission Ongoing',
      description: 'Mission execution and monitoring',
      status: mission?.status === 'in_progress' ? 'in_progress' : 'pending',
      icon: <Clock className="h-4 w-4" />
    },
    {
      id: 'invoicing',
      title: 'Freelance Invoices',
      description: `${invoices.filter(i => i.status === 'approved').length}/${invoices.length} invoices processed`,
      status: invoices.length > 0 ? (invoices.every(i => i.status === 'approved') ? 'completed' : 'in_progress') : 'pending',
      icon: <Receipt className="h-4 w-4" />
    },
    {
      id: 'validation',
      title: 'Final Validation',
      description: 'Final mission validation and client invoicing',
      status: mission?.validation_status === 'validated' ? 'completed' : 'pending',
      icon: <CheckCircle className="h-4 w-4" />
    }
  ];

  // Load all workflow data
  const loadWorkflowData = async () => {
    try {
      setLoading(true);
      
      // Load parallel data
      const [
        missionAssignments,
        clientsData,
        workflowStatusData
      ] = await Promise.all([
        MissionWorkflowService.getMissionAssignments(missionId, user?.access_token),
        MissionWorkflowService.getClients(user?.access_token),
        MissionWorkflowService.getMissionWorkflowStatus(user?.access_token)
      ]);

      setAssignments(missionAssignments || []);
      setClients(clientsData || []);
      setWorkflowStatus(workflowStatusData?.find(w => w.mission_id === missionId) || null);

      // Note: In a real implementation, you'd also load mission, quote, and invoices data
      // For now, we'll simulate this data
      setMission({
        id: missionId,
        status: 'pending',
        validation_status: 'pending'
      });

    } catch (error) {
      console.error('Error loading workflow data:', error);
      toast.error('Failed to load workflow data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (missionId) {
      loadWorkflowData();
    }
  }, [missionId]);

  // Step 1: Create and send quote
  const handleCreateQuote = async () => {
    if (!selectedClient) {
      toast.error('Please select a client first');
      return;
    }

    try {
      setActionLoading('quote');
      
      // Create quote
      const newQuote = await MissionWorkflowService.createMissionQuote(
        missionId,
        selectedClient,
        15, // 15% fee
        'EUR',
        user?.access_token
      );

      // Create quote items
      if (quoteItems.length > 0) {
        await MissionWorkflowService.createMissionQuoteItems(
          newQuote[0]?.id,
          quoteItems,
          user?.access_token
        );
      }

      // Generate client approval token
      const approval = await MissionWorkflowService.generateClientApproval(
        missionId,
        newQuote[0]?.id,
        selectedClient,
        user?.access_token
      );

      setQuote({ ...newQuote[0], approval_token: approval.approval_token });
      
      toast.success('Quote created and sent to client');
      
    } catch (error) {
      console.error('Error creating quote:', error);
      toast.error('Failed to create quote');
    } finally {
      setActionLoading(null);
    }
  };

  // Step 2: Handle crew assignments
  const handleAssignCrew = async (userId: string, position: string, engagement: string) => {
    try {
      setActionLoading('assignment');

      await MissionWorkflowService.upsertAssignment(
        missionId,
        userId,
        position,
        engagement,
        500, // day rate
        'EUR',
        '2024-01-01', // start date
        '2024-01-02', // end date
        user?.access_token
      );

      // Reload assignments
      const updatedAssignments = await MissionWorkflowService.getMissionAssignments(
        missionId,
        user?.access_token
      );
      setAssignments(updatedAssignments);

      toast.success('Crew member assigned');

    } catch (error) {
      console.error('Error assigning crew:', error);
      toast.error('Failed to assign crew member');
    } finally {
      setActionLoading(null);
    }
  };

  // Step 3: Handle contract generation
  const handleGenerateContracts = async () => {
    try {
      setActionLoading('contracts');

      // Check for zero-hour contracts
      for (const assignment of assignments) {
        if (assignment.engagement === 'freelance') {
          const hasContract = await MissionWorkflowService.userHasZeroHourContract(
            assignment.user_id,
            user?.access_token
          );

          if (!hasContract) {
            // Generate contract document
            await MissionWorkflowService.createDocument(
              'zero_hour_contract',
              missionId,
              assignment.user_id,
              `/contracts/${missionId}/${assignment.user_id}.pdf`,
              `Zero Hour Contract - ${assignment.user_id}`,
              { assignment_id: assignment.id },
              user?.access_token
            );
          }
        }
      }

      // Generate temp assignment letter
      if (quote?.client_approved) {
        await MissionWorkflowService.createDocument(
          'temp_assignment_letter',
          missionId,
          null,
          `/assignments/${missionId}/temp_letter.pdf`,
          'Temporary Assignment Letter',
          { assignments: assignments.map(a => a.id) },
          user?.access_token
        );
      }

      toast.success('Contracts and orders generated');

    } catch (error) {
      console.error('Error generating contracts:', error);
      toast.error('Failed to generate contracts');
    } finally {
      setActionLoading(null);
    }
  };

  // Step 4: Handle invoice processing
  const handleProcessInvoice = async (invoiceId: string, status: string) => {
    try {
      setActionLoading('invoice');

      await MissionWorkflowService.updateSupplierInvoiceStatus(
        invoiceId,
        status,
        user?.access_token
      );

      // Reload invoices (you'd fetch these from the API)
      toast.success(`Invoice ${status}`);

    } catch (error) {
      console.error('Error processing invoice:', error);
      toast.error('Failed to process invoice');
    } finally {
      setActionLoading(null);
    }
  };

  // Step 5: Final validation
  const handleFinalValidation = async () => {
    try {
      setActionLoading('validation');

      await MissionWorkflowService.validateAndInvoice(missionId, user?.access_token);

      // Generate final assignment letter
      await MissionWorkflowService.createDocument(
        'final_assignment_letter',
        missionId,
        null,
        `/assignments/${missionId}/final_letter.pdf`,
        'Final Assignment Letter',
        { validation_complete: true },
        user?.access_token
      );

      setMission(prev => ({ ...prev, validation_status: 'validated' }));
      
      toast.success('Mission validated and final documents generated');
      onStatusChange?.('completed');

    } catch (error) {
      console.error('Error in final validation:', error);
      toast.error('Failed to complete final validation');
    } finally {
      setActionLoading(null);
    }
  };

  const getStepStatus = (step: WorkflowStep) => {
    switch (step.status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getProgressPercentage = () => {
    const steps = getWorkflowSteps();
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return (completedSteps / steps.length) * 100;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 mx-auto animate-spin text-blue-600 mb-4" />
          <p>Loading workflow data...</p>
        </CardContent>
      </Card>
    );
  }

  const workflowSteps = getWorkflowSteps();
  const progressPercentage = getProgressPercentage();

  return (
    <div className="space-y-6">
      {/* Workflow Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plane className="h-5 w-5" />
            <span>Mission Workflow Progress</span>
          </CardTitle>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>
        </CardHeader>
      </Card>

      {/* Workflow Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {workflowSteps.map((step, index) => (
          <Card key={step.id} className={`relative ${
            step.status === 'completed' ? 'ring-2 ring-green-200' :
            step.status === 'in_progress' ? 'ring-2 ring-blue-200' : ''
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${getStepStatus(step)}`}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium text-sm">{step.title}</h3>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getStepStatus(step)}`}
                    >
                      {step.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600">{step.description}</p>
                  
                  {/* Step-specific actions */}
                  {step.id === 'quote' && !quote && (
                    <Button
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => setActiveTab('quote')}
                    >
                      Create Quote
                    </Button>
                  )}
                  
                  {step.id === 'assignments' && assignments.length === 0 && (
                    <Button
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => setActiveTab('assignments')}
                    >
                      Assign Crew
                    </Button>
                  )}
                  
                  {step.id === 'contracts' && quote?.client_approved && assignments.length > 0 && (
                    <Button
                      size="sm"
                      className="mt-2 w-full"
                      onClick={handleGenerateContracts}
                      disabled={actionLoading === 'contracts'}
                    >
                      Generate Documents
                    </Button>
                  )}
                  
                  {step.id === 'validation' && step.status !== 'completed' && (
                    <Button
                      size="sm"
                      className="mt-2 w-full"
                      onClick={handleFinalValidation}
                      disabled={actionLoading === 'validation'}
                    >
                      Final Validation
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Step connector */}
              {index < workflowSteps.length - 1 && (
                <div className="absolute top-1/2 -right-2 w-4 h-0.5 bg-gray-200 hidden lg:block" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Workflow Management */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quote">Quote</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="execution">Execution</TabsTrigger>
          <TabsTrigger value="invoicing">Invoicing</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflowSteps.map((step) => (
                  <div key={step.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className={`p-2 rounded ${getStepStatus(step)}`}>
                      {step.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{step.title}</h3>
                        <Badge className={getStepStatus(step)}>
                          {step.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quote" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quote Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!quote ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Client</label>
                    <select 
                      className="w-full p-2 border rounded"
                      value={selectedClient}
                      onChange={(e) => setSelectedClient(e.target.value)}
                    >
                      <option value="">Choose a client...</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.name} ({client.contact_email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button 
                    onClick={handleCreateQuote}
                    disabled={!selectedClient || actionLoading === 'quote'}
                    className="w-full"
                  >
                    {actionLoading === 'quote' ? 'Creating Quote...' : 'Create & Send Quote'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Quote created and sent to client. 
                      {quote.client_approved ? ' Client has approved the quote.' : ' Awaiting client approval.'}
                    </AlertDescription>
                  </Alert>
                  
                  {quote.approval_token && (
                    <div className="p-3 bg-blue-50 rounded border">
                      <p className="text-sm font-medium">Client Approval Link:</p>
                      <code className="text-xs break-all">
                        {window.location.origin}/client-approval?token={quote.approval_token}
                      </code>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Crew Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignments.length > 0 ? (
                  assignments.map((assignment, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{assignment.position}</p>
                          <p className="text-sm text-gray-600">
                            {assignment.engagement} • {assignment.day_rate} {assignment.currency}/day
                          </p>
                        </div>
                        <Badge 
                          className={
                            assignment.engagement === 'internal' ? 'bg-blue-100 text-blue-800' :
                            assignment.engagement === 'freelance' ? 'bg-purple-100 text-purple-800' :
                            'bg-green-100 text-green-800'
                          }
                        >
                          {assignment.engagement}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No crew members assigned yet. Use the crew assignment tools to add crew members to this mission.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="execution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mission Execution</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Check dates & payments panel. Monitor crew schedules and payment status during mission execution.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoicing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Freelance Invoice Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {invoices.length > 0 ? (
                  invoices.map((invoice, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Invoice #{invoice.invoice_number}</p>
                          <p className="text-sm text-gray-600">
                            {invoice.amount} {invoice.currency}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Badge className={
                            invoice.status === 'approved' ? 'bg-green-100 text-green-800' :
                            invoice.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {invoice.status}
                          </Badge>
                          {invoice.status === 'uploaded' && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => handleProcessInvoice(invoice.id, 'approved')}
                              >
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleProcessInvoice(invoice.id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No freelance invoices uploaded yet. Freelancers will upload their invoices here after mission completion.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}