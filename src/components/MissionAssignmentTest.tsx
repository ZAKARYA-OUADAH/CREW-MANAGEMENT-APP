import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { useAuth } from './AuthProvider';
import { useNotifications } from './NotificationContext';
import { localApiClient } from '../utils/local/LocalClient';
import { CheckCircle, Clock, User, Plane, TestTube } from 'lucide-react';

export default function MissionAssignmentTest() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  // Only show for admin users
  if (!user || user.role !== 'admin') {
    return null;
  }

  const createTestMission = async () => {
    setLoading(true);
    try {
      // Create a test mission that will go through the approval workflow
      const testMissionData = {
        type: 'freelance',
        crew: {
          id: 'freelancer-001', // Lisa Anderson
          name: 'Lisa Anderson',
          position: 'Flight Attendant',
          email: 'freelancer@aviation.com'
        },
        aircraft: {
          id: 'aircraft-001',
          immat: 'F-HCTA',
          type: 'Citation CJ3+'
        },
        contract: {
          startDate: '2025-02-15',
          endDate: '2025-02-16',
          salaryAmount: 400,
          salaryType: 'daily',
          salaryCurrency: 'EUR',
          hasPerDiem: true,
          perDiemAmount: 80,
          perDiemCurrency: 'EUR',
          additionalNotes: 'Test mission pour vérifier le workflow d\'assignation'
        },
        flights: [
          {
            id: 'flight-test-001',
            flight: 'TEST001',
            departure: 'LFPB',
            arrival: 'EGGW',
            date: '2025-02-15',
            time: '09:00'
          },
          {
            id: 'flight-test-002',
            flight: 'TEST002',
            departure: 'EGGW',
            arrival: 'LFPB',
            date: '2025-02-16',
            time: '16:00'
          }
        ],
        emailData: {
          ownerEmail: 'test-client@example.com',
          subject: 'Mission Order Test - Approval Required',
          fees: {
            dailyRate: 400,
            duration: 2,
            totalSalary: 800,
            perDiem: 160,
            totalFees: 960,
            currency: 'EUR'
          }
        },
        status: 'pending_client_approval' // Start at client approval stage
      };

      const result = await localApiClient.createMission(testMissionData);
      
      if (result.success) {
        setTestResults(prev => [...prev, {
          step: 'Mission Created',
          status: 'success',
          message: `Test mission ${result.data.id} created with status: ${result.data.status}`,
          timestamp: new Date().toISOString()
        }]);
        
        showToast('success', 'Test Mission Created', `Mission ${result.data.id} created successfully`);
        return result.data;
      } else {
        throw new Error('Failed to create test mission');
      }
    } catch (error) {
      console.error('Error creating test mission:', error);
      setTestResults(prev => [...prev, {
        step: 'Mission Creation',
        status: 'error',
        message: `Error creating test mission: ${error.message}`,
        timestamp: new Date().toISOString()
      }]);
      showToast('error', 'Test Failed', 'Failed to create test mission');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const approveClientResponse = async (missionId: string) => {
    setLoading(true);
    try {
      const result = await localApiClient.approveClientResponse(missionId, 'Test client approval for workflow verification');
      
      if (result.success) {
        setTestResults(prev => [...prev, {
          step: 'Client Approval',
          status: 'success',
          message: `Mission ${missionId} approved by client. Status: ${result.data.status}`,
          timestamp: new Date().toISOString()
        }]);
        
        showToast('success', 'Client Approved', `Mission ${missionId} approved by test client`);
        
        // Wait a moment for the MissionAssignmentService to process
        setTimeout(() => {
          checkMissionAssignment(missionId);
        }, 2000);
        
        return result.data;
      } else {
        throw new Error('Failed to approve client response');
      }
    } catch (error) {
      console.error('Error approving client response:', error);
      setTestResults(prev => [...prev, {
        step: 'Client Approval',
        status: 'error',
        message: `Error approving client response: ${error.message}`,
        timestamp: new Date().toISOString()
      }]);
      showToast('error', 'Test Failed', 'Failed to approve client response');
    } finally {
      setLoading(false);
    }
  };

  const checkMissionAssignment = async (missionId: string) => {
    try {
      const result = await localApiClient.getMission(missionId);
      
      if (result.success && result.data) {
        const mission = result.data;
        const expectedStatus = 'pending_execution';
        const actualStatus = mission.status;
        
        if (actualStatus === expectedStatus) {
          setTestResults(prev => [...prev, {
            step: 'Assignment Check',
            status: 'success',
            message: `✅ Mission ${missionId} successfully assigned with status: ${actualStatus}`,
            timestamp: new Date().toISOString()
          }]);
          showToast('success', 'Assignment Success', `Mission ${missionId} properly assigned to crew`);
        } else {
          setTestResults(prev => [...prev, {
            step: 'Assignment Check',
            status: 'warning',
            message: `⚠️ Mission ${missionId} status is ${actualStatus}, expected: ${expectedStatus}`,
            timestamp: new Date().toISOString()
          }]);
          showToast('warning', 'Assignment Issue', `Mission status is ${actualStatus}, expected ${expectedStatus}`);
        }
      } else {
        throw new Error('Mission not found');
      }
    } catch (error) {
      console.error('Error checking mission assignment:', error);
      setTestResults(prev => [...prev, {
        step: 'Assignment Check',
        status: 'error',
        message: `Error checking assignment: ${error.message}`,
        timestamp: new Date().toISOString()
      }]);
      showToast('error', 'Check Failed', 'Failed to verify mission assignment');
    }
  };

  const runFullWorkflowTest = async () => {
    setTestResults([]);
    setTestResults([{
      step: 'Test Start',
      status: 'info',
      message: '🧪 Starting full mission assignment workflow test...',
      timestamp: new Date().toISOString()
    }]);

    // Step 1: Create mission
    const mission = await createTestMission();
    if (!mission) return;

    // Step 2: Approve client response (simulate client approval)
    setTimeout(() => {
      approveClientResponse(mission.id);
    }, 1000);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TestTube className="h-5 w-5 text-purple-600" />
          <span>Mission Assignment Workflow Test</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-purple-200 bg-purple-50">
          <TestTube className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-purple-800">
            <strong>Test Workflow:</strong> Create mission → Client approves → Auto-assign to crew → Status: pending_execution
          </AlertDescription>
        </Alert>

        <div className="flex space-x-2">
          <Button 
            onClick={runFullWorkflowTest}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <TestTube className="h-4 w-4 mr-2" />
            )}
            Run Full Test
          </Button>
          
          <Button 
            variant="outline"
            onClick={clearTestResults}
            disabled={loading}
          >
            Clear Results
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Test Results:</h4>
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start space-x-3 py-2">
                  <Badge 
                    className={
                      result.status === 'success' ? 'bg-green-100 text-green-800' :
                      result.status === 'error' ? 'bg-red-100 text-red-800' :
                      result.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }
                  >
                    {result.step}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{result.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Alert className="border-blue-200 bg-blue-50">
          <User className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            Ce test vérifie que les missions approuvées par les clients sont automatiquement assignées aux crew members 
            et apparaissent dans leur espace freelancer avec le statut "pending_execution".
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}