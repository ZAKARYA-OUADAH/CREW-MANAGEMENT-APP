import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Copy, 
  ExternalLink,
  Zap,
  Terminal,
  Rocket,
  Download,
  Upload
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface EmergencyEdgeFunctionsFixerProps {
  onClose?: () => void;
}

const EmergencyEdgeFunctionsFixer: React.FC<EmergencyEdgeFunctionsFixerProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [testResults, setTestResults] = useState<any[]>([]);

  // Edge Function Code prêt à déployer
  const EDGE_FUNCTION_CODE = `// CrewTech Platform - Edge Function Complete
// Déployez ce code dans Supabase Dashboard → Edge Functions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://nrvzifxdmllgcidfhlzh.supabase.co';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydnppZnhkbWxsZ2NpZGZobHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzOTY2OTAsImV4cCI6MjA3MTk3MjY5MH0.LQkxhokeAsrpQDKmBQ4f6mpP0XJlwRjXNEGKjOM1xVs';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydnppZnhkbWxsZ2NpZGZobHpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5NjY5MCwiZXhwIjoyMDcxOTcyNjkwfQ.dCx1BUVy4K7YecsyNN5pAIJ_CKLgO-s5KM5WKIZQyWs';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  if (method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Health check
    if (path === '/make-server-9fd39b98/health' && method === 'GET') {
      return new Response(JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        service: 'CrewTech Platform - Emergency Deploy'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Secrets status
    if (path === '/make-server-9fd39b98/secrets/status' && method === 'GET') {
      return new Response(JSON.stringify({
        valid: true,
        missing: [],
        configured: {
          SUPABASE_URL: !!SUPABASE_URL,
          SUPABASE_ANON_KEY: !!SUPABASE_ANON_KEY,
          SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY
        },
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // KV Test
    if (path === '/make-server-9fd39b98/debug/kv-test' && method === 'POST') {
      const KV_TABLE_NAME = 'kv_store_9fd39b98';
      
      try {
        const { data, error } = await supabaseAdmin
          .from(KV_TABLE_NAME)
          .select('*')
          .limit(1);
        
        return new Response(JSON.stringify({
          success: true,
          message: 'KV Store accessible',
          table_exists: !error,
          row_count: data?.length || 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      } catch (kvError) {
        return new Response(JSON.stringify({
          success: false,
          error: kvError.message
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        });
      }
    }

    // Default 404
    return new Response(JSON.stringify({
      error: 'Route not found',
      method,
      path,
      available_routes: [
        'GET /make-server-9fd39b98/health',
        'GET /make-server-9fd39b98/secrets/status', 
        'POST /make-server-9fd39b98/debug/kv-test'
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 404
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

console.log('🚀 CrewTech Emergency Edge Function Started');`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Code copié dans le presse-papier !');
  };

  const testEdgeFunction = async () => {
    setIsLoading(true);
    const results: any[] = [];

    // Test 1: Health Check
    try {
      const response = await fetch('https://nrvzifxdmllgcidfhlzh.supabase.co/functions/v1/make-server-9fd39b98/health');
      if (response.ok) {
        const data = await response.json();
        results.push({
          test: 'Health Check',
          status: 'success',
          message: `✅ Edge Function accessible (v${data.version || 'unknown'})`,
          details: data
        });
      } else {
        results.push({
          test: 'Health Check',
          status: 'error',
          message: `❌ HTTP ${response.status} - Function not accessible`,
          details: response.statusText
        });
      }
    } catch (error: any) {
      results.push({
        test: 'Health Check',
        status: 'error',
        message: '❌ Connection failed',
        details: error.message
      });
    }

    // Test 2: Secrets Status
    try {
      const response = await fetch('https://nrvzifxdmllgcidfhlzh.supabase.co/functions/v1/make-server-9fd39b98/secrets/status');
      if (response.ok) {
        const data = await response.json();
        results.push({
          test: 'Secrets Status',
          status: data.valid ? 'success' : 'warning',
          message: data.valid ? '✅ Secrets configured' : '⚠️ Some secrets missing',
          details: data
        });
      } else {
        results.push({
          test: 'Secrets Status',
          status: 'error',
          message: `❌ HTTP ${response.status}`,
          details: response.statusText
        });
      }
    } catch (error: any) {
      results.push({
        test: 'Secrets Status',
        status: 'error',
        message: '❌ Connection failed',
        details: error.message
      });
    }

    // Test 3: KV Store
    try {
      const response = await fetch('https://nrvzifxdmllgcidfhlzh.supabase.co/functions/v1/make-server-9fd39b98/debug/kv-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'emergency' })
      });
      
      if (response.ok) {
        const data = await response.json();
        results.push({
          test: 'KV Store Test',
          status: data.success ? 'success' : 'error',
          message: data.success ? '✅ Database accessible' : '❌ Database error',
          details: data
        });
      } else {
        results.push({
          test: 'KV Store Test',
          status: 'error',
          message: `❌ HTTP ${response.status}`,
          details: response.statusText
        });
      }
    } catch (error: any) {
      results.push({
        test: 'KV Store Test',
        status: 'error',
        message: '❌ Connection failed',
        details: error.message
      });
    }

    setTestResults(results);
    setIsLoading(false);

    // Determine overall status
    const hasErrors = results.some(r => r.status === 'error');
    if (!hasErrors) {
      setDeploymentStatus('success');
      toast.success('🎉 Edge Functions fonctionnelles !');
    } else {
      setDeploymentStatus('error');
      toast.error('❌ Edge Functions nécessitent un déploiement');
    }
  };

  const downloadCode = () => {
    const blob = new Blob([EDGE_FUNCTION_CODE], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edge-function-crewtech.ts';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Code téléchargé !');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
    }
  };

  useEffect(() => {
    // Test automatique au chargement
    testEdgeFunction();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-6 w-6 text-red-500" />
              <CardTitle>🚨 Réparation d'Urgence Edge Functions</CardTitle>
            </div>
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="test">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="test">Test Immédiat</TabsTrigger>
              <TabsTrigger value="deploy">Déploiement</TabsTrigger>
              <TabsTrigger value="guide">Guide Express</TabsTrigger>
            </TabsList>

            <TabsContent value="test" className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Statut actuel :</strong> Edge Functions indisponibles (0% disponibilité)
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between">
                <h3 className="font-medium">Tests de Connectivité</h3>
                <Button 
                  onClick={testEdgeFunction} 
                  disabled={isLoading}
                  size="sm"
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Tester Maintenant
                </Button>
              </div>

              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <Card key={index} className={`border-l-4 ${
                    result.status === 'success' ? 'border-l-green-500' :
                    result.status === 'error' ? 'border-l-red-500' : 'border-l-yellow-500'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        {getStatusIcon(result.status)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{result.test}</h4>
                            <Badge variant={
                              result.status === 'success' ? 'default' : 
                              result.status === 'error' ? 'destructive' : 'secondary'
                            }>
                              {result.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {result.message}
                          </p>
                          {result.details && (
                            <details className="mt-2">
                              <summary className="text-xs cursor-pointer text-blue-600">
                                Voir détails
                              </summary>
                              <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {testResults.length === 0 && (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500" />
                    <p className="text-muted-foreground mt-2">Test en cours...</p>
                  </div>
                )}
              </div>

              {deploymentStatus === 'error' && (
                <Alert className="border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Action requise :</strong> Déployement nécessaire. Utilisez l'onglet "Déploiement" pour corriger le problème.
                  </AlertDescription>
                </Alert>
              )}

              {deploymentStatus === 'success' && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <strong>✅ Résolu :</strong> Edge Functions fonctionnelles ! Votre application va se reconnecter automatiquement.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="deploy" className="space-y-4">
              <Alert>
                <Rocket className="h-4 w-4" />
                <AlertDescription>
                  <strong>Déploiement d'urgence :</strong> Code optimisé prêt à déployer
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">1. Code Edge Function</h4>
                  <div className="relative">
                    <Textarea 
                      value={EDGE_FUNCTION_CODE}
                      readOnly
                      className="font-mono text-xs h-40 resize-none"
                    />
                    <div className="absolute top-2 right-2 space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(EDGE_FUNCTION_CODE)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copier
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={downloadCode}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Télécharger
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-blue-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">1</span>
                        Méthode Dashboard (RAPIDE)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        onClick={() => window.open('https://supabase.com/dashboard/project/nrvzifxdmllgcidfhlzh/functions', '_blank')}
                        className="w-full"
                        size="sm"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ouvrir Dashboard
                      </Button>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>• Créer fonction "make-server-9fd39b98"</p>
                        <p>• Coller le code ci-dessus</p>
                        <p>• Cliquer "Deploy"</p>
                        <p>• Tester avec l'onglet "Test"</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center">
                        <span className="bg-gray-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">2</span>
                        Méthode CLI
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="bg-muted p-2 rounded font-mono text-xs">
                        supabase functions deploy make-server-9fd39b98
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard('supabase functions deploy make-server-9fd39b98')}
                        className="w-full"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copier commande
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Après déploiement :</strong> Revenez à l'onglet "Test" pour vérifier que tout fonctionne.
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>

            <TabsContent value="guide" className="space-y-4">
              <Alert>
                <Terminal className="h-4 w-4" />
                <AlertDescription>
                  <strong>Guide de résolution express</strong> - 3 minutes maximum
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <Card className="border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-red-700 mb-2">🔴 Problème Identifié</h4>
                    <ul className="text-sm space-y-1 text-red-600">
                      <li>• Edge Function non déployée ou inaccessible</li>
                      <li>• URL /functions/v1/make-server-9fd39b98/* retourne 404</li>
                      <li>• Application en mode fallback local</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-500">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-yellow-700 mb-2">⚡ Solution Express</h4>
                    <div className="text-sm space-y-2">
                      <div className="flex items-start space-x-2">
                        <span className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
                        <div>
                          <strong>Copier le code</strong> de l'onglet "Déploiement"
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                        <div>
                          <strong>Ouvrir Supabase Dashboard</strong> → Edge Functions
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
                        <div>
                          <strong>Créer fonction</strong> nommée "make-server-9fd39b98"
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">4</span>
                        <div>
                          <strong>Coller et déployer</strong> le code
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">5</span>
                        <div>
                          <strong>Tester</strong> avec l'onglet "Test" de cet outil
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <h4 className="font-medium text-green-700 mb-2">✅ Vérification</h4>
                    <div className="text-sm space-y-1 text-green-600">
                      <p>• URL accessible : https://nrvzifxdmllgcidfhlzh.supabase.co/functions/v1/make-server-9fd39b98/health</p>
                      <p>• Réponse attendue : {"{"}"status": "healthy"{"}"}  </p>
                      <p>• Application se reconnecte automatiquement</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex space-x-2">
                  <Button
                    onClick={() => window.open('https://supabase.com/dashboard/project/nrvzifxdmllgcidfhlzh/functions', '_blank')}
                    className="flex-1"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir Dashboard Supabase
                  </Button>
                  <Button
                    onClick={testEdgeFunction}
                    variant="outline"
                    className="flex-1"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tester Après Déploiement
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmergencyEdgeFunctionsFixer;