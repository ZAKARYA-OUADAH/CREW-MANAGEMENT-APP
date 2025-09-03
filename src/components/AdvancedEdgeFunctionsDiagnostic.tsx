import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { 
  AlertTriangle,
  CheckCircle,
  X,
  RefreshCw,
  Terminal,
  Copy,
  ExternalLink,
  Zap,
  CloudLightning,
  Settings,
  Shield,
  Database,
  Network,
  Key,
  FileText,
  Wrench,
  Eye,
  EyeOff
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: string;
  solution?: string;
  errorCode?: string;
}

interface AdvancedEdgeFunctionsDiagnosticProps {
  onClose?: () => void;
}

export default function AdvancedEdgeFunctionsDiagnostic({ onClose }: AdvancedEdgeFunctionsDiagnosticProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({});
  const [deploymentSuggestions, setDeploymentSuggestions] = useState<string[]>([]);
  const [showSecrets, setShowSecrets] = useState(false);

  const diagnosticTests = [
    {
      name: 'Ping Function',
      description: 'Test de base de réponse de la fonction',
      endpoint: '/health',
      method: 'GET'
    },
    {
      name: 'Auth Verification',
      description: 'Vérification de l\'authentification',
      endpoint: '/auth/verify',
      method: 'GET'
    },
    {
      name: 'Secrets Status',
      description: 'Vérification des variables d\'environnement',
      endpoint: '/secrets/status',
      method: 'GET'
    },
    {
      name: 'KV Store Connectivity',
      description: 'Test de connectivité à la base de données',
      endpoint: '/data/kv/ping',
      method: 'GET'
    },
    {
      name: 'CORS Configuration',
      description: 'Vérification de la configuration CORS',
      endpoint: '/health',
      method: 'OPTIONS'
    }
  ];

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDiagnostics([]);
    setCurrentTestIndex(0);
    setDeploymentSuggestions([]);

    const results: DiagnosticResult[] = [];

    for (let i = 0; i < diagnosticTests.length; i++) {
      setCurrentTestIndex(i);
      const test = diagnosticTests[i];
      
      const result = await runSingleDiagnostic(test);
      results.push(result);
      setDiagnostics([...results]);
      
      // Pause entre les tests pour une meilleure UX
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Analyser les résultats et proposer des solutions
    analyzeDiagnosticResults(results);
    setIsRunning(false);
  };

  const runSingleDiagnostic = async (test: any): Promise<DiagnosticResult> => {
    const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98`;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${baseUrl}${test.endpoint}`, {
        method: test.method,
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        return {
          test: test.name,
          status: 'success',
          message: `${test.description} - OK`,
          details: JSON.stringify(data, null, 2)
        };
      } else {
        let errorDetails = '';
        try {
          const errorData = await response.json();
          errorDetails = JSON.stringify(errorData, null, 2);
        } catch {
          errorDetails = response.statusText;
        }

        return {
          test: test.name,
          status: 'error',
          message: `${test.description} - Échec`,
          details: errorDetails,
          errorCode: response.status.toString(),
          solution: getSolutionForError(response.status, test.name)
        };
      }
    } catch (error: any) {
      return {
        test: test.name,
        status: 'error',
        message: `${test.description} - Erreur de connexion`,
        details: error.message,
        solution: getSolutionForError(0, test.name, error.message)
      };
    }
  };

  const getSolutionForError = (statusCode: number, testName: string, errorMessage?: string): string => {
    switch (statusCode) {
      case 404:
        return `La fonction n'existe pas ou n'est pas déployée. Utilisez le guide de déploiement pour configurer les Edge Functions.`;
      case 401:
        return `Problème d'authentification. Vérifiez vos clés API et la configuration des secrets.`;
      case 403:
        return `Accès refusé. Vérifiez les permissions et la configuration CORS.`;
      case 500:
        return `Erreur serveur. Vérifiez les logs de la fonction et la configuration des variables d'environnement.`;
      case 0:
        if (errorMessage?.includes('AbortError')) {
          return `Timeout de la requête. Le serveur met trop de temps à répondre.`;
        }
        return `Impossible de joindre le serveur. La fonction n'est probablement pas déployée.`;
      default:
        return `Erreur HTTP ${statusCode}. Consultez la documentation Supabase pour plus d'informations.`;
    }
  };

  const analyzeDiagnosticResults = (results: DiagnosticResult[]) => {
    const suggestions: string[] = [];
    const errors = results.filter(r => r.status === 'error');
    
    if (errors.length === results.length) {
      suggestions.push('Aucune Edge Function n\'est accessible. Déployement complet requis.');
    } else if (errors.some(e => e.errorCode === '404')) {
      suggestions.push('Fonction non trouvée (404). Vérifiez le déploiement.');
    }
    
    if (errors.some(e => e.errorCode === '401')) {
      suggestions.push('Problème d\'authentification (401). Configurez les secrets.');
    }
    
    if (errors.some(e => e.test === 'Secrets Status')) {
      suggestions.push('Variables d\'environnement manquantes ou incorrectes.');
    }
    
    if (results.every(r => r.status === 'success')) {
      suggestions.push('Toutes les fonctions sont opérationnelles !');
    }

    setDeploymentSuggestions(suggestions);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papiers');
  };

  const toggleDetails = (testName: string) => {
    setShowDetails(prev => ({
      ...prev,
      [testName]: !prev[testName]
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <X className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const progress = isRunning ? (currentTestIndex / diagnosticTests.length) * 100 : 100;
  const successCount = diagnostics.filter(d => d.status === 'success').length;
  const errorCount = diagnostics.filter(d => d.status === 'error').length;

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <CloudLightning className="h-6 w-6 text-blue-600" />
            <span>Diagnostic Avancé Edge Functions</span>
            {!isRunning && (
              <Badge variant="outline">
                {successCount}/{diagnostics.length} OK
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={runDiagnostics}
              disabled={isRunning}
            >
              {isRunning ? (
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              {isRunning ? 'En cours...' : 'Relancer'}
            </Button>
            
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        {isRunning && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Test en cours: {diagnosticTests[currentTestIndex]?.name}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informations du projet */}
        <Alert className="bg-blue-50 border-blue-200">
          <Database className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium text-blue-900">Configuration du projet</div>
              <div className="text-sm text-blue-800 space-y-1">
                <div>ID Projet: <code className="bg-blue-100 px-1 rounded">{projectId}</code></div>
                <div className="flex items-center space-x-2">
                  <span>Clé publique:</span>
                  <code className="bg-blue-100 px-1 rounded text-xs">
                    {showSecrets ? publicAnonKey : `${publicAnonKey.substring(0, 20)}...`}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="h-4 w-4 p-0"
                  >
                    {showSecrets ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Résultats des tests */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900 flex items-center space-x-2">
            <Network className="h-4 w-4" />
            <span>Résultats des tests</span>
          </h3>
          
          {diagnostics.length > 0 && (
            <div className="grid gap-3">
              {diagnostics.map((diagnostic, index) => (
                <div 
                  key={diagnostic.test}
                  className={`p-3 rounded-lg border ${getStatusColor(diagnostic.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(diagnostic.status)}
                      <div>
                        <div className="font-medium">{diagnostic.test}</div>
                        <div className="text-sm opacity-75">{diagnostic.message}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      {diagnostic.errorCode && (
                        <Badge variant="outline" className="text-xs">
                          {diagnostic.errorCode}
                        </Badge>
                      )}
                      
                      {(diagnostic.details || diagnostic.solution) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDetails(diagnostic.test)}
                          className="h-6 w-6 p-0"
                        >
                          {showDetails[diagnostic.test] ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {showDetails[diagnostic.test] && (
                    <div className="mt-3 space-y-2 border-t pt-2">
                      {diagnostic.solution && (
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <Wrench className="h-3 w-3" />
                            <span className="text-xs font-medium">Solution recommandée:</span>
                          </div>
                          <p className="text-xs bg-white bg-opacity-50 p-2 rounded">
                            {diagnostic.solution}
                          </p>
                        </div>
                      )}
                      
                      {diagnostic.details && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              <FileText className="h-3 w-3" />
                              <span className="text-xs font-medium">Détails techniques:</span>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(diagnostic.details!)}
                              className="h-5 text-xs"
                            >
                              <Copy className="h-2 w-2 mr-1" />
                              Copier
                            </Button>
                          </div>
                          <Textarea
                            value={diagnostic.details}
                            readOnly
                            className="text-xs font-mono bg-gray-900 text-green-400 border-gray-700"
                            rows={Math.min(diagnostic.details.split('\n').length, 5)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Suggestions de déploiement */}
        {deploymentSuggestions.length > 0 && (
          <div className="space-y-3">
            <Separator />
            
            <h3 className="font-medium text-gray-900 flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>Recommandations</span>
            </h3>
            
            <div className="space-y-2">
              {deploymentSuggestions.map((suggestion, index) => (
                <Alert 
                  key={index}
                  className={
                    suggestion.includes('opérationnelles') 
                      ? 'bg-green-50 border-green-200'
                      : 'bg-orange-50 border-orange-200'
                  }
                >
                  {suggestion.includes('opérationnelles') ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                  )}
                  <AlertDescription>
                    <div className="text-sm">
                      {suggestion}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Actions rapides */}
        {errorCount > 0 && (
          <div className="space-y-3">
            <Separator />
            
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Actions rapides</span>
              </h3>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}/functions`, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Dashboard Functions
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}/logs/edge-functions`, '_blank')}
              >
                <FileText className="h-3 w-3 mr-1" />
                Logs Edge Functions
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}/settings/api`, '_blank')}
              >
                <Key className="h-3 w-3 mr-1" />
                Clés API
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}