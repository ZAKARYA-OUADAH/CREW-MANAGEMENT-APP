import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Database,
  Key,
  Users,
  Server,
  Shield,
  Code,
  RefreshCw,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface SQLDiagnosticResult {
  test: string;
  status: 'success' | 'warning' | 'error' | 'info';
  message: string;
  details?: any;
  sqlQuery?: string;
  solution?: string;
}

interface SupabaseDiagnosticProps {
  onComplete?: (results: SQLDiagnosticResult[], hasErrors: boolean) => void;
}

export default function SupabaseDiagnostic({ onComplete }: SupabaseDiagnosticProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<SQLDiagnosticResult[]>([]);
  const [currentTest, setCurrentTest] = useState('');
  const [progress, setProgress] = useState(0);
  const [showSQL, setShowSQL] = useState(false);

  const addResult = (result: SQLDiagnosticResult) => {
    console.log(`[SupabaseDiagnostic] ${result.test}: ${result.status} - ${result.message}`);
    setResults(prev => [...prev, result]);
  };

  const updateProgress = (step: number, total: number) => {
    const newProgress = Math.round((step / total) * 100);
    setProgress(newProgress);
  };

  const runDatabaseDiagnostic = async () => {
    setIsRunning(true);
    setResults([]);
    setCurrentTest('');
    setProgress(0);

    const totalTests = 10;
    let currentStep = 0;

    try {
      // Test 1: Configuration de base
      setCurrentTest('Vérification de la configuration Supabase...');
      updateProgress(++currentStep, totalTests);
      
      if (!projectId || !publicAnonKey) {
        addResult({
          test: 'Configuration Supabase',
          status: 'error',
          message: 'Configuration Supabase manquante',
          details: { projectId: !!projectId, publicAnonKey: !!publicAnonKey },
          solution: 'Vérifiez que les variables projectId et publicAnonKey sont définies dans /utils/supabase/info.tsx'
        });
      } else {
        addResult({
          test: 'Configuration Supabase',
          status: 'success',
          message: 'Configuration Supabase valide',
          details: { 
            projectId: projectId,
            publicAnonKeyLength: publicAnonKey.length,
            supabaseUrl: `https://${projectId}.supabase.co`
          }
        });
      }

      // Test 2: Connexion client Supabase
      setCurrentTest('Test de connexion client Supabase...');
      updateProgress(++currentStep, totalTests);
      
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (!error) {
          addResult({
            test: 'Connexion Client Supabase',
            status: 'success',
            message: 'Client Supabase connecté avec succès',
            details: { hasSession: !!data.session }
          });
        } else {
          addResult({
            test: 'Connexion Client Supabase',
            status: 'warning',
            message: 'Client Supabase accessible avec avertissement',
            details: { error: error.message }
          });
        }
      } catch (error) {
        addResult({
          test: 'Connexion Client Supabase',
          status: 'error',
          message: 'Échec de connexion client Supabase',
          details: { error: error.message },
          solution: 'Vérifiez la validité des clés API et la configuration réseau'
        });
      }

      // Test 3: Vérification de la table KV Store
      setCurrentTest('Vérification de la table KV Store...');
      updateProgress(++currentStep, totalTests);
      
      try {
        // Test direct avec le client Supabase
        const { data, error } = await supabase
          .from('kv_store_9fd39b98')
          .select('count', { count: 'exact', head: true });

        if (!error) {
          addResult({
            test: 'Table KV Store',
            status: 'success',
            message: 'Table KV Store accessible',
            details: { count: data },
            sqlQuery: 'SELECT COUNT(*) FROM kv_store_9fd39b98;'
          });
        } else if (error.message.includes('relation "kv_store_9fd39b98" does not exist')) {
          addResult({
            test: 'Table KV Store',
            status: 'error',
            message: 'Table KV Store manquante - doit être créée',
            details: { error: error.message },
            sqlQuery: `CREATE TABLE kv_store_9fd39b98 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter un index pour les recherches par préfixe
CREATE INDEX idx_kv_store_9fd39b98_key_prefix ON kv_store_9fd39b98 USING btree (key text_pattern_ops);

-- Index GIN pour les recherches dans les valeurs JSONB
CREATE INDEX idx_kv_store_9fd39b98_value_gin ON kv_store_9fd39b98 USING gin (value);

-- Donner les permissions
ALTER TABLE kv_store_9fd39b98 ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre l'accès aux utilisateurs authentifiés
CREATE POLICY "Allow all operations" ON kv_store_9fd39b98
FOR ALL USING (true) WITH CHECK (true);`,
            solution: 'Créez la table KV Store avec la requête SQL fournie dans votre tableau de bord Supabase'
          });
        } else {
          addResult({
            test: 'Table KV Store',
            status: 'error',
            message: 'Erreur d\'accès à la table KV Store',
            details: { error: error.message },
            solution: 'Vérifiez les permissions de la table dans le tableau de bord Supabase'
          });
        }
      } catch (error) {
        addResult({
          test: 'Table KV Store',
          status: 'error',
          message: 'Test de table KV Store échoué',
          details: { error: error.message }
        });
      }

      // Test 4: Test des politiques RLS
      setCurrentTest('Vérification des politiques de sécurité...');
      updateProgress(++currentStep, totalTests);
      
      try {
        // Tenter un test d'insertion/lecture/suppression avec des données JSONB correctes
        const testKey = `test_${Date.now()}`;
        const testValue = { 
          test: true, 
          timestamp: new Date().toISOString(),
          diagnostic: 'rls_test'
        };

        const { error: insertError } = await supabase
          .from('kv_store_9fd39b98')
          .insert({ key: testKey, value: testValue });

        if (!insertError) {
          // Test de lecture
          const { data: readData, error: readError } = await supabase
            .from('kv_store_9fd39b98')
            .select('value')
            .eq('key', testKey)
            .single();

          // Test de suppression
          const { error: deleteError } = await supabase
            .from('kv_store_9fd39b98')
            .delete()
            .eq('key', testKey);

          if (!readError && !deleteError) {
            addResult({
              test: 'Politiques de Sécurité RLS',
              status: 'success',
              message: 'Opérations CRUD autorisées avec succès',
              details: { 
                insertSuccess: !insertError,
                readSuccess: !readError,
                deleteSuccess: !deleteError,
                dataMatch: JSON.stringify(readData?.value) === JSON.stringify(testValue)
              }
            });
          } else {
            addResult({
              test: 'Politiques de Sécurité RLS',
              status: 'warning',
              message: 'Certaines opérations CRUD échouent',
              details: { insertError, readError, deleteError }
            });
          }
        } else {
          addResult({
            test: 'Politiques de Sécurité RLS',
            status: 'error',
            message: 'Insertion non autorisée - problème de politique RLS',
            details: { error: insertError.message },
            sqlQuery: `-- Désactiver RLS temporairement ou créer des politiques appropriées
ALTER TABLE kv_store_9fd39b98 DISABLE ROW LEVEL SECURITY;

-- OU créer des politiques appropriées:
CREATE POLICY "Allow all operations" ON kv_store_9fd39b98
FOR ALL USING (true) WITH CHECK (true);`,
            solution: 'Ajustez les politiques RLS dans le tableau de bord Supabase'
          });
        }
      } catch (error) {
        addResult({
          test: 'Politiques de Sécurité RLS',
          status: 'error',
          message: 'Test des politiques RLS échoué',
          details: { error: error.message }
        });
      }

      // Test 5: Test du service Auth
      setCurrentTest('Vérification du service d\'authentification...');
      updateProgress(++currentStep, totalTests);
      
      try {
        // Test de création d'un utilisateur test temporaire
        const testEmail = `test_${Date.now()}@test.com`;
        const testPassword = 'TestPassword123!';

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: testEmail,
          password: testPassword,
          options: {
            data: {
              name: 'Test User',
              role: 'test'
            }
          }
        });

        if (signUpData.user && !signUpError) {
          addResult({
            test: 'Service d\'Authentification',
            status: 'success',
            message: 'Service Auth fonctionne correctement',
            details: { 
              userId: signUpData.user.id,
              email: signUpData.user.email,
              hasSession: !!signUpData.session
            }
          });
          
          // Nettoyer l'utilisateur test si possible
          if (signUpData.session) {
            await supabase.auth.signOut();
          }
        } else {
          addResult({
            test: 'Service d\'Authentification',
            status: 'warning',
            message: 'Service Auth accessible avec limitations',
            details: { error: signUpError?.message }
          });
        }
      } catch (error) {
        addResult({
          test: 'Service d\'Authentification',
          status: 'error',
          message: 'Service Auth inaccessible',
          details: { error: error.message },
          solution: 'Vérifiez la configuration Auth dans le tableau de bord Supabase'
        });
      }

      // Test 6: Test des Edge Functions
      setCurrentTest('Test des Edge Functions...');
      updateProgress(++currentStep, totalTests);
      
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/health`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          addResult({
            test: 'Edge Functions',
            status: 'success',
            message: 'Edge Functions opérationnelles',
            details: data
          });
        } else {
          addResult({
            test: 'Edge Functions',
            status: 'error',
            message: `Edge Functions retournent ${response.status}`,
            details: { status: response.status, statusText: response.statusText },
            solution: 'Déployez les Edge Functions avec: supabase functions deploy make-server-9fd39b98'
          });
        }
      } catch (error) {
        addResult({
          test: 'Edge Functions',
          status: 'error',
          message: 'Edge Functions inaccessibles',
          details: { error: error.message },
          solution: 'Vérifiez que les Edge Functions sont activées et déployées'
        });
      }

      // Test 7: Test des variables d'environnement serveur
      setCurrentTest('Vérification des variables d\'environnement serveur...');
      updateProgress(++currentStep, totalTests);
      
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/health`,
          {
            method: 'GET'
          }
        );

        if (response.ok) {
          const data = await response.json();
          const envCheck = data.env_check;
          
          let missingVars = [];
          if (envCheck?.SUPABASE_URL !== 'SET') missingVars.push('SUPABASE_URL');
          if (envCheck?.SUPABASE_SERVICE_ROLE_KEY !== 'SET') missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
          if (envCheck?.SUPABASE_ANON_KEY !== 'SET') missingVars.push('SUPABASE_ANON_KEY');

          if (missingVars.length === 0) {
            addResult({
              test: 'Variables d\'Environnement Serveur',
              status: 'success',
              message: 'Toutes les variables d\'environnement sont définies',
              details: envCheck
            });
          } else {
            addResult({
              test: 'Variables d\'Environnement Serveur',
              status: 'error',
              message: `Variables manquantes: ${missingVars.join(', ')}`,
              details: envCheck,
              solution: 'Configurez les variables d\'environnement dans les paramètres des Edge Functions'
            });
          }
        } else {
          addResult({
            test: 'Variables d\'Environnement Serveur',
            status: 'error',
            message: 'Impossible de vérifier les variables d\'environnement',
            details: { status: response.status }
          });
        }
      } catch (error) {
        addResult({
          test: 'Variables d\'Environnement Serveur',
          status: 'error',
          message: 'Échec de vérification des variables d\'environnement',
          details: { error: error.message }
        });
      }

      // Test 8: Test du KV Store via API
      setCurrentTest('Test KV Store via API...');
      updateProgress(++currentStep, totalTests);
      
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/auto-seed-test`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.kv_test?.match) {
            addResult({
              test: 'KV Store via API',
              status: 'success',
              message: 'KV Store fonctionne via l\'API serveur',
              details: data.kv_test
            });
          } else {
            addResult({
              test: 'KV Store via API',
              status: 'error',
              message: 'KV Store ne fonctionne pas via l\'API',
              details: data
            });
          }
        } else {
          addResult({
            test: 'KV Store via API',
            status: 'error',
            message: 'Endpoint KV Store inaccessible',
            details: { status: response.status }
          });
        }
      } catch (error) {
        addResult({
          test: 'KV Store via API',
          status: 'error',
          message: 'Test KV Store API échoué',
          details: { error: error.message }
        });
      }

      // Test 9: Test complet d'authentification
      setCurrentTest('Test complet d\'authentification...');
      updateProgress(++currentStep, totalTests);
      
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/auth-test`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`
            },
            body: JSON.stringify({ test: 'diagnostic' })
          }
        );

        if (response.ok) {
          const data = await response.json();
          addResult({
            test: 'Test Authentification Complet',
            status: 'success',
            message: 'Système d\'authentification opérationnel',
            details: data
          });
        } else {
          addResult({
            test: 'Test Authentification Complet',
            status: 'warning',
            message: 'Authentification partiellement fonctionnelle',
            details: { status: response.status }
          });
        }
      } catch (error) {
        addResult({
          test: 'Test Authentification Complet',
          status: 'error',
          message: 'Test d\'authentification échoué',
          details: { error: error.message }
        });
      }

      // Test 10: Vérification finale de l'état de la base
      setCurrentTest('Vérification finale de l\'état de la base...');
      updateProgress(++currentStep, totalTests);
      
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/status-direct`,
          {
            method: 'GET'
          }
        );

        if (response.ok) {
          const data = await response.json();
          const dbStatus = data.database_status;
          
          addResult({
            test: 'État Final de la Base',
            status: 'info',
            message: `Base contient ${dbStatus?.users || 0} utilisateurs, ${dbStatus?.missions || 0} missions`,
            details: dbStatus,
            sqlQuery: `-- Requêtes utiles pour vérifier l'état de la base:
SELECT key, jsonb_typeof(value) as type 
FROM kv_store_9fd39b98 
WHERE key LIKE 'user:%' 
LIMIT 5;

SELECT key, value->>'name' as name, value->>'email' as email 
FROM kv_store_9fd39b98 
WHERE key LIKE 'user:%';

SELECT COUNT(*) as total_records FROM kv_store_9fd39b98;

-- Test d'insertion de données JSONB
INSERT INTO kv_store_9fd39b98 (key, value) 
VALUES (
  'test:diagnostic', 
  jsonb_build_object(
    'test', true,
    'timestamp', NOW()::text,
    'message', 'Diagnostic test successful'
  )
);`
          });
        } else {
          addResult({
            test: 'État Final de la Base',
            status: 'warning',
            message: 'Impossible de vérifier l\'état final',
            details: { status: response.status }
          });
        }
      } catch (error) {
        addResult({
          test: 'État Final de la Base',
          status: 'error',
          message: 'Vérification d\'état échouée',
          details: { error: error.message }
        });
      }

      setProgress(100);

    } finally {
      setIsRunning(false);
      setCurrentTest('');
      
      const hasErrors = results.some(r => r.status === 'error');
      if (onComplete) {
        onComplete(results, hasErrors);
      }
    }
  };

  const copySQL = (sql: string) => {
    navigator.clipboard.writeText(sql);
  };

  const getStatusIcon = (status: SQLDiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'info':
        return <Database className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: SQLDiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const warningCount = results.filter(r => r.status === 'warning').length;

  return (
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-6 w-6" />
          <span>Diagnostic Supabase & SQL</span>
          {!isRunning && results.length > 0 && (
            <Badge className={
              errorCount > 0 ? "bg-red-100 text-red-800" :
              warningCount > 0 ? "bg-yellow-100 text-yellow-800" :
              "bg-green-100 text-green-800"
            }>
              {successCount} réussis, {errorCount} échecs, {warningCount} avertissements
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Diagnostic complet des connexions Supabase, base de données et requêtes SQL
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isRunning && results.length === 0 && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">Tests de Diagnostic</span>
              </div>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Configuration des clients Supabase</li>
                <li>• Existence et permissions de la table KV Store</li>
                <li>• Politiques de sécurité RLS</li>
                <li>• Service d'authentification</li>
                <li>• Edge Functions et API</li>
                <li>• Variables d'environnement serveur</li>
                <li>• Tests d'intégration complets</li>
                <li>• Vérification du format JSONB</li>
              </ul>
            </div>
            
            <Button onClick={runDatabaseDiagnostic} className="w-full" size="lg">
              <Database className="h-4 w-4 mr-2" />
              Lancer le Diagnostic Complet
            </Button>
          </div>
        )}

        {isRunning && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Exécution du diagnostic...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
            
            {currentTest && (
              <div className="flex items-center space-x-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">{currentTest}</span>
              </div>
            )}
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Résultats du Diagnostic</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSQL(!showSQL)}
              >
                {showSQL ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                {showSQL ? 'Masquer' : 'Afficher'} SQL
              </Button>
            </div>
            
            {results.map((result, index) => (
              <Alert key={index} className={getStatusColor(result.status)}>
                <div className="flex items-start space-x-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{result.test}</span>
                      <Badge variant="outline" className="text-xs">
                        {result.status}
                      </Badge>
                    </div>
                    <AlertDescription className="mt-1">
                      {result.message}
                      
                      {result.solution && (
                        <div className="mt-2 p-2 bg-black/5 rounded text-xs">
                          <strong>Solution:</strong> {result.solution}
                        </div>
                      )}
                      
                      {result.sqlQuery && showSQL && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">Requêtes SQL:</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copySQL(result.sqlQuery!)}
                              className="h-6 px-2"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <pre className="text-xs p-2 bg-gray-900 text-green-400 rounded overflow-auto max-h-40">
                            {result.sqlQuery}
                          </pre>
                        </div>
                      )}
                      
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs cursor-pointer">Voir les détails techniques</summary>
                          <pre className="text-xs mt-1 p-2 bg-black/5 rounded overflow-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {!isRunning && results.length > 0 && (
          <div className="flex space-x-2">
            <Button variant="outline" onClick={runDatabaseDiagnostic} size="sm">
              <RefreshCw className="h-3 w-3 mr-1" />
              Relancer
            </Button>
          </div>
        )}

        {errorCount > 0 && (
          <Alert className="bg-orange-50 border-orange-200">
            <Code className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Actions Correctives SQL:</strong>
              <div className="mt-2 space-y-1 text-sm">
                <div>1. Exécutez le script <code className="bg-black/10 px-1 rounded">database-setup.sql</code> complet</div>
                <div>2. Utilisez <code className="bg-black/10 px-1 rounded">jsonb_build_object()</code> pour créer des données JSONB</div>
                <div>3. Configurez les variables d'environnement dans le tableau de bord Supabase</div>
                <div>4. Déployez les Edge Functions: <code className="bg-black/10 px-1 rounded">supabase functions deploy make-server-9fd39b98</code></div>
                <div>5. Vérifiez les politiques RLS dans la section "Database" &gt; "Tables"</div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}