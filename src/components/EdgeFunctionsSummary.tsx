import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  CloudLightning,
  CheckCircle,
  X,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Zap,
  Clock,
  TrendingUp,
  Settings,
  Wrench,
  Activity
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface EdgeFunctionsSummaryProps {
  onOpenSettings?: () => void;
  compact?: boolean;
}

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  errorCode?: number;
  lastCheck: Date;
  suggestions: string[];
}

export default function EdgeFunctionsSummary({ 
  onOpenSettings,
  compact = false 
}: EdgeFunctionsSummaryProps) {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({
    status: 'unknown',
    lastCheck: new Date(),
    suggestions: []
  });
  const [isChecking, setIsChecking] = useState(false);
  const [lastAutoCheck, setLastAutoCheck] = useState<Date | null>(null);

  useEffect(() => {
    performHealthCheck();
    
    // Auto-check every 2 minutes
    const interval = setInterval(() => {
      performHealthCheck(true);
    }, 120000);
    
    return () => clearInterval(interval);
  }, []);

  const performHealthCheck = async (isAuto = false) => {
    if (!isAuto) setIsChecking(true);
    
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/health`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        setHealthStatus({
          status: 'healthy',
          responseTime,
          lastCheck: new Date(),
          suggestions: [
            'Edge Functions opérationnelles ✅',
            'Toutes les fonctionnalités serveur sont disponibles',
            'Monitoring automatique actif'
          ]
        });
        
        if (!isAuto) {
          toast.success('✅ Edge Functions sont opérationnelles !');
        }
      } else {
        const suggestions = getSuggestionsForError(response.status);
        setHealthStatus({
          status: 'unhealthy',
          responseTime,
          errorCode: response.status,
          lastCheck: new Date(),
          suggestions
        });
        
        if (!isAuto) {
          toast.error(`❌ Edge Functions indisponibles (${response.status})`);
        }
      }

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const suggestions = getSuggestionsForError(0, error.message);
      
      setHealthStatus({
        status: 'unhealthy',
        responseTime,
        errorCode: 0,
        lastCheck: new Date(),
        suggestions
      });
      
      if (!isAuto && !error.name?.includes('AbortError')) {
        toast.error('❌ Impossible de joindre les Edge Functions');
      }
    }
    
    if (isAuto) {
      setLastAutoCheck(new Date());
    }
    setIsChecking(false);
  };

  const getSuggestionsForError = (statusCode: number, errorMessage?: string): string[] => {
    switch (statusCode) {
      case 404:
        return [
          'Fonction non trouvée - Déploiement requis',
          'Utilisez le guide de correction rapide 404',
          'Vérifiez que la fonction make-server-9fd39b98 existe'
        ];
      case 401:
        return [
          'Problème d\'authentification détecté',
          'Configurez les variables d\'environnement',
          'Utilisez le guide de correction rapide 401'
        ];
      case 403:
        return [
          'Accès refusé - Problème de permissions',
          'Vérifiez la configuration CORS',
          'Vérifiez les clés API'
        ];
      case 500:
        return [
          'Erreur serveur interne',
          'Consultez les logs Edge Functions',
          'Vérifiez la configuration des secrets'
        ];
      case 0:
        if (errorMessage?.includes('AbortError')) {
          return [
            'Timeout - Fonction trop lente',
            'Vérifiez les performances',
            'Possible problème de réseau'
          ];
        }
        return [
          'Fonction probablement non déployée',
          'Utilisez le guide de déploiement complet',
          'Vérifiez votre connexion internet'
        ];
      default:
        return [
          `Erreur HTTP ${statusCode} - Consultez la documentation`,
          'Utilisez le diagnostic avancé',
          'Contactez le support si le problème persiste'
        ];
    }
  };

  const getStatusInfo = () => {
    switch (healthStatus.status) {
      case 'healthy':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          label: 'Opérationnelles',
          color: 'bg-green-100 text-green-800 border-green-200',
          alertColor: 'bg-green-50 border-green-200',
          description: 'Edge Functions déployées et fonctionnelles'
        };
      case 'unhealthy':
        return {
          icon: <X className="h-5 w-5 text-red-600" />,
          label: `Erreur ${healthStatus.errorCode || 'Réseau'}`,
          color: 'bg-red-100 text-red-800 border-red-200',
          alertColor: 'bg-red-50 border-red-200',
          description: 'Edge Functions inaccessibles ou mal configurées'
        };
      default:
        return {
          icon: <AlertTriangle className="h-5 w-5 text-gray-600" />,
          label: 'Vérification...',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          alertColor: 'bg-gray-50 border-gray-200',
          description: 'Statut en cours de vérification'
        };
    }
  };

  const status = getStatusInfo();

  if (compact) {
    return (
      <Card className="w-full">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CloudLightning className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Edge Functions</span>
              <Badge variant="outline" className={`${status.color} text-xs`}>
                {status.icon}
                <span className="ml-1">{status.label}</span>
              </Badge>
            </div>
            
            <div className="flex items-center space-x-1">
              {healthStatus.responseTime && (
                <span className="text-xs text-gray-500">
                  {healthStatus.responseTime}ms
                </span>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => performHealthCheck()}
                disabled={isChecking}
                className="h-5 w-5 p-0"
              >
                <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
              </Button>
              
              {onOpenSettings && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onOpenSettings}
                  className="h-5 w-5 p-0"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <CloudLightning className="h-5 w-5 text-blue-600" />
            <span>État des Edge Functions</span>
            <Badge variant="outline" className={status.color}>
              {status.icon}
              <span className="ml-1">{status.label}</span>
            </Badge>
          </CardTitle>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => performHealthCheck()}
            disabled={isChecking}
          >
            {isChecking ? (
              <RefreshCw className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            Vérifier
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Alerte principale */}
        <Alert className={status.alertColor}>
          {healthStatus.status === 'healthy' ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription>
            <div className="space-y-1">
              <div className="font-medium">
                {status.description}
              </div>
              <div className="text-sm">
                Dernière vérification: {healthStatus.lastCheck.toLocaleString('fr-FR')}
                {healthStatus.responseTime && ` (${healthStatus.responseTime}ms)`}
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Métriques rapides */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold">
              {healthStatus.responseTime ? `${healthStatus.responseTime}ms` : '-'}
            </div>
            <div className="text-xs text-gray-600 flex items-center justify-center">
              <Clock className="h-3 w-3 mr-1" />
              Temps de réponse
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold">
              {healthStatus.status === 'healthy' ? '✅' : '❌'}
            </div>
            <div className="text-xs text-gray-600 flex items-center justify-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              Disponibilité
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold">
              {projectId.substring(0, 8)}...
            </div>
            <div className="text-xs text-gray-600">
              Projet ID
            </div>
          </div>
        </div>

        {/* Suggestions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Recommandations</h4>
          <div className="space-y-1">
            {healthStatus.suggestions.map((suggestion, index) => (
              <div key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions rapides */}
        {healthStatus.status === 'unhealthy' && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Actions rapides</h4>
            <div className="flex flex-wrap gap-2">
              {healthStatus.errorCode === 404 && (
                <Button variant="outline" size="sm">
                  <Wrench className="h-3 w-3 mr-1" />
                  Guide 404
                </Button>
              )}
              
              {healthStatus.errorCode === 401 && (
                <Button variant="outline" size="sm">
                  <Wrench className="h-3 w-3 mr-1" />
                  Guide 401
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}/functions`, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Dashboard
              </Button>
              
              {onOpenSettings && (
                <Button variant="outline" size="sm" onClick={onOpenSettings}>
                  <Settings className="h-3 w-3 mr-1" />
                  Outils
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Informations techniques */}
        <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
          <div>Endpoint: /functions/v1/make-server-9fd39b98/health</div>
          <div>Projet: {projectId}</div>
          {lastAutoCheck && (
            <div>Surveillance automatique: {lastAutoCheck.toLocaleTimeString('fr-FR')}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}