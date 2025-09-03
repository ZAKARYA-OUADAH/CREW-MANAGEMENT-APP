import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Database
} from 'lucide-react';

const STORAGE_KEYS = [
  'crewtech_auth_user',
  'crewtech_auth_mode',
  'sb-access-token', // Legacy token key
  'supabase-auth-token' // Another possible legacy key
];

export default function AuthSessionCleaner() {
  const [sessionData, setSessionData] = useState<{ [key: string]: any }>({});
  const [isClearing, setIsClearing] = useState(false);
  const [lastCleared, setLastCleared] = useState<Date | null>(null);

  const scanLocalStorage = () => {
    const data: { [key: string]: any } = {};
    
    STORAGE_KEYS.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            data[key] = JSON.parse(value);
          } catch {
            data[key] = value; // Store as string if not JSON
          }
        }
      } catch (error) {
        console.error(`Error reading ${key} from localStorage:`, error);
      }
    });
    
    setSessionData(data);
  };

  useEffect(() => {
    scanLocalStorage();
  }, []);

  const clearAllSessions = async () => {
    setIsClearing(true);
    
    try {
      console.log('🧹 Clearing all authentication sessions...');
      
      // Clear all auth-related keys from localStorage
      STORAGE_KEYS.forEach(key => {
        localStorage.removeItem(key);
        console.log(`✅ Cleared: ${key}`);
      });
      
      // Also clear any other auth-related keys that might exist
      const allKeys = Object.keys(localStorage);
      const authKeys = allKeys.filter(key => 
        key.includes('auth') || 
        key.includes('token') || 
        key.includes('supabase') ||
        key.includes('crewtech')
      );
      
      authKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`✅ Cleared additional key: ${key}`);
      });
      
      // Simulate some delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLastCleared(new Date());
      setSessionData({});
      
      toast.success('All authentication sessions cleared successfully! You may need to sign in again.');
      
    } catch (error) {
      console.error('❌ Error clearing sessions:', error);
      toast.error('Failed to clear some authentication data');
    } finally {
      setIsClearing(false);
    }
  };

  const clearSpecificKey = async (key: string) => {
    try {
      localStorage.removeItem(key);
      console.log(`✅ Cleared specific key: ${key}`);
      toast.success(`Cleared ${key}`);
      scanLocalStorage(); // Refresh the display
    } catch (error) {
      console.error(`❌ Error clearing ${key}:`, error);
      toast.error(`Failed to clear ${key}`);
    }
  };

  const refreshScan = () => {
    scanLocalStorage();
    toast.success('Local storage scan refreshed');
  };

  const hasSessionData = Object.keys(sessionData).length > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Authentication Session Cleaner
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshScan}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This tool helps clear corrupted or invalid authentication sessions. 
            Use this if you're experiencing persistent login issues or Buffer errors.
          </AlertDescription>
        </Alert>

        {/* Session Status */}
        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm">
            <span className="font-medium">Sessions Found: </span>
            {hasSessionData ? (
              <Badge className="bg-yellow-100 text-yellow-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {Object.keys(sessionData).length} items
              </Badge>
            ) : (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Clean
              </Badge>
            )}
          </div>
        </div>

        {/* Session Data */}
        {hasSessionData && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Found Authentication Data:</h4>
            {Object.entries(sessionData).map(([key, value]) => (
              <div key={key} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{key}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => clearSpecificKey(key)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
                <details className="text-xs">
                  <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                    Show data
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-32">
                    {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )}

        {/* Last Cleared Info */}
        {lastCleared && (
          <div className="p-2 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-700">
              <CheckCircle className="h-4 w-4 inline mr-1" />
              All sessions cleared at {lastCleared.toLocaleTimeString()}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col space-y-2">
          <Button
            onClick={clearAllSessions}
            disabled={isClearing}
            variant="destructive"
            className="w-full"
          >
            {isClearing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Clearing Sessions...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Authentication Sessions
              </>
            )}
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-600 space-y-2">
          <p className="font-medium">When to use this tool:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>When seeing "Buffer is not defined" errors</li>
            <li>When authentication tokens appear corrupted</li>
            <li>When login fails with unexpected errors</li>
            <li>After system updates that change token format</li>
          </ul>
          <p className="text-yellow-600 font-medium mt-2">
            ⚠️ Warning: This will sign you out and require re-authentication.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}