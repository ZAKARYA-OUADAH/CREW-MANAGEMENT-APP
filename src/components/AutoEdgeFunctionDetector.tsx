import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Server,
  Wifi,
  WifiOff,
  RefreshCw,
  Settings,
  Terminal,
  ExternalLink
} from 'lucide-react';

interface EdgeFunctionDetectionResult {
  isDeployed: boolean;
  isAccessible: boolean;
  responseTime?: number;
  error?: string;
  serverInfo?: any;
}

export default function AutoEdgeFunctionDetector() {
  const [detection, setDetection] = useState<EdgeFunctionDetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [autoFixAttempted, setAutoFixAttempted] = useState(false);

  const detectEdgeFunctions = async (): Promise<EdgeFunctionDetectionResult> => {
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const healthUrl = `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/health`;
      
      console.log('🔍 Detecting Edge Functions at:', healthUrl);
      
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const serverInfo = await response.json();
        console.log('✅ Edge Functions detected successfully:', serverInfo);
        
        return {
          isDeployed: true,
          isAccessible: true,
          responseTime,
          serverInfo
        };
      } else if (response.status === 404) {
        console.log('❌ Edge Functions not found (404)');
        return {
          isDeployed: false,
          isAccessible: false,
          error: 'Edge Functions not deployed (404)'
        };
      } else {
        console.log('⚠️ Edge Functions deployed but not accessible:', response.status);
        return {
          isDeployed: true,
          isAccessible: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error: any) {
      console.log('💥 Edge Functions detection failed:', error);
      
      let errorMessage = 'Unknown error';
      let isDeployed = false;
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout (10s)';
        isDeployed = false; // Might be deployed but not responding
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error or CORS issue';
        isDeployed = false;
      } else if (error.message.includes('404')) {
        errorMessage = 'Edge Functions not deployed';
        isDeployed = false;
      } else {
        errorMessage = error.message;
      }

      return {
        isDeployed,
        isAccessible: false,
        error: errorMessage
      };
    }
  };

  const runDetection = async () => {
    setIsDetecting(true);
    try {
      const result = await detectEdgeFunctions();
      setDetection(result);
      
      if (result.isDeployed && result.isAccessible) {
        toast.success(`✅ Edge Functions are working (${result.responseTime}ms)`);
      } else {
        toast.error(`❌ Edge Functions issue: ${result.error}`);
        
        // Auto-enable local mode if detection fails and not already attempted
        if (!autoFixAttempted && !result.isDeployed) {
          setAutoFixAttempted(true);
          setTimeout(() => {
            enableLocalMode();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Detection error:', error);
      toast.error('Detection failed');
    } finally {
      setIsDetecting(false);
    }
  };

  const enableLocalMode = () => {
    localStorage.setItem('USE_LOCAL_MODE', 'true');
    toast.success('🔄 Enabled local mode - page will reload');
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const openSupabaseDashboard = () => {
    import('../utils/supabase/info').then(({ projectId }) => {
      const url = `https://supabase.com/dashboard/project/${projectId}/functions`;
      window.open(url, '_blank');
    });
  };

  useEffect(() => {
    // Run detection on mount
    runDetection();
  }, []);

  if (isDetecting && !detection) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Detecting Edge Functions...</p>
              <p className="text-sm text-blue-700">Checking server connectivity and deployment status</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!detection) return null;

  const { isDeployed, isAccessible, responseTime, error, serverInfo } = detection;

  // Don't show if everything is working fine
  if (isDeployed && isAccessible) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div>
              <strong>Edge Functions Issue Detected</strong>
              <p className="text-sm mt-1">{error}</p>
              {!isDeployed && (
                <p className="text-sm text-red-700 mt-1">
                  This means the server functions are not deployed to your Supabase project.
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={runDetection}
                disabled={isDetecting}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isDetecting ? 'animate-spin' : ''}`} />
                Retry
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                Details
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {showDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>Detection Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                {isDeployed ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <div>
                  <p className="font-medium">Deployment Status</p>
                  <p className="text-sm text-gray-600">
                    {isDeployed ? 'Deployed' : 'Not Deployed'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {isAccessible ? (
                  <Wifi className="h-5 w-5 text-green-600" />
                ) : (
                  <WifiOff className="h-5 w-5 text-red-600" />
                )}
                <div>
                  <p className="font-medium">Accessibility</p>
                  <p className="text-sm text-gray-600">
                    {isAccessible ? `Accessible (${responseTime}ms)` : 'Not Accessible'}
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertDescription>
                  <strong>Error Details:</strong> {error}
                </AlertDescription>
              </Alert>
            )}

            {serverInfo && (
              <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                <pre>{JSON.stringify(serverInfo, null, 2)}</pre>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium">Quick Solutions:</h4>
              
              {!isDeployed && (
                <div className="space-y-2">
                  <Button
                    onClick={openSupabaseDashboard}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Supabase Dashboard
                  </Button>
                  
                  <div className="bg-blue-50 p-3 rounded text-sm">
                    <p className="font-medium text-blue-900 mb-1">Deploy via CLI:</p>
                    <code className="block bg-blue-900 text-blue-100 p-2 rounded text-xs">
                      supabase functions deploy server --project-ref {import('../utils/supabase/info').then(m => m.projectId)}
                    </code>
                  </div>
                </div>
              )}

              <Button
                onClick={enableLocalMode}
                variant="default"
                size="sm"
                className="w-full"
              >
                <Settings className="h-4 w-4 mr-2" />
                Enable Local Mode (Demo Data)
              </Button>

              <p className="text-xs text-gray-500">
                Local mode uses demo data and limited functionality for development purposes.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}