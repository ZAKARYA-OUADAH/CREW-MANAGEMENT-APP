import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { createClient } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import * as kv from '../utils/supabase/kv_store';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Database, 
  Wifi,
  AlertCircle
} from 'lucide-react';

export default function SupabaseConnectionTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState({
    client: { status: 'pending', message: '', error: null },
    kvStore: { status: 'pending', message: '', error: null },
    edgeFunctions: { status: 'pending', message: '', error: null }
  });

  const runTests = async () => {
    setTesting(true);
    setResults({
      client: { status: 'testing', message: 'Test en cours...', error: null },
      kvStore: { status: 'testing', message: 'Test en cours...', error: null },
      edgeFunctions: { status: 'testing', message: 'Test en cours...', error: null }
    });

    // Test 1: Client Supabase
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      setResults(prev => ({
        ...prev,
        client: { 
          status: 'success', 
          message: 'Client Supabase initialisé avec succès', 
          error: null 
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        client: { 
          status: 'error', 
          message: 'Erreur du client Supabase', 
          error: error.message 
        }
      }));
    }

    // Test 2: KV Store
    try {
      const testKey = `test_${Date.now()}`;
      const testValue = { message: 'Test connection', timestamp: new Date().toISOString() };
      
      // Test set
      await kv.set(testKey, testValue);
      
      // Test get
      const retrieved = await kv.get(testKey);
      
      if (!retrieved || retrieved.message !== testValue.message) {
        throw new Error('Données récupérées incorrectes');
      }
      
      // Test delete
      await kv.del(testKey);
      
      setResults(prev => ({
        ...prev,
        kvStore: { 
          status: 'success', 
          message: 'KV Store fonctionne correctement (set/get/delete)', 
          error: null 
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        kvStore: { 
          status: 'error', 
          message: 'Erreur du KV Store', 
          error: error.message 
        }
      }));
    }

    // Test 3: Edge Functions
    try {
      const isConnected = await kv.testConnection();
      
      if (!isConnected) {
        throw new Error('Ping des Edge Functions échoué');
      }
      
      setResults(prev => ({
        ...prev,
        edgeFunctions: { 
          status: 'success', 
          message: 'Edge Functions accessibles', 
          error: null 
        }
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        edgeFunctions: { 
          status: 'error', 
          message: 'Erreur des Edge Functions', 
          error: error.message 
        }
      }));
    }

    setTesting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'testing':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">✅ OK</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">❌ Erreur</Badge>;
      case 'testing':
        return <Badge className="bg-blue-100 text-blue-800">🔄 Test...</Badge>;
      default:
        return <Badge variant="outline">⏸️ En attente</Badge>;
    }
  };

  const allTestsPassed = Object.values(results).every(result => result.status === 'success');
  const hasErrors = Object.values(results).some(result => result.status === 'error');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-blue-600" />
          <span>Test de Connexion Supabase</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Configuration actuelle */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Configuration</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Project ID:</strong> {projectId}</p>
            <p><strong>URL:</strong> https://{projectId}.supabase.co</p>
            <p><strong>Clé publique:</strong> {publicAnonKey.substring(0, 20)}...</p>
          </div>
        </div>

        {/* Résultats des tests */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Résultats des Tests</h3>
          
          {[
            { key: 'client', label: 'Client Supabase', icon: <Database className="h-4 w-4" /> },
            { key: 'kvStore', label: 'KV Store', icon: <Database className="h-4 w-4" /> },
            { key: 'edgeFunctions', label: 'Edge Functions', icon: <Wifi className="h-4 w-4" /> }
          ].map(({ key, label, icon }) => {
            const result = results[key];
            return (
              <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {icon}
                    {getStatusIcon(result.status)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{label}</p>
                    <p className="text-sm text-gray-600">{result.message}</p>
                    {result.error && (
                      <p className="text-xs text-red-600 mt-1">{result.error}</p>
                    )}
                  </div>
                </div>
                {getStatusBadge(result.status)}
              </div>
            );
          })}
        </div>

        {/* État global */}
        {allTestsPassed && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>✅ Tous les tests réussis !</strong><br />
              Votre connexion Supabase est entièrement fonctionnelle.
            </AlertDescription>
          </Alert>
        )}

        {hasErrors && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>❌ Certains tests ont échoué</strong><br />
              Vérifiez la configuration et les Edge Functions de Supabase.
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <Button 
            onClick={runTests} 
            disabled={testing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Test en cours...
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Lancer les Tests
              </>
            )}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}`, '_blank')}
          >
            Ouvrir Dashboard
          </Button>
        </div>

        {/* Informations de dépannage */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Dépannage :</strong></p>
          <p>• Si le client échoue : Vérifiez les clés API dans /utils/supabase/info.tsx</p>
          <p>• Si KV Store échoue : Vérifiez que les Edge Functions sont déployées</p>
          <p>• Si Edge Functions échouent : Vérifiez la configuration dans Supabase Dashboard</p>
        </div>
      </CardContent>
    </Card>
  );
}