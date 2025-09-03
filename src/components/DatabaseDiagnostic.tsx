import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  Database, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Trash2,
  RefreshCw,
  Eye,
  User,
  Key
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DiagnosticResult {
  auth_users?: any;
  kv_data?: any;
  login_test?: any;
  error?: string;
}

export default function DatabaseDiagnostic() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult>({});
  const [showDetails, setShowDetails] = useState(false);

  const runDiagnostic = async () => {
    setIsRunning(true);
    setResults({});

    try {
      // Check Auth users
      const authResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/debug/auth-users`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (authResponse.ok) {
        const authData = await authResponse.json();
        setResults(prev => ({ ...prev, auth_users: authData }));
      }

      // Check KV store
      const kvResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/debug/kv-data`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (kvResponse.ok) {
        const kvData = await kvResponse.json();
        setResults(prev => ({ ...prev, kv_data: kvData }));
      }

      // Test login with a known user
      const loginResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/debug/test-login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'admin@crewtech.fr',
            password: 'admin123!'
          }),
        }
      );

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        setResults(prev => ({ ...prev, login_test: loginData }));
      }

    } catch (error: any) {
      setResults({ error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  const resetSystem = async () => {
    if (!confirm('Êtes-vous sûr de vouloir réinitialiser complètement le système ? Cette action est irréversible.')) {
      return;
    }

    setIsRunning(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/debug/full-reset`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const result = await response.json();
      alert(response.ok ? 'Système réinitialisé avec succès' : `Erreur: ${result.error}`);
      
      if (response.ok) {
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error: any) {
      alert(`Erreur de réinitialisation: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Diagnostic Système</span>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              disabled={isRunning}
            >
              <Eye className="h-4 w-4 mr-1" />
              {showDetails ? 'Masquer' : 'Détails'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={runDiagnostic}
              disabled={isRunning}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isRunning ? 'animate-spin' : ''}`} />
              Diagnostic
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {results.error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Erreur de diagnostic:</strong> {results.error}
            </AlertDescription>
          </Alert>
        )}

        {results.auth_users && (
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Utilisateurs Supabase Auth</span>
                <Badge variant="secondary">{results.auth_users.count}</Badge>
              </div>
            </div>
            {showDetails && results.auth_users.users && (
              <div className="space-y-2 text-sm">
                {results.auth_users.users.slice(0, 3).map((user: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-2 rounded text-xs">
                    <div><strong>Email:</strong> {user.email}</div>
                    <div><strong>ID:</strong> {user.id}</div>
                    <div><strong>Confirmé:</strong> {user.email_confirmed ? '✅' : '❌'}</div>
                    <div><strong>Rôle:</strong> {user.user_metadata?.role || 'N/A'}</div>
                  </div>
                ))}
                {results.auth_users.users.length > 3 && (
                  <div className="text-xs text-gray-500">+{results.auth_users.users.length - 3} autres utilisateurs</div>
                )}
              </div>
            )}
          </div>
        )}

        {results.kv_data && (
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-green-600" />
                <span className="font-medium">Données KV Store</span>
              </div>
              <div className="flex space-x-2">
                <Badge variant="secondary">{results.kv_data.kv_store.users.count} utilisateurs</Badge>
                <Badge variant="secondary">{results.kv_data.kv_store.missions.count} missions</Badge>
                <Badge variant="secondary">{results.kv_data.kv_store.notifications.count} notifications</Badge>
              </div>
            </div>
          </div>
        )}

        {results.login_test && (
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Key className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Test de Connexion</span>
                <Badge variant={results.login_test.success ? "default" : "destructive"}>
                  {results.login_test.success ? 'Succès' : 'Échec'}
                </Badge>
              </div>
            </div>
            {showDetails && (
              <div className="text-sm space-y-1">
                {results.login_test.success ? (
                  <>
                    <div><strong>User ID:</strong> {results.login_test.user_id}</div>
                    <div><strong>Email:</strong> {results.login_test.email}</div>
                    <div><strong>Session:</strong> {results.login_test.session_valid ? '✅ Valide' : '❌ Invalide'}</div>
                  </>
                ) : (
                  <div className="text-red-600"><strong>Erreur:</strong> {results.login_test.error}</div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="border-t pt-3 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Utilisez ces outils pour diagnostiquer les problèmes d'authentification
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={resetSystem}
            disabled={isRunning}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Réinitialiser
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}