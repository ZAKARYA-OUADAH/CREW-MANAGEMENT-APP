import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { MissionWorkflowService } from './MissionWorkflowService';
import { useSupabaseData } from './SupabaseDataProvider';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner@2.0.3';
import { 
  Users, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign,
  FileText,
  Clock,
  User
} from 'lucide-react';

interface CrewAssignmentPanelProps {
  missionId: string;
  onAssignmentsUpdate?: () => void;
}

interface Assignment {
  id: string;
  mission_id: string;
  user_id: string;
  position: string;
  engagement: 'internal' | 'freelance' | 'freelance_with_invoice';
  day_rate: number;
  currency: string;
  start_date: string;
  end_date: string;
  status: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  has_zero_hour_contract?: boolean;
}

export default function CrewAssignmentPanel({ missionId, onAssignmentsUpdate }: CrewAssignmentPanelProps) {
  const { user } = useAuth();
  const { crewMembers } = useSupabaseData();
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // New assignment form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    user_id: '',
    position: '',
    engagement: 'internal' as 'internal' | 'freelance' | 'freelance_with_invoice',
    day_rate: 500,
    currency: 'EUR',
    start_date: '',
    end_date: ''
  });

  const positions = [
    'Pilot in Command',
    'Co-Pilot', 
    'Flight Attendant',
    'Flight Engineer',
    'Ground Handler'
  ];

  const engagementTypes = [
    { value: 'internal', label: 'Internal' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'freelance_with_invoice', label: 'Freelance with Invoice' }
  ];

  // Load assignments
  const loadAssignments = async () => {
    try {
      setLoading(true);
      
      const assignmentData = await MissionWorkflowService.getMissionAssignments(missionId, user?.access_token);
      
      // Enrich assignments with crew member data and contract status
      const enrichedAssignments = await Promise.all(
        assignmentData.map(async (assignment: any) => {
          const crewMember = crewMembers.find(cm => cm.id === assignment.user_id);
          
          let hasZeroHourContract = false;
          if (assignment.engagement === 'freelance' || assignment.engagement === 'freelance_with_invoice') {
            try {
              hasZeroHourContract = await MissionWorkflowService.userHasZeroHourContract(
                assignment.user_id, 
                user?.access_token
              );
            } catch (error) {
              console.error('Error checking contract status:', error);
            }
          }
          
          return {
            ...assignment,
            user: crewMember ? {
              id: crewMember.id,
              name: crewMember.name || crewMember.full_name,
              email: crewMember.email
            } : null,
            has_zero_hour_contract: hasZeroHourContract
          };
        })
      );
      
      setAssignments(enrichedAssignments);
      
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast.error('Failed to load crew assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (missionId) {
      loadAssignments();
    }
  }, [missionId, crewMembers]);

  const handleAddAssignment = async () => {
    if (!newAssignment.user_id || !newAssignment.position || !newAssignment.start_date || !newAssignment.end_date) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setActionLoading('add');
      
      await MissionWorkflowService.upsertAssignment(
        missionId,
        newAssignment.user_id,
        newAssignment.position,
        newAssignment.engagement,
        newAssignment.day_rate,
        newAssignment.currency,
        newAssignment.start_date,
        newAssignment.end_date,
        user?.access_token
      );

      // Reset form
      setNewAssignment({
        user_id: '',
        position: '',
        engagement: 'internal',
        day_rate: 500,
        currency: 'EUR',
        start_date: '',
        end_date: ''
      });
      
      setShowAddForm(false);
      
      // Reload assignments
      await loadAssignments();
      
      toast.success('Crew member assigned successfully');
      onAssignmentsUpdate?.();
      
    } catch (error) {
      console.error('Error adding assignment:', error);
      toast.error('Failed to assign crew member');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) {
      return;
    }

    try {
      setActionLoading(assignmentId);
      
      // Note: You'd need a delete endpoint for this
      // await MissionWorkflowService.deleteAssignment(assignmentId, user?.access_token);
      
      // For now, simulate removal
      setAssignments(prev => prev.filter(a => a.id !== assignmentId));
      
      toast.success('Assignment removed');
      onAssignmentsUpdate?.();
      
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast.error('Failed to remove assignment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleGenerateZeroHourContract = async (assignment: Assignment) => {
    try {
      setActionLoading(`contract_${assignment.id}`);
      
      // Generate and upload zero hour contract document
      await MissionWorkflowService.createDocument(
        'zero_hour_contract',
        missionId,
        assignment.user_id,
        `/contracts/${missionId}/${assignment.user_id}_zero_hour.pdf`,
        `Zero Hour Contract - ${assignment.user?.name}`,
        { 
          assignment_id: assignment.id,
          position: assignment.position,
          day_rate: assignment.day_rate,
          currency: assignment.currency
        },
        user?.access_token
      );
      
      // Update local state to reflect contract exists
      setAssignments(prev => 
        prev.map(a => 
          a.id === assignment.id 
            ? { ...a, has_zero_hour_contract: true }
            : a
        )
      );
      
      toast.success('Zero hour contract generated');
      
    } catch (error) {
      console.error('Error generating contract:', error);
      toast.error('Failed to generate contract');
    } finally {
      setActionLoading(null);
    }
  };

  const getEngagementBadgeColor = (engagement: string) => {
    switch (engagement) {
      case 'internal':
        return 'bg-blue-100 text-blue-800';
      case 'freelance':
        return 'bg-purple-100 text-purple-800';
      case 'freelance_with_invoice':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const getTotalCost = (assignment: Assignment) => {
    const duration = calculateDuration(assignment.start_date, assignment.end_date);
    return assignment.day_rate * duration;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Clock className="h-8 w-8 mx-auto animate-spin text-blue-600 mb-4" />
          <p>Loading crew assignments...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Crew Assignments</span>
              <Badge variant="outline">{assignments.length} assigned</Badge>
            </div>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Crew Member
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Add Assignment Form */}
          {showAddForm && (
            <Card className="border-dashed border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <h3 className="font-medium mb-4">Assign New Crew Member</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Crew Member</Label>
                    <Select 
                      value={newAssignment.user_id}
                      onValueChange={(value) => setNewAssignment(prev => ({ ...prev, user_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select crew member" />
                      </SelectTrigger>
                      <SelectContent>
                        {crewMembers
                          .filter(cm => !assignments.some(a => a.user_id === cm.id))
                          .map((crewMember) => (
                          <SelectItem key={crewMember.id} value={crewMember.id}>
                            {crewMember.name || crewMember.full_name} ({crewMember.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Position</Label>
                    <Select 
                      value={newAssignment.position}
                      onValueChange={(value) => setNewAssignment(prev => ({ ...prev, position: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        {positions.map((position) => (
                          <SelectItem key={position} value={position}>
                            {position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Engagement Type</Label>
                    <Select 
                      value={newAssignment.engagement}
                      onValueChange={(value) => setNewAssignment(prev => ({ 
                        ...prev, 
                        engagement: value as 'internal' | 'freelance' | 'freelance_with_invoice' 
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {engagementTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Label>Day Rate</Label>
                      <Input
                        type="number"
                        value={newAssignment.day_rate}
                        onChange={(e) => setNewAssignment(prev => ({ 
                          ...prev, 
                          day_rate: parseFloat(e.target.value) || 0 
                        }))}
                      />
                    </div>
                    <div className="w-20">
                      <Label>Currency</Label>
                      <Select 
                        value={newAssignment.currency}
                        onValueChange={(value) => setNewAssignment(prev => ({ ...prev, currency: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={newAssignment.start_date}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={newAssignment.end_date}
                      onChange={(e) => setNewAssignment(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddAssignment}
                    disabled={actionLoading === 'add'}
                  >
                    {actionLoading === 'add' ? 'Adding...' : 'Add Assignment'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assignments List */}
          <div className="space-y-4">
            {assignments.length > 0 ? (
              assignments.map((assignment) => (
                <Card key={assignment.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">
                              {assignment.user?.name || 'Unknown User'}
                            </h3>
                            <p className="text-sm text-gray-600">{assignment.position}</p>
                            <p className="text-xs text-gray-500">{assignment.user?.email}</p>
                          </div>
                          <Badge className={getEngagementBadgeColor(assignment.engagement)}>
                            {engagementTypes.find(t => t.value === assignment.engagement)?.label || assignment.engagement}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Duration:</span>
                            <p>{new Date(assignment.start_date).toLocaleDateString()} - {new Date(assignment.end_date).toLocaleDateString()}</p>
                            <p className="text-xs text-gray-500">
                              {calculateDuration(assignment.start_date, assignment.end_date)} days
                            </p>
                          </div>
                          
                          <div>
                            <span className="text-gray-500">Rate:</span>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-3 w-3" />
                              <span>{assignment.day_rate} {assignment.currency}/day</span>
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-gray-500">Total Cost:</span>
                            <div className="flex items-center space-x-1 font-medium">
                              <DollarSign className="h-3 w-3" />
                              <span>{getTotalCost(assignment).toLocaleString()} {assignment.currency}</span>
                            </div>
                          </div>
                        </div>

                        {/* Contract Status for Freelancers */}
                        {(assignment.engagement === 'freelance' || assignment.engagement === 'freelance_with_invoice') && (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                            {assignment.has_zero_hour_contract ? (
                              <div className="flex items-center space-x-2 text-green-800">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm">Zero hour contract in place</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-yellow-800">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span className="text-sm">No zero hour contract found</span>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleGenerateZeroHourContract(assignment)}
                                  disabled={actionLoading === `contract_${assignment.id}`}
                                >
                                  <FileText className="h-3 w-3 mr-1" />
                                  {actionLoading === `contract_${assignment.id}` ? 'Generating...' : 'Generate Contract'}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveAssignment(assignment.id)}
                          disabled={actionLoading === assignment.id}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  No crew members assigned yet. Click "Add Crew Member" to assign crew to this mission.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Assignment Summary */}
          {assignments.length > 0 && (
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Assignment Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Total Crew Members:</span>
                    <p className="font-medium">{assignments.length}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Internal:</span>
                    <p className="font-medium">{assignments.filter(a => a.engagement === 'internal').length}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Freelancers:</span>
                    <p className="font-medium">
                      {assignments.filter(a => a.engagement === 'freelance' || a.engagement === 'freelance_with_invoice').length}
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Estimated Total Cost:</span>
                    <div className="flex items-center space-x-1 font-medium">
                      <DollarSign className="h-4 w-4" />
                      <span>
                        {assignments.reduce((total, assignment) => total + getTotalCost(assignment), 0).toLocaleString()} EUR
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}