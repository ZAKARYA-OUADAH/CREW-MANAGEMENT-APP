import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { 
  AlertTriangle, 
  Settings, 
  ExternalLink, 
  RefreshCw, 
  X,
  Zap,
  CheckCircle
} from 'lucide-react';

interface ServerStatus {
  isConfigured: boolean;
  isOnline: boolean;
  hasErrors: boolean;
  lastChecked: Date | null;
  errors: string[];
}

export default function QuickFixBanner() {
  const [serverStatus, setServerStatus] = useState<ServerStatus>({
    isConfigured: false,
    isOnline: false,
    hasErrors: true,
    lastChecked: null,
    errors: []
  });
  const [isVisible, setIsVisible] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [hasCheckedOnMount, setHasCheckedOnMount] = useState(false);

  // Vérification rapide du statut
  const checkServerStatus = async () => {
    setIsChecking(true);
    
    try {
      // Vérifier la configuration
      const isConfigured = !!(
        projectId && 
        publicAnonKey && 
        projectId.length === 20 && 
        publicAnonKey.length > 100 &&
        projectId !== 'your-project-id'
      );

      if (!isConfigured) {
        setServerStatus({
          isConfigured: false,
          isOnline: false,
          hasErrors: true,
          lastChecked: new Date(),
          errors: ['Configuration Supabase invalide']
        });
        setIsChecking(false);
        return;
      }

      // Test rapide de connectivité
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        // Test auth endpoint (celui qui fonctionne selon les logs)
        const authResponse = await fetch(
          `https://${projectId}.supabase.co/auth/v1/settings`,
          {
            headers: {
              'apikey': publicAnonKey,
              'Authorization': `Bearer ${publicAnonKey}`
            },
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        const errors: string[] = [];
        let isOnline = false;

        if (authResponse.ok) {
          isOnline = true;
          
          // Test rapide des edge functions
          try {
            const functionsResponse = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/health`,
              {
                headers: {
                  'Authorization': `Bearer ${publicAnonKey}`
                },
                signal: controller.signal
              }
            );

            if (functionsResponse.status === 404) {
              errors.push('Edge Functions non déployées');
            } else if (functionsResponse.status === 401) {
              errors.push('Configuration auth Edge Functions');
            }
          } catch (funcError) {
            errors.push('Edge Functions inaccessibles');
          }
        } else {
          errors.push('API Supabase inaccessible');
        }

        setServerStatus({
          isConfigured: true,
          isOnline,
          hasErrors: errors.length > 0,
          lastChecked: new Date(),
          errors
        });

      } catch (fetchError) {
        clearTimeout(timeoutId);
        setServerStatus({
          isConfigured: true,
          isOnline: false,
          hasErrors: true,
          lastChecked: new Date(),
          errors: ['Connexion serveur impossible']
        });
      }

    } catch (error) {
      setServerStatus({
        isConfigured: false,
        isOnline: false,
        hasErrors: true,
        lastChecked: new Date(),
        errors: ['Erreur de diagnostic']
      });
    }
    
    setIsChecking(false);
  };

  // Vérification automatique au montage
  useEffect(() => {
    if (!hasCheckedOnMount) {
      checkServerStatus();
      setHasCheckedOnMount(true);
    }
  }, [hasCheckedOnMount]);

  // Ne pas afficher la bannière si tout fonctionne
  if (!isVisible || (!serverStatus.hasErrors && serverStatus.isOnline)) {
    return null;
  }

  const getPriorityIssue = () => {
    if (!serverStatus.isConfigured) {
      return {
        title: 'Configuration Supabase Requise',
        description: 'Le projet Supabase n\'est pas configuré correctement',
        action: 'Configurer',
        severity: 'error' as const
      };
    } else if (serverStatus.errors.includes('Edge Functions non déployées')) {
      return {
        title: 'Edge Functions Non Déployées',
        description: 'Les fonctions serveur ne sont pas déployées sur Supabase',
        action: 'Voir Instructions',
        severity: 'warning' as const
      };
    } else if (!serverStatus.isOnline) {
      return {
        title: 'Serveur Supabase Inaccessible',
        description: 'Impossible de se connecter au serveur Supabase',
        action: 'Diagnostiquer',
        severity: 'error' as const
      };
    } else {
      return {
        title: 'Configuration Partielle',
        description: serverStatus.errors.join(', '),
        action: 'Diagnostiquer',
        severity: 'warning' as const
      };
    }
  };

  const issue = getPriorityIssue();

  const handleActionClick = () => {
    if (!serverStatus.isConfigured) {
      // Rediriger vers Settings > Development
      window.location.hash = '#settings';
    } else {
      // Ouvrir le diagnostic
      window.location.hash = '#settings';
    }
  };

  return (
    <Alert className={`mb-4 ${
      issue.severity === 'error' 
        ? 'border-red-200 bg-red-50' 
        : 'border-orange-200 bg-orange-50'
    }`}>
      <AlertTriangle className={`h-4 w-4 ${
        issue.severity === 'error' ? 'text-red-600' : 'text-orange-600'
      }`} />
      
      <div className="flex-1">
        <AlertDescription className={`${
          issue.severity === 'error' ? 'text-red-800' : 'text-orange-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-medium">{issue.title}</span>
                <Badge variant={issue.severity === 'error' ? 'destructive' : 'secondary'} className="text-xs">
                  {serverStatus.errors.length} problème{serverStatus.errors.length > 1 ? 's' : ''}
                </Badge>
              </div>
              <p className="text-sm">{issue.description}</p>
              
              {serverStatus.lastChecked && (
                <p className="text-xs mt-1 opacity-75">
                  Dernière vérification: {serverStatus.lastChecked.toLocaleTimeString()}
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <Button
                size="sm"
                variant="outline"
                onClick={checkServerStatus}
                disabled={isChecking}
                className="text-xs"
              >
                {isChecking ? (
                  <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                Vérifier
              </Button>
              
              <Button
                size="sm"
                onClick={handleActionClick}
                className={`text-xs ${
                  issue.severity === 'error' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {issue.severity === 'error' ? (
                  <Settings className="h-3 w-3 mr-1" />
                ) : (
                  <Zap className="h-3 w-3 mr-1" />
                )}
                {issue.action}
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsVisible(false)}
                className="p-1"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </AlertDescription>
      </div>
    </Alert>
  );
}