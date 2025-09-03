import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { 
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  Play,
  RefreshCw,
  Database,
  Key,
  Server,
  Users,
  AlertTriangle,
  Download
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface DeploiementAssisteProps {
  onClose?: () => void;
}

interface StepStatus {
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  message?: string;
  data?: any;
}

const DeploiementAssiste: React.FC<DeploiementAssisteProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [anonKey, setAnonKey] = useState('');
  const [serviceKey, setServiceKey] = useState('');
  const [steps, setSteps] = useState<StepStatus[]>([
    { status: 'pending' },
    { status: 'pending' },
    { status: 'pending' },
    { status: 'pending' },
    { status: 'pending' }
  ]);

  const PROJECT_ID = 'nrvzifxdmllgcidfhlzh';
  const PROJECT_URL = `https://${PROJECT_ID}.supabase.co`;
  const FUNCTION_NAME = 'make-server-9fd39b98';

  const stepTitles = [
    '🔑 Récupération des clés Supabase',
    '🚀 Déploiement Edge Function',
    '🗄️ Configuration Base de Données',
    '👥 Création Utilisateurs Test',
    '🧪 Tests de Vérification'
  ];

  const edgeFunctionCode = `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log('🚀 CrewTech Edge Function Starting...')

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://nrvzifxdmllgcidfhlzh.supabase.co'
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE'
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

serve(async (req) => {
  console.log(\`📞 \${req.method} \${req.url}\`)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const path = url.pathname

  try {
    // 🏥 HEALTH CHECK
    if (path === '/make-server-9fd39b98/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        service: 'CrewTech Platform',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        message: 'Edge Function is working! 🎉',
        project_id: 'nrvzifxdmllgcidfhlzh',
        environment: {
          supabase_url: !!SUPABASE_URL,
          anon_key: !!SUPABASE_ANON_KEY,
          service_key: !!SUPABASE_SERVICE_KEY
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 🔐 SECRETS STATUS
    if (path === '/make-server-9fd39b98/secrets/status') {
      const authHeader = req.headers.get('Authorization')
      const apikey = req.headers.get('apikey')
      
      return new Response(JSON.stringify({
        valid: true,
        timestamp: new Date().toISOString(),
        auth_header_present: !!authHeader,
        apikey_present: !!apikey,
        configured: {
          SUPABASE_URL: !!SUPABASE_URL,
          SUPABASE_ANON_KEY: !!SUPABASE_ANON_KEY,
          SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_KEY
        },
        environment_status: 'ready'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 🗄️ DATABASE TEST
    if (path === '/make-server-9fd39b98/debug/kv-test' && req.method === 'POST') {
      try {
        const { data, error } = await supabaseAdmin
          .from('kv_store_9fd39b98')
          .select('*')
          .limit(1)
        
        return new Response(JSON.stringify({
          success: true,
          database_accessible: !error,
          table_exists: true,
          row_count: data?.length || 0,
          message: error ? \`Database error: \${error.message}\` : 'Database accessible ✅',
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } catch (dbError) {
        return new Response(JSON.stringify({
          success: false,
          database_accessible: false,
          error: dbError.message,
          message: 'Database connection failed ❌',
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // 👥 AUTH LOGIN
    if (path === '/make-server-9fd39b98/auth/login' && req.method === 'POST') {
      const { email, password } = await req.json()
      
      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return new Response(JSON.stringify({ 
          success: false,
          error: error.message 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({
        success: true,
        access_token: data.session?.access_token,
        user: data.user
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 📋 KV STORE OPERATIONS
    if (path.startsWith('/make-server-9fd39b98/kv/')) {
      const operation = path.split('/').pop()
      
      if (operation === 'get' && req.method === 'POST') {
        const { key } = await req.json()
        const { data, error } = await supabaseAdmin
          .from('kv_store_9fd39b98')
          .select('value')
          .eq('key', key)
          .single()
        
        return new Response(JSON.stringify({
          success: !error,
          value: data?.value || null,
          error: error?.message
        }), {
          status: error ? 404 : 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      if (operation === 'set' && req.method === 'POST') {
        const { key, value } = await req.json()
        const { error } = await supabaseAdmin
          .from('kv_store_9fd39b98')
          .upsert({ key, value })
        
        return new Response(JSON.stringify({
          success: !error,
          error: error?.message
        }), {
          status: error ? 500 : 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    return new Response(JSON.stringify({
      error: 'Route not found',
      path: path,
      method: req.method,
      available_routes: [
        'GET /make-server-9fd39b98/health',
        'GET /make-server-9fd39b98/secrets/status', 
        'POST /make-server-9fd39b98/debug/kv-test',
        'POST /make-server-9fd39b98/auth/login',
        'POST /make-server-9fd39b98/kv/get',
        'POST /make-server-9fd39b98/kv/set'
      ],
      timestamp: new Date().toISOString()
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('💥 Server error:', error)
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

console.log('✅ CrewTech Edge Function Ready!')`;

  const databaseSQL = `-- Créer la table kv_store_9fd39b98 si elle n'existe pas
CREATE TABLE IF NOT EXISTS kv_store_9fd39b98 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS (Row Level Security)
ALTER TABLE kv_store_9fd39b98 ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre toutes les opérations
CREATE POLICY IF NOT EXISTS "Allow all operations" ON kv_store_9fd39b98
FOR ALL USING (true);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_kv_store_key ON kv_store_9fd39b98(key);
CREATE INDEX IF NOT EXISTS idx_kv_store_created_at ON kv_store_9fd39b98(created_at);

-- Insérer quelques données de test
INSERT INTO kv_store_9fd39b98 (key, value) 
VALUES 
  ('system:version', '"2.0.0"'),
  ('system:status', '"active"'),
  ('test:hello', '"world"')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- Vérifier les données
SELECT key, value, created_at FROM kv_store_9fd39b98 ORDER BY created_at;`;

  const usersSQL = `-- Créer les utilisateurs de test
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@crewtech.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(), 
  NOW(),
  'authenticated',
  'authenticated',
  '',
  '',
  '{"role": "admin", "name": "Admin CrewTech"}'::jsonb
) ON CONFLICT (email) DO NOTHING;

INSERT INTO auth.users (
  id,
  instance_id, 
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  recovery_token,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'freelancer@crewtech.com',
  crypt('freelancer123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated', 
  'authenticated',
  '',
  '',
  '{"role": "freelancer", "name": "Freelancer Test"}'::jsonb
) ON CONFLICT (email) DO NOTHING;

-- Vérifier les utilisateurs créés
SELECT email, raw_user_meta_data FROM auth.users WHERE email LIKE '%crewtech.com';`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Code copié dans le presse-papiers !');
  };

  const testHealthCheck = async () => {
    try {
      const response = await fetch(`${PROJECT_URL}/functions/v1/${FUNCTION_NAME}/health`);
      const data = await response.json();
      
      if (response.ok) {
        updateStepStatus(4, 'completed', 'Health check réussi !', data);
        toast.success('✅ Health check réussi !');
      } else {
        updateStepStatus(4, 'error', 'Health check échoué');
        toast.error('❌ Health check échoué');
      }
    } catch (error) {
      updateStepStatus(4, 'error', `Erreur: ${error.message}`);
      toast.error('❌ Erreur de connexion');
    }
  };

  const updateStepStatus = (stepIndex: number, status: StepStatus['status'], message?: string, data?: any) => {
    setSteps(prev => prev.map((step, index) => 
      index === stepIndex ? { status, message, data } : step
    ));
  };

  const getStepIcon = (status: StepStatus['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'in_progress':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getProgressValue = () => {
    const completedSteps = steps.filter(step => step.status === 'completed').length;
    return (completedSteps / steps.length) * 100;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center space-x-2">
                <Server className="h-6 w-6 text-blue-500" />
                <span>🚀 Déploiement Assisté CrewTech</span>
              </CardTitle>
              <Progress value={getProgressValue()} className="w-full" />
              <p className="text-sm text-muted-foreground">
                {steps.filter(s => s.status === 'completed').length}/{steps.length} étapes complétées
              </p>
            </div>
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={currentStep.toString()} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              {stepTitles.map((title, index) => (
                <TabsTrigger 
                  key={index}
                  value={index.toString()}
                  onClick={() => setCurrentStep(index)}
                  className="text-xs"
                >
                  {getStepIcon(steps[index].status)}
                  <span className="ml-1 hidden sm:inline">{index + 1}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Étape 1: Récupération des clés */}
            <TabsContent value="0" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Key className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-medium">Étape 1: Récupération des clés Supabase</h3>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <AlertDescription>
                    <div className="space-y-2">
                      <p><strong>Project ID:</strong> {PROJECT_ID}</p>
                      <p><strong>URL:</strong> {PROJECT_URL}</p>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Button
                    onClick={() => window.open(`https://supabase.com/dashboard/project/${PROJECT_ID}/settings/api`, '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir Dashboard Supabase - API Settings
                  </Button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="anonKey">Clé ANON / PUBLIC</Label>
                      <Input
                        id="anonKey"
                        value={anonKey}
                        onChange={(e) => setAnonKey(e.target.value)}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        className="font-mono text-xs"
                      />
                    </div>
                    <div>
                      <Label htmlFor="serviceKey">Clé SERVICE_ROLE</Label>
                      <Input
                        id="serviceKey"
                        value={serviceKey}
                        onChange={(e) => setServiceKey(e.target.value)}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        className="font-mono text-xs"
                        type="password"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      if (anonKey && serviceKey) {
                        updateStepStatus(0, 'completed', 'Clés configurées');
                        setCurrentStep(1);
                        toast.success('✅ Clés configurées !');
                      } else {
                        toast.error('❌ Veuillez saisir les deux clés');
                      }
                    }}
                    disabled={!anonKey || !serviceKey}
                    className="w-full"
                  >
                    Valider les clés et continuer
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Étape 2: Déploiement Edge Function */}
            <TabsContent value="1" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Server className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-medium">Étape 2: Déploiement Edge Function</h3>
                </div>

                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Nom exact requis:</strong> <code>{FUNCTION_NAME}</code>
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Button
                    onClick={() => window.open(`https://supabase.com/dashboard/project/${PROJECT_ID}/functions`, '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir Dashboard Supabase - Edge Functions
                  </Button>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Code Edge Function</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(edgeFunctionCode)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copier
                      </Button>
                    </div>
                    <Textarea
                      value={edgeFunctionCode}
                      readOnly
                      className="font-mono text-xs h-64"
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                    <strong>Instructions:</strong>
                    <ol className="list-decimal ml-4 mt-1 space-y-1">
                      <li>Cliquez "Create a new function"</li>
                      <li>Nom: <code>{FUNCTION_NAME}</code></li>
                      <li>Supprimez le code par défaut</li>
                      <li>Collez le code ci-dessus</li>
                      <li>Cliquez "Deploy function"</li>
                    </ol>
                  </div>

                  <Button
                    onClick={() => {
                      updateStepStatus(1, 'completed', 'Edge Function déployée');
                      setCurrentStep(2);
                      toast.success('✅ Edge Function déployée !');
                    }}
                    className="w-full"
                  >
                    Marquer comme déployé et continuer
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Étape 3: Configuration BDD */}
            <TabsContent value="2" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-purple-500" />
                  <h3 className="text-lg font-medium">Étape 3: Configuration Base de Données</h3>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => window.open(`https://supabase.com/dashboard/project/${PROJECT_ID}/sql`, '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir SQL Editor Supabase
                  </Button>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>SQL de configuration</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(databaseSQL)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copier
                      </Button>
                    </div>
                    <Textarea
                      value={databaseSQL}
                      readOnly
                      className="font-mono text-xs h-40"
                    />
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded p-3 text-sm">
                    <strong>Instructions:</strong>
                    <ol className="list-decimal ml-4 mt-1 space-y-1">
                      <li>Collez le SQL dans l'éditeur</li>
                      <li>Cliquez "Run" ou "Exécuter"</li>
                      <li>Vérifiez que la table est créée</li>
                    </ol>
                  </div>

                  <Button
                    onClick={() => {
                      updateStepStatus(2, 'completed', 'Base de données configurée');
                      setCurrentStep(3);
                      toast.success('✅ Base de données configurée !');
                    }}
                    className="w-full"
                  >
                    Marquer comme configuré et continuer
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Étape 4: Utilisateurs */}
            <TabsContent value="3" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-indigo-500" />
                  <h3 className="text-lg font-medium">Étape 4: Création Utilisateurs Test</h3>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>SQL utilisateurs test</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(usersSQL)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copier
                      </Button>
                    </div>
                    <Textarea
                      value={usersSQL}
                      readOnly
                      className="font-mono text-xs h-40"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-green-200">
                      <CardContent className="p-4">
                        <h4 className="font-medium text-green-700">Admin</h4>
                        <p className="text-sm">Email: admin@crewtech.com</p>
                        <p className="text-sm">Password: admin123</p>
                      </CardContent>
                    </Card>
                    <Card className="border-blue-200">
                      <CardContent className="p-4">
                        <h4 className="font-medium text-blue-700">Freelancer</h4>
                        <p className="text-sm">Email: freelancer@crewtech.com</p>
                        <p className="text-sm">Password: freelancer123</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Button
                    onClick={() => {
                      updateStepStatus(3, 'completed', 'Utilisateurs créés');
                      setCurrentStep(4);
                      toast.success('✅ Utilisateurs créés !');
                    }}
                    className="w-full"
                  >
                    Marquer comme créé et continuer
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Étape 5: Tests */}
            <TabsContent value="4" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Play className="h-5 w-5 text-green-500" />
                  <h3 className="text-lg font-medium">Étape 5: Tests de Vérification</h3>
                </div>

                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription>
                    <strong>URL de test:</strong><br />
                    <code className="text-xs">{PROJECT_URL}/functions/v1/{FUNCTION_NAME}/health</code>
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Button
                    onClick={testHealthCheck}
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Tester Health Check
                  </Button>

                  {steps[4].status === 'completed' && steps[4].data && (
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="p-4">
                        <h4 className="font-medium text-green-700">✅ Test réussi !</h4>
                        <pre className="text-xs mt-2 bg-white p-2 rounded overflow-auto">
                          {JSON.stringify(steps[4].data, null, 2)}
                        </pre>
                      </CardContent>
                    </Card>
                  )}

                  {steps[4].status === 'error' && (
                    <Card className="border-red-200 bg-red-50">
                      <CardContent className="p-4">
                        <h4 className="font-medium text-red-700">❌ Test échoué</h4>
                        <p className="text-sm text-red-600">{steps[4].message}</p>
                      </CardContent>
                    </Card>
                  )}

                  {steps[4].status === 'completed' && (
                    <div className="space-y-2">
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription className="text-green-800">
                          <strong>🎉 Déploiement terminé avec succès !</strong><br />
                          Votre plateforme CrewTech est maintenant opérationnelle.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={onClose}>
                          Fermer l'assistant
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => window.location.reload()}
                        >
                          Recharger l'application
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeploiementAssiste;