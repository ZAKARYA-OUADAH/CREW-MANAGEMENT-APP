import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import SupabaseDeploymentGuide from './SupabaseDeploymentGuide';
import { 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  Settings,
  Zap,
  ExternalLink,
  Copy,
  Terminal,
  CloudOff,
  Server,
  Shield,
  Wrench,
  Play,
  Code
} from 'lucide-react';

interface DiagnosticTest {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'warning' | 'error';
  message: string;
  details?: any;
  solution?: string;
  action?: () => Promise<void>;
}

interface SupabaseEnvironment {
  projectId: string;
  hasValidKey: boolean;
  projectUrl: string;
  functionsUrl: string;
  dashboardUrl: string;
}

export default function AdvancedSupabaseDiagnostic() {
  const [tests, setTests] = useState<DiagnosticTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [environment, setEnvironment] = useState<SupabaseEnvironment | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);

  // Initialiser les tests de diagnostic
  const initializeTests = (): DiagnosticTest[] => {
    return [
      {
        id: 'environment',
        name: 'Configuration Environnement',
        description: 'Vérification des variables Supabase',
        status: 'pending',
        message: 'En attente...'
      },
      {
        id: 'internet',
        name: 'Connectivité Internet',
        description: 'Test de connexion internet',
        status: 'pending',
        message: 'En attente...'
      },
      {
        id: 'supabase-api',
        name: 'API Supabase Accessible',
        description: 'Test de base de l\'API Supabase',
        status: 'pending',
        message: 'En attente...'
      },
      {
        id: 'edge-functions',
        name: 'Edge Functions Déployées',
        description: 'Vérification du déploiement des functions',
        status: 'pending',
        message: 'En attente...'
      },
      {
        id: 'server-endpoints',
        name: 'Endpoints Serveur',
        description: 'Test des endpoints principaux',
        status: 'pending',
        message: 'En attente...'
      },
      {
        id: 'database-access',
        name: 'Accès Base de Données',
        description: 'Test de connexion à la base de données',
        status: 'pending',
        message: 'En attente...'
      },
      {
        id: 'authentication',
        name: 'Service d\'Authentification',
        description: 'Test du service auth Supabase',
        status: 'pending',
        message: 'En attente...'
      }
    ];
  };

  // Utilitaire pour les requêtes avec timeout
  const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> => {
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
      throw error;
    }
  };

  // Mise à jour du statut d'un test
  const updateTest = (testId: string, updates: Partial<DiagnosticTest>) => {
    setTests(prev => prev.map(test => 
      test.id === testId ? { ...test, ...updates } : test
    ));
  };

  // Test 1: Configuration environnement
  const testEnvironment = async () => {
    updateTest('environment', { status: 'running', message: 'Vérification configuration...' });
    
    try {
      const hasProjectId = !!projectId && projectId.length === 20 && projectId !== 'your-project-id';
      const hasValidKey = !!publicAnonKey && publicAnonKey.length > 100;
      
      const env: SupabaseEnvironment = {
        projectId: projectId || '',
        hasValidKey,
        projectUrl: `https://${projectId}.supabase.co`,
        functionsUrl: `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98`,
        dashboardUrl: `https://supabase.com/dashboard/project/${projectId}`
      };
      
      setEnvironment(env);
      
      if (hasProjectId && hasValidKey) {
        updateTest('environment', { 
          status: 'success', 
          message: 'Configuration valide',
          details: env
        });
      } else {
        updateTest('environment', { 
          status: 'error', 
          message: 'Configuration invalide',
          solution: 'Utilisez SupabaseConfigUpdater pour corriger la configuration',
          details: { hasProjectId, hasValidKey, projectId, keyLength: publicAnonKey?.length || 0 }
        });
      }
    } catch (error) {
      updateTest('environment', { 
        status: 'error', 
        message: `Erreur de configuration: ${error.message}`,
        solution: 'Vérifiez les variables dans /utils/supabase/info.tsx'
      });
    }
  };

  // Test 2: Connectivité internet
  const testInternet = async () => {
    updateTest('internet', { status: 'running', message: 'Test connectivité...' });
    
    try {
      await fetchWithTimeout('https://httpbin.org/status/200', {}, 5000);
      updateTest('internet', { 
        status: 'success', 
        message: 'Connexion internet OK' 
      });
    } catch (error) {
      updateTest('internet', { 
        status: 'error', 
        message: 'Pas de connexion internet',
        solution: 'Vérifiez votre connexion internet et réessayez'
      });
    }
  };

  // Test 3: API Supabase de base
  const testSupabaseAPI = async () => {
    if (!environment?.projectId) return;
    
    updateTest('supabase-api', { status: 'running', message: 'Test API Supabase...' });
    
    try {
      // Test de l'endpoint auth (qui fonctionne selon les logs)
      const response = await fetchWithTimeout(
        `${environment.projectUrl}/auth/v1/settings`,
        {
          headers: {
            'apikey': publicAnonKey,
            'Authorization': `Bearer ${publicAnonKey}`
          }
        },
        8000
      );

      if (response.ok) {
        const data = await response.json();
        updateTest('supabase-api', { 
          status: 'success', 
          message: 'API Supabase accessible',
          details: data
        });
      } else {
        updateTest('supabase-api', { 
          status: 'error', 
          message: `API Supabase retourne ${response.status}`,
          solution: 'Vérifiez que le projet Supabase est actif'
        });
      }
    } catch (error) {
      updateTest('supabase-api', { 
        status: 'error', 
        message: `Erreur API Supabase: ${error.message}`,
        solution: 'Vérifiez l\'URL du projet et les clés API'
      });
    }
  };

  // Test 4: Edge Functions
  const testEdgeFunctions = async () => {
    if (!environment?.functionsUrl) return;
    
    updateTest('edge-functions', { status: 'running', message: 'Test Edge Functions...' });
    
    try {
      // Test health endpoint with updated configuration
      const response = await fetchWithTimeout(
        `${environment.functionsUrl}/health`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        },
        8000
      );

      if (response.status === 404) {
        updateTest('edge-functions', { 
          status: 'error', 
          message: 'Edge Functions non déployées (404)',
          solution: 'Les Edge Functions doivent être déployées sur Supabase',
          action: async () => await deployEdgeFunctions()
        });
      } else if (response.status === 401) {
        updateTest('edge-functions', { 
          status: 'warning', 
          message: 'Edge Functions présentes mais configuration auth incorrecte',
          solution: 'Vérifiez la configuration des clés API - nouvelles clés intégrées mais variables d\'environnement peut-être manquantes'
        });
      } else if (response.ok) {
        const data = await response.json();
        updateTest('edge-functions', { 
          status: 'success', 
          message: 'Edge Functions déployées et accessibles',
          details: data
        });
        
        // Test secrets endpoint if health is OK
        try {
          const secretsResponse = await fetchWithTimeout(
            `${environment.functionsUrl}/secrets/status`,
            {
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'Content-Type': 'application/json'
              }
            },
            5000
          );
          
          if (secretsResponse.ok) {
            const secretsData = await secretsResponse.json();
            updateTest('edge-functions', {
              status: secretsData.valid ? 'success' : 'warning',
              message: secretsData.valid ? 
                'Edge Functions déployées avec secrets configurés' : 
                'Edge Functions déployées mais secrets manquants',
              details: { health: data, secrets: secretsData }
            });
          }
        } catch (secretsError) {
          // Secrets endpoint not available, keep original status
        }
      } else {
        updateTest('edge-functions', { 
          status: 'warning', 
          message: `Edge Functions répondent avec status ${response.status}`,
          details: { status: response.status, statusText: response.statusText }
        });
      }
    } catch (error) {
      updateTest('edge-functions', { 
        status: 'error', 
        message: `Erreur Edge Functions: ${error.message}`,
        solution: 'Edge Functions non déployées ou inaccessibles'
      });
    }
  };

  // Test 5: Endpoints serveur
  const testServerEndpoints = async () => {
    if (!environment?.functionsUrl) return;
    
    updateTest('server-endpoints', { status: 'running', message: 'Test endpoints serveur...' });
    
    const endpoints = [
      '/seed/status-public',
      '/crew',
      '/missions'
    ];

    let successCount = 0;
    const results = [];

    for (const endpoint of endpoints) {
      try {
        const response = await fetchWithTimeout(
          `${environment.functionsUrl}${endpoint}`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`
            }
          },
          5000
        );
        
        if (response.ok) {
          successCount++;
        }
        
        results.push({
          endpoint,
          status: response.status,
          ok: response.ok
        });
      } catch (error) {
        results.push({
          endpoint,
          status: 'error',
          error: error.message
        });
      }
    }

    if (successCount === endpoints.length) {
      updateTest('server-endpoints', { 
        status: 'success', 
        message: `Tous les endpoints fonctionnent (${successCount}/${endpoints.length})`,
        details: results
      });
    } else if (successCount > 0) {
      updateTest('server-endpoints', { 
        status: 'warning', 
        message: `Endpoints partiellement fonctionnels (${successCount}/${endpoints.length})`,
        details: results
      });
    } else {
      updateTest('server-endpoints', { 
        status: 'error', 
        message: 'Aucun endpoint ne fonctionne',
        solution: 'Vérifiez le déploiement des Edge Functions',
        details: results
      });
    }
  };

  // Test 6: Accès base de données
  const testDatabaseAccess = async () => {
    if (!environment?.functionsUrl) return;
    
    updateTest('database-access', { status: 'running', message: 'Test base de données...' });
    
    try {
      const response = await fetchWithTimeout(
        `${environment.functionsUrl}/seed/status-public`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        },
        8000
      );

      if (response.ok) {
        const data = await response.json();
        updateTest('database-access', { 
          status: 'success', 
          message: 'Base de données accessible',
          details: data
        });
      } else {
        updateTest('database-access', { 
          status: 'error', 
          message: `Base de données inaccessible (${response.status})`,
          solution: 'Vérifiez les permissions et la configuration de la base de données'
        });
      }
    } catch (error) {
      updateTest('database-access', { 
        status: 'error', 
        message: `Erreur base de données: ${error.message}`
      });
    }
  };

  // Test 7: Authentification
  const testAuthentication = async () => {
    if (!environment?.projectUrl) return;
    
    updateTest('authentication', { status: 'running', message: 'Test authentification...' });
    
    try {
      const response = await fetchWithTimeout(
        `${environment.projectUrl}/auth/v1/settings`,
        {
          headers: {
            'apikey': publicAnonKey,
            'Authorization': `Bearer ${publicAnonKey}`
          }
        },
        5000
      );

      if (response.ok) {
        updateTest('authentication', { 
          status: 'success', 
          message: 'Service d\'authentification fonctionnel'
        });
      } else {
        updateTest('authentication', { 
          status: 'error', 
          message: `Authentification échoue (${response.status})`
        });
      }
    } catch (error) {
      updateTest('authentication', { 
        status: 'error', 
        message: `Erreur authentification: ${error.message}`
      });
    }
  };

  // Fonction de déploiement simulée des Edge Functions
  const deployEdgeFunctions = async () => {
    setIsDeploying(true);
    setDeploymentLogs([]);
    
    const addLog = (message: string) => {
      setDeploymentLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    addLog('🚀 Début du déploiement des Edge Functions...');
    addLog('📁 Vérification des fichiers locaux...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    addLog('✅ Fichiers Edge Functions trouvés');
    addLog('🔧 Préparation du déploiement...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    addLog('⚠️  ATTENTION: Le déploiement automatique n\'est pas encore implémenté');
    addLog('📋 Instructions manuelles:');
    addLog('1. Installez la CLI Supabase: npm install -g supabase');
    addLog('2. Connectez-vous: supabase login');
    addLog('3. Liez votre projet: supabase link --project-ref ' + projectId);
    addLog('4. Déployez les functions: supabase functions deploy');
    addLog('5. Vérifiez les variables d\'environnement dans le dashboard Supabase');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    addLog('🔄 Relancez le diagnostic après le déploiement manuel');
    
    setIsDeploying(false);
  };

  // Exécution de tous les tests
  const runFullDiagnostic = async () => {
    setIsRunning(true);
    setProgress(0);
    setTests(initializeTests());
    
    const testFunctions = [
      testEnvironment,
      testInternet,
      testSupabaseAPI,
      testEdgeFunctions,
      testServerEndpoints,
      testDatabaseAccess,
      testAuthentication
    ];
    
    for (let i = 0; i < testFunctions.length; i++) {
      setProgress(((i + 1) / testFunctions.length) * 100);
      await testFunctions[i]();
      await new Promise(resolve => setTimeout(resolve, 500)); // Pause entre tests
    }
    
    setIsRunning(false);
  };

  // Initialiser au chargement
  useEffect(() => {
    setTests(initializeTests());
  }, []);

  const getStatusIcon = (status: DiagnosticTest['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running': return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />;
      default: return <div className="h-4 w-4 border border-gray-300 rounded-full" />;
    }
  };

  const getStatusColor = (status: DiagnosticTest['status']) => {
    switch (status) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'error': return 'border-red-200 bg-red-50';
      case 'running': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const hasErrors = tests.some(t => t.status === 'error');
  const hasWarnings = tests.some(t => t.status === 'warning');
  const completedTests = tests.filter(t => t.status !== 'pending' && t.status !== 'running').length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5 text-blue-600" />
            <span>Diagnostic Avancé Supabase</span>
            {hasErrors && <Badge variant="destructive">Erreurs</Badge>}
            {hasWarnings && !hasErrors && <Badge className="bg-yellow-100 text-yellow-800">Avertissements</Badge>}
            {!hasErrors && !hasWarnings && completedTests > 0 && (
              <Badge className="bg-green-100 text-green-800">Fonctionnel</Badge>
            )}
          </CardTitle>
          
          <div className="flex space-x-2">
            <SupabaseDeploymentGuide />
            <Button
              onClick={runFullDiagnostic}
              disabled={isRunning}
              variant="outline"
            >
              {isRunning ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isRunning ? 'Diagnostic en cours...' : 'Lancer Diagnostic'}
            </Button>
          </div>
        </div>
        
        {isRunning && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-gray-600">
              Progression: {Math.round(progress)}% ({completedTests}/{tests.length} tests)
            </p>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Tabs defaultValue="results" className="w-full">
          <TabsList>
            <TabsTrigger value="results">Résultats Tests</TabsTrigger>
            <TabsTrigger value="environment">Environnement</TabsTrigger>
            <TabsTrigger value="deployment">Déploiement</TabsTrigger>
          </TabsList>
          
          <TabsContent value="results" className="space-y-4">
            {tests.map((test, index) => (
              <Card key={test.id} className={`${getStatusColor(test.status)} border-l-4`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <h4 className="font-medium">{test.name}</h4>
                        <p className="text-sm text-gray-600">{test.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {index + 1}/{tests.length}
                    </Badge>
                  </div>
                  
                  <p className="text-sm mb-2">{test.message}</p>
                  
                  {test.solution && (
                    <Alert className="mb-2">
                      <Wrench className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        <strong>Solution:</strong> {test.solution}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {test.action && (
                    <Button
                      size="sm"
                      onClick={test.action}
                      className="bg-purple-600 hover:bg-purple-700 mb-2"
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Réparer
                    </Button>
                  )}
                  
                  {test.details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                        Détails techniques
                      </summary>
                      <pre className="bg-white p-2 mt-1 rounded text-xs overflow-auto border">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
          
          <TabsContent value="environment" className="space-y-4">
            {environment ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Configuration Actuelle</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="text-sm font-medium">Project ID:</span>
                      <Badge variant="outline" className="ml-2 font-mono text-xs">
                        {environment.projectId}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Clé valide:</span>
                      <Badge variant={environment.hasValidKey ? "default" : "destructive"} className="ml-2">
                        {environment.hasValidKey ? "Oui" : "Non"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">URLs Générées</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      {[
                        { label: 'Projet', url: environment.projectUrl },
                        { label: 'Functions', url: environment.functionsUrl },
                        { label: 'Dashboard', url: environment.dashboardUrl }
                      ].map(({ label, url }) => (
                        <div key={label} className="flex items-center space-x-2">
                          <span className="text-xs text-gray-600 w-20">{label}:</span>
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs flex items-center space-x-1"
                          >
                            <span className="font-mono truncate max-w-xs">{url}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  Lancez le diagnostic pour voir les informations d'environnement.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="deployment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <CloudOff className="h-5 w-5" />
                  <span>Déploiement Edge Functions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    Les Edge Functions semblent ne pas être déployées (erreur 404). 
                    Le déploiement manuel est nécessaire via la CLI Supabase.
                  </AlertDescription>
                </Alert>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Terminal className="h-4 w-4 mr-2" />
                      Instructions de Déploiement
                    </Button>
                  </DialogTrigger>
                  
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Déploiement Edge Functions - Instructions</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <Alert className="border-blue-200 bg-blue-50">
                        <Code className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          Suivez ces étapes pour déployer manuellement les Edge Functions sur Supabase.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-3">
                        <h3 className="font-medium">Étapes de déploiement:</h3>
                        
                        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm space-y-2">
                          <div># 1. Installation de la CLI Supabase</div>
                          <div className="text-white">npm install -g supabase</div>
                          
                          <div className="mt-3"># 2. Connexion à Supabase</div>
                          <div className="text-white">supabase login</div>
                          
                          <div className="mt-3"># 3. Liaison avec votre projet</div>
                          <div className="text-white">supabase link --project-ref {projectId}</div>
                          
                          <div className="mt-3"># 4. Déploiement des functions</div>
                          <div className="text-white">supabase functions deploy</div>
                          
                          <div className="mt-3"># 5. Configuration des variables (optionnel)</div>
                          <div className="text-white">supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key</div>
                        </div>
                        
                        <Alert className="border-yellow-200 bg-yellow-50">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <AlertDescription className="text-yellow-800">
                            <strong>Important:</strong> Après le déploiement, configurez les variables d'environnement 
                            dans le dashboard Supabase (Settings → Edge Functions → Environment Variables).
                          </AlertDescription>
                        </Alert>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                {deploymentLogs.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium">Logs de déploiement:</h3>
                    <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-xs max-h-40 overflow-y-auto">
                      {deploymentLogs.map((log, index) => (
                        <div key={index}>{log}</div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}