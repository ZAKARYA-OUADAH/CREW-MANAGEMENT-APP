import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { createClient } from '../utils/supabase/client';
import { 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Shield, 
  Database,
  XCircle,
  Settings,
  Wrench
} from 'lucide-react';

export default function RLSPolicyDiagnostic() {
  const [supabase] = useState(() => createClient());
  const [diagnosticResults, setDiagnosticResults] = useState({
    canReadUsers: false,
    canReadOwnProfile: false,
    hasRLSError: false,
    errorMessage: '',
    testResults: [],
    policyStatus: 'unknown'
  });
  const [testing, setTesting] = useState(false);
  const [fixing, setFixing] = useState(false);

  const runDiagnostic = async () => {
    setTesting(true);
    const results = [];
    let canReadUsers = false;
    let canReadOwnProfile = false;
    let hasRLSError = false;
    let errorMessage = '';

    try {
      // Test 1: Try to read users table with minimal data
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .limit(1);
        
        if (error) {
          hasRLSError = true;
          errorMessage = error.message;
          results.push({
            test: 'Basic users table access',
            status: 'error',
            message: error.message,
            timestamp: new Date().toLocaleTimeString()
          });
        } else {
          canReadUsers = true;
          results.push({
            test: 'Basic users table access',
            status: 'success',
            message: `Retrieved ${data?.length || 0} records`,
            timestamp: new Date().toLocaleTimeString()
          });
        }
      } catch (err) {
        hasRLSError = true;
        errorMessage = err.message;
        results.push({
          test: 'Basic users table access',
          status: 'error',
          message: err.message,
          timestamp: new Date().toLocaleTimeString()
        });
      }

      // Test 2: Try to get current user info
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (user && !userError) {
          // Try to read own profile
          const { data, error } = await supabase
            .from('users')
            .select('id, email, name')
            .eq('id', user.id)
            .single();
          
          if (!error) {
            canReadOwnProfile = true;
            results.push({
              test: 'Own profile access',
              status: 'success',
              message: 'Can read own profile data',
              timestamp: new Date().toLocaleTimeString()
            });
          } else {
            results.push({
              test: 'Own profile access',
              status: 'warning',
              message: error.message,
              timestamp: new Date().toLocaleTimeString()
            });
          }
        }
      } catch (err) {
        results.push({
          test: 'Own profile access',
          status: 'error',
          message: err.message,
          timestamp: new Date().toLocaleTimeString()
        });
      }

      // Test 3: Try simple count query
      try {
        const { count, error } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          results.push({
            test: 'Count query test',
            status: 'success',
            message: `Total users: ${count}`,
            timestamp: new Date().toLocaleTimeString()
          });
        } else {
          results.push({
            test: 'Count query test',
            status: 'error',
            message: error.message,
            timestamp: new Date().toLocaleTimeString()
          });
        }
      } catch (err) {
        results.push({
          test: 'Count query test',
          status: 'error',
          message: err.message,
          timestamp: new Date().toLocaleTimeString()
        });
      }

    } catch (globalError) {
      hasRLSError = true;
      errorMessage = globalError.message;
    }

    setDiagnosticResults({
      canReadUsers,
      canReadOwnProfile,
      hasRLSError,
      errorMessage,
      testResults: results,
      policyStatus: hasRLSError ? 'error' : canReadUsers ? 'ok' : 'limited'
    });
    setTesting(false);
  };

  const attemptRLSFix = async () => {
    setFixing(true);
    
    try {
      // This is a client-side workaround - we can't actually fix RLS policies from the client
      // But we can provide guidance and try alternative approaches
      
      // Test alternative query patterns
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Try with specific user context
        const { data, error } = await supabase
          .from('users')
          .select(`
            id, name, email, role, status, position,
            validation_status, currency, experience_years, 
            last_active, profile_complete
          `)
          .eq('id', user.id);
        
        if (!error) {
          setDiagnosticResults(prev => ({
            ...prev,
            testResults: [...prev.testResults, {
              test: 'Alternative query pattern',
              status: 'success',
              message: 'Found working query pattern for authenticated user',
              timestamp: new Date().toLocaleTimeString()
            }]
          }));
        }
      }
      
    } catch (error) {
      setDiagnosticResults(prev => ({
        ...prev,
        testResults: [...prev.testResults, {
          test: 'RLS Fix attempt',
          status: 'error',
          message: error.message,
          timestamp: new Date().toLocaleTimeString()
        }]
      }));
    }
    
    setFixing(false);
  };

  // Auto-run diagnostic on mount
  useEffect(() => {
    runDiagnostic();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <XCircle className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>RLS Policy Diagnostic</span>
          <Badge variant={
            diagnosticResults.policyStatus === 'ok' ? 'default' : 
            diagnosticResults.policyStatus === 'limited' ? 'secondary' : 'destructive'
          }>
            {diagnosticResults.policyStatus}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-3 rounded-lg border ${
            diagnosticResults.canReadUsers ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              {diagnosticResults.canReadUsers ? 
                <CheckCircle className="h-4 w-4 text-green-600" /> : 
                <XCircle className="h-4 w-4 text-red-600" />
              }
              <span className="text-sm font-medium">Users Table Access</span>
            </div>
          </div>
          
          <div className={`p-3 rounded-lg border ${
            diagnosticResults.canReadOwnProfile ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center space-x-2">
              {diagnosticResults.canReadOwnProfile ? 
                <CheckCircle className="h-4 w-4 text-green-600" /> : 
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              }
              <span className="text-sm font-medium">Own Profile Access</span>
            </div>
          </div>
          
          <div className={`p-3 rounded-lg border ${
            !diagnosticResults.hasRLSError ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              {!diagnosticResults.hasRLSError ? 
                <CheckCircle className="h-4 w-4 text-green-600" /> : 
                <XCircle className="h-4 w-4 text-red-600" />
              }
              <span className="text-sm font-medium">No RLS Errors</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {diagnosticResults.hasRLSError && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>RLS Policy Error Detected:</strong>
              <br />
              {diagnosticResults.errorMessage}
              <br />
              <span className="text-sm mt-2 block">
                This typically indicates circular dependencies in RLS policies on the users table.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <Button 
            onClick={runDiagnostic} 
            disabled={testing}
            variant="outline"
          >
            {testing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Run Diagnostic
              </>
            )}
          </Button>
          
          {diagnosticResults.hasRLSError && (
            <Button 
              onClick={attemptRLSFix} 
              disabled={fixing}
              variant="outline"
              className="text-orange-600 border-orange-200"
            >
              {fixing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Attempting Fix...
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4 mr-2" />
                  Attempt Workaround
                </>
              )}
            </Button>
          )}
        </div>

        <Separator />

        {/* Test Results */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium">Test Results</h3>
          {diagnosticResults.testResults.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tests run yet</p>
          ) : (
            <div className="space-y-2">
              {diagnosticResults.testResults.map((result, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.status)}
                      <span className="font-medium text-sm">{result.test}</span>
                    </div>
                    <span className="text-xs opacity-75">{result.timestamp}</span>
                  </div>
                  <p className="text-sm mt-1 ml-6">{result.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommendations */}
        {diagnosticResults.hasRLSError && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Recommended Actions</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Database Administrator Actions Required:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Review RLS policies on the `users` table for circular references</li>
                  <li>• Temporarily disable RLS on users table: <code>ALTER TABLE users DISABLE ROW LEVEL SECURITY;</code></li>
                  <li>• Or create simpler policies that don't reference other policies</li>
                  <li>• Check for policy dependencies that create infinite loops</li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Temporary Workaround:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Use more specific queries with user context</li>
                  <li>• Implement client-side filtering as fallback</li>
                  <li>• Consider using service role key for admin operations</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}