import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { 
  Play,
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Copy, 
  Settings,
  Globe,
  Lock,
  Database,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface EdgeFunctionHTTPTesterProps {
  onClose?: () => void;
}

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'testing';
  response?: any;
  statusCode?: number;
  error?: string;
  duration?: number;
  url?: string;
}

const EdgeFunctionHTTPTester: React.FC<EdgeFunctionHTTPTesterProps> = ({ onClose }) => {
  const [anonKey, setAnonKey] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydnppZnhkbWxsZ2NpZGZobHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTY2OTAsImV4cCI6MjA3MTk3MjY5MH0.LQkxhokeAsrpQDKmBQ4f6mpP0XJlwRjXNEGKjOM1xVs');
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Base URL et configuration
  const BASE = "https://nrvzifxdmllgcidfhlzh.supabase.co/functions/v1/make-server-9fd39b98";

  // Code exact fourni par l'utilisateur
  async function httpJson(url: string, options: any = {}, timeoutMs = 15000) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: ctrl.signal });
      const text = await res.text();
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch {}
      return { ok: res.ok, status: res.status, json, error: !res.ok ? text : null };
    } catch (e: any) {
      return { ok: false, status: 0, json: null, error: e?.message || String(e) };
    } finally {
      clearTimeout(id);
    }
  }

  // Health (public)
  async function testHealth() {
    return await httpJson(`${BASE}/health`, { method: "GET" });
  }

  // Secrets (protégé)
  async function testSecrets() {
    return await httpJson(`${BASE}/secrets/status`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
        "Content-Type": "application/json",
      },
    });
  }

  // KV test (protégé)
  async function testKv() {
    return await httpJson(`${BASE}/debug/kv-test`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: "{}",
    });
  }

  const runSingleTest = async (testName: string, testFunction: () => Promise<any>, url: string) => {
    const testIndex = tests.findIndex(t => t.name === testName);
    if (testIndex === -1) return;

    // Update status to testing
    const updatedTests = [...tests];
    updatedTests[testIndex] = { ...updatedTests[testIndex], status: 'testing' };
    setTests(updatedTests);

    const startTime = Date.now();

    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;

      updatedTests[testIndex] = {
        ...updatedTests[testIndex],
        status: result.ok ? 'success' : 'error',
        response: result.json,
        statusCode: result.status,
        error: result.error,
        duration,
        url
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updatedTests[testIndex] = {
        ...updatedTests[testIndex],
        status: 'error',
        error: error.message,
        duration,
        url
      };
    }

    setTests([...updatedTests]);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    const initialTests: TestResult[] = [
      { name: '🏥 Health Check', status: 'pending', url: `${BASE}/health` },
      { name: '🔐 Secrets Status', status: 'pending', url: `${BASE}/secrets/status` },
      { name: '🗄️ KV Store Test', status: 'pending', url: `${BASE}/debug/kv-test` }
    ];
    
    setTests(initialTests);

    // Run tests sequentially
    await runSingleTest('🏥 Health Check', testHealth, `${BASE}/health`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await runSingleTest('🔐 Secrets Status', testSecrets, `${BASE}/secrets/status`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await runSingleTest('🗄️ KV Store Test', testKv, `${BASE}/debug/kv-test`);

    setIsRunning(false);
    
    // Show summary
    const successCount = tests.filter(t => t.status === 'success').length;
    if (successCount === 3) {
      toast.success('🎉 Tous les tests réussis ! Edge Functions fonctionnelles !');
    } else if (successCount > 0) {
      toast.warning(`⚠️ ${successCount}/3 tests réussis`);
    } else {
      toast.error('❌ Tous les tests échoués. Vérifiez le déploiement.');
    }
  };

  const copyResponse = (response: any) => {
    navigator.clipboard.writeText(JSON.stringify(response, null, 2));
    toast.success('Réponse copiée !');
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copiée !');
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
        return 'border-l-green-500 bg-green-50';
      case 'error':
        return 'border-l-red-500 bg-red-50';
      case 'testing':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-300 bg-gray-50';
    }
  };

  const getTestIcon = (name: string) => {
    if (name.includes('Health')) return <Globe className="h-4 w-4 text-green-600" />;
    if (name.includes('Secrets')) return <Lock className="h-4 w-4 text-blue-600" />;
    if (name.includes('KV')) return <Database className="h-4 w-4 text-purple-600" />;
    return <Play className="h-4 w-4" />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="h-6 w-6 text-blue-500" />
              <CardTitle>🧪 Test HTTP Edge Functions</CardTitle>
            </div>
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tests" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tests">Tests</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
              <TabsTrigger value="docs">Documentation</TabsTrigger>
            </TabsList>

            <TabsContent value="tests" className="space-y-6">
              {/* Configuration rapide */}
              <Alert className="border-blue-200 bg-blue-50">
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <strong className="text-blue-800">Base URL:</strong>
                    <div className="font-mono text-sm bg-blue-100 p-2 rounded">
                      {BASE}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Contrôles */}
              <div className="flex space-x-2">
                <Button 
                  onClick={runAllTests} 
                  disabled={isRunning}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {isRunning ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {isRunning ? 'Tests en cours...' : 'Lancer Tous les Tests'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setTests([])}
                  disabled={isRunning}
                >
                  Effacer
                </Button>
              </div>

              {/* Résultats des tests */}
              <div className="space-y-4">
                <h3 className="font-medium">Résultats des Tests</h3>
                {tests.map((test, index) => (
                  <Card key={index} className={`border-l-4 ${getStatusColor(test.status)}`}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* En-tête du test */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getTestIcon(test.name)}
                            {getStatusIcon(test.status)}
                            <div>
                              <h4 className="font-medium">{test.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {test.url && (
                                  <>
                                    {test.url.replace(BASE, '')} 
                                    {test.duration && ` • ${test.duration}ms`}
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {test.statusCode && (
                              <Badge variant={test.statusCode < 400 ? 'default' : 'destructive'}>
                                {test.statusCode}
                              </Badge>
                            )}
                            {test.url && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => copyUrl(test.url!)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Messages d'erreur */}
                        {test.error && (
                          <div className="bg-red-100 border border-red-200 rounded p-2">
                            <p className="text-sm text-red-800">
                              <strong>Erreur:</strong> {test.error}
                            </p>
                          </div>
                        )}

                        {/* Réponse */}
                        {test.response && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Réponse JSON</span>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => copyResponse(test.response)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Copier
                              </Button>
                            </div>
                            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
                              {JSON.stringify(test.response, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {tests.length === 0 && (
                  <div className="text-center py-8">
                    <Play className="h-8 w-8 mx-auto text-gray-400" />
                    <p className="text-muted-foreground mt-2">
                      Cliquez sur "Lancer Tous les Tests" pour commencer
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="config" className="space-y-6">
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-orange-800">
                  <strong>⚠️ Ne jamais mettre la SERVICE_ROLE_KEY ici</strong><br />
                  Utilisez uniquement l'ANON_KEY pour les tests frontend.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="anonKey">Nouvelle ANON_KEY (après rotation)</Label>
                  <Input
                    id="anonKey"
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Utilisée pour les routes protégées (/secrets/status et /debug/kv-test)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-green-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium flex items-center">
                        <Globe className="h-4 w-4 text-green-600 mr-2" />
                        Health Check
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Route publique, aucune authentification requise
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full mt-2"
                        onClick={() => runSingleTest('🏥 Health Check', testHealth, `${BASE}/health`)}
                        disabled={isRunning}
                      >
                        Tester Health
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-blue-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium flex items-center">
                        <Lock className="h-4 w-4 text-blue-600 mr-2" />
                        Secrets Status
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Route protégée, utilise ANON_KEY
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full mt-2"
                        onClick={() => runSingleTest('🔐 Secrets Status', testSecrets, `${BASE}/secrets/status`)}
                        disabled={isRunning}
                      >
                        Tester Secrets
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-purple-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium flex items-center">
                        <Database className="h-4 w-4 text-purple-600 mr-2" />
                        KV Store Test
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Route protégée, teste la base de données
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full mt-2"
                        onClick={() => runSingleTest('🗄️ KV Store Test', testKv, `${BASE}/debug/kv-test`)}
                        disabled={isRunning}
                      >
                        Tester KV
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="docs" className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Code utilisé dans le plugin/widget</h3>
                <Textarea
                  readOnly
                  value={`// Base URL
const BASE = "${BASE}";
const NEW_ANON_KEY = "${anonKey}";

// Fonction HTTP générique
async function httpJson(url, options = {}, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    const text = await res.text();
    let json = null;
    try { json = text ? JSON.parse(text) : null; } catch {}
    return { ok: res.ok, status: res.status, json, error: !res.ok ? text : null };
  } catch (e) {
    return { ok: false, status: 0, json: null, error: e?.message || String(e) };
  } finally {
    clearTimeout(id);
  }
}

// Health (public)
export async function testHealth() {
  return await httpJson(\`\${BASE}/health\`, { method: "GET" });
}

// Secrets (protégé)
export async function testSecrets() {
  return await httpJson(\`\${BASE}/secrets/status\`, {
    method: "GET",
    headers: {
      Authorization: \`Bearer \${NEW_ANON_KEY}\`,
      apikey: NEW_ANON_KEY,
      "Content-Type": "application/json",
    },
  });
}

// KV test (protégé)
export async function testKv() {
  return await httpJson(\`\${BASE}/debug/kv-test\`, {
    method: "POST",
    headers: {
      Authorization: \`Bearer \${NEW_ANON_KEY}\`,
      apikey: NEW_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: "{}",
  });
}`}
                  className="font-mono text-xs h-96"
                />
                
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertDescription className="text-blue-800">
                    <strong>Instructions Figma/Make:</strong>
                    <ul className="list-disc ml-4 mt-2 space-y-1">
                      <li>Health → bouton qui appelle testHealth() → affiche la réponse JSON</li>
                      <li>Secrets → bouton qui appelle testSecrets() avec NEW_ANON_KEY</li>
                      <li>KV Test → bouton qui appelle testKv() avec NEW_ANON_KEY</li>
                      <li>Si 401 → vérifier dans Supabase que Verify JWT est désactivé</li>
                      <li>Si 404 → afficher les routes disponibles (health, secrets, kv-test)</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EdgeFunctionHTTPTester;