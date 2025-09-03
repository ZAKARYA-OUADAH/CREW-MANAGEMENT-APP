import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Database, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Plane, 
  Bell,
  Copy,
  RefreshCw,
  Trash2,
  Info
} from 'lucide-react';
import { createClient } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import DatabaseSetup from './DatabaseSetup';
import QuickStartGuide from './QuickStartGuide';

export default function DatabaseSeeder() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [seedingProgress, setSeedingProgress] = useState(0);
  const [showSetup, setShowSetup] = useState(true);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [serverLogs, setServerLogs] = useState<string[]>([]);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  const handleSeed = async () => {
    setIsSeeding(true);
    setError('');
    setSeedResult(null);
    setSeedingProgress(0);
    setServerLogs([]);

    try {
      console.log('Starting database seeding...');
      setServerLogs(prev => [...prev, 'Démarrage du peuplement de la base de données...']);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSeedingProgress(prev => Math.min(prev + 10, 90));
      }, 500);
      
      setServerLogs(prev => [...prev, 'Utilisation de l\'auto-seeding (no auth required)']);
      
      // Use the auto-seed endpoint which doesn't require authentication
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/seed/auto-seed`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();

      clearInterval(progressInterval);
      setSeedingProgress(100);

      console.log('Auto-seeding response:', result);
      setServerLogs(prev => [...prev, `Données reçues: ${JSON.stringify(result, null, 2).substring(0, 200)}...`]);

      if (!result.success) {
        const errorMessage = result.error || result.details || 'Auto-seeding failed';
        console.error('Auto-seeding failed:', result);
        setServerLogs(prev => [...prev, `ERREUR: ${errorMessage}`]);
        throw new Error(errorMessage);
      }

      setSeedResult(result);
      setShowSetup(false);
      setShowQuickStart(true);
      setServerLogs(prev => [...prev, 'Peuplement terminé avec succès !']);
    } catch (err: any) {
      console.error('Seeding error:', err);
      setServerLogs(prev => [...prev, `ERREUR CRITIQUE: ${err.message}`]);
      setError(err.message);
    } finally {
      setIsSeeding(false);
      setSeedingProgress(0);
    }
  };

  const copyCredentials = (credentials: any) => {
    const text = JSON.stringify(credentials, null, 2);
    navigator.clipboard.writeText(text);
  };

  const clearDatabase = async () => {
    if (!confirm('Êtes-vous sûr de vouloir effacer toutes les données de test ? Cette action est irréversible.')) {
      return;
    }

    setIsClearing(true);
    setError('');

    try {
      // This would require a clear endpoint on the server
      console.log('Clearing database...');
      alert('Fonction de nettoyage non implémentée. Utilisez l\'interface Supabase pour effacer manuellement les données.');
    } catch (err: any) {
      console.error('Clearing error:', err);
      setError(`Failed to clear database: ${err.message}`);
    } finally {
      setIsClearing(false);
    }
  };

  const runDiagnostic = async () => {
    setIsDiagnosing(true);
    setDiagnosticResult(null);
    setError('');

    try {
      console.log('Running full diagnostic...');
      
      const diagnostic = {
        environment: {
          api_client: 'Configured',
          timestamp: new Date().toISOString()
        },
        endpoints: {} as any,
        database: {} as any,
        timestamp: new Date().toISOString()
      };

      // Test health endpoint
      try {
        const healthResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/health`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        });
        
        if (healthResponse.ok) {
          const healthResult = await healthResponse.json();
          diagnostic.endpoints.health = {
            status: 'OK',
            response: healthResult
          };
        } else {
          throw new Error(`HTTP ${healthResponse.status}: ${healthResponse.statusText}`);
        }
      } catch (err: any) {
        diagnostic.endpoints.health = {
          status: 'ERROR',
          error: err.message
        };
      }

      // Test seed status endpoint
      try {
        const statusResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/data/status`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        });
        
        if (statusResponse.ok) {
          const statusResult = await statusResponse.json();
          diagnostic.endpoints.status = {
            status: 'OK',
            response: statusResult
          };
          
          diagnostic.database = statusResult.database_status || statusResult;
        } else {
          throw new Error(`HTTP ${statusResponse.status}: ${statusResponse.statusText}`);
        }
      } catch (err: any) {
        diagnostic.endpoints.status = {
          status: 'ERROR',
          error: err.message
        };
      }

      setDiagnosticResult(diagnostic);

      // Hide setup guide if database already has data
      if (diagnostic.database.users > 0 || diagnostic.database.missions > 0) {
        setShowSetup(false);
      }
      
    } catch (err: any) {
      console.error('Diagnostic error:', err);
      setError(`Diagnostic failed: ${err.message}`);
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Auto-test connection on component mount
  useEffect(() => {
    runDiagnostic();
  }, []);

  return (
    <div className="space-y-6">
      {showSetup && !seedResult && (
        <DatabaseSetup />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Database Seeder</span>
            </div>
            {diagnosticResult && (
              <Badge variant={diagnosticResult.database?.users > 0 ? "default" : "secondary"}>
                {diagnosticResult.database?.users > 0 ? 'Peuplée' : 'Vide'}
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-gray-600">
            Peuplez la base de données avec des données de test réalistes pour le développement et les tests.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Button
                onClick={runDiagnostic}
                disabled={isDiagnosing}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${isDiagnosing ? 'animate-spin' : ''}`} />
                <span>{isDiagnosing ? 'Diagnostic en cours...' : 'Diagnostic Complet'}</span>
              </Button>
              
              <Button
                onClick={handleSeed}
                disabled={isSeeding || isDiagnosing}
                className="flex items-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>{isSeeding ? 'Peuplement en cours...' : 'Peupler la Base'}</span>
              </Button>

              {diagnosticResult && diagnosticResult.database?.users > 0 && (
                <Button
                  onClick={clearDatabase}
                  disabled={isClearing}
                  variant="destructive"
                  className="flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{isClearing ? 'Nettoyage...' : 'Nettoyer'}</span>
                </Button>
              )}
            </div>
            
            {isSeeding && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Création des utilisateurs de test et des données...</span>
                </div>
                <Progress value={seedingProgress} className="h-2" />
              </div>
            )}

            {isDiagnosing && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Diagnostic système en cours...</span>
              </div>
            )}
          </div>

          {diagnosticResult && (
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Diagnostic Système Complet</strong>
                <div className="mt-3 space-y-2">
                  <div>
                    <strong>Environnement:</strong>
                    <div className="text-sm ml-2">
                      • Client API: {diagnosticResult.environment?.api_client}
                      <br />
                      • Timestamp: {new Date(diagnosticResult.timestamp).toLocaleString('fr-FR')}
                    </div>
                  </div>
                  
                  <div>
                    <strong>API Health:</strong>
                    <div className="text-sm ml-2">
                      • Statut: {diagnosticResult.endpoints?.health?.status}
                      {diagnosticResult.endpoints?.health?.response?.env_check && (
                        <>
                          <br />
                          • Variables d'environnement: {Object.entries(diagnosticResult.endpoints.health.response.env_check).map(([key, value]) => `${key}: ${value === 'SET' ? 'OK' : 'Manquant'}`).join(', ')}
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <strong>Base de données:</strong>
                    <div className="text-sm ml-2">
                      • {diagnosticResult.database?.users || 0} utilisateurs
                      <br />
                      • {diagnosticResult.database?.missions || 0} missions
                      <br />
                      • {diagnosticResult.database?.notifications || 0} notifications
                    </div>
                  </div>
                </div>

                {(diagnosticResult.endpoints?.health?.status === 'ERROR' || diagnosticResult.endpoints?.status?.status === 'ERROR') && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm underline">Détails des erreurs</summary>
                    <div className="mt-2 p-2 bg-red-100 rounded text-xs font-mono">
                      {diagnosticResult.endpoints?.health?.error && (
                        <div>Health Error: {diagnosticResult.endpoints.health.error}</div>
                      )}
                      {diagnosticResult.endpoints?.status?.error && (
                        <div>Status Error: {diagnosticResult.endpoints.status.error}</div>
                      )}
                    </div>
                  </details>
                )}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Error:</strong> {error}
                {serverLogs.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm underline">Voir les logs du serveur</summary>
                    <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {serverLogs.join('\n')}
                    </div>
                  </details>
                )}
              </AlertDescription>
            </Alert>
          )}

          {serverLogs.length > 0 && !error && isSeeding && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <details className="cursor-pointer">
                  <summary className="font-medium">Logs du serveur en temps réel</summary>
                  <div className="mt-2 p-2 bg-blue-100 rounded text-xs font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {serverLogs.join('\n')}
                  </div>
                </details>
              </AlertDescription>
            </Alert>
          )}

          {seedResult && seedResult.success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Base de données peuplée avec succès !</strong>
                <div className="mt-2 flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>{seedResult.data.users_created} utilisateurs</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Plane className="h-3 w-3" />
                    <span>{seedResult.data.missions_created} missions</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Bell className="h-3 w-3" />
                    <span>{seedResult.data.notifications_created} notifications</span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {showQuickStart && (
        <QuickStartGuide onClose={() => setShowQuickStart(false)} />
      )}

      {seedResult && seedResult.credentials && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-medium">Identifiants de Test</h3>
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Prêts
            </Badge>
          </div>
          
          {/* Admin Credentials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-100 text-blue-800">Administrator</Badge>
                  <span>{seedResult.credentials.admin.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyCredentials(seedResult.credentials.admin)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Email:</span>
                  <p className="font-mono">{seedResult.credentials.admin.email}</p>
                </div>
                <div>
                  <span className="text-gray-600">Password:</span>
                  <p className="font-mono">{seedResult.credentials.admin.password}</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Accès administratif complet à toutes les fonctionnalités et données.
              </p>
            </CardContent>
          </Card>

          {/* Internal Staff Credentials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-800">Internal Staff</Badge>
                  <span>{seedResult.credentials.internal.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyCredentials(seedResult.credentials.internal)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Email:</span>
                  <p className="font-mono">{seedResult.credentials.internal.email}</p>
                </div>
                <div>
                  <span className="text-gray-600">Password:</span>
                  <p className="font-mono">{seedResult.credentials.internal.password}</p>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Membre d'équipage interne avec interface freelancer mais statut d'employé.
              </p>
            </CardContent>
          </Card>

          {/* Freelancer Credentials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-purple-100 text-purple-800">Freelancers</Badge>
                  <span>External Crew Members</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyCredentials(seedResult.credentials.freelancers)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {seedResult.credentials.freelancers.map((freelancer: any, index: number) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium">{freelancer.name}</h5>
                    <Badge variant="outline" className="text-xs">
                      {freelancer.role}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-mono text-xs">{freelancer.email}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Password:</span>
                      <p className="font-mono text-xs">{freelancer.password}</p>
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-600">
                Membres d'équipage freelance externes avec accès limité à leurs missions et profil.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>Contenu du Peuplement</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span><strong>Utilisateurs:</strong> 1 Admin, 1 Personnel interne, 3 Freelancers avec profils complets</span>
            </div>
            <div className="flex items-center space-x-2">
              <Plane className="h-4 w-4 text-green-600" />
              <span><strong>Missions:</strong> Ordres de mission d'exemple dans différents états (approuvé, en attente, rejeté)</span>
            </div>
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-purple-600" />
              <span><strong>Notifications:</strong> Notifications réalistes pour chaque type d'utilisateur</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}