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
  Plane
} from 'lucide-react';

interface DiagnosticResult {
  source: 'Supabase' | 'LocalAPI' | 'Mock';
  status: 'success' | 'error' | 'warning';
  missionsCount: number;
  error?: string;
  sampleMissions?: any[];
}

export default function MissionSyncDiagnostic() {
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runDiagnostic = async () => {
    setLoading(true);
    const results: DiagnosticResult[] = [];

    // Test Supabase API
    try {
      console.log('Testing Supabase API...');
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/missions`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const missions = data.missions || [];
        
        results.push({
          source: 'Supabase',
          status: 'success',
          missionsCount: missions.length,
          sampleMissions: missions.slice(0, 3).map((m: any) => ({
            id: m.id,
            status: m.status,
            crew: m.crew?.name || 'No crew',
            crewId: m.crew?.id
          }))
        });
      } else {
        results.push({
          source: 'Supabase',
          status: 'error',
          missionsCount: 0,
          error: `HTTP ${response.status}: ${response.statusText}`
        });
      }
    } catch (error) {
      results.push({
        source: 'Supabase',
        status: 'error',
        missionsCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test Local API
    try {
      console.log('Testing Local API...');
      const result = await localApiClient.getMissions();
      
      if (result.success && result.data) {
        results.push({
          source: 'LocalAPI',
          status: 'success',
          missionsCount: result.data.length,
          sampleMissions: result.data.slice(0, 3).map((m: any) => ({
            id: m.id,
            status: m.status,
            crew: m.crew?.name || 'No crew',
            crewId: m.crew?.id
          }))
        });
      } else {
        results.push({
          source: 'LocalAPI',
          status: 'warning',
          missionsCount: 0,
          error: 'No missions in Local API'
        });
      }
    } catch (error) {
      results.push({
        source: 'LocalAPI',
        status: 'error',
        missionsCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    setDiagnostics(results);
    setLoading(false);
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      runDiagnostic();
    }
  }, [user]);

  const copyMissionsFromSupabaseToLocal = async () => {
    setLoading(true);
    try {
      console.log('Copying missions from Supabase to Local API...');
      
      // Get missions from Supabase
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/missions`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const missions = data.missions || [];
        
        console.log(`Found ${missions.length} missions in Supabase`);
        
        // Create each mission in Local API
        for (const mission of missions) {
          try {
            await localApiClient.createMission(mission);
            console.log(`Copied mission ${mission.id} to Local API`);
          } catch (error) {
            console.log(`Failed to copy mission ${mission.id}:`, error);
          }
        }
        
        console.log('Mission sync completed');
        runDiagnostic(); // Refresh diagnostics
      }
    } catch (error) {
      console.error('Error syncing missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-600" />
            <span>Diagnostic de Synchronisation des Missions</span>
          </CardTitle>
          <div className="flex space-x-2">
            <Button 
              onClick={runDiagnostic}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Actualiser
            </Button>
            <Button 
              onClick={copyMissionsFromSupabaseToLocal}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
              size="sm"
            >
              Synchroniser
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {diagnostics.length === 0 && !loading && (
          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              Cliquez sur "Actualiser" pour tester la connectivité des APIs
            </AlertDescription>
          </Alert>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="ml-3 text-gray-600">Test des APIs en cours...</span>
          </div>
        )}

        {diagnostics.map((result, index) => (
          <Card key={index} className={`border-l-4 ${
            result.status === 'success' ? 'border-l-green-500' :
            result.status === 'warning' ? 'border-l-yellow-500' :
            'border-l-red-500'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(result.status)}
                  <h4 className="font-medium">{result.source}</h4>
                </div>
                <Badge className={getStatusColor(result.status)}>
                  {result.missionsCount} mission(s)
                </Badge>
              </div>

              {result.error && (
                <Alert className="mb-3">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {result.error}
                  </AlertDescription>
                </Alert>
              )}

              {result.sampleMissions && result.sampleMissions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Échantillon de missions:</p>
                  {result.sampleMissions.map((mission, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                      <div className="flex items-center space-x-2">
                        <Plane className="h-3 w-3 text-gray-400" />
                        <span className="font-medium">{mission.id}</span>
                        <Badge variant="outline" className="text-xs">
                          {mission.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Users className="h-3 w-3" />
                        <span>{mission.crew}</span>
                        {mission.crewId && (
                          <span className="text-gray-400">({mission.crewId})</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {user && (
          <Alert className="border-blue-200 bg-blue-50">
            <Users className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Utilisateur actuel:</strong> {user.name} ({user.role}) - ID: {user.id}
              <br />
              <strong>Note:</strong> Les missions doivent être assignées à cet ID de crew pour être visibles côté freelancer.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}