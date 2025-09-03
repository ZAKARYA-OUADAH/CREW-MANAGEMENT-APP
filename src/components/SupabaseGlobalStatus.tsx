import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Database,
  Key,
  Cloud,
  Zap,
  Globe,
  Settings
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

interface ServiceStatus {
  name: string;
  status: 'checking' | 'online' | 'offline' | 'error' | 'warning';
  description: string;
  details?: any;
  lastCheck?: Date;
  responseTime?: number;
}

interface SupabaseGlobalStatusProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function SupabaseGlobalStatus({ 
  autoRefresh = true, 
  refreshInterval = 60000 
}: SupabaseGlobalStatusProps) {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Database (REST API)',
      status: 'checking',
      description: 'API REST Supabase'
    },
    {
      name: 'Authentication',
      status: 'checking',
      description: 'Service d\'authentification'
    },
    {
      name: 'Edge Functions',
      status: 'checking',
      description: 'Service Edge Functions'
    },
    {
      name: 'CrewTech Function',
      status: 'checking',
      description: 'Fonction make-server-9fd39b98'
    },
    {
      name: 'Function Health',
      status: 'checking',
      description: 'État de santé de la fonction'
    }
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [overallStatus, setOverallStatus] = useState<'healthy' | 'degraded' | 'offline'>('offline');

  const updateService = (name: string, updates: Partial<ServiceStatus>) => {
    setServices(prev => prev.map(service => 
      service.name === name 
        ? { ...service, ...updates, lastCheck: new Date() }
        : service
    ));
  };

  const checkServices = async () => {
    setIsRefreshing(true);
    
    try {
      // Test 1: Database/REST API
      const dbStart = performance.now();
      try {
        const response = await fetch(`https://${projectId}.supabase.co/rest/v1/`, {
          method: 'HEAD',
          headers: { 'apikey': publicAnonKey },
          signal: AbortSignal.timeout(10000)
        });
        
        const dbTime = performance.now() - dbStart;
        
        updateService('Database (REST API)', {
          status: response.ok || response.status === 404 ? 'online' : 'error',
          description: response.ok ? `API accessible (${Math.round(dbTime)}ms)` : `Erreur ${response.status}`,
          responseTime: dbTime,
          details: { status: response.status }
        });
      } catch (error) {
        updateService('Database (REST API)', {
          status: 'offline',
          description: 'Inaccessible',
          details: { error: error.message }
        });
      }

      // Test 2: Authentication
      try {
        const { data, error } = await supabase.auth.getSession();
        updateService('Authentication', {
          status: !error ? 'online' : 'warning',
          description: !error ? 'Service fonctionnel' : 'Problème détecté',
          details: { hasSession: !!data.session, error: error?.message }
        });
      } catch (error) {
        updateService('Authentication', {
          status: 'error',
          description: 'Erreur de service',
          details: { error: error.message }
        });
      }

      // Test 3: Edge Functions Service
      try {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/`, {
          method: 'GET',
          signal: AbortSignal.timeout(10000)
        });

        updateService('Edge Functions', {
          status: response.ok ? 'online' : response.status === 403 ? 'warning' : 'error',
          description: response.ok ? 'Service disponible' : 
                      response.status === 403 ? 'Non activé' : `Erreur ${response.status}`,
          details: { status: response.status }
        });
      } catch (error) {
        updateService('Edge Functions', {
          status: 'offline',
          description: 'Service indisponible',
          details: { error: error.message }
        });
      }

      // Test 4: CrewTech Function Deployment
      const funcStart = performance.now();
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/health`,
          {
            method: 'GET',
            signal: AbortSignal.timeout(15000)
          }
        );

        const funcTime = performance.now() - funcStart;

        if (response.ok) {
          const data = await response.json();
          updateService('CrewTech Function', {
            status: 'online',
            description: `Déployée et accessible (${Math.round(funcTime)}ms)`,
            responseTime: funcTime,
            details: data
          });
        } else if (response.status === 404) {
          updateService('CrewTech Function', {
            status: 'offline',
            description: 'Non déployée',
            details: { status: response.status }
          });
        } else {
          updateService('CrewTech Function', {
            status: 'error',
            description: `Erreur ${response.status}`,
            details: { status: response.status }
          });
        }
      } catch (error) {
        updateService('CrewTech Function', {
          status: 'offline',
          description: 'Inaccessible',
          details: { error: error.message }
        });
      }

      // Test 5: Function Health Check
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
          updateService('Function Health', {
            status: data.success ? 'online' : 'warning',
            description: data.success ? 'Tests passent' : 'Tests échouent',
            details: data
          });
        } else {
          updateService('Function Health', {
            status: 'error',
            description: `Erreur ${response.status}`,
            details: { status: response.status }
          });
        }
      } catch (error) {
        updateService('Function Health', {
          status: 'error',
          description: 'Test impossible',
          details: { error: error.message }
        });
      }

    } finally {
      setIsRefreshing(false);
      setLastRefresh(new Date());
    }
  };

  // Calculer le statut global
  useEffect(() => {
    const onlineCount = services.filter(s => s.status === 'online').length;
    const offlineCount = services.filter(s => s.status === 'offline' || s.status === 'error').length;
    
    if (offlineCount === 0) {
      setOverallStatus('healthy');
    } else if (onlineCount > offlineCount) {
      setOverallStatus('degraded');
    } else {
      setOverallStatus('offline');
    }
  }, [services]);

  // Auto-refresh
  useEffect(() => {
    checkServices(); // Initial check

    if (autoRefresh) {
      const interval = setInterval(checkServices, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
      case 'offline':
        return 'bg-red-50 border-red-200';
      case 'checking':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getOverallStatusBadge = () => {
    switch (overallStatus) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">Tous systèmes opérationnels</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-100 text-yellow-800">Service dégradé</Badge>;
      case 'offline':
        return <Badge className="bg-red-100 text-red-800">Services hors ligne</Badge>;
    }
  };

  const onlineServices = services.filter(s => s.status === 'online').length;
  const totalServices = services.length;
  const healthPercentage = (onlineServices / totalServices) * 100;

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5 text-blue-600" />
            <span>Statut Global Supabase</span>
            {getOverallStatusBadge()}
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            {lastRefresh && (
              <span className="text-xs text-gray-500">
                Mis à jour: {lastRefresh.toLocaleTimeString('fr-FR')}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={checkServices}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Santé globale</span>
            <span>{onlineServices}/{totalServices} services</span>
          </div>
          <Progress value={healthPercentage} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {services.map((service) => (
            <div
              key={service.name}
              className={`p-3 rounded-lg border ${getStatusColor(service.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <div className="font-medium text-sm">{service.name}</div>
                    <div className="text-xs text-gray-600">{service.description}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {service.responseTime && (
                    <Badge variant="outline" className="text-xs">
                      {Math.round(service.responseTime)}ms
                    </Badge>
                  )}
                  
                  {service.details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-500">Détails</summary>
                      <pre className="mt-1 text-xs bg-black/5 rounded p-1 overflow-auto">
                        {JSON.stringify(service.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            ID Projet: <code className="bg-gray-100 px-1 rounded">{projectId}</code>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}`, '_blank')}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Dashboard Supabase
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}