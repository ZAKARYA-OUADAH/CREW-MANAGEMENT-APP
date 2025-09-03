import { useState, useEffect, useCallback } from 'react';

interface EdgeFunctionStatus {
  isAvailable: boolean;
  isChecking: boolean;
  lastCheck: Date | null;
  error: string | null;
}

export const useEdgeFunctionStatus = (checkInterval = 5 * 60 * 1000) => {
  const [status, setStatus] = useState<EdgeFunctionStatus>({
    isAvailable: false,
    isChecking: false,
    lastCheck: null,
    error: null
  });

  const checkStatus = useCallback(async () => {
    setStatus(prev => ({ ...prev, isChecking: true }));

    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const healthUrl = `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/health`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        setStatus({
          isAvailable: true,
          isChecking: false,
          lastCheck: new Date(),
          error: null
        });
        return true;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      let errorMessage = 'Edge Functions not available';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Connection timeout (8s)';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network connectivity issue';
      } else if (error.message.includes('404')) {
        errorMessage = 'Edge Functions not deployed';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error';
      }

      setStatus({
        isAvailable: false,
        isChecking: false,
        lastCheck: new Date(),
        error: errorMessage
      });
      return false;
    }
  }, []);

  useEffect(() => {
    // Check immediately on mount
    checkStatus();
    
    // Set up interval if specified
    if (checkInterval > 0) {
      const interval = setInterval(checkStatus, checkInterval);
      return () => clearInterval(interval);
    }
  }, [checkStatus, checkInterval]);

  return {
    ...status,
    checkStatus
  };
};