import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { 
  Cloud,
  HardDrive,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Settings,
  Zap
} from 'lucide-react';
import * as kv from '../utils/supabase/kv_store';

interface SystemStatusIndicatorProps {
  onOpenSettings?: () => void;
  compact?: boolean;
}

export default function SystemStatusIndicator({ onOpenSettings, compact = false }: SystemStatusIndicatorProps) {
  const [connectivity, setConnectivity] = useState(kv.getConnectivityStatus());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const updateStatus = () => {
      setConnectivity(kv.getConnectivityStatus());
      setLastUpdate(new Date());
    };

    // Vérification initiale
    updateStatus();

    // Mise à jour périodique
    const interval = setInterval(updateStatus, 10000); // Toutes les 10 secondes

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Forcer une nouvelle vérification
    try {
      await kv.testConnection();
      setTimeout(() => {
        setConnectivity(kv.getConnectivityStatus());
        setLastUpdate(new Date());
        setIsRefreshing(false);
      }, 1000);
    } catch (error) {
      setIsRefreshing(false);
    }
  };

  const getStatusInfo = () => {
    switch (connectivity.mode) {
      case 'server':
        return {
          icon: <Cloud className="h-3 w-3" />,
          label: compact ? 'Serveur' : 'Mode Serveur',
          color: 'bg-green-100 text-green-800 border-green-200',
          description: 'Edge Functions actives - Toutes les fonctionnalités disponibles',
          actionLabel: null
        };
      
      case 'local':
        return {
          icon: <HardDrive className="h-3 w-3" />,
          label: compact ? 'Local' : 'Mode Local',
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          description: 'Fonctionnement hors ligne - Déployez les Edge Functions pour plus de fonctionnalités',
          actionLabel: 'Déployer'
        };
      
      default:
        return {
          icon: <AlertTriangle className="h-3 w-3" />,
          label: compact ? 'Inconnu' : 'Vérification',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          description: 'Statut du système en cours de vérification',
          actionLabel: 'Actualiser'
        };
    }
  };

  const status = getStatusInfo();

  const formatLastUpdate = () => {
    const diff = new Date().getTime() - lastUpdate.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    
    const hours = Math.floor(minutes / 60);
    return `Il y a ${hours}h`;
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center space-x-1">
              <Badge variant="outline" className={`${status.color} cursor-pointer`}>
                <div className="flex items-center space-x-1">
                  {status.icon}
                  <span>{status.label}</span>
                </div>
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <div className="font-medium">{status.description}</div>
              <div className="text-xs opacity-75">
                Dernière mise à jour: {formatLastUpdate()}
              </div>
              {status.actionLabel && (
                <div className="text-xs">
                  Cliquez pour accéder aux paramètres
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={status.color}>
              <div className="flex items-center space-x-1">
                {isRefreshing ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  status.icon
                )}
                <span>{status.label}</span>
              </div>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-sm">
            <div className="space-y-2">
              <div className="font-medium text-sm">{status.description}</div>
              
              <div className="text-xs space-y-1 opacity-75">
                <div>Dernière vérification: {formatLastUpdate()}</div>
                {connectivity.lastCheck > 0 && (
                  <div>
                    Test réseau: {new Date(connectivity.lastCheck).toLocaleTimeString('fr-FR')}
                  </div>
                )}
              </div>
              
              {status.actionLabel && (
                <div className="border-t pt-2 mt-2">
                  <div className="text-xs text-blue-600">
                    💡 Utilisez les paramètres pour {status.actionLabel.toLowerCase()}
                  </div>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
        
        {status.actionLabel && onOpenSettings && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSettings}
            className="h-6 w-6 p-0"
          >
            {status.actionLabel === 'Déployer' ? (
              <Zap className="h-3 w-3" />
            ) : (
              <Settings className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}