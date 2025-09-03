import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { 
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

interface HealthStatus {
  edgeFunction: 'healthy' | 'error' | 'checking';
  database: 'healthy' | 'error' | 'checking';
  auth: 'healthy' | 'error' | 'checking';
  overall: 'healthy' | 'degraded' | 'critical' | 'checking';
}

interface SystemHealthCheckerProps {
  onSystemFailure?: () => void;
}

const SystemHealthChecker: React.FC<SystemHealthCheckerProps> = ({ onSystemFailure }) => {
  const [status, setStatus] = useState<HealthStatus>({
    edgeFunction: 'checking',
    database: 'checking',
    auth: 'checking',
    overall: 'checking'
  });

  const PROJECT_URL = 'https://nrvzifxdmllgcidfhlzh.supabase.co';
  const FUNCTION_NAME = 'make-server-9fd39b98';

  const checkEdgeFunction = async () => {
    try {
      const response = await fetch(`${PROJECT_URL}/functions/v1/${FUNCTION_NAME}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000) // 10s timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'healthy') {
          return 'healthy';
        }
      }
      return 'error';
    } catch (error) {
      console.error('Edge Function check failed:', error);
      return 'error';
    }
  };

  const checkDatabase = async () => {
    try {
      const response = await fetch(`${PROJECT_URL}/functions/v1/${FUNCTION_NAME}/debug/kv-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.database_accessible) {
          return 'healthy';
        }
      }
      return 'error';
    } catch (error) {
      console.error('Database check failed:', error);
      return 'error';
    }
  };

  const checkAuth = async () => {
    try {
      const response = await fetch(`${PROJECT_URL}/functions/v1/${FUNCTION_NAME}/secrets/status`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          return 'healthy';
        }
      }
      return 'error';
    } catch (error) {
      console.error('Auth check failed:', error);
      return 'error';
    }
  };

  const runHealthChecks = async () => {
    setStatus(prev => ({ ...prev, overall: 'checking' }));

    // Check Edge Function
    setStatus(prev => ({ ...prev, edgeFunction: 'checking' }));
    const edgeFunctionStatus = await checkEdgeFunction();
    setStatus(prev => ({ ...prev, edgeFunction: edgeFunctionStatus }));

    // Si Edge Function KO, inutile de continuer
    if (edgeFunctionStatus === 'error') {
      setStatus(prev => ({ 
        ...prev, 
        database: 'error', 
        auth: 'error', 
        overall: 'critical' 
      }));
      onSystemFailure?.();
      return;
    }

    // Check Database
    setStatus(prev => ({ ...prev, database: 'checking' }));
    const databaseStatus = await checkDatabase();
    setStatus(prev => ({ ...prev, database: databaseStatus }));

    // Check Auth
    setStatus(prev => ({ ...prev, auth: 'checking' }));
    const authStatus = await checkAuth();
    setStatus(prev => ({ ...prev, auth: authStatus }));

    // Determine overall status
    const healthyCount = [edgeFunctionStatus, databaseStatus, authStatus]
      .filter(s => s === 'healthy').length;

    let overall: HealthStatus['overall'];
    if (healthyCount === 3) {
      overall = 'healthy';
    } else if (healthyCount >= 1) {
      overall = 'degraded';
    } else {
      overall = 'critical';
      onSystemFailure?.();
    }

    setStatus(prev => ({ ...prev, overall }));
  };

  useEffect(() => {
    runHealthChecks();
    
    // Re-check every 30 seconds
    const interval = setInterval(runHealthChecks, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'checking':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'checking':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getOverallMessage = () => {
    switch (status.overall) {
      case 'healthy':
        return '✅ Système opérationnel';
      case 'degraded':
        return '⚠️ Fonctionnalités limitées';
      case 'critical':
        return '🚨 Système hors service';
      case 'checking':
        return '🔍 Vérification en cours...';
      default:
        return '❓ État inconnu';
    }
  };

  // N'afficher le composant que si le système est en erreur ou en vérification
  if (status.overall === 'healthy') {
    return null;
  }

  return (
    <Card className={`border-l-4 ${
      status.overall === 'critical' ? 'border-l-red-500 bg-red-50' :
      status.overall === 'degraded' ? 'border-l-yellow-500 bg-yellow-50' :
      'border-l-blue-500 bg-blue-50'
    }`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">État du Système</h3>
            <Badge className={getStatusColor(status.overall)}>
              {getOverallMessage()}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              {getStatusIcon(status.edgeFunction)}
              <span>Edge Functions</span>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(status.database)}
              <span>Base de Données</span>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(status.auth)}
              <span>Authentification</span>
            </div>
          </div>

          {status.overall === 'critical' && (
            <div className="text-xs text-red-700 bg-red-100 p-2 rounded">
              Le système nécessite un redéploiement complet pour fonctionner.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemHealthChecker;