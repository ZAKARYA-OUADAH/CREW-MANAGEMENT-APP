import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import * as kv from '../utils/supabase/kv_store';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function BuildHealthCheck() {
  const [status, setStatus] = useState({
    kvStore: 'testing',
    localStorage: 'testing',
    connectivity: 'testing'
  });
  const [testing, setTesting] = useState(false);

  const runHealthCheck = async () => {
    setTesting(true);
    
    // Test 1: KV Store functions
    try {
      const testKey = `health_check_${Date.now()}`;
      const testValue = { test: true, timestamp: new Date().toISOString() };
      
      await kv.set(testKey, testValue);
      const retrieved = await kv.get(testKey);
      await kv.del(testKey);
      
      if (retrieved && retrieved.test === true) {
        setStatus(prev => ({ ...prev, kvStore: 'success' }));
      } else {
        setStatus(prev => ({ ...prev, kvStore: 'error' }));
      }
    } catch (error) {
      console.error('KV Store test failed:', error);
      setStatus(prev => ({ ...prev, kvStore: 'error' }));
    }

    // Test 2: localStorage availability
    try {
      const testKey = 'health_check_local';
      const testValue = 'test_value';
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (retrieved === testValue) {
        setStatus(prev => ({ ...prev, localStorage: 'success' }));
      } else {
        setStatus(prev => ({ ...prev, localStorage: 'error' }));
      }
    } catch (error) {
      console.error('localStorage test failed:', error);
      setStatus(prev => ({ ...prev, localStorage: 'error' }));
    }

    // Test 3: Connectivity status
    try {
      const connectivity = kv.getConnectivityStatus();
      const isConnected = await kv.testConnection();
      
      if (isConnected) {
        setStatus(prev => ({ ...prev, connectivity: 'success' }));
      } else {
        setStatus(prev => ({ ...prev, connectivity: 'warning' }));
      }
    } catch (error) {
      console.error('Connectivity test failed:', error);
      setStatus(prev => ({ ...prev, connectivity: 'error' }));
    }

    setTesting(false);
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const getStatusIcon = (statusValue: string) => {
    switch (statusValue) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'testing':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (statusValue: string) => {
    switch (statusValue) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">OK</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Attention</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Erreur</Badge>;
      case 'testing':
        return <Badge className="bg-blue-100 text-blue-800">Test...</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const overallHealth = Object.values(status).every(s => s === 'success') ? 'healthy' :
                       Object.values(status).some(s => s === 'error') ? 'unhealthy' : 'warning';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getStatusIcon(overallHealth === 'healthy' ? 'success' : 
                        overallHealth === 'unhealthy' ? 'error' : 'warning')}
          <span>État de l'Application</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Tests de santé */}
        <div className="space-y-3">
          
          {/* KV Store */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(status.kvStore)}
              <div>
                <p className="font-medium">KV Store</p>
                <p className="text-sm text-gray-600">
                  {status.kvStore === 'success' ? 'Fonctionnel (set/get/delete)' :
                   status.kvStore === 'error' ? 'Erreur de fonctionnement' :
                   status.kvStore === 'testing' ? 'Test en cours...' : 'État inconnu'}
                </p>
              </div>
            </div>
            {getStatusBadge(status.kvStore)}
          </div>

          {/* localStorage */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(status.localStorage)}
              <div>
                <p className="font-medium">LocalStorage</p>
                <p className="text-sm text-gray-600">
                  {status.localStorage === 'success' ? 'Disponible et fonctionnel' :
                   status.localStorage === 'error' ? 'Indisponible ou défaillant' :
                   status.localStorage === 'testing' ? 'Test en cours...' : 'État inconnu'}
                </p>
              </div>
            </div>
            {getStatusBadge(status.localStorage)}
          </div>

          {/* Connectivité */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              {getStatusIcon(status.connectivity)}
              <div>
                <p className="font-medium">Connectivité</p>
                <p className="text-sm text-gray-600">
                  {status.connectivity === 'success' ? 'Serveur Supabase accessible' :
                   status.connectivity === 'warning' ? 'Mode local uniquement' :
                   status.connectivity === 'error' ? 'Aucune connectivité' :
                   status.connectivity === 'testing' ? 'Test en cours...' : 'État inconnu'}
                </p>
              </div>
            </div>
            {getStatusBadge(status.connectivity)}
          </div>
        </div>

        {/* État global */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                État global: {overallHealth === 'healthy' ? '✅ Sain' :
                            overallHealth === 'unhealthy' ? '❌ Problèmes détectés' :
                            '⚠️ Attention requise'}
              </p>
              <p className="text-sm text-gray-600">
                {overallHealth === 'healthy' ? 'Tous les systèmes fonctionnent correctement' :
                 overallHealth === 'unhealthy' ? 'Des erreurs ont été détectées' :
                 'Certains systèmes nécessitent votre attention'}
              </p>
            </div>
            <Button
              onClick={runHealthCheck}
              disabled={testing}
              variant="outline"
              size="sm"
            >
              {testing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Test...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Relancer
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}