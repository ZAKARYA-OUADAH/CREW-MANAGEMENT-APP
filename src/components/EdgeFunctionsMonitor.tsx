import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Activity,
  CheckCircle,
  X,
  AlertTriangle,
  RefreshCw,
  CloudLightning,
  Zap,
  Clock,
  TrendingUp,
  TrendingDown,
  Wifi,
  WifiOff,
  Play,
  Pause,
  BarChart3
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface HealthMetric {
  timestamp: number;
  status: 'healthy' | 'unhealthy' | 'error';
  responseTime: number;
  errorCode?: number;
}

interface EdgeFunctionsMonitorProps {
  compact?: boolean;
  autoStart?: boolean;
  refreshInterval?: number;
}

export default function EdgeFunctionsMonitor({ 
  compact = false, 
  autoStart = true,
  refreshInterval = 15000 
}: EdgeFunctionsMonitorProps) {
  const [isMonitoring, setIsMonitoring] = useState(autoStart);
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [currentStatus, setCurrentStatus] = useState<'healthy' | 'unhealthy' | 'unknown'>('unknown');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [averageResponseTime, setAverageResponseTime] = useState(0);
  const [uptime, setUptime] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isMonitoring) {
      startMonitoring();
    } else {
      stopMonitoring();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMonitoring, refreshInterval]);

  useEffect(() => {
    // Calculer les métriques dérivées
    if (metrics.length > 0) {
      const recentMetrics = metrics.slice(-10); // Dernières 10 mesures
      const responseTimes = recentMetrics.map(m => m.responseTime);
      const avgResponse = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      setAverageResponseTime(Math.round(avgResponse));

      const healthyMetrics = recentMetrics.filter(m => m.status === 'healthy');
      const uptimePercentage = (healthyMetrics.length / recentMetrics.length) * 100;
      setUptime(Math.round(uptimePercentage));
    }
  }, [metrics]);

  const startMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    startTimeRef.current = Date.now();
    
    // Premier check immédiat
    performHealthCheck();
    
    // Puis intervalles réguliers
    intervalRef.current = setInterval(() => {
      performHealthCheck();
    }, refreshInterval);
  };

  const stopMonitoring = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const performHealthCheck = async () => {
    setIsChecking(true);
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

      const metric: HealthMetric = {
        timestamp: Date.now(),
        responseTime,
        status: response.ok ? 'healthy' : 'unhealthy',
        errorCode: response.ok ? undefined : response.status
      };

      setMetrics(prev => [...prev.slice(-29), metric]); // Garder 30 dernières mesures
      setCurrentStatus(metric.status);
      setLastCheck(new Date());

      if (metric.status === 'healthy') {
        setConsecutiveFailures(0);
        if (consecutiveFailures >= 3) {
          toast.success('✅ Edge Functions restaurées !');
        }
      } else {
        setConsecutiveFailures(prev => prev + 1);
        if (consecutiveFailures === 2) { // Au 3ème échec consécutif
          toast.error('🚨 Edge Functions indisponibles depuis 3 vérifications');
        }
      }

    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      const metric: HealthMetric = {
        timestamp: Date.now(),
        responseTime,
        status: 'error',
        errorCode: 0
      };

      setMetrics(prev => [...prev.slice(-29), metric]);
      setCurrentStatus('unhealthy');
      setLastCheck(new Date());
      setConsecutiveFailures(prev => prev + 1);

      if (consecutiveFailures === 2) {
        toast.error('🚨 Impossible de joindre les Edge Functions');
      }
    }
    
    setIsChecking(false);
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    if (!isMonitoring) {
      toast.info('🔍 Monitoring Edge Functions activé');
    } else {
      toast.info('⏸️ Monitoring Edge Functions interrompu');
    }
  };

  const clearMetrics = () => {
    setMetrics([]);
    setConsecutiveFailures(0);
    setCurrentStatus('unknown');
    setLastCheck(null);
    startTimeRef.current = Date.now();
    toast.info('📊 Métriques réinitialisées');
  };

  const getStatusInfo = () => {
    switch (currentStatus) {
      case 'healthy':
        return {
          icon: <CheckCircle className="h-4 w-4 text-green-600" />,
          label: 'Fonctionnel',
          color: 'bg-green-100 text-green-800 border-green-200',
          description: 'Edge Functions opérationnelles'
        };
      case 'unhealthy':
        return {
          icon: <X className="h-4 w-4 text-red-600" />,
          label: 'Indisponible',
          color: 'bg-red-100 text-red-800 border-red-200',
          description: 'Edge Functions inaccessibles'
        };
      default:
        return {
          icon: <AlertTriangle className="h-4 w-4 text-gray-600" />,
          label: 'Inconnu',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          description: 'Statut non déterminé'
        };
    }
  };

  const status = getStatusInfo();
  const monitoringDuration = Math.floor((Date.now() - startTimeRef.current) / 1000 / 60); // en minutes

  if (compact) {
    return (
      <Card className="w-full">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {isMonitoring ? (
                  <Activity className="h-3 w-3 text-blue-600 animate-pulse" />
                ) : (
                  <Activity className="h-3 w-3 text-gray-400" />
                )}
                <span className="text-xs font-medium">Monitor</span>
              </div>
              
              <Badge variant="outline" className={`${status.color} text-xs`}>
                {status.icon}
                <span className="ml-1">{status.label}</span>
              </Badge>
            </div>
            
            <div className="flex items-center space-x-1">
              <div className="text-xs text-gray-500">
                {metrics.length > 0 && `${averageResponseTime}ms`}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMonitoring}
                className="h-5 w-5 p-0"
              >
                {isMonitoring ? (
                  <Pause className="h-3 w-3" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
              </Button>
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
            <span>Monitor Edge Functions</span>
            <Badge variant="outline" className={status.color}>
              {status.icon}
              <span className="ml-1">{status.label}</span>
            </Badge>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMonitoring}
            >
              {isMonitoring ? (
                <>
                  <Pause className="h-3 w-3 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 mr-1" />
                  Start
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={clearMetrics}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Alertes */}
        {consecutiveFailures >= 3 && (
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-medium text-red-900">
                  Problème détecté avec les Edge Functions
                </div>
                <div className="text-sm text-red-800">
                  {consecutiveFailures} échecs consécutifs. Vérifiez le déploiement ou consultez les logs.
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {isMonitoring && (
          <Alert className="bg-blue-50 border-blue-200">
            <Activity className="h-4 w-4 text-blue-600 animate-pulse" />
            <AlertDescription>
              <div className="text-sm text-blue-800">
                Monitoring actif - Vérifications toutes les {Math.round(refreshInterval / 1000)}s
                {monitoringDuration > 0 && ` (depuis ${monitoringDuration}min)`}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Métriques principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-gray-600 flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Temps de réponse
            </div>
            <div className="text-lg font-semibold">
              {averageResponseTime > 0 ? `${averageResponseTime}ms` : '-'}
            </div>
            <div className="text-xs text-gray-500">
              {averageResponseTime < 1000 ? 'Excellent' : 
               averageResponseTime < 3000 ? 'Correct' : 'Lent'}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-xs text-gray-600 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              Disponibilité
            </div>
            <div className="text-lg font-semibold">
              {metrics.length > 0 ? `${uptime}%` : '-'}
            </div>
            <div className="text-xs text-gray-500">
              {uptime >= 95 ? 'Excellent' : 
               uptime >= 80 ? 'Correct' : 'Problématique'}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-xs text-gray-600 flex items-center">
              <BarChart3 className="h-3 w-3 mr-1" />
              Checks totaux
            </div>
            <div className="text-lg font-semibold">
              {metrics.length}
            </div>
            <div className="text-xs text-gray-500">
              Depuis le début
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-xs text-gray-600 flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Échecs consécutifs
            </div>
            <div className="text-lg font-semibold">
              {consecutiveFailures}
            </div>
            <div className="text-xs text-gray-500">
              {consecutiveFailures === 0 ? 'Stable' : 'Instable'}
            </div>
          </div>
        </div>

        {/* Graphique de statut en temps réel */}
        {metrics.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Historique des vérifications</div>
              <div className="text-xs text-gray-500">
                {lastCheck && `Dernière: ${lastCheck.toLocaleTimeString('fr-FR')}`}
              </div>
            </div>
            
            <div className="flex items-center space-x-1 h-6 bg-gray-100 rounded overflow-hidden">
              {metrics.map((metric, index) => (
                <div
                  key={metric.timestamp}
                  className={`flex-1 h-full ${
                    metric.status === 'healthy' ? 'bg-green-500' :
                    metric.status === 'unhealthy' ? 'bg-red-500' : 'bg-gray-500'
                  }`}
                  title={`${new Date(metric.timestamp).toLocaleTimeString('fr-FR')} - ${metric.status} (${metric.responseTime}ms)`}
                />
              ))}
              
              {/* Indicateur de vérification en cours */}
              {isChecking && (
                <div className="w-2 h-full bg-blue-500 animate-pulse" />
              )}
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded"></div>
                  <span>Sain</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded"></div>
                  <span>Erreur</span>
                </div>
              </div>
              <div>
                Plus ancien → Plus récent
              </div>
            </div>
          </div>
        )}

        {/* Informations de statut */}
        <div className="text-xs text-gray-600 space-y-1">
          <div>Endpoint: /functions/v1/make-server-9fd39b98/health</div>
          <div>Projet: {projectId}</div>
          {lastCheck && (
            <div>Dernière vérification: {lastCheck.toLocaleString('fr-FR')}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}