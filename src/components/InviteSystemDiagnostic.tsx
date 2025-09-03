import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner@2.0.3';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Server,
  Key,
  Globe,
  Users
} from 'lucide-react';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

// Get Supabase config
const getSupabaseConfig = async () => {
  try {
    const { projectId, publicAnonKey } = await import('../utils/supabase/info');
    return {
      url: `https://${projectId}.supabase.co`,
      key: publicAnonKey,
      projectId
    };
  } catch (error) {
    throw new Error('Supabase configuration not available');
  }
};

export default function InviteSystemDiagnostic() {
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addDiagnostic = (result: DiagnosticResult) => {
    setDiagnostics(prev => [...prev, result]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDiagnostics([]);

    try {
      // 1. Check Supabase Config
      try {
        const config = await getSupabaseConfig();
        addDiagnostic({
          name: 'Supabase Configuration',
          status: 'success',
          message: `Connected to project: ${config.projectId}`,
          details: { url: config.url, hasKey: !!config.key }
        });
      } catch (error) {
        addDiagnostic({
          name: 'Supabase Configuration',
          status: 'error',
          message: 'Failed to load Supabase configuration',
          details: error.message
        });
        return;
      }

      // 2. Check Authentication
      if (!user) {
        addDiagnostic({
          name: 'User Authentication',
          status: 'error',
          message: 'User not authenticated'
        });
        return;
      }

      addDiagnostic({
        name: 'User Authentication',
        status: 'success',
        message: `Authenticated as: ${user.email}`,
        details: { 
          role: user.role, 
          hasAccessToken: !!user.access_token,
          tokenLength: user.access_token?.length || 0
        }
      });

      // 3. Check Edge Functions Health
      const config = await getSupabaseConfig();
      
      try {
        const healthResponse = await fetch(
          `${config.url}/functions/v1/make-server-9fd39b98/health`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${user.access_token}`,
              'apikey': config.key,
              'Accept': 'application/json'
            }
          }
        );

        if (healthResponse.ok) {
          const healthData = await healthResponse.json();
          addDiagnostic({
            name: 'Edge Functions Health',
            status: healthData.status === 'healthy' ? 'success' : 'warning',
            message: `Server status: ${healthData.status}`,
            details: healthData
          });
        } else {
          throw new Error(`HTTP ${healthResponse.status}: ${healthResponse.statusText}`);
        }
      } catch (error) {
        addDiagnostic({
          name: 'Edge Functions Health',
          status: 'error',
          message: 'Edge Functions not reachable',
          details: error.message
        });
      }

      // 4. Check Secrets Status
      try {
        const secretsResponse = await fetch(
          `${config.url}/functions/v1/make-server-9fd39b98/secrets/status`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${user.access_token}`,
              'apikey': config.key,
              'Accept': 'application/json'
            }
          }
        );

        if (secretsResponse.ok) {
          const secretsData = await secretsResponse.json();
          addDiagnostic({
            name: 'Environment Secrets',
            status: secretsData.valid ? 'success' : 'error',
            message: secretsData.valid ? 'All secrets configured' : `Missing secrets: ${secretsData.missing?.join(', ') || 'Unknown'}`,
            details: secretsData
          });
        } else {
          throw new Error(`HTTP ${secretsResponse.status}`);
        }
      } catch (error) {
        addDiagnostic({
          name: 'Environment Secrets',
          status: 'error',
          message: 'Unable to check secrets status',
          details: error.message
        });
      }

      // 5. Test Invitations Endpoint
      try {
        const invitationsResponse = await fetch(
          `${config.url}/functions/v1/make-server-9fd39b98/invitations`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${user.access_token}`,
              'apikey': config.key,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }
        );

        if (invitationsResponse.ok) {
          const invitationsData = await invitationsResponse.json();
          addDiagnostic({
            name: 'Invitations Endpoint',
            status: 'success',
            message: `Successfully retrieved ${invitationsData.invitations?.length || 0} invitations`,
            details: invitationsData
          });
        } else {
          const errorText = await invitationsResponse.text();
          throw new Error(`HTTP ${invitationsResponse.status}: ${errorText}`);
        }
      } catch (error) {
        addDiagnostic({
          name: 'Invitations Endpoint',
          status: 'error',
          message: 'Invitations endpoint failed',
          details: error.message
        });
      }

      // 6. Test Invite User Endpoint (without actually sending)
      try {
        const testInviteResponse = await fetch(
          `${config.url}/functions/v1/make-server-9fd39b98/invite-user`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${user.access_token}`,
              'apikey': config.key,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({}) // Empty body to test validation
          }
        );

        const responseText = await testInviteResponse.text();
        
        if (testInviteResponse.status === 400) {
          // This is expected for empty body - endpoint is working
          addDiagnostic({
            name: 'Invite User Endpoint',
            status: 'success',
            message: 'Endpoint is accessible and validates input',
            details: { status: testInviteResponse.status, response: responseText }
          });
        } else {
          throw new Error(`Unexpected status ${testInviteResponse.status}: ${responseText}`);
        }
      } catch (error) {
        addDiagnostic({
          name: 'Invite User Endpoint',
          status: 'error',
          message: 'Invite user endpoint failed',
          details: error.message
        });
      }

    } catch (error) {
      addDiagnostic({
        name: 'System Diagnostic',
        status: 'error',
        message: 'Diagnostic failed',
        details: error.message
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Run diagnostics on component mount
  useEffect(() => {
    if (user?.access_token) {
      runDiagnostics();
    }
  }, [user?.access_token]);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">OK</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">ERROR</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">WARNING</Badge>;
    }
  };

  const hasErrors = diagnostics.some(d => d.status === 'error');
  const hasWarnings = diagnostics.some(d => d.status === 'warning');

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Invitation System Diagnostic
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={runDiagnostics}
            disabled={isRunning}
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isRunning ? 'Running...' : 'Run Diagnostic'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!user && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              User not authenticated. Please log in to run diagnostics.
            </AlertDescription>
          </Alert>
        )}

        {diagnostics.length > 0 && (
          <>
            {/* Summary */}
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm">
                <span className="font-medium">Overall Status: </span>
                {hasErrors ? (
                  <span className="text-red-600 font-medium">Issues Found</span>
                ) : hasWarnings ? (
                  <span className="text-yellow-600 font-medium">Warnings</span>
                ) : (
                  <span className="text-green-600 font-medium">All Systems Operational</span>
                )}
              </div>
            </div>

            {/* Diagnostic Results */}
            <div className="space-y-3">
              {diagnostics.map((diagnostic, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(diagnostic.status)}
                      <span className="font-medium text-sm">{diagnostic.name}</span>
                    </div>
                    {getStatusBadge(diagnostic.status)}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{diagnostic.message}</p>
                  
                  {diagnostic.details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                        Show Details
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                        {typeof diagnostic.details === 'string' 
                          ? diagnostic.details 
                          : JSON.stringify(diagnostic.details, null, 2)
                        }
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>

            {/* Recommendations */}
            {hasErrors && (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Issues detected that need attention:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {diagnostics
                        .filter(d => d.status === 'error')
                        .map((d, i) => (
                          <li key={i}>{d.name}: {d.message}</li>
                        ))
                      }
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {isRunning && (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-600" />
            <p className="text-gray-600">Running system diagnostics...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}