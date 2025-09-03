import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { 
  AlertTriangle, 
  RefreshCw, 
  Settings, 
  Wifi,
  WifiOff,
  X
} from 'lucide-react';

interface FetchErrorHandlerProps {
  error: Error | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  showAutoFix?: boolean;
}

export default function FetchErrorHandler({ 
  error, 
  onRetry, 
  onDismiss, 
  showAutoFix = true 
}: FetchErrorHandlerProps) {
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [showLocalModeOption, setShowLocalModeOption] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (error && error.message.includes('Failed to fetch')) {
      setShowLocalModeOption(true);
      // Auto-dismiss network errors after 5 seconds if they're fallback-handled
      const timer = setTimeout(() => {
        setIsDismissed(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!error || isDismissed) return null;

  const isNetworkError = error.message.includes('Failed to fetch') || 
                        error.message.includes('TypeError: Failed to fetch') ||
                        error.message.includes('Network error');

  const enableLocalMode = async () => {
    setIsAutoFixing(true);
    try {
      localStorage.setItem('USE_LOCAL_MODE', 'true');
      toast.success('🔄 Local mode enabled - reloading...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      toast.error('Failed to enable local mode');
    } finally {
      setIsAutoFixing(false);
    }
  };

  const checkEdgeFunctionStatus = async () => {
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const healthUrl = `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/health`;
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        signal: AbortSignal.timeout(5000)
      });

      return response.ok;
    } catch {
      return false;
    }
  };

  const autoFix = async () => {
    setIsAutoFixing(true);
    
    try {
      toast.info('🔧 Diagnosing connection issue...');
      
      // Check if Edge Functions are available
      const isAvailable = await checkEdgeFunctionStatus();
      
      if (!isAvailable) {
        toast.warning('Edge Functions not available - enabling local mode');
        await enableLocalMode();
      } else {
        toast.info('Edge Functions are available - retrying...');
        if (onRetry) {
          onRetry();
        }
      }
    } catch (error) {
      toast.error('Auto-fix failed - please try manual solutions');
    } finally {
      setIsAutoFixing(false);
    }
  };

  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <strong>Connection Error</strong>
              {isNetworkError && (
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Network Issue
                </Badge>
              )}
            </div>
            
            <p className="text-sm mb-2">{error.message}</p>
            
            {isNetworkError && (
              <p className="text-xs text-orange-700">
                This usually means Edge Functions are not deployed or there's a connectivity issue.
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                disabled={isAutoFixing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isAutoFixing ? 'animate-spin' : ''}`} />
                Retry
              </Button>
            )}
            
            {showAutoFix && (
              <Button
                variant="outline"
                size="sm"
                onClick={autoFix}
                disabled={isAutoFixing}
              >
                <Settings className="h-4 w-4 mr-2" />
                Auto Fix
              </Button>
            )}
            
            {showLocalModeOption && (
              <Button
                variant="default"
                size="sm"
                onClick={enableLocalMode}
                disabled={isAutoFixing}
              >
                <Wifi className="h-4 w-4 mr-2" />
                Use Demo
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsDismissed(true);
                onDismiss?.();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}