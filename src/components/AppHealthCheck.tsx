import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  Loader
} from 'lucide-react';

interface HealthCheck {
  name: string;
  status: 'checking' | 'success' | 'error' | 'warning';
  message?: string;
  error?: string;
}

export default function AppHealthCheck() {
  const [checks, setChecks] = useState<HealthCheck[]>([
    { name: 'React Router', status: 'checking' },
    { name: 'AuthProvider', status: 'checking' },
    { name: 'Supabase Client', status: 'checking' },
    { name: 'Local Storage', status: 'checking' },
    { name: 'UI Components', status: 'checking' },
    { name: 'Navigation Routes', status: 'checking' }
  ]);

  const [isRunning, setIsRunning] = useState(false);

  const runHealthChecks = async () => {
    setIsRunning(true);
    const newChecks: HealthCheck[] = [];

    try {
      // 1. React Router
      try {
        const { BrowserRouter } = await import('react-router-dom');
        if (BrowserRouter) {
          newChecks.push({ 
            name: 'React Router', 
            status: 'success', 
            message: 'React Router disponible' 
          });
        }
      } catch (error: any) {
        newChecks.push({ 
          name: 'React Router', 
          status: 'error', 
          error: error.message 
        });
      }

      // 2. AuthProvider
      try {
        const { AuthProvider } = await import('./AuthProvider');
        if (AuthProvider) {
          newChecks.push({ 
            name: 'AuthProvider', 
            status: 'success', 
            message: 'AuthProvider chargé' 
          });
        }
      } catch (error: any) {
        newChecks.push({ 
          name: 'AuthProvider', 
          status: 'error', 
          error: error.message 
        });
      }

      // 3. Supabase Client
      try {
        const { createClient } = await import('../utils/supabase/client');
        const client = createClient();
        if (client) {
          newChecks.push({ 
            name: 'Supabase Client', 
            status: 'success', 
            message: 'Client Supabase initialisé' 
          });
        }
      } catch (error: any) {
        newChecks.push({ 
          name: 'Supabase Client', 
          status: 'error', 
          error: error.message 
        });
      }

      // 4. Local Storage
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('healthcheck', 'test');
          const test = localStorage.getItem('healthcheck');
          localStorage.removeItem('healthcheck');
          
          if (test === 'test') {
            newChecks.push({ 
              name: 'Local Storage', 
              status: 'success', 
              message: 'Local Storage fonctionnel' 
            });
          } else {
            newChecks.push({ 
              name: 'Local Storage', 
              status: 'warning', 
              message: 'Local Storage limité' 
            });
          }
        } else {
          newChecks.push({ 
            name: 'Local Storage', 
            status: 'warning', 
            message: 'Local Storage non disponible (SSR)' 
          });
        }
      } catch (error: any) {
        newChecks.push({ 
          name: 'Local Storage', 
          status: 'error', 
          error: error.message 
        });
      }

      // 5. UI Components
      try {
        const { Button } = await import('./ui/button');
        const { Card } = await import('./ui/card');
        if (Button && Card) {
          newChecks.push({ 
            name: 'UI Components', 
            status: 'success', 
            message: 'Composants UI chargés' 
          });
        }
      } catch (error: any) {
        newChecks.push({ 
          name: 'UI Components', 
          status: 'error', 
          error: error.message 
        });
      }

      // 6. Navigation Routes
      try {
        const { default: AppRoutes } = await import('./AppRoutes');
        if (AppRoutes) {
          newChecks.push({ 
            name: 'Navigation Routes', 
            status: 'success', 
            message: 'AppRoutes chargé' 
          });
        }
      } catch (error: any) {
        newChecks.push({ 
          name: 'Navigation Routes', 
          status: 'error', 
          error: error.message 
        });
      }

    } catch (error: any) {
      console.error('Erreur during health check:', error);
    }

    setChecks(newChecks);
    setIsRunning(false);
  };

  useEffect(() => {
    runHealthChecks();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'checking':
        return <Loader className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Loader className="h-4 w-4 animate-spin text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checking':
        return <Badge variant="secondary">Vérification...</Badge>;
      case 'success':
        return <Badge className="bg-green-600">OK</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500">Attention</Badge>;
      case 'error':
        return <Badge variant="destructive">Erreur</Badge>;
      default:
        return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  const successCount = checks.filter(c => c.status === 'success').length;
  const errorCount = checks.filter(c => c.status === 'error').length;
  const warningCount = checks.filter(c => c.status === 'warning').length;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Diagnostic de l'Application CrewTech</span>
              <Button 
                onClick={runHealthChecks} 
                disabled={isRunning}
                variant="outline"
                size="sm"
              >
                {isRunning ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Relancer
              </Button>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{successCount}</div>
                  <p className="text-sm text-green-700">Succès</p>
                </CardContent>
              </Card>
              
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
                  <p className="text-sm text-yellow-700">Avertissements</p>
                </CardContent>
              </Card>
              
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                  <p className="text-sm text-red-700">Erreurs</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Results */}
            <div className="space-y-3">
              {checks.map((check, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg bg-white"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(check.status)}
                    <span className="font-medium">{check.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {check.message && (
                      <span className="text-sm text-gray-600">{check.message}</span>
                    )}
                    {check.error && (
                      <span className="text-sm text-red-600 max-w-xs truncate" title={check.error}>
                        {check.error}
                      </span>
                    )}
                    {getStatusBadge(check.status)}
                  </div>
                </div>
              ))}
            </div>

            {/* Global Status */}
            {errorCount > 0 && (
              <Alert className="mt-6 border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Problèmes détectés :</strong> {errorCount} erreur(s) empêchent le bon fonctionnement de l'application.
                  Vérifiez les détails ci-dessus et corrigez les problèmes.
                </AlertDescription>
              </Alert>
            )}

            {errorCount === 0 && warningCount > 0 && (
              <Alert className="mt-6 border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Avertissements :</strong> {warningCount} avertissement(s) détecté(s). 
                  L'application devrait fonctionner mais certaines fonctionnalités peuvent être limitées.
                </AlertDescription>
              </Alert>
            )}

            {errorCount === 0 && warningCount === 0 && successCount > 0 && (
              <Alert className="mt-6 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Tous les systèmes sont opérationnels !</strong> L'application CrewTech est prête à être utilisée.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}