import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Copy,
  Play,
  Globe,
  Database,
  Lock
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface DiagnosticEmergenceProps {
  onClose?: () => void;
}

interface TestResult {
  name: string;
  status: 'pending' | 'testing' | 'success' | 'error';
  details?: any;
  error?: string;
  duration?: number;
}

const DiagnosticEmergence: React.FC<DiagnosticEmergenceProps> = ({ onClose }) => {
  const [tests, setTests] = useState<TestResult[]>([
    { name: '🌐 Connexion Internet', status: 'pending' },
    { name: '🏥 Edge Function Health', status: 'pending' },
    { name: '🔐 Auth Status', status: 'pending' },
    { name: '🗄️ Database KV', status: 'pending' }
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentConfig, setCurrentConfig] = useState({
    projectId,
    publicAnonKey,
    baseUrl: `https://${projectId}.supabase.co`,
    functionUrl: `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98`
  });

  const updateTest = (index: number, updates: Partial<TestResult>) => {
    setTests(prev => prev.map((test, i) => i === index ? { ...test, ...updates } : test));
  };

  const testInternetConnection = async () => {
    updateTest(0, { status: 'testing' });
    const startTime = Date.now();
    
    try {
      // Test simple avec Google DNS
      const response = await fetch('https://dns.google/resolve?name=google.com&type=A', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        updateTest(0, { 
          status: 'success', 
          duration,
          details: { 
            status: response.status,
            message: 'Connexion Internet OK'
          }
        });
        return true;
      } else {
        updateTest(0, { 
          status: 'error', 
          duration,
          error: `HTTP ${response.status}`
        });
        return false;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTest(0, { 
        status: 'error', 
        duration,
        error: error.message || 'Pas de connexion Internet'
      });
      return false;
    }
  };

  const testEdgeFunctionHealth = async () => {
    updateTest(1, { status: 'testing' });
    const startTime = Date.now();
    
    try {
      const url = `${currentConfig.functionUrl}/health`;
      console.log('Testing URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });
      
      const duration = Date.now() - startTime;
      const text = await response.text();
      
      console.log('Raw response:', text);
      
      let data = null;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.log('Failed to parse JSON:', parseError);
      }
      
      if (response.ok && data?.status === 'healthy') {
        updateTest(1, { 
          status: 'success', 
          duration,
          details: data
        });
        return true;
      } else {
        updateTest(1, { 
          status: 'error', 
          duration,
          error: `HTTP ${response.status}: ${text || 'Empty response'}`,
          details: { status: response.status, raw: text }
        });
        return false;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTest(1, { 
        status: 'error', 
        duration,
        error: error.message || 'Network error'
      });
      return false;
    }
  };

  const testAuthStatus = async () => {
    updateTest(2, { status: 'testing' });
    const startTime = Date.now();
    
    try {
      const url = `${currentConfig.functionUrl}/secrets/status`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${currentConfig.publicAnonKey}`,
          'apikey': currentConfig.publicAnonKey,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      });
      
      const duration = Date.now() - startTime;
      const text = await response.text();
      
      let data = null;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.log('Auth test - Failed to parse JSON:', parseError);
      }
      
      if (response.ok) {
        updateTest(2, { 
          status: 'success', 
          duration,
          details: data
        });
        return true;
      } else {
        updateTest(2, { 
          status: 'error', 
          duration,
          error: `HTTP ${response.status}: ${text}`,
          details: { status: response.status, raw: text }
        });
        return false;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTest(2, { 
        status: 'error', 
        duration,
        error: error.message || 'Network error'
      });
      return false;
    }
  };

  const testDatabaseKV = async () => {
    updateTest(3, { status: 'testing' });
    const startTime = Date.now();
    
    try {
      const url = `${currentConfig.functionUrl}/debug/kv-test`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentConfig.publicAnonKey}`,
          'apikey': currentConfig.publicAnonKey,
          'Content-Type': 'application/json'
        },
        body: '{}',
        signal: AbortSignal.timeout(10000)
      });
      
      const duration = Date.now() - startTime;
      const text = await response.text();
      
      let data = null;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.log('KV test - Failed to parse JSON:', parseError);
      }
      
      if (response.ok && data?.success) {
        updateTest(3, { 
          status: 'success', 
          duration,
          details: data
        });
        return true;
      } else {
        updateTest(3, { 
          status: 'error', 
          duration,
          error: `HTTP ${response.status}: ${text}`,
          details: { status: response.status, raw: text }
        });
        return false;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      updateTest(3, { 
        status: 'error', 
        duration,
        error: error.message || 'Network error'
      });
      return false;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    // Reset all tests
    setTests(prev => prev.map(test => ({ ...test, status: 'pending' as const })));
    
    console.log('🔍 Démarrage diagnostic complet...');
    
    // Test 1: Internet
    const internetOk = await testInternetConnection();
    if (!internetOk) {
      setIsRunning(false);
      toast.error('❌ Pas de connexion Internet');
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 2: Edge Function
    const edgeFunctionOk = await testEdgeFunctionHealth();
    if (!edgeFunctionOk) {
      setIsRunning(false);
      toast.error('❌ Edge Function inaccessible');
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 3: Auth
    await testAuthStatus();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 4: Database
    await testDatabaseKV();
    
    setIsRunning(false);
    
    const successCount = tests.filter(t => t.status === 'success').length;
    if (successCount === 4) {
      toast.success('🎉 Tous les tests réussis !');
    } else {
      toast.warning(`⚠️ ${successCount}/4 tests réussis`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'testing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'testing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const copyConfig = () => {
    const configText = `Configuration actuelle:
Project ID: ${currentConfig.projectId}
Public Anon Key: ${currentConfig.publicAnonKey}
Base URL: ${currentConfig.baseUrl}
Function URL: ${currentConfig.functionUrl}`;
    
    navigator.clipboard.writeText(configText);
    toast.success('Configuration copiée !');
  };

  const openSupabaseDashboard = () => {
    window.open(`https://supabase.com/dashboard/project/${currentConfig.projectId}`, '_blank');
  };

  const openEdgeFunctionsDashboard = () => {
    window.open(`https://supabase.com/dashboard/project/${currentConfig.projectId}/functions`, '_blank');
  };

  // Auto-run tests on mount
  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <span>🚨 Diagnostic d'Urgence</span>
            </CardTitle>
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Configuration actuelle */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Configuration Détectée</h3>
                  <Button size="sm" variant="outline" onClick={copyConfig}>
                    <Copy className="h-3 w-3 mr-1" />
                    Copier
                  </Button>
                </div>
                <div className="text-xs space-y-1 font-mono">
                  <div>Project: <span className="text-blue-700">{currentConfig.projectId}</span></div>
                  <div>Function: <span className="text-blue-700">make-server-9fd39b98</span></div>
                  <div>URL: <span className="text-blue-700">{currentConfig.functionUrl}</span></div>
                  <div>Key: <span className="text-blue-700">{currentConfig.publicAnonKey.substring(0, 20)}...</span></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tests en cours */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Tests de Diagnostic</h3>
              <Button 
                onClick={runAllTests} 
                disabled={isRunning}
                className="bg-red-500 hover:bg-red-600"
              >
                {isRunning ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {isRunning ? 'Tests en cours...' : 'Relancer Tests'}
              </Button>
            </div>

            {tests.map((test, index) => (
              <Card key={index} className={`border-l-4 ${
                test.status === 'success' ? 'border-l-green-500 bg-green-50' :
                test.status === 'error' ? 'border-l-red-500 bg-red-50' :
                test.status === 'testing' ? 'border-l-blue-500 bg-blue-50' :
                'border-l-gray-300 bg-gray-50'
              }`}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(test.status)}
                        <span className="font-medium">{test.name}</span>
                        {test.duration && (
                          <span className="text-xs text-muted-foreground">
                            {test.duration}ms
                          </span>
                        )}
                      </div>
                      <Badge className={getStatusColor(test.status)}>
                        {test.status === 'testing' ? 'En cours...' :
                         test.status === 'success' ? 'OK' :
                         test.status === 'error' ? 'ÉCHEC' : 'En attente'}
                      </Badge>
                    </div>

                    {test.error && (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertDescription className="text-red-800 text-xs">
                          <strong>Erreur:</strong> {test.error}
                        </AlertDescription>
                      </Alert>
                    )}

                    {test.details && test.status === 'success' && (
                      <div className="bg-white p-2 rounded text-xs">
                        <pre>{JSON.stringify(test.details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions d'urgence */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <h3 className="font-medium mb-3 text-orange-800">Actions d'Urgence</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={openSupabaseDashboard}
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  Dashboard Supabase
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={openEdgeFunctionsDashboard}
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  Edge Functions
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Diagnostic automatique */}
          {tests.some(t => t.status === 'error') && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                <strong>🚨 Problème détecté !</strong>
                <br />
                {tests.find(t => t.name.includes('Health') && t.status === 'error') && (
                  <span>• Edge Function non déployée ou inaccessible<br /></span>
                )}
                {tests.find(t => t.name.includes('Auth') && t.status === 'error') && (
                  <span>• Problème d'authentification ou clés invalides<br /></span>
                )}
                {tests.find(t => t.name.includes('Database') && t.status === 'error') && (
                  <span>• Base de données non configurée<br /></span>
                )}
                <br />
                <strong>Recommandation:</strong> Utilisez le déploiement assisté complet.
              </AlertDescription>
            </Alert>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default DiagnosticEmergence;