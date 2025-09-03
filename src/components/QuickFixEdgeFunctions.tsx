import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { 
  Zap,
  CheckCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
  Terminal,
  Key,
  Database,
  RefreshCw,
  Wrench,
  Clock,
  Shield
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface QuickFixStep {
  id: string;
  title: string;
  description: string;
  action: 'command' | 'link' | 'manual';
  data: string;
  status: 'pending' | 'completed';
  timeEstimate: string;
}

interface QuickFixEdgeFunctionsProps {
  errorType?: '404' | '401' | 'general';
  onComplete?: () => void;
}

export default function QuickFixEdgeFunctions({ 
  errorType = 'general',
  onComplete
}: QuickFixEdgeFunctionsProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  const getStepsForError = (type: string): QuickFixStep[] => {
    const baseSteps = [
      {
        id: 'check-cli',
        title: 'Vérifier Supabase CLI',
        description: 'Assurez-vous que Supabase CLI est installé et à jour',
        action: 'command' as const,
        data: 'npm install -g supabase@latest',
        status: 'pending' as const,
        timeEstimate: '2-3 min'
      },
      {
        id: 'login',
        title: 'Connexion Supabase',
        description: 'Se connecter à votre compte Supabase',
        action: 'command' as const,
        data: 'supabase login',
        status: 'pending' as const,
        timeEstimate: '1 min'
      }
    ];

    switch (type) {
      case '404':
        return [
          ...baseSteps,
          {
            id: 'link-project',
            title: 'Lier le projet',
            description: 'Connecter le CLI à votre projet Supabase',
            action: 'command' as const,
            data: `supabase link --project-ref ${projectId}`,
            status: 'pending' as const,
            timeEstimate: '1 min'
          },
          {
            id: 'deploy-function',
            title: 'Déployer la fonction',
            description: 'Créer et déployer la fonction make-server-9fd39b98',
            action: 'command' as const,
            data: `supabase functions deploy make-server-9fd39b98 --project-ref ${projectId}`,
            status: 'pending' as const,
            timeEstimate: '2-3 min'
          },
          {
            id: 'verify-deployment',
            title: 'Vérifier le déploiement',
            description: 'Tester que la fonction répond correctement',
            action: 'link' as const,
            data: `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/health`,
            status: 'pending' as const,
            timeEstimate: '30 sec'
          }
        ];

      case '401':
        return [
          ...baseSteps,
          {
            id: 'set-secrets',
            title: 'Configurer les secrets',
            description: 'Définir les variables d\'environnement requises',
            action: 'command' as const,
            data: `supabase secrets set SUPABASE_URL=https://${projectId}.supabase.co\nsupabase secrets set SUPABASE_ANON_KEY=${publicAnonKey}\nsupabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`,
            status: 'pending' as const,
            timeEstimate: '2-3 min'
          },
          {
            id: 'get-service-key',
            title: 'Récupérer la clé service',
            description: 'Obtenir votre clé service depuis le dashboard',
            action: 'link' as const,
            data: `https://supabase.com/dashboard/project/${projectId}/settings/api`,
            status: 'pending' as const,
            timeEstimate: '1 min'
          },
          {
            id: 'redeploy',
            title: 'Redéployer avec secrets',
            description: 'Redéployer la fonction avec les nouvelles variables',
            action: 'command' as const,
            data: `supabase functions deploy make-server-9fd39b98 --project-ref ${projectId}`,
            status: 'pending' as const,
            timeEstimate: '2-3 min'
          }
        ];

      default:
        return [
          ...baseSteps,
          {
            id: 'link-project',
            title: 'Lier le projet',
            description: 'Connecter le CLI à votre projet',
            action: 'command' as const,
            data: `supabase link --project-ref ${projectId}`,
            status: 'pending' as const,
            timeEstimate: '1 min'
          },
          {
            id: 'deploy-function',
            title: 'Déployer la fonction',
            description: 'Déployer make-server-9fd39b98',
            action: 'command' as const,
            data: `supabase functions deploy make-server-9fd39b98`,
            status: 'pending' as const,
            timeEstimate: '2-3 min'
          },
          {
            id: 'set-secrets',
            title: 'Configurer les secrets',
            description: 'Variables d\'environnement nécessaires',
            action: 'command' as const,
            data: `supabase secrets set SUPABASE_URL=https://${projectId}.supabase.co\nsupabase secrets set SUPABASE_ANON_KEY=${publicAnonKey}`,
            status: 'pending' as const,
            timeEstimate: '2 min'
          }
        ];
    }
  };

  const [steps, setSteps] = useState(() => getStepsForError(errorType));

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Commande copiée dans le presse-papiers');
  };

  const markStepCompleted = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      const newCompletedSteps = [...completedSteps, stepId];
      setCompletedSteps(newCompletedSteps);
      
      // Passer à l'étape suivante
      const currentStepIndex = steps.findIndex(s => s.id === stepId);
      if (currentStepIndex < steps.length - 1) {
        setCurrentStep(currentStepIndex + 1);
      } else {
        setIsCompleted(true);
        toast.success('🎉 Configuration terminée ! Testez vos Edge Functions.');
        if (onComplete) onComplete();
      }
    }
  };

  const getStepStatus = (stepId: string, index: number) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (index === currentStep) return 'current';
    return 'pending';
  };

  const getStepIcon = (stepId: string, index: number) => {
    const status = getStepStatus(stepId, index);
    
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'current':
        return <div className="h-4 w-4 rounded-full bg-blue-600 animate-pulse" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getErrorTypeInfo = () => {
    switch (errorType) {
      case '404':
        return {
          title: 'Résolution Erreur 404',
          description: 'La fonction Edge n\'existe pas ou n\'est pas déployée',
          icon: <Database className="h-5 w-5 text-red-600" />,
          color: 'bg-red-50 border-red-200'
        };
      case '401':
        return {
          title: 'Résolution Erreur 401',
          description: 'Problème d\'authentification ou de variables d\'environnement',
          icon: <Shield className="h-5 w-5 text-yellow-600" />,
          color: 'bg-yellow-50 border-yellow-200'
        };
      default:
        return {
          title: 'Configuration Edge Functions',
          description: 'Déploiement et configuration complète',
          icon: <Zap className="h-5 w-5 text-blue-600" />,
          color: 'bg-blue-50 border-blue-200'
        };
    }
  };

  const errorInfo = getErrorTypeInfo();
  const progressPercentage = (completedSteps.length / steps.length) * 100;
  const totalTimeEstimate = steps.reduce((total, step) => {
    const minutes = parseInt(step.timeEstimate.split('-')[0] || step.timeEstimate.split(' ')[0]);
    return total + minutes;
  }, 0);

  if (isCompleted) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription>
          <div className="space-y-2">
            <div className="font-medium text-green-900">
              Configuration terminée avec succès !
            </div>
            <p className="text-sm text-green-800">
              Vos Edge Functions devraient maintenant être opérationnelles. 
              Testez l'endpoint pour confirmer.
            </p>
            <div className="flex space-x-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/health`, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Tester la fonction
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Recharger l'app
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {errorInfo.icon}
          <span>{errorInfo.title}</span>
          <Badge variant="outline">
            {completedSteps.length}/{steps.length} étapes
          </Badge>
        </CardTitle>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">{errorInfo.description}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Progression</span>
              <span>{Math.round(progressPercentage)}% - ~{totalTimeEstimate} min</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Information du projet */}
        <Alert className={errorInfo.color}>
          <Terminal className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">Configuration du projet</div>
              <div className="text-sm">
                ID: <code className="bg-white bg-opacity-50 px-1 rounded">{projectId}</code>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Étapes */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const status = getStepStatus(step.id, index);
            
            return (
              <div 
                key={step.id}
                className={`p-4 rounded-lg border transition-colors ${
                  status === 'current' ? 'bg-blue-50 border-blue-200' :
                  status === 'completed' ? 'bg-green-50 border-green-200' :
                  'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {getStepIcon(step.id, index)}
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">
                        {index + 1}. {step.title}
                      </h4>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-2 w-2 mr-1" />
                          {step.timeEstimate}
                        </Badge>
                        
                        {status === 'completed' ? (
                          <Badge className="bg-green-100 text-green-800 text-xs">Terminé</Badge>
                        ) : status === 'current' ? (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">En cours</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">En attente</Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600">{step.description}</p>
                    
                    {(status === 'current' || status === 'completed') && (
                      <div className="space-y-2">
                        {step.action === 'command' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-700">Commande :</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => copyToClipboard(step.data)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copier
                              </Button>
                            </div>
                            
                            <Textarea
                              value={step.data}
                              readOnly
                              className="text-xs font-mono bg-gray-900 text-green-400 border-gray-700"
                              rows={step.data.split('\n').length}
                            />
                          </div>
                        )}
                        
                        {step.action === 'link' && (
                          <div className="space-y-2">
                            <span className="text-xs font-medium text-gray-700">Lien :</span>
                            <div className="flex items-center space-x-2">
                              <code className="flex-1 text-xs bg-gray-100 p-2 rounded">
                                {step.data}
                              </code>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(step.data, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Ouvrir
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {status === 'current' && (
                          <div className="pt-2">
                            <Button
                              size="sm"
                              onClick={() => markStepCompleted(step.id)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Marquer comme terminé
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            Étape {currentStep + 1} sur {steps.length}
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}`, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Dashboard
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://supabase.com/docs/guides/functions`, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Documentation
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}