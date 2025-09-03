import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, Clock, Plane, User, DollarSign, Plus, Settings } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner';
import { apiClient } from '../utils/supabase/client';

interface TestMission {
  id: string;
  type: 'extra_day' | 'freelance' | 'service';
  status: 'pending_validation' | 'completed' | 'approved';
  createdAt: string;
  completedAt: string;
  validationRequestedAt: string;
  crew: {
    id: string;
    name: string;
    position: string;
    type: string;
    ggid: string;
    email: string;
  };
  aircraft: {
    id: string;
    immat: string;
    type: string;
  };
  flights: Array<{
    id: string;
    flight: string;
    departure: string;
    arrival: string;
    date: string;
    time: string;
  }>;
  contract: {
    startDate: string;
    endDate: string;
    salaryAmount: number;
    salaryCurrency: string;
    salaryType: 'daily' | 'monthly';
    hasPerDiem: boolean;
    perDiemAmount?: number;
    perDiemCurrency?: string;
    additionalNotes?: string;
  };
  validation?: {
    requestedAt: string;
  };
}

// Removed mock mission generation functions
// All missions should be created through the proper mission creation workflow





export default function MissionTestGenerator() {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [exampleMissions, setExampleMissions] = useState<TestMission[]>([]);

  const generateExamples = () => {
    toast.error('Mock mission generation has been disabled');
  };

  const testApiConnection = async () => {
    try {
      console.log('=== API CONNECTION TEST ===');
      console.log('Testing API connection...');
      const result = await apiClient.healthCheck();
      console.log('Health check result:', result);
      toast.success('API connection successful');
    } catch (error) {
      console.error('API connection failed:', error);
      toast.error('API connection failed: ' + error.message);
    }
  };

  const testAuthentication = async () => {
    try {
      console.log('=== AUTHENTICATION TEST ===');
      console.log('Current user:', user);
      console.log('API Client token:', apiClient.accessToken ? 'SET (length: ' + apiClient.accessToken.length + ')' : 'NOT SET');
      
      const result = await apiClient.testAuthDebug();
      console.log('Auth test result:', result);
      toast.success('Authentication test successful');
    } catch (error) {
      console.error('Authentication test failed:', error);
      toast.error('Authentication test failed: ' + error.message);
    }
  };

  const createLisaAndersonMission = async () => {
    toast.error('Mock mission creation has been disabled');
  };

  const createMissionInDatabase = async (mission: TestMission) => {
    toast.error('Mock mission creation has been disabled');
  };

  const updateMissionToPendingValidation = async (missionId: string) => {
    try {
      console.log('Updating status to pending_validation for:', missionId);
      await apiClient.checkMissionsForValidation();
      console.log('Status updated successfully');
    } catch (error) {
      console.warn('Error updating status:', error);
    }
  };

  const createAllExamples = async () => {
    if (exampleMissions.length === 0) {
      toast.error('No examples to create');
      return;
    }

    setIsGenerating(true);
    try {
      const promises = exampleMissions.map(mission => createMissionInDatabase(mission));
      await Promise.all(promises);
      toast.success(`${exampleMissions.length} example missions created`);
      setExampleMissions([]); // Clear examples after creation
    } catch (error) {
      toast.error('Creation error');
    } finally {
      setIsGenerating(false);
    }
  };

  const getStatusBadge = (status: string, type: string) => {
    if (status === 'pending_validation') {
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Pending validation</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      service: 'bg-blue-50 text-blue-700 border-blue-200',
      freelance: 'bg-green-50 text-green-700 border-green-200',
      extra_day: 'bg-purple-50 text-purple-700 border-purple-200'
    };
    
    const labels = {
      service: 'Service',
      freelance: 'Freelance',
      extra_day: 'Extra Day'
    };

    return (
      <Badge variant="outline" className={colors[type as keyof typeof colors]}>
        {labels[type as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Mission Test Generator
          </CardTitle>
          <CardDescription>
            Generate test missions for development and testing purposes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={testApiConnection}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Test API Connection
            </Button>
            
            <Button 
              onClick={testAuthentication}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Test Authentication
            </Button>
            
            <Button 
              onClick={createLisaAndersonMission}
              disabled={true}
              variant="outline"
              className="flex items-center gap-2 opacity-50"
            >
              <User className="h-4 w-4" />
              Mock Mission Creation Disabled
            </Button>
            
            <Button 
              onClick={generateExamples}
              disabled={true}
              variant="outline"
              className="flex items-center gap-2 opacity-50"
            >
              <Plus className="h-4 w-4" />
              Mock Generation Disabled
            </Button>
            
            {exampleMissions.length > 0 && (
              <Button 
                onClick={createAllExamples}
                disabled={isGenerating}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                {isGenerating ? 'Creating...' : `Create ${exampleMissions.length} Missions`}
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Settings className="h-5 w-5 text-gray-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-900">Authentication Status</h4>
                  <div className="text-sm text-gray-700 mt-1 space-y-1">
                    <div><strong>User:</strong> {user?.name || 'Not connected'} ({user?.email || 'N/A'})</div>
                    <div><strong>Role:</strong> {user?.role || 'N/A'}</div>
                    <div><strong>API Token:</strong> {apiClient.accessToken ? '✅ Present' : '❌ Missing'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900">Mock Data Removed</h4>
                  <p className="text-sm text-red-700 mt-1">
                    All mock mission generation has been disabled. Use the proper mission creation workflow instead.
                  </p>
                  <div className="text-xs text-red-600 mt-2">
                    <strong>Note:</strong> Missions should be created through MissionRequest component or API
                  </div>
                </div>
              </div>
            </div>
          </div>

          {exampleMissions.length > 0 && (
            <div className="space-y-4 mt-6">
              <h3 className="font-medium">Generated Examples</h3>
              <div className="grid gap-4">
                {exampleMissions.map((mission) => (
                  <Card key={mission.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{mission.id}</h4>
                          {getTypeBadge(mission.type)}
                          {getStatusBadge(mission.status, mission.type)}
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => createMissionInDatabase(mission)}
                          disabled={isGenerating}
                        >
                          Create Single
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span>{mission.crew.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Plane className="h-4 w-4 text-gray-500" />
                          <span>{mission.aircraft.immat}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>{mission.contract.startDate} → {mission.contract.endDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-500" />
                          <span>{mission.contract.salaryAmount} {mission.contract.salaryCurrency}/day</span>
                        </div>
                      </div>

                      <div className="mt-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4" />
                          <span>{mission.flights.length} flight{mission.flights.length > 1 ? 's' : ''}</span>
                        </div>
                        {mission.type === 'service' && mission.status === 'pending_validation' && (
                          <div className="text-orange-600 font-medium">
                            Pending crew validation
                          </div>
                        )}
                      </div>

                      {mission.contract.additionalNotes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          {mission.contract.additionalNotes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}