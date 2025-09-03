import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import * as kv from '../utils/supabase/kv_store';
import { 
  HardDrive, 
  X, 
  RefreshCw,
  Wifi,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export default function LocalModeNotification() {
  const [connectivity, setConnectivity] = useState(kv.getConnectivityStatus());
  const [dismissed, setDismissed] = useState(false);
  const [testing, setTesting] = useState(false);

  // Mettre à jour l'état de connectivité
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectivity(kv.getConnectivityStatus());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Auto-dismiss si on revient en mode serveur
  useEffect(() => {
    if (connectivity.mode === 'server' && !dismissed) {
      const timer = setTimeout(() => {
        setDismissed(true);
      }, 3000); // Se fermer automatiquement après 3 secondes en mode serveur
      
      return () => clearTimeout(timer);
    }
  }, [connectivity.mode, dismissed]);

  // Test de reconnexion
  const handleReconnect = async () => {
    setTesting(true);
    try {
      const isConnected = await kv.testConnection();
      if (isConnected) {
        setConnectivity(kv.getConnectivityStatus());
      }
    } catch (error) {
      console.error('Test de reconnexion échoué:', error);
    } finally {
      setTesting(false);
    }
  };

  // Ne pas afficher si dismissé ou si en mode serveur
  if (dismissed || connectivity.mode === 'server') {
    return null;
  }

  // Ne pas afficher si le mode est inconnu (première charge)
  if (connectivity.mode === 'unknown') {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert className="border-yellow-200 bg-yellow-50 shadow-lg">
        <HardDrive className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  Mode Local
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDismissed(true)}
                  className="h-4 w-4 p-0 text-yellow-600 hover:text-yellow-800"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <p className="text-sm">
                L'application fonctionne en mode local (localStorage). 
                Les Edge Functions Supabase ne sont pas accessibles.
              </p>
              
              <div className="flex items-center space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReconnect}
                  disabled={testing}
                  className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                >
                  {testing ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Test...
                    </>
                  ) : (
                    <>
                      <Wifi className="h-3 w-3 mr-1" />
                      Reconnecter
                    </>
                  )}
                </Button>
                
                <div className="text-xs text-yellow-600">
                  {connectivity.lastCheck > 0 && (
                    <>
                      Dernière vérif: {new Date(connectivity.lastCheck).toLocaleTimeString('fr-FR')}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}