import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Terminal, 
  Copy, 
  ExternalLink,
  Zap,
  Database,
  Key,
  Globe
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface EdgeFunctionDeploymentFixerProps {
  onClose?: () => void;
}

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'testing';
  message: string;
  details?: string;
  solution?: string;
  command?: string;
}

const EdgeFunctionDeploymentFixer: React.FC<EdgeFunctionDeploymentFixerProps> = ({ onClose }) => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTab, setSelectedTab] = useState('diagnostic');

  // Configuration par défaut pour CrewTech
  const EDGE_FUNCTION_CONFIG = {
    name: 'crew-tech-server',
    url: 'https://nrvzifxdmllgcidfhlzh.supabase.co/functions/v1/crew-tech-server',
    project_id: 'nrvzifxdmllgcidfhlzh',
    required_env_vars: [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ]
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    // Test 1: Ping la fonction Edge
    results.push({ name: 'Edge Function Ping', status: 'testing', message: 'Test en cours...' });
    setDiagnostics([...results]);
    
    try {
      const response = await fetch(`${EDGE_FUNCTION_CONFIG.url}/make-server-9fd39b98/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        results[results.length - 1] = {
          name: 'Edge Function Ping',
          status: 'success',
          message: `✅ Edge Function accessible (${response.status})`,
          details: `Version: ${data.version || 'Unknown'}, Status: ${data.status || 'Unknown'}`
        };
      } else {
        results[results.length - 1] = {
          name: 'Edge Function Ping',
          status: 'error',
          message: `❌ Edge Function non accessible (${response.status})`,
          solution: 'La fonction doit être redéployée',
          command: 'supabase functions deploy crew-tech-server'
        };
      }
    } catch (error: any) {
      results[results.length - 1] = {
        name: 'Edge Function Ping',
        status: 'error',
        message: '❌ Erreur de connexion',
        details: error.message,
        solution: 'Vérifier le déploiement de la fonction'
      };
    }

    // Test 2: Vérification des secrets
    results.push({ name: 'Variables Environnement', status: 'testing', message: 'Test en cours...' });
    setDiagnostics([...results]);
    
    try {
      const response = await fetch(`${EDGE_FUNCTION_CONFIG.url}/make-server-9fd39b98/secrets/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          results[results.length - 1] = {
            name: 'Variables Environnement',
            status: 'success',
            message: '✅ Toutes les variables sont configurées'
          };
        } else {
          results[results.length - 1] = {
            name: 'Variables Environnement',
            status: 'error',
            message: `❌ Variables manquantes: ${data.missing?.join(', ')}`,
            solution: 'Configurer les variables d\'environnement'
          };
        }
      } else {
        results[results.length - 1] = {
          name: 'Variables Environnement',
          status: 'warning',
          message: '⚠️ Impossible de vérifier les variables'
        };
      }
    } catch (error: any) {
      results[results.length - 1] = {
        name: 'Variables Environnement',
        status: 'error',
        message: '❌ Erreur lors de la vérification',
        details: error.message
      };
    }

    // Test 3: Test KV Store
    results.push({ name: 'Base de Données KV', status: 'testing', message: 'Test en cours...' });
    setDiagnostics([...results]);
    
    try {
      const response = await fetch(`${EDGE_FUNCTION_CONFIG.url}/make-server-9fd39b98/debug/kv-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase_access_token') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydnppZnhkbWxsZ2NpZGZobHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTY2OTAsImV4cCI6MjA3MTk3MjY5MH0.LQkxhokeAsrpQDKmBQ4f6mpP0XJlwRjXNEGKjOM1xVs'}`
        },
        body: JSON.stringify({ test_key: 'diagnostic_test', test_value: 'test_data' })
      });
      
      if (response.ok) {
        results[results.length - 1] = {
          name: 'Base de Données KV',
          status: 'success',
          message: '✅ Connexion KV Store fonctionnelle'
        };
      } else {
        results[results.length - 1] = {
          name: 'Base de Données KV',
          status: 'error',
          message: '❌ Problème de connexion KV Store',
          solution: 'Vérifier les permissions de la base de données'
        };
      }
    } catch (error: any) {
      results[results.length - 1] = {
        name: 'Base de Données KV',
        status: 'error',
        message: '❌ Erreur de connexion',
        details: error.message
      };
    }

    // Test 4: Test Auth
    results.push({ name: 'Système Auth', status: 'testing', message: 'Test en cours...' });
    setDiagnostics([...results]);
    
    try {
      const response = await fetch(`${EDGE_FUNCTION_CONFIG.url}/make-server-9fd39b98/debug/auth-test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        results[results.length - 1] = {
          name: 'Système Auth',
          status: 'success',
          message: '✅ Système d\'authentification fonctionnel'
        };
      } else {
        results[results.length - 1] = {
          name: 'Système Auth',
          status: 'error',
          message: '❌ Problème avec l\'authentification'
        };
      }
    } catch (error: any) {
      results[results.length - 1] = {
        name: 'Système Auth',
        status: 'error',
        message: '❌ Erreur du système auth',
        details: error.message
      };
    }

    setDiagnostics(results);
    setIsRunning(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papier');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'testing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-6 w-6 text-blue-500" />
              <CardTitle>Diagnostic & Réparation Edge Function</CardTitle>
            </div>
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="diagnostic">Diagnostic</TabsTrigger>
              <TabsTrigger value="deployment">Déploiement</TabsTrigger>
              <TabsTrigger value="environment">Variables</TabsTrigger>
              <TabsTrigger value="solutions">Solutions</TabsTrigger>
            </TabsList>

            <TabsContent value="diagnostic" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">État des Services Edge Functions</h3>
                <Button 
                  onClick={runDiagnostics} 
                  disabled={isRunning}
                  size="sm"
                >
                  {isRunning ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Relancer
                </Button>
              </div>

              <div className="space-y-3">
                {diagnostics.map((diagnostic, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        {getStatusIcon(diagnostic.status)}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{diagnostic.name}</h4>
                            <Badge variant={
                              diagnostic.status === 'success' ? 'default' : 
                              diagnostic.status === 'error' ? 'destructive' : 'secondary'
                            }>
                              {diagnostic.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {diagnostic.message}
                          </p>
                          {diagnostic.details && (
                            <Alert>
                              <AlertDescription className="text-xs">
                                <strong>Détails:</strong> {diagnostic.details}
                              </AlertDescription>
                            </Alert>
                          )}
                          {diagnostic.solution && (
                            <Alert>
                              <AlertDescription className="text-xs">
                                <strong>Solution:</strong> {diagnostic.solution}
                              </AlertDescription>
                            </Alert>
                          )}
                          {diagnostic.command && (
                            <div className="flex items-center space-x-2 p-2 bg-muted rounded">
                              <Terminal className="h-4 w-4" />
                              <code className="text-xs flex-1">{diagnostic.command}</code>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => copyToClipboard(diagnostic.command)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="deployment" className="space-y-4">
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  <strong>Guide de déploiement rapide</strong><br />
                  Suivez ces étapes pour déployer votre Edge Function CrewTech.
                </AlertDescription>
              </Alert>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">1</span>
                    Installer Supabase CLI
                  </h4>
                  <div className="bg-muted p-3 rounded-md font-mono text-sm">
                    <div className="flex items-center justify-between">
                      <span>npm install -g supabase</span>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard('npm install -g supabase')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">2</span>
                    Se connecter à Supabase
                  </h4>
                  <div className="bg-muted p-3 rounded-md font-mono text-sm">
                    <div className="flex items-center justify-between">
                      <span>supabase login</span>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard('supabase login')}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">3</span>
                    Associer au projet
                  </h4>
                  <div className="bg-muted p-3 rounded-md font-mono text-sm">
                    <div className="flex items-center justify-between">
                      <span>supabase link --project-ref {EDGE_FUNCTION_CONFIG.project_id}</span>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(`supabase link --project-ref ${EDGE_FUNCTION_CONFIG.project_id}`)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2 flex items-center">
                    <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">4</span>
                    Déployer la fonction
                  </h4>
                  <div className="bg-muted p-3 rounded-md font-mono text-sm">
                    <div className="flex items-center justify-between">
                      <span>supabase functions deploy {EDGE_FUNCTION_CONFIG.name}</span>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(`supabase functions deploy ${EDGE_FUNCTION_CONFIG.name}`)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <Alert>
                  <ExternalLink className="h-4 w-4" />
                  <AlertDescription>
                    Vous pouvez également déployer directement dans l'interface Supabase :<br />
                    <a 
                      href={`https://supabase.com/dashboard/project/${EDGE_FUNCTION_CONFIG.project_id}/functions`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Ouvrir le Dashboard Supabase →
                    </a>
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            <TabsContent value="environment" className="space-y-4">
              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                  <strong>Configuration des variables d'environnement</strong><br />
                  Ces variables sont requises pour le bon fonctionnement de l'Edge Function.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {EDGE_FUNCTION_CONFIG.required_env_vars.map((envVar) => (
                  <Card key={envVar}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{envVar}</h4>
                        <Badge variant="outline">Required</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {envVar === 'SUPABASE_URL' && 'URL de votre projet Supabase'}
                        {envVar === 'SUPABASE_ANON_KEY' && 'Clé publique pour l\'authentification côté client'}
                        {envVar === 'SUPABASE_SERVICE_ROLE_KEY' && 'Clé service pour les opérations serveur'}
                      </div>
                      {envVar === 'SUPABASE_URL' && (
                        <div className="bg-muted p-2 rounded font-mono text-xs">
                          https://nrvzifxdmllgcidfhlzh.supabase.co
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Comment configurer :</strong><br />
                  1. Ouvrez votre dashboard Supabase<br />
                  2. Allez dans Project Settings → API<br />
                  3. Copiez les valeurs URL et Keys<br />
                  4. Configurez-les dans Edge Functions → Settings
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="solutions" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Solutions aux problèmes courants</strong><br />
                  Guides de dépannage pour résoudre les erreurs Edge Functions.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🚫 Erreur 404 - Function Not Found</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      La fonction n'existe pas ou n'est pas déployée correctement.
                    </p>
                    <div className="space-y-2">
                      <h5 className="font-medium">Solutions :</h5>
                      <ul className="text-sm space-y-1 ml-4">
                        <li>• Vérifier que la fonction est déployée</li>
                        <li>• Vérifier le nom de la fonction</li>
                        <li>• Redéployer avec la CLI Supabase</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🔒 Erreur 401 - Unauthorized</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Problème d'authentification ou de permissions.
                    </p>
                    <div className="space-y-2">
                      <h5 className="font-medium">Solutions :</h5>
                      <ul className="text-sm space-y-1 ml-4">
                        <li>• Vérifier les clés API Supabase</li>
                        <li>• Contrôler les variables d'environnement</li>
                        <li>• Vérifier les permissions RLS</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">⚡ Erreur 500 - Internal Server Error</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Erreur interne dans le code de la fonction.
                    </p>
                    <div className="space-y-2">
                      <h5 className="font-medium">Solutions :</h5>
                      <ul className="text-sm space-y-1 ml-4">
                        <li>• Vérifier les logs de la fonction</li>
                        <li>• Contrôler la syntaxe du code</li>
                        <li>• Vérifier les dépendances</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🌐 Erreur CORS</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Problème de politique CORS pour les requêtes cross-origin.
                    </p>
                    <div className="space-y-2">
                      <h5 className="font-medium">Solutions :</h5>
                      <ul className="text-sm space-y-1 ml-4">
                        <li>• Vérifier la configuration CORS</li>
                        <li>• Ajouter les origines autorisées</li>
                        <li>• Contrôler les headers autorisés</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="pt-4">
                <Button 
                  onClick={() => window.open(`https://supabase.com/dashboard/project/${EDGE_FUNCTION_CONFIG.project_id}/functions`, '_blank')}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ouvrir Dashboard Supabase
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EdgeFunctionDeploymentFixer;