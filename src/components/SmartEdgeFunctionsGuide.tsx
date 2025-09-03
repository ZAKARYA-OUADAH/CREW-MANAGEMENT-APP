import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Textarea } from './ui/textarea';
import { 
  Rocket,
  CheckCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
  Terminal,
  Zap,
  RefreshCw,
  Play,
  ChevronRight,
  Settings,
  CloudLightning
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import * as kv from '../utils/supabase/kv_store';

interface DeploymentStep {
  id: string;
  title: string;
  description: string;
  command?: string;
  status: 'pending' | 'completed' | 'current' | 'failed';
  details?: string;
}

interface SmartEdgeFunctionsGuideProps {
  onComplete?: () => void;
  compact?: boolean;
}

export default function SmartEdgeFunctionsGuide({ onComplete, compact = false }: SmartEdgeFunctionsGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [deploymentStatus, setDeploymentStatus] = useState<'checking' | 'needed' | 'deployed'>('checking');
  const [isChecking, setIsChecking] = useState(false);
  const [showFullGuide, setShowFullGuide] = useState(false);

  const deploymentSteps: DeploymentStep[] = [
    {
      id: 'check-cli',
      title: 'Installer Supabase CLI',
      description: 'Installation de l\'outil en ligne de commande Supabase',
      command: 'npm install -g supabase',
      status: 'pending'
    },
    {
      id: 'login',
      title: 'Se connecter à Supabase',
      description: 'Authentification avec votre compte Supabase',
      command: 'supabase login',
      status: 'pending'
    },
    {
      id: 'link-project',
      title: 'Lier le projet',
      description: 'Connecter le CLI à votre projet Supabase',
      command: `supabase link --project-ref ${projectId}`,
      status: 'pending'
    },
    {
      id: 'deploy-function',
      title: 'Déployer la fonction',
      description: 'Déployer make-server-9fd39b98 sur Supabase',
      command: 'supabase functions deploy make-server-9fd39b98',
      status: 'pending'
    },
    {
      id: 'configure-secrets',
      title: 'Configurer les secrets',
      description: 'Définir les variables d\'environnement nécessaires',
      command: `supabase secrets set SUPABASE_URL=https://${projectId}.supabase.co\nsupabase secrets set SUPABASE_ANON_KEY=${publicAnonKey}\nsupabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key`,
      status: 'pending',
      details: 'Remplacez your_service_role_key par votre vraie clé depuis le dashboard'
    },
    {
      id: 'test-function',
      title: 'Tester la fonction',
      description: 'Vérifier que la fonction répond correctement',
      command: `curl https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/health`,
      status: 'pending'
    }
  ];

  const [steps, setSteps] = useState<DeploymentStep[]>(deploymentSteps);

  useEffect(() => {
    checkDeploymentStatus();
  }, []);

  const checkDeploymentStatus = async () => {
    setIsChecking(true);
    
    try {
      // Test direct de la fonction
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/health`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(10000)
        }
      );

      if (response.ok) {
        setDeploymentStatus('deployed');
        toast.success('Edge Functions déjà déployées et fonctionnelles !');
        if (onComplete) onComplete();
      } else {
        setDeploymentStatus('needed');
      }
    } catch (error) {
      setDeploymentStatus('needed');
    }
    
    setIsChecking(false);
  };

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    toast.success('Commande copiée dans le presse-papiers');
  };

  const markStepCompleted = (stepIndex: number) => {
    setSteps(prev => prev.map((step, index) => ({
      ...step,
      status: index <= stepIndex ? 'completed' : 'pending'
    })));
    
    if (stepIndex < steps.length - 1) {
      setCurrentStep(stepIndex + 1);
    } else {
      // Toutes les étapes terminées, vérifier à nouveau
      setTimeout(() => {
        checkDeploymentStatus();
      }, 2000);
    }
  };

  const getStepIcon = (step: DeploymentStep, index: number) => {
    if (step.status === 'completed') {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (index === currentStep) {
      return <div className="h-4 w-4 rounded-full bg-blue-600 animate-pulse" />;
    }
    return <div className="h-4 w-4 rounded-full bg-gray-300" />;
  };

  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  if (isChecking) {
    return (
      <Card className={compact ? "w-full" : "w-full max-w-2xl"}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            <span>Vérification du statut des Edge Functions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (deploymentStatus === 'deployed') {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription>
          <div className="space-y-2">
            <div className="font-medium text-green-900">
              Edge Functions déployées avec succès !
            </div>
            <p className="text-sm text-green-800">
              Votre fonction make-server-9fd39b98 est active et répond correctement.
              L'application va maintenant fonctionner en mode serveur.
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={checkDeploymentStatus}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Revérifier
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (compact && !showFullGuide) {
    return (
      <Card className="w-full border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CloudLightning className="h-5 w-5 text-orange-600" />
              <div>
                <div className="font-medium text-orange-900">
                  Edge Functions à déployer
                </div>
                <div className="text-sm text-orange-700">
                  Configuration requise pour activer toutes les fonctionnalités
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                size="sm"
                onClick={() => setShowFullGuide(true)}
              >
                <Rocket className="h-3 w-3 mr-1" />
                Déployer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={compact ? "w-full" : "w-full max-w-4xl"}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Rocket className="h-6 w-6 text-blue-600" />
          <span>Guide de Déploiement Intelligent</span>
          <Badge variant="outline">
            {completedSteps}/{steps.length} étapes
          </Badge>
        </CardTitle>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Suivez ces étapes pour déployer les Edge Functions et activer toutes les fonctionnalités
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Progression</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Alerte d'information */}
        <Alert className="bg-blue-50 border-blue-200">
          <Terminal className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium text-blue-900">Prérequis</div>
              <p className="text-sm text-blue-800">
                Vous aurez besoin d'un terminal/invite de commandes et de Node.js installé sur votre machine.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Liste des étapes */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`p-4 rounded-lg border transition-colors ${
                index === currentStep ? 'bg-blue-50 border-blue-200' :
                step.status === 'completed' ? 'bg-green-50 border-green-200' :
                'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start space-x-3">
                {getStepIcon(step, index)}
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      {index + 1}. {step.title}
                    </h4>
                    
                    {step.status === 'completed' ? (
                      <Badge className="bg-green-100 text-green-800">Terminé</Badge>
                    ) : index === currentStep ? (
                      <Badge className="bg-blue-100 text-blue-800">En cours</Badge>
                    ) : (
                      <Badge variant="outline">En attente</Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600">{step.description}</p>
                  
                  {step.command && (index === currentStep || step.status === 'completed') && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700">Commande :</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyCommand(step.command!)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copier
                        </Button>
                      </div>
                      
                      <Textarea
                        value={step.command}
                        readOnly
                        className="text-xs font-mono bg-gray-900 text-green-400 border-gray-700"
                        rows={step.command.split('\n').length}
                      />
                      
                      {step.details && (
                        <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                          💡 {step.details}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {index === currentStep && step.status !== 'completed' && (
                    <div className="flex space-x-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => markStepCompleted(index)}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Marquer comme terminé
                      </Button>
                      
                      {step.id === 'configure-secrets' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}/settings/api`, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Clés API
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions finales */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            Une fois toutes les étapes terminées, testez le déploiement
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={checkDeploymentStatus}
              disabled={isChecking}
            >
              {isChecking ? (
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Play className="h-3 w-3 mr-1" />
              )}
              Tester
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}`, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Dashboard
            </Button>
          </div>
        </div>
        
        {compact && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullGuide(false)}
              className="w-full"
            >
              Réduire le guide
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}