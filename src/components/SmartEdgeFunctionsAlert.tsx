import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  AlertTriangle,
  X,
  RefreshCw,
  Rocket,
  CheckCircle,
  Settings,
  Activity
} from 'lucide-react';
import * as kv from '../utils/supabase/kv_store';
import SmartEdgeFunctionsGuide from './SmartEdgeFunctionsGuide';
import AdvancedEdgeFunctionsDiagnostic from './AdvancedEdgeFunctionsDiagnostic';
import EdgeFunctionsMonitor from './EdgeFunctionsMonitor';
import EdgeFunctionDeploymentFixer from './EdgeFunctionDeploymentFixer';
import EmergencyEdgeFunctionsFixer from './EmergencyEdgeFunctionsFixer';

interface SmartEdgeFunctionsAlertProps {
  onDismiss?: () => void;
}

type AlertMode = 'compact' | 'guide' | 'diagnostic' | 'monitor' | 'fixer' | 'emergency';

export default function SmartEdgeFunctionsAlert({ onDismiss }: SmartEdgeFunctionsAlertProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [currentMode, setCurrentMode] = useState<AlertMode>('compact');

  useEffect(() => {
    // Vérifier l'état de connectivité
    const checkConnectivity = () => {
      const connectivity = kv.getConnectivityStatus();
      setIsOnline(connectivity.mode === 'server');
      setLastCheck(connectivity.lastCheck > 0 ? new Date(connectivity.lastCheck) : null);
    };

    checkConnectivity();
    
    // Vérifier périodiquement
    const interval = setInterval(checkConnectivity, 15000); // Toutes les 15 secondes
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Vérifier si l'alerte a été supprimée récemment
    const dismissed = localStorage.getItem('smart_edge_functions_alert_dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000); // 2 heures
      
      if (dismissedTime > twoHoursAgo) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem('smart_edge_functions_alert_dismissed');
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('smart_edge_functions_alert_dismissed', Date.now().toString());
    if (onDismiss) onDismiss();
  };

  const handleRecheck = () => {
    window.location.reload();
  };

  const handleDeploymentComplete = () => {
    setCurrentMode('compact');
    // Recharger pour vérifier la reconnexion
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleModeChange = (mode: AlertMode) => {
    setCurrentMode(mode);
  };

  // Ne pas afficher si en mode serveur ou si supprimé
  if (isOnline || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-2xl z-50">
      {currentMode === 'guide' && (
        <SmartEdgeFunctionsGuide 
          compact={true}
          onComplete={handleDeploymentComplete}
        />
      )}
      
      {currentMode === 'diagnostic' && (
        <AdvancedEdgeFunctionsDiagnostic 
          onClose={() => setCurrentMode('compact')}
        />
      )}
      
      {currentMode === 'monitor' && (
        <div className="space-y-2">
          <EdgeFunctionsMonitor compact={true} autoStart={true} />
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMode('compact')}
            >
              <X className="h-3 w-3 mr-1" />
              Fermer
            </Button>
          </div>
        </div>
      )}
      
      {currentMode === 'fixer' && (
        <EdgeFunctionDeploymentFixer 
          onClose={() => setCurrentMode('compact')}
        />
      )}
      
      {currentMode === 'emergency' && (
        <EmergencyEdgeFunctionsFixer 
          onClose={() => setCurrentMode('compact')}
        />
      )}
      
      {currentMode === 'compact' && (
        <Card className="border-orange-200 bg-orange-50 shadow-lg">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* En-tête de l'alerte */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-orange-900">
                      Mode Local Actif
                    </div>
                    <div className="text-sm text-orange-700">
                      Edge Functions indisponibles (404/401)
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRecheck}
                    className="h-6 w-6 p-0 text-orange-600 hover:text-orange-800"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="h-6 w-6 p-0 text-orange-600 hover:text-orange-800"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Status et dernière vérification */}
              <div className="flex items-center justify-between text-xs text-orange-600">
                <Badge variant="outline" className="border-orange-300 text-orange-700">
                  Données locales
                </Badge>
                {lastCheck && (
                  <span>
                    Vérif: {lastCheck.toLocaleTimeString('fr-FR')}
                  </span>
                )}
              </div>

              {/* Actions principales */}
              <div className="space-y-2">
                <Button 
                  size="sm" 
                  onClick={() => setCurrentMode('emergency')}
                  className="w-full text-xs bg-red-500 hover:bg-red-600 text-white animate-pulse"
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  🚨 RÉPARATION D'URGENCE
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setCurrentMode('fixer')}
                    className="text-xs"
                  >
                    <Rocket className="h-3 w-3 mr-1" />
                    Diagnostic
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setCurrentMode('guide')}
                    className="text-xs"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Guide
                  </Button>
                </div>
              </div>

              {/* Actions secondaires */}
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setCurrentMode('monitor')}
                  className="flex-1 text-xs"
                >
                  <Activity className="h-3 w-3 mr-1" />
                  Monitor
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => window.open('/settings', '_blank')}
                  className="flex-1 text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Settings
                </Button>
              </div>

              {/* Info rapide */}
              <div className="text-xs text-orange-600 bg-orange-100 p-2 rounded">
                💡 Application fonctionnelle en mode local. Déployez les Edge Functions pour les fonctionnalités serveur complètes.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}