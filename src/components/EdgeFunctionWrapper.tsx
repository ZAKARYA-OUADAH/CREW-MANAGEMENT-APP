import React, { useEffect, useState } from 'react';
import { useEdgeFunctionStatus } from './useEdgeFunctionStatus';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner@2.0.3';
import { 
  AlertTriangle, 
  CheckCircle, 
  Server, 
  Wifi, 
  WifiOff,
  Settings
} from 'lucide-react';

interface EdgeFunctionWrapperProps {
  children: React.ReactNode;
}

export default function EdgeFunctionWrapper({ children }: EdgeFunctionWrapperProps) {
  const { isAvailable, isChecking, error, checkStatus } = useEdgeFunctionStatus(0); // No auto-check
  const [hasChecked, setHasChecked] = useState(false);
  const [showLocalModePrompt, setShowLocalModePrompt] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);

  useEffect(() => {
    // Check local mode setting
    const localMode = localStorage.getItem('USE_LOCAL_MODE') === 'true';
    setIsLocalMode(localMode);

    // If not in local mode, check Edge Functions
    if (!localMode && !hasChecked) {
      checkStatus().then((available) => {
        setHasChecked(true);
        if (!available) {
          // Show prompt to enable local mode after a delay
          setTimeout(() => {
            setShowLocalModePrompt(true);
          }, 2000);
        }
      });
    } else {
      setHasChecked(true);
    }
  }, [checkStatus, hasChecked]);

  const enableLocalMode = () => {
    localStorage.setItem('USE_LOCAL_MODE', 'true');
    setIsLocalMode(true);
    setShowLocalModePrompt(false);
    toast.success('Local mode enabled - using demo data');
    window.location.reload();
  };

  const disableLocalMode = () => {
    localStorage.removeItem('USE_LOCAL_MODE');
    setIsLocalMode(false);
    toast.info('Local mode disabled - reconnecting to server');
    window.location.reload();
  };

  const retryConnection = async () => {
    toast.info('Retrying connection...');
    const available = await checkStatus();
    if (available) {
      setShowLocalModePrompt(false);
      toast.success('Connection restored!');
    }
  };

  // Show loading while checking
  if (!hasChecked && isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Server className="h-8 w-8 mx-auto mb-4 animate-pulse text-blue-600" />
          <p className="text-gray-600">Checking server connectivity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Local Mode Indicator */}
      {isLocalMode && (
        <div className="fixed top-4 right-4 z-50">
          <Badge className="bg-blue-100 text-blue-800 shadow-lg">
            <WifiOff className="h-3 w-3 mr-1" />
            Demo Mode
          </Badge>
        </div>
      )}

      {/* Server Status Indicator */}
      {!isLocalMode && hasChecked && (
        <div className="fixed top-4 right-4 z-50">
          <Badge className={isAvailable ? "bg-green-100 text-green-800 shadow-lg" : "bg-red-100 text-red-800 shadow-lg"}>
            {isAvailable ? (
              <>
                <Wifi className="h-3 w-3 mr-1" />
                Connected
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </>
            )}
          </Badge>
        </div>
      )}

      {/* Local Mode Prompt */}
      {showLocalModePrompt && !isLocalMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span>Connection Issue Detected</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-orange-200 bg-orange-50">
                <AlertDescription>
                  <strong>Unable to connect to server:</strong> {error}
                  <p className="mt-1 text-sm">
                    This usually means Edge Functions are not deployed or there's a network issue.
                  </p>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <p className="text-sm text-gray-600">Choose an option to continue:</p>
                
                <Button 
                  onClick={enableLocalMode} 
                  className="w-full"
                  variant="outline"
                >
                  <WifiOff className="h-4 w-4 mr-2" />
                  Use Demo Mode
                </Button>
                
                <Button 
                  onClick={retryConnection} 
                  className="w-full"
                  variant="default"
                >
                  <Wifi className="h-4 w-4 mr-2" />
                  Retry Connection
                </Button>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Demo Mode:</strong> Uses sample data, limited functionality</p>
                <p><strong>Retry:</strong> Attempts to reconnect to the server</p>
              </div>

              <Button 
                onClick={() => setShowLocalModePrompt(false)}
                variant="ghost"
                size="sm"
                className="w-full"
              >
                Continue Anyway
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings Panel for Local Mode */}
      {isLocalMode && (
        <div className="fixed bottom-4 right-4 z-40">
          <Button
            onClick={disableLocalMode}
            variant="outline"
            size="sm"
            className="shadow-lg"
          >
            <Settings className="h-4 w-4 mr-2" />
            Exit Demo Mode
          </Button>
        </div>
      )}

      {children}
    </div>
  );
}