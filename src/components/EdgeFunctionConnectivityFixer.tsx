import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  RefreshCw,
  Zap,
  Globe,
  Server,
  Network,
  Info
} from 'lucide-react';

interface ConnectivityTest {
  name: string;
  url: string;
  status: 'pending' | 'success' | 'error';
  error?: string;
  duration?: number;
  response?: any;
}

export default function EdgeFunctionConnectivityFixer() {
  const [tests, setTests] = useState<ConnectivityTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [supabaseConfig, setSupabaseConfig] = useState<any>(null);

  const initializeTests = async () => {
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const config = {
        url: `https://${projectId}.supabase.co`,
        key: publicAnonKey,
        projectId
      };
      setSupabaseConfig(config);

      const initialTests: ConnectivityTest[] = [
        {
          name: 'Supabase Project Ping',
          url: `${config.url}/rest/v1/`,
          status: 'pending'
        },
        {
          name: 'Edge Functions Base URL',
          url: `${config.url}/functions/v1/`,
          status: 'pending'
        },
        {
          name: 'Health Check Endpoint',
          url: `${config.url}/functions/v1/make-server-9fd39b98/health`,
          status: 'pending'
        },
        {
          name: 'Crew Endpoint',
          url: `${config.url}/functions/v1/make-server-9fd39b98/crew`,
          status: 'pending'
        },
        {
          name: 'Auth Test',
          url: `${config.url}/functions/v1/make-server-9fd39b98/auth/test`,
          status: 'pending'
        }
      ];
      
      setTests(initialTests);
    } catch (error) {
      console.error('Failed to initialize tests:', error);
      toast.error('Failed to load Supabase configuration');
    }
  };

  useEffect(() => {
    initializeTests();
  }, []);

  const runTest = async (test: ConnectivityTest, index: number) => {
    const startTime = Date.now();
    
    setTests(prev => prev.map((t, i) => 
      i === index ? { ...t, status: 'pending' } : t
    ));

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      // Add auth header for protected endpoints
      if (test.url.includes('/crew') || test.url.includes('/auth')) {
        headers['Authorization'] = `Bearer ${supabaseConfig?.key}`;
      }

      console.log(`Testing: ${test.name} - ${test.url}`);
      console.log('Headers:', headers);

      const response = await fetch(test.url, {
        method: 'GET',
        headers,
        signal: controller.signal,
        mode: 'cors'
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        responseData = await response.text();
      }

      console.log(`Response for ${test.name}:`, {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
        data: responseData
      });

      if (response.ok) {
        setTests(prev => prev.map((t, i) => 
          i === index ? { 
            ...t, 
            status: 'success', 
            duration,
            response: responseData 
          } : t
        ));
        toast.success(`✅ ${test.name} - Success (${duration}ms)`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const errorMessage = error.name === 'AbortError' 
        ? 'Request timeout (10s)'
        : error.message;

      console.error(`Test failed for ${test.name}:`, error);

      setTests(prev => prev.map((t, i) => 
        i === index ? { 
          ...t, 
          status: 'error', 
          error: errorMessage,
          duration 
        } : t
      ));
      
      toast.error(`❌ ${test.name} - ${errorMessage}`);
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    
    for (let i = 0; i < tests.length; i++) {
      await runTest(tests[i], i);
      // Add small delay between tests
      if (i < tests.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    setLoading(false);
  };

  const getStatusIcon = (status: ConnectivityTest['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
    }
  };

  const getStatusBadge = (status: ConnectivityTest['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800">Testing...</Badge>;
    }
  };

  const successTests = tests.filter(t => t.status === 'success').length;
  const errorTests = tests.filter(t => t.status === 'error').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl text-gray-900">Edge Functions Connectivity Diagnostic</h2>
          <p className="text-gray-600">
            Diagnose and fix connection issues with Supabase Edge Functions
          </p>
        </div>
        
        <Button 
          onClick={runAllTests} 
          disabled={loading || !supabaseConfig}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Run All Tests</span>
        </Button>
      </div>

      {/* Configuration Info */}
      {supabaseConfig && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="h-5 w-5" />
              <span>Configuration Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Project ID:</span>
                <p className="text-gray-600 break-all">{supabaseConfig.projectId}</p>
              </div>
              <div>
                <span className="font-medium">Base URL:</span>
                <p className="text-gray-600 break-all">{supabaseConfig.url}</p>
              </div>
              <div>
                <span className="font-medium">Anon Key:</span>
                <p className="text-gray-600 break-all">{supabaseConfig.key.substring(0, 50)}...</p>
              </div>
              <div>
                <span className="font-medium">Edge Functions URL:</span>
                <p className="text-gray-600 break-all">{supabaseConfig.url}/functions/v1/</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results Summary */}
      {tests.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Network className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Tests</p>
                  <p className="text-2xl text-gray-900">{tests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Successful</p>
                  <p className="text-2xl text-gray-900">{successTests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl text-gray-900">{errorTests}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>Connectivity Tests</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tests.map((test, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <p className="font-medium">{test.name}</p>
                    <p className="text-sm text-gray-600 break-all">{test.url}</p>
                    {test.error && (
                      <p className="text-sm text-red-600 mt-1">Error: {test.error}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {test.duration && (
                    <span className="text-sm text-gray-500">{test.duration}ms</span>
                  )}
                  {getStatusBadge(test.status)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => runTest(test, index)}
                    disabled={loading}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Solutions and Recommendations */}
      <Tabs defaultValue="solutions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="solutions">Solutions</TabsTrigger>
          <TabsTrigger value="debug">Debug Info</TabsTrigger>
        </TabsList>
        
        <TabsContent value="solutions">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Solutions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {errorTests > 0 && (
                <>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Edge Functions Connection Issues Detected</strong>
                      <div className="mt-2 space-y-2">
                        <p>Common solutions:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Verify Edge Functions are deployed in your Supabase project</li>
                          <li>Check if the project URL and API keys are correct</li>
                          <li>Ensure your internet connection allows HTTPS requests</li>
                          <li>Check browser console for CORS errors</li>
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Quick Deployment Check</h4>
                    <p className="text-sm text-blue-800 mb-3">
                      If Edge Functions are not deployed, you can deploy them using the Supabase CLI:
                    </p>
                    <code className="block bg-blue-900 text-blue-100 p-2 rounded text-sm">
                      supabase functions deploy server --project-ref {supabaseConfig?.projectId}
                    </code>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">Alternative: Use Local Mode</h4>
                    <p className="text-sm text-yellow-800 mb-3">
                      If Edge Functions are not available, you can enable local mode for development:
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        localStorage.setItem('USE_LOCAL_MODE', 'true');
                        window.location.reload();
                      }}
                    >
                      Enable Local Mode
                    </Button>
                  </div>
                </>
              )}
              
              {successTests === tests.length && tests.length > 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>All connectivity tests passed!</strong>
                    <p className="mt-1">Your Edge Functions are properly deployed and accessible.</p>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="debug">
          <Card>
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Environment</h4>
                  <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                    <div>User Agent: {navigator.userAgent}</div>
                    <div>URL: {window.location.href}</div>
                    <div>Protocol: {window.location.protocol}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Test Responses</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {tests.map((test, index) => (
                      <div key={index} className="bg-gray-100 p-3 rounded">
                        <div className="font-medium text-sm">{test.name}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          Status: {test.status}
                          {test.duration && ` | Duration: ${test.duration}ms`}
                          {test.error && ` | Error: ${test.error}`}
                        </div>
                        {test.response && (
                          <pre className="text-xs mt-2 bg-white p-2 rounded overflow-x-auto">
                            {JSON.stringify(test.response, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}