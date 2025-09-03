import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Textarea } from './ui/textarea';
import { 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Server,
  Globe,
  Key,
  Cloud,
  Zap,
  RefreshCw,
  ExternalLink,
  Copy,
  FileText,
  Terminal,
  Settings,
  Wrench
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface DiagnosticStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'warning' | 'error';
  result?: any;
  solution?: string;
  actionable?: boolean;
  timestamp?: Date;
}

interface EdgeFunctionsDiagnosticProps {
  autoRun?: boolean;
  onComplete?: (results: DiagnosticStep[]) => void;
}

export default function EdgeFunctionsDiagnostic({ autoRun = false, onComplete }: EdgeFunctionsDiagnosticProps) {
  const [steps, setSteps] = useState<DiagnosticStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showDeploymentGuide, setShowDeploymentGuide] = useState(false);

  const diagnosticSteps: Omit<DiagnosticStep, 'status' | 'timestamp'>[] = [
    {
      id: 'internet',
      name: 'Connectivité Internet',
      description: 'Vérification de la connexion internet de base'
    },
    {
      id: 'supabase_project',
      name: 'Projet Supabase',
      description: 'Accessibilité du projet Supabase'
    },
    {
      id: 'edge_functions_service',
      name: 'Service Edge Functions',
      description: 'Disponibilité du service Edge Functions'
    },
    {
      id: 'function_deployment',
      name: 'Déploiement de la Fonction',
      description: 'Vérification du déploiement de make-server-9fd39b98'
    },
    {
      id: 'environment_variables',
      name: 'Variables d\'Environnement',
      description: 'Configuration des variables d\'environnement'
    },
    {
      id: 'function_health',
      name: 'Santé de la Fonction',
      description: 'Test de santé complet de la fonction'
    },
    {
      id: 'billing_status',
      name: 'Statut de Facturation',
      description: 'Vérification du statut de facturation Supabase'
    }
  ];

  useEffect(() => {
    const initialSteps = diagnosticSteps.map(step => ({
      ...step,
      status: 'pending' as const,
      timestamp: new Date()
    }));
    setSteps(initialSteps);

    if (autoRun) {
      runDiagnostic();
    }
  }, [autoRun]);

  const updateStep = (stepId: string, updates: Partial<DiagnosticStep>) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, ...updates, timestamp: new Date() }
        : step
    ));
  };

  const runDiagnostic = async () => {
    setIsRunning(true);
    setCurrentStepIndex(0);
    setProgress(0);

    const totalSteps = diagnosticSteps.length;

    for (let i = 0; i < totalSteps; i++) {
      const step = diagnosticSteps[i];
      setCurrentStepIndex(i);
      updateStep(step.id, { status: 'running' });

      try {
        const result = await executeStep(step.id);
        updateStep(step.id, {
          status: result.success ? 'success' : 'error',
          result: result.data,
          solution: result.solution,
          actionable: result.actionable
        });
      } catch (error) {
        updateStep(step.id, {
          status: 'error',
          result: { error: error.message },
          solution: 'Une erreur inattendue s\'est produite lors de ce test',
          actionable: true
        });
      }

      setProgress(((i + 1) / totalSteps) * 100);
      await new Promise(resolve => setTimeout(resolve, 500)); // Pause entre les étapes
    }

    setIsRunning(false);
    setCurrentStepIndex(-1);

    if (onComplete) {
      onComplete(steps);
    }
  };

  const executeStep = async (stepId: string): Promise<{ success: boolean; data?: any; solution?: string; actionable?: boolean }> => {
    switch (stepId) {
      case 'internet':
        return await testInternetConnectivity();
      
      case 'supabase_project':
        return await testSupabaseProject();
      
      case 'edge_functions_service':
        return await testEdgeFunctionsService();
      
      case 'function_deployment':
        return await testFunctionDeployment();
      
      case 'environment_variables':
        return await testEnvironmentVariables();
      
      case 'function_health':
        return await testFunctionHealth();
      
      case 'billing_status':
        return await testBillingStatus();
      
      default:
        throw new Error(`Étape de diagnostic inconnue: ${stepId}`);
    }
  };

  const testInternetConnectivity = async () => {
    try {
      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      return {
        success: response.ok,
        data: { status: response.status, online: navigator.onLine },
        solution: !response.ok ? 'Vérifiez votre connexion internet et réessayez' : undefined,
        actionable: !response.ok
      };
    } catch (error) {
      return {
        success: false,
        data: { error: error.message, online: navigator.onLine },
        solution: 'Vérifiez votre connexion internet. Vous semblez être hors ligne.',
        actionable: true
      };
    }
  };

  const testSupabaseProject = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/rest/v1/`, {
        method: 'HEAD',
        headers: { 'apikey': publicAnonKey },
        signal: AbortSignal.timeout(10000)
      });

      return {
        success: response.ok || response.status === 404,
        data: { 
          status: response.status, 
          projectId,
          reachable: response.ok || response.status === 404
        },
        solution: !(response.ok || response.status === 404) 
          ? 'Vérifiez que l\'ID du projet Supabase est correct et que le projet existe'
          : undefined,
        actionable: !(response.ok || response.status === 404)
      };
    } catch (error) {
      return {
        success: false,
        data: { error: error.message, projectId },
        solution: 'Impossible d\'atteindre le projet Supabase. Vérifiez l\'ID du projet et l\'état du service.',
        actionable: true
      };
    }
  };

  const testEdgeFunctionsService = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/`, {
        method: 'GET',
        signal: AbortSignal.timeout(15000)
      });

      if (response.ok) {
        return {
          success: true,
          data: { status: response.status, service_enabled: true }
        };
      } else if (response.status === 403) {
        return {
          success: false,
          data: { status: response.status, service_enabled: false },
          solution: 'Les Edge Functions ne sont pas activées pour ce projet. Activez-les dans le dashboard Supabase.',
          actionable: true
        };
      } else {
        return {
          success: false,
          data: { status: response.status },
          solution: 'Le service Edge Functions renvoie une erreur. Vérifiez l\'état du service dans Supabase.',
          actionable: true
        };
      }
    } catch (error) {
      return {
        success: false,
        data: { error: error.message },
        solution: 'Impossible d\'accéder au service Edge Functions. Il peut ne pas être activé ou configuré.',
        actionable: true
      };
    }
  };

  const testFunctionDeployment = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/health`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(20000)
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: { deployed: true, health_data: data }
        };
      } else if (response.status === 404) {
        return {
          success: false,
          data: { deployed: false, status: response.status },
          solution: 'La fonction make-server-9fd39b98 n\'est pas déployée. Utilisez `supabase functions deploy make-server-9fd39b98`',
          actionable: true
        };
      } else {
        return {
          success: false,
          data: { deployed: true, status: response.status, error: true },
          solution: 'La fonction est déployée mais renvoie une erreur. Vérifiez les logs de la fonction.',
          actionable: true
        };
      }
    } catch (error) {
      return {
        success: false,
        data: { error: error.message },
        solution: 'Impossible de contacter la fonction. Elle peut ne pas être déployée ou être en erreur.',
        actionable: true
      };
    }
  };

  const testEnvironmentVariables = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/secrets/status`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(15000)
        }
      );

      if (response.ok) {
        const data = await response.json();
        const missingVars = Object.entries(data.configured)
          .filter(([key, value]) => !value)
          .map(([key]) => key);

        return {
          success: missingVars.length === 0,
          data: { ...data, missing_vars: missingVars },
          solution: missingVars.length > 0 
            ? `Variables manquantes: ${missingVars.join(', ')}. Configurez-les dans le dashboard Supabase.`
            : undefined,
          actionable: missingVars.length > 0
        };
      } else {
        return {
          success: false,
          data: { status: response.status },
          solution: 'Impossible de vérifier les variables d\'environnement. La fonction peut ne pas être déployée.',
          actionable: true
        };
      }
    } catch (error) {
      return {
        success: false,
        data: { error: error.message },
        solution: 'Erreur lors de la vérification des variables d\'environnement.',
        actionable: true
      };
    }
  };

  const testFunctionHealth = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/debug/simple-test`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(15000)
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: data.success === true,
          data,
          solution: data.success !== true ? 'La fonction répond mais a des problèmes internes.' : undefined,
          actionable: data.success !== true
        };
      } else {
        return {
          success: false,
          data: { status: response.status },
          solution: 'La fonction ne répond pas correctement aux tests de santé.',
          actionable: true
        };
      }
    } catch (error) {
      return {
        success: false,
        data: { error: error.message },
        solution: 'Impossible d\'effectuer le test de santé de la fonction.',
        actionable: true
      };
    }
  };

  const testBillingStatus = async () => {
    // Ce test est approximatif car nous ne pouvons pas accéder directement aux infos de facturation
    try {
      const response = await fetch(`https://${projectId}.supabase.co/rest/v1/`, {
        method: 'HEAD',
        headers: { 'apikey': publicAnonKey }
      });

      if (response.status === 402) {
        return {
          success: false,
          data: { billing_issue: true, status: response.status },
          solution: 'Problème de facturation détecté. Vérifiez votre abonnement Supabase et le statut de paiement.',
          actionable: true
        };
      }

      return {
        success: true,
        data: { billing_ok: true },
        solution: undefined
      };
    } catch (error) {
      return {
        success: false,
        data: { error: error.message },
        solution: 'Impossible de vérifier le statut de facturation.',
        actionable: false
      };
    }
  };

  const getStepIcon = (status: DiagnosticStep['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getStepColor = (status: DiagnosticStep['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'running':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papiers');
  };

  const deploymentCommands = `# Déployer la fonction Edge sur Supabase
supabase functions deploy make-server-9fd39b98

# Configurer les variables d'environnement
supabase secrets set SUPABASE_URL=https://${projectId}.supabase.co
supabase secrets set SUPABASE_ANON_KEY=${publicAnonKey}
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Vérifier les logs
supabase functions logs make-server-9fd39b98`;

  const hasErrors = steps.some(step => step.status === 'error');
  const hasDeploymentError = steps.find(step => step.id === 'function_deployment')?.status === 'error';

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-6 w-6 text-blue-600" />
          <span>Diagnostic Edge Functions Supabase</span>
          {!isRunning && steps.length > 0 && (
            <Badge variant={hasErrors ? 'destructive' : 'default'}>
              {steps.filter(s => s.status === 'success').length}/{steps.length} OK
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Diagnostic spécialisé pour résoudre les problèmes d'accès aux Edge Functions
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {!isRunning && steps.length === 0 && (
          <div className="text-center space-y-4">
            <div className="bg-blue-50 rounded-lg p-6">
              <Cloud className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-medium text-blue-900 mb-2">
                Diagnostic Complet des Edge Functions
              </h3>
              <p className="text-sm text-blue-700 mb-4">
                Ce diagnostic va identifier précisément pourquoi les Edge Functions Supabase ne sont pas accessibles
              </p>
              <ul className="text-xs text-blue-600 space-y-1 text-left">
                <li>• Test de connectivité internet et Supabase</li>
                <li>• Vérification du service Edge Functions</li>
                <li>• Contrôle du déploiement de la fonction</li>
                <li>• Validation des variables d'environnement</li>
                <li>• Test de santé fonctionnel</li>
                <li>• Vérification du statut de facturation</li>
              </ul>
            </div>
            
            <Button onClick={runDiagnostic} size="lg" className="w-full">
              <Wrench className="h-4 w-4 mr-2" />
              Lancer le Diagnostic
            </Button>
          </div>
        )}

        {isRunning && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Diagnostic en cours...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
            
            {currentStepIndex >= 0 && (
              <div className="flex items-center space-x-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">
                  {diagnosticSteps[currentStepIndex]?.name}...
                </span>
              </div>
            )}
          </div>
        )}

        {steps.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Résultats du Diagnostic</h3>
            
            <div className="space-y-3">
              {steps.map((step) => (
                <Alert key={step.id} className={getStepColor(step.status)}>
                  <div className="flex items-start space-x-3">
                    {getStepIcon(step.status)}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{step.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {step.status === 'success' ? 'OK' : 
                           step.status === 'error' ? 'ERREUR' :
                           step.status === 'warning' ? 'AVERTISSEMENT' :
                           step.status === 'running' ? 'EN COURS' : 'EN ATTENTE'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600">{step.description}</p>
                      
                      {step.solution && (
                        <div className="bg-black/5 rounded p-3 space-y-2">
                          <div className="flex items-center space-x-2">
                            <AlertCircle className="h-3 w-3 text-orange-600" />
                            <span className="text-xs font-medium text-orange-800">Solution</span>
                          </div>
                          <p className="text-xs text-gray-700">{step.solution}</p>
                        </div>
                      )}
                      
                      {step.result && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                            Détails techniques
                          </summary>
                          <pre className="mt-2 p-2 bg-black/5 rounded overflow-auto text-xs">
                            {JSON.stringify(step.result, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>

            {hasDeploymentError && (
              <div className="space-y-4">
                <Separator />
                <div className="bg-orange-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Terminal className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-orange-900">Solution de Déploiement</span>
                  </div>
                  
                  <p className="text-sm text-orange-800">
                    Il semble que la fonction Edge ne soit pas déployée. Voici les commandes pour la déployer :
                  </p>
                  
                  <div className="relative">
                    <Textarea
                      value={deploymentCommands}
                      readOnly
                      className="text-xs font-mono bg-gray-900 text-green-400 border-gray-700"
                      rows={8}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(deploymentCommands)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeploymentGuide(true)}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Guide de Déploiement Complet
                  </Button>
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <Button variant="outline" onClick={runDiagnostic}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Relancer
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}`, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Dashboard Supabase
              </Button>
            </div>
          </div>
        )}

        {showDeploymentGuide && (
          <Alert className="bg-blue-50 border-blue-200">
            <FileText className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <div className="space-y-3">
                <div className="font-medium text-blue-900">Guide de Déploiement Complet</div>
                
                <div className="text-sm text-blue-800 space-y-2">
                  <p><strong>1. Prérequis :</strong></p>
                  <ul className="ml-4 space-y-1 text-xs">
                    <li>• Supabase CLI installé (<code>npm install -g supabase</code>)</li>
                    <li>• Connexion au projet (<code>supabase login</code>)</li>
                    <li>• Projet lié (<code>supabase link --project-ref {projectId}</code>)</li>
                  </ul>
                  
                  <p><strong>2. Déploiement :</strong></p>
                  <ul className="ml-4 space-y-1 text-xs">
                    <li>• Déployer la fonction : <code>supabase functions deploy make-server-9fd39b98</code></li>
                    <li>• Configurer les secrets (voir commandes ci-dessus)</li>
                    <li>• Vérifier les logs : <code>supabase functions logs make-server-9fd39b98</code></li>
                  </ul>
                  
                  <p><strong>3. Vérification :</strong></p>
                  <ul className="ml-4 space-y-1 text-xs">
                    <li>• Tester l'endpoint : <code>curl https://{projectId}.supabase.co/functions/v1/make-server-9fd39b98/health</code></li>
                  </ul>
                </div>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowDeploymentGuide(false)}
                >
                  Fermer
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}