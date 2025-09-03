import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Loader2,
  X
} from 'lucide-react';

interface EdgeFunctionStatus {
  isAvailable: boolean;
  isChecking: boolean;
  lastCheck: Date | null;
  error: string | null;
}

export default function EdgeFunctionStatusBanner() {
  const [status, setStatus] = useState<EdgeFunctionStatus>({
    isAvailable: false,
    isChecking: false,
    lastCheck: null,
    error: null
  });
  const [isDismissed, setIsDismissed] = useState(false);

  const checkEdgeFunctionStatus = async () => {
    setStatus(prev => ({ ...prev, isChecking: true }));

    try {
      const { projectId } = await import('../utils/supabase/info');
      const healthUrl = `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/health`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setStatus({
          isAvailable: true,
          isChecking: false,
          lastCheck: new Date(),
          error: null
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      let errorMessage = 'Edge Functions not available';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Connection timeout';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error';
      }

      setStatus({
        isAvailable: false,
        isChecking: false,
        lastCheck: new Date(),
        error: errorMessage
      });
    }
  };

  useEffect(() => {
    // Check on mount
    checkEdgeFunctionStatus();
    
    // Check every 5 minutes
    const interval = setInterval(checkEdgeFunctionStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Don't show if dismissed or if Edge Functions are working
  if (isDismissed || (status.isAvailable && !status.error)) {
    return null;
  }

  // Don't show if still checking on initial load
  if (status.isChecking && !status.lastCheck) {
    return null;
  }

  const getStatusIcon = () => {
    if (status.isChecking) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    if (status.isAvailable) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusBadge = () => {
    if (status.isChecking) {
      return <Badge className="bg-blue-100 text-blue-800">Checking...</Badge>;
    }
    
    if (status.isAvailable) {
      return <Badge className="bg-green-100 text-green-800">Online</Badge>;
    }
    
    return <Badge className="bg-red-100 text-red-800">Offline</Badge>;
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
      <Alert className="max-w-4xl mx-auto border-orange-200 bg-orange-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <AlertDescription>
                <div className="flex items-center space-x-2">
                  <strong>Edge Functions Status:</strong>
                  {getStatusBadge()}
                  {status.error && (
                    <span className="text-sm text-gray-600">- {status.error}</span>
                  )}
                </div>
                {!status.isAvailable && (
                  <p className="text-sm mt-1">
                    Some features may use demo data. Check your internet connection or deploy Edge Functions.
                  </p>
                )}
              </AlertDescription>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={checkEdgeFunctionStatus}
              disabled={status.isChecking}
            >
              Retry
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  );
}