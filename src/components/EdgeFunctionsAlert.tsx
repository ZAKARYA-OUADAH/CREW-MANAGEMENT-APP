import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { 
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Wrench,
  Cloud,
  Terminal,
  CheckCircle,
  X,
  RefreshCw
} from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import * as kv from '../utils/supabase/kv_store';

interface EdgeFunctionsAlertProps {
  onDismiss?: () => void;
  onOpenDiagnostic?: () => void;
  onOpenDeploymentGuide?: () => void;
}

export default function EdgeFunctionsAlert({ 
  onDismiss, 
  onOpenDiagnostic, 
  onOpenDeploymentGuide 
}: EdgeFunctionsAlertProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Vérifier l'état de connectivité
    const checkConnectivity = () => {
      const connectivity = kv.getConnectivityStatus();
      setIsOnline(connectivity.mode === 'server');
      setLastCheck(connectivity.lastCheck > 0 ? new Date(connectivity.lastCheck) : null);
    };

    checkConnectivity();
    
    // Vérifier périodiquement
    const interval = setInterval(checkConnectivity, 10000); // Toutes les 10 secondes
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Vérifier si l'alerte a été supprimée récemment
    const dismissed = localStorage.getItem('edge_functions_alert_dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const oneHourAgo = Date.now() - (60 * 60 * 1000); // 1 heure
      
      if (dismissedTime > oneHourAgo) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem('edge_functions_alert_dismissed');
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('edge_functions_alert_dismissed', Date.now().toString());
    if (onDismiss) onDismiss();
  };

  const handleRecheck = () => {
    window.location.reload();
  };

  // Ne pas afficher si en mode serveur ou si supprimé
  if (isOnline || isDismissed) {
    return null;
  }

  const quickActions = [
    {
      id: 'diagnostic',
      title: 'Diagnostic Complet',
      description: 'Identifier le problème exact',
      icon: <Wrench className="h-4 w-4" />,
      onClick: onOpenDiagnostic,
      variant: 'default' as const
    },
    {
      id: 'deployment',
      title: 'Guide de Déploiement',
      description: 'Instructions pas à pas',
      icon: <Cloud className="h-4 w-4" />,
      onClick: onOpenDeploymentGuide,
      variant: 'outline' as const
    },
    {
      id: 'dashboard',
      title: 'Dashboard Supabase',
      description: 'Ouvrir la console',
      icon: <ExternalLink className="h-4 w-4" />,
      onClick: () => window.open(`https://supabase.com/dashboard/project/${projectId}`, '_blank'),
      variant: 'outline' as const
    }
  ];

  return (
    <div className="fixed bottom-4 right-4 max-w-md z-50">
      <Card className="border-orange-200 bg-orange-50 shadow-lg">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* En-tête de l'alerte */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                <div>
                  <div className="font-medium text-orange-900">
                    Edge Functions Indisponibles
                  </div>
                  <div className="text-sm text-orange-700">
                    Fonctionnement en mode local
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRecheck}
                  className="h-6 w-6 p-0 text-orange-600 hover:text-orange-800"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="h-6 w-6 p-0 text-orange-600 hover:text-orange-800"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Status et dernière vérification */}
            <div className="flex items-center justify-between text-xs text-orange-600">
              <Badge variant="outline" className="border-orange-300 text-orange-700">
                Mode Local Actif
              </Badge>
              {lastCheck && (
                <span>
                  Dernière vérif: {lastCheck.toLocaleTimeString('fr-FR')}
                </span>
              )}
            </div>

            {/* Collapsible content */}
            <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between h-8 text-orange-800 hover:bg-orange-100"
                >
                  <span className="text-sm">Options de résolution</span>
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-2">
                <div className="pt-2 space-y-2">
                  {quickActions.map((action) => (
                    <Button
                      key={action.id}
                      variant={action.variant}
                      size="sm"
                      onClick={action.onClick}
                      className="w-full justify-start h-auto p-2"
                    >
                      <div className="flex items-center space-x-2">
                        {action.icon}
                        <div className="text-left">
                          <div className="text-sm font-medium">{action.title}</div>
                          <div className="text-xs opacity-75">{action.description}</div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
                
                <div className="pt-2 border-t border-orange-200">
                  <div className="text-xs text-orange-600 space-y-1">
                    <div className="flex items-center space-x-1">
                      <Terminal className="h-3 w-3" />
                      <span>Cause probable: Fonction non déployée</span>
                    </div>
                    <div className="text-orange-500">
                      Les données sont sauvegardées localement en attendant la reconnexion
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Action principale si pas étendu */}
            {!isExpanded && (
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  onClick={onOpenDiagnostic}
                  className="flex-1"
                >
                  <Wrench className="h-3 w-3 mr-1" />
                  Diagnostic
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setIsExpanded(true)}
                >
                  Plus
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}