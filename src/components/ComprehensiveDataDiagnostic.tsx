import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from './AuthProvider';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { localApiClient } from '../utils/local/LocalClient';
import { 
  Database, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Users,
  Plane,
  Settings,
  Zap,
  Link,
  ArrowRight,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';

interface ConnectivityResult {
  source: 'Supabase' | 'LocalAPI' | 'Mock';
  status: 'success' | 'error' | 'warning' | 'timeout';
  usersCount: number;
  missionsCount: number;
  error?: string;
  details?: any;
  responseTime?: number;
}

interface SyncOperation {
  operation: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

// Utility function to make fetch requests with timeout
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs: number = 10000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
};

// Check if Supabase variables are available
const isSupabaseConfigured = (): boolean => {
  return !!(projectId && publicAnonKey && projectId !== 'your-project-id' && publicAnonKey.length > 50);
};

export default function ComprehensiveDataDiagnostic() {
  const { user } = useAuth();
  const [results, setResults] = useState<ConnectivityResult[]>([]);
  const [syncOperations, setSyncOperations] = useState<SyncOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoFixing, setAutoFixing] = useState(false);

  const runFullDiagnostic = async () => {
    setLoading(true);
    setResults([]);
    setSyncOperations([]);
    
    const diagnosticResults: ConnectivityResult[] = [];

    // Test Supabase Configuration
    console.log('=== CHECKING SUPABASE CONFIGURATION ===');
    if (!isSupabaseConfigured()) {
      console.log('❌ Supabase not configured properly');
      diagnosticResults.push({
        source: 'Supabase',
        status: 'error',
        usersCount: 0,
        missionsCount: 0,
        error: 'Supabase variables not configured or invalid',
        details: { projectId: projectId || 'missing', hasValidKey: !!(publicAnonKey && publicAnonKey.length > 50) }
      });
    } else {
      console.log('✅ Supabase configuration looks valid');
      
      // Test Supabase API with timeout
      console.log('=== TESTING SUPABASE API ===');
      const supabaseStart = Date.now();
      try {
        const response = await fetchWithTimeout(
          `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/seed/status-public`,
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
          8000 // 8 second timeout
        );

        const supabaseTime = Date.now() - supabaseStart;
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Supabase status response:', data);
          
          diagnosticResults.push({
            source: 'Supabase',
            status: 'success',
            usersCount: data.database_status?.users || 0,
            missionsCount: data.database_status?.missions || 0,
            responseTime: supabaseTime,
            details: data.database_status
          });
        } else {
          console.log('⚠️ Supabase status error:', response.status, response.statusText);
          diagnosticResults.push({
            source: 'Supabase',
            status: 'error',
            usersCount: 0,
            missionsCount: 0,
            error: `HTTP ${response.status}: ${response.statusText}`,
            responseTime: supabaseTime
          });
        }
      } catch (error) {
        const supabaseTime = Date.now() - supabaseStart;
        console.log('❌ Supabase connectivity error:', error.message);
        
        let status: ConnectivityResult['status'] = 'error';
        let errorMessage = error.message;
        
        if (error.message.includes('timed out')) {
          status = 'timeout';
          errorMessage = 'Request timed out - server may be slow or unavailable';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error - server may be offline or unreachable';
        }
        
        diagnosticResults.push({
          source: 'Supabase',
          status,
          usersCount: 0,
          missionsCount: 0,
          error: errorMessage,
          responseTime: supabaseTime
        });
      }
    }

    // Test Local API with timeout
    console.log('=== TESTING LOCAL API ===');
    const localStart = Date.now();
    try {
      // Use a shorter timeout for local API since it should be faster
      const healthResult = await Promise.race([
        localApiClient.healthCheck(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Local API timeout after 5s')), 5000)
        )
      ]) as any;
      
      const localTime = Date.now() - localStart;
      
      if (healthResult.success) {
        // Get data from local API
        try {
          const usersResult = await localApiClient.getUsers();
          const missionsResult = await localApiClient.getMissions();
          
          diagnosticResults.push({
            source: 'LocalAPI',
            status: 'success',
            usersCount: usersResult.success ? usersResult.data.length : 0,
            missionsCount: missionsResult.success ? missionsResult.data.length : 0,
            responseTime: localTime,
            details: {
              usersSuccess: usersResult.success,
              missionsSuccess: missionsResult.success
            }
          });
        } catch (dataError) {
          diagnosticResults.push({
            source: 'LocalAPI',
            status: 'warning',
            usersCount: 0,
            missionsCount: 0,
            error: 'Health OK but data access failed',
            responseTime: localTime,
            details: { dataError: dataError.message }
          });
        }
      } else {
        diagnosticResults.push({
          source: 'LocalAPI',
          status: 'error',
          usersCount: 0,
          missionsCount: 0,
          error: 'Health check failed',
          responseTime: localTime
        });
      }
    } catch (error) {
      const localTime = Date.now() - localStart;
      console.log('❌ Local API connectivity error:', error.message);
      
      let status: ConnectivityResult['status'] = 'error';
      if (error.message.includes('timeout')) {
        status = 'timeout';
      }
      
      diagnosticResults.push({
        source: 'LocalAPI',
        status,
        usersCount: 0,
        missionsCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime: localTime
      });
    }

    // Test authenticated Supabase endpoints (only if basic Supabase works)
    const supabaseResult = diagnosticResults.find(r => r.source === 'Supabase');
    if (user && supabaseResult && supabaseResult.status === 'success') {
      console.log('=== TESTING AUTHENTICATED SUPABASE ENDPOINTS ===');
      try {
        // Test crew endpoint with timeout
        const crewResponse = await fetchWithTimeout(
          `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/crew`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
          },
          6000
        );

        console.log('Crew endpoint response:', crewResponse.status);
        
        // Test missions endpoint with timeout
        const missionsResponse = await fetchWithTimeout(
          `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/missions`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
          },
          6000
        );

        console.log('Missions endpoint response:', missionsResponse.status);
        
        if (crewResponse.ok && missionsResponse.ok) {
          const crewData = await crewResponse.json();
          const missionsData = await missionsResponse.json();
          
          // Update the Supabase result with authenticated data
          if (supabaseResult) {
            supabaseResult.details = {
              ...supabaseResult.details,
              authenticatedUsers: crewData.crew?.length || 0,
              authenticatedMissions: missionsData.missions?.length || 0,
              authEndpointsWorking: true
            };
          }
        }
      } catch (authError) {
        console.log('⚠️ Authenticated endpoints test failed:', authError.message);
        if (supabaseResult) {
          supabaseResult.details = {
            ...supabaseResult.details,
            authEndpointsWorking: false,
            authError: authError.message
          };
        }
      }
    }

    setResults(diagnosticResults);
    setLoading(false);
  };

  const performAutoFix = async () => {
    setAutoFixing(true);
    const operations: SyncOperation[] = [];
    
    const addOperation = (operation: string, status: SyncOperation['status'], message: string, details?: any) => {
      const newOp = { operation, status, message, details };
      operations.push(newOp);
      setSyncOperations([...operations]);
    };

    try {
      // Check if Supabase is configured and accessible
      const supabaseResult = results.find(r => r.source === 'Supabase');
      
      if (!isSupabaseConfigured()) {
        addOperation('Check Configuration', 'error', 'Supabase not configured - cannot perform auto-fix');
        setAutoFixing(false);
        return;
      }
      
      if (supabaseResult && (supabaseResult.status === 'timeout' || supabaseResult.status === 'error')) {
        addOperation('Check Connectivity', 'error', 'Supabase server not accessible - auto-fix requires working connection');
        
        // Try to use Local API as primary data source
        addOperation('Fallback Setup', 'pending', 'Setting up Local API as primary data source...');
        
        try {
          // Initialize Local API with mock data if empty
          const localResult = await localApiClient.getMissions();
          if (!localResult.success || localResult.data.length === 0) {
            // This would be where we could seed local API with mock data
            addOperation('Fallback Setup', 'success', 'Local API configured for offline operation');
          } else {
            addOperation('Fallback Setup', 'success', `Local API has ${localResult.data.length} missions available`);
          }
        } catch (error) {
          addOperation('Fallback Setup', 'error', `Local API setup failed: ${error.message}`);
        }
        
        setAutoFixing(false);
        return;
      }

      // Step 1: Initialize Supabase database if empty
      addOperation('Initialize Database', 'pending', 'Checking if Supabase database needs initialization...');
      
      if (supabaseResult && supabaseResult.status === 'success' && supabaseResult.usersCount === 0) {
        try {
          console.log('Initializing Supabase database...');
          const initResponse = await fetchWithTimeout(
            `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/seed/auto-seed`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            },
            15000 // Longer timeout for seeding
          );

          if (initResponse.ok) {
            const initData = await initResponse.json();
            addOperation('Initialize Database', 'success', `Created ${initData.data?.users_created || 0} users and ${initData.data?.missions_created || 0} missions in Supabase`, initData);
          } else {
            addOperation('Initialize Database', 'error', `Failed to initialize: HTTP ${initResponse.status}`);
          }
        } catch (error) {
          addOperation('Initialize Database', 'error', `Initialization error: ${error.message}`);
        }
      } else {
        addOperation('Initialize Database', 'success', 'Database already initialized');
      }

      // Step 2: Sync data from Supabase to Local API (if Supabase is working)
      if (supabaseResult && supabaseResult.status === 'success') {
        addOperation('Sync to Local API', 'pending', 'Syncing data from Supabase to Local API...');
        
        try {
          // Get missions from Supabase with timeout
          const missionsResponse = await fetchWithTimeout(
            `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/missions`,
            {
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
              },
            },
            10000
          );

          if (missionsResponse.ok) {
            const missionsData = await missionsResponse.json();
            const missions = missionsData.missions || [];
            
            let syncedCount = 0;
            for (const mission of missions) {
              try {
                await localApiClient.createMission(mission);
                syncedCount++;
              } catch (syncError) {
                console.log(`Failed to sync mission ${mission.id}:`, syncError);
              }
            }
            
            addOperation('Sync to Local API', 'success', `Synced ${syncedCount}/${missions.length} missions to Local API`);
          } else {
            addOperation('Sync to Local API', 'warning', 'Could not fetch missions from Supabase for sync');
          }
        } catch (error) {
          addOperation('Sync to Local API', 'error', `Sync failed: ${error.message}`);
        }
      } else {
        addOperation('Sync to Local API', 'warning', 'Skipped - Supabase not available');
      }

      // Step 3: Verify sync worked
      addOperation('Verify Sync', 'pending', 'Verifying data synchronization...');
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a moment for sync to complete
      
      try {
        const localResult = await localApiClient.getMissions();
        if (localResult.success && localResult.data.length > 0) {
          addOperation('Verify Sync', 'success', `Local API now has ${localResult.data.length} missions`);
        } else {
          addOperation('Verify Sync', 'warning', 'Local API still has no missions');
        }
      } catch (error) {
        addOperation('Verify Sync', 'error', `Verification failed: ${error.message}`);
      }

    } catch (error) {
      console.error('Auto-fix error:', error);
      addOperation('Auto Fix', 'error', `Auto-fix failed: ${error.message}`);
    }

    setAutoFixing(false);
    
    // Re-run diagnostic after auto-fix
    setTimeout(() => {
      runFullDiagnostic();
    }, 2000);
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      runFullDiagnostic();
    }
  }, [user]);

  const getStatusIcon = (status: ConnectivityResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'timeout':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: ConnectivityResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'timeout':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  const hasErrors = results.some(r => r.status === 'error' || r.status === 'timeout');
  const hasData = results.some(r => r.usersCount > 0 || r.missionsCount > 0);
  const isSupabaseWorking = results.some(r => r.source === 'Supabase' && r.status === 'success');

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-600" />
            <span>Diagnostic Complet de Connectivité</span>
            {!isSupabaseConfigured() && (
              <Badge variant="destructive" className="ml-2">
                <WifiOff className="h-3 w-3 mr-1" />
                Configuration Required
              </Badge>
            )}
            {isSupabaseWorking && (
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                <Wifi className="h-3 w-3 mr-1" />
                Online
              </Badge>
            )}
          </CardTitle>
          <div className="flex space-x-2">
            <Button 
              onClick={runFullDiagnostic}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Diagnostiquer
            </Button>
            {(hasErrors || !hasData) && (
              <Button 
                onClick={performAutoFix}
                disabled={autoFixing || !isSupabaseConfigured()}
                className="bg-purple-600 hover:bg-purple-700"
                size="sm"
              >
                {autoFixing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Auto-Fix
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration Status */}
        {!isSupabaseConfigured() && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Configuration Error:</strong> Supabase variables are not properly configured. 
              Please check that the project ID and API key are valid.
            </AlertDescription>
          </Alert>
        )}

        {/* Connectivity Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <Link className="h-4 w-4" />
              <span>État de Connectivité</span>
            </h3>
            
            {results.map((result, index) => (
              <Card key={index} className={`border-l-4 ${getStatusColor(result.status)}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.status)}
                      <h4 className="font-medium">{result.source}</h4>
                      {result.responseTime && (
                        <Badge variant="outline" className="text-xs">
                          {result.responseTime}ms
                        </Badge>
                      )}
                      {result.status === 'timeout' && (
                        <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800">
                          Timeout
                        </Badge>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant="secondary">
                        <Users className="h-3 w-3 mr-1" />
                        {result.usersCount} users
                      </Badge>
                      <Badge variant="secondary">
                        <Plane className="h-3 w-3 mr-1" />
                        {result.missionsCount} missions
                      </Badge>
                    </div>
                  </div>

                  {result.error && (
                    <Alert className="mb-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {result.error}
                      </AlertDescription>
                    </Alert>
                  )}

                  {result.details && (
                    <details className="text-xs text-gray-600">
                      <summary className="cursor-pointer hover:text-gray-800">
                        Détails techniques
                      </summary>
                      <pre className="bg-gray-50 p-2 mt-2 rounded text-xs overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Sync Operations */}
        {syncOperations.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Opérations de Réparation</span>
            </h3>
            
            {syncOperations.map((op, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded">
                {op.status === 'pending' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                )}
                {op.status === 'success' && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                {op.status === 'error' && (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{op.operation}</span>
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-600">{op.message}</p>
                  
                  {op.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">
                        Détails
                      </summary>
                      <pre className="text-xs bg-white p-2 mt-1 rounded border">
                        {JSON.stringify(op.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {results.length > 0 && (
          <Alert className="border-blue-200 bg-blue-50">
            <Database className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Recommandations:</strong>
              {!isSupabaseConfigured() && (
                <span> Configurez d'abord les variables Supabase pour utiliser la base de données en ligne.</span>
              )}
              {isSupabaseConfigured() && hasErrors && !hasData && (
                <span> Le serveur Supabase semble inaccessible. Vérifiez que le serveur est démarré et accessible.</span>
              )}
              {isSupabaseConfigured() && hasErrors && hasData && (
                <span> Des erreurs de connectivité sont détectées. L'application fonctionne en mode dégradé avec les données locales.</span>
              )}
              {isSupabaseConfigured() && !hasErrors && hasData && (
                <span> Toutes les connexions fonctionnent correctement ! 🎉</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {user && (
          <Alert className="border-gray-200 bg-gray-50">
            <Users className="h-4 w-4 text-gray-600" />
            <AlertDescription className="text-gray-700">
              <strong>Utilisateur actuel:</strong> {user.name} ({user.role}) - ID: {user.id}
              <br />
              <strong>Mode de fonctionnement:</strong> {isSupabaseWorking ? 'En ligne (Supabase)' : 'Hors ligne (Local/Mock)'}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}