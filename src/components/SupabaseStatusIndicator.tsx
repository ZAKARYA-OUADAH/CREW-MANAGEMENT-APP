import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useSupabaseData } from './SupabaseDataProvider';
import * as kv from '../utils/supabase/kv_store';
import { 
  Database, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  HardDrive,
  Cloud
} from 'lucide-react';

export default function SupabaseStatusIndicator() {
  const { 
    missions, 
    crewMembers, 
    notifications, 
    activities,
    loading, 
    syncing, 
    lastSync 
  } = useSupabaseData();

  const [connectivity, setConnectivity] = useState(kv.getConnectivityStatus());
  
  const totalItems = missions.length + crewMembers.length + notifications.length + activities.length;
  const isLoading = Object.values(loading).some(Boolean);
  
  // Mettre à jour l'état de connectivité périodiquement
  useEffect(() => {
    const interval = setInterval(() => {
      setConnectivity(kv.getConnectivityStatus());
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const getStatusInfo = () => {
    if (isLoading) {
      return {
        color: 'bg-blue-100 text-blue-800',
        icon: <RefreshCw className="h-3 w-3 animate-spin" />,
        text: 'Chargement...',
        description: 'Chargement des données'
      };
    }
    
    if (syncing) {
      const modeText = connectivity.mode === 'local' ? 'locale' : 'serveur';
      return {
        color: 'bg-orange-100 text-orange-800',
        icon: <RefreshCw className="h-3 w-3 animate-spin" />,
        text: 'Sync',
        description: `Synchronisation ${modeText} en cours`
      };
    }
    
    // État basé sur le mode de connectivité
    switch (connectivity.mode) {
      case 'server':
        return {
          color: 'bg-green-100 text-green-800',
          icon: <Cloud className="h-3 w-3" />,
          text: 'Serveur',
          description: `${totalItems} éléments - Mode serveur Supabase`
        };
      
      case 'local':
        return {
          color: 'bg-yellow-100 text-yellow-800',
          icon: <HardDrive className="h-3 w-3" />,
          text: 'Local',
          description: `${totalItems} éléments - Mode local (localStorage)`
        };
      
      case 'unknown':
      default:
        if (totalItems === 0) {
          return {
            color: 'bg-gray-100 text-gray-800',
            icon: <Database className="h-3 w-3" />,
            text: 'Vide',
            description: 'Aucune donnée disponible'
          };
        }
        
        return {
          color: 'bg-blue-100 text-blue-800',
          icon: <AlertCircle className="h-3 w-3" />,
          text: 'Inconnu',
          description: `${totalItems} éléments - Mode indéterminé`
        };
    }
  };

  const status = getStatusInfo();
  
  const formatLastSync = () => {
    if (!lastSync) return 'Jamais';
    
    const now = new Date();
    const diff = now.getTime() - lastSync.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    
    return lastSync.toLocaleDateString('fr-FR');
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-2 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer">
            <div className="flex items-center space-x-1">
              {status.icon}
              <span className="text-xs font-medium">{status.text}</span>
            </div>
            <Badge 
              variant="outline" 
              className={`text-xs ${status.color} border-transparent`}
            >
              {totalItems}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-blue-600" />
              <span className="font-medium">État des Données</span>
            </div>
            <div className="text-xs space-y-1">
              <p><strong>Mode:</strong> {connectivity.mode === 'server' ? 'Serveur Supabase' : 
                                        connectivity.mode === 'local' ? 'Local (localStorage)' : 
                                        'Indéterminé'}</p>
              <p><strong>Statut:</strong> {status.description}</p>
              <p><strong>Dernière sync:</strong> {formatLastSync()}</p>
              
              {connectivity.mode === 'local' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                  <p className="text-yellow-800"><strong>⚠️ Mode hors ligne</strong></p>
                  <p className="text-yellow-700">Edge Functions indisponibles</p>
                </div>
              )}
              
              <div className="border-t pt-1 mt-2">
                <p><strong>Données chargées:</strong></p>
                <div className="ml-2 space-y-0.5">
                  <p>• {missions.length} missions</p>
                  <p>• {crewMembers.length} membres d'équipage</p>
                  <p>• {notifications.length} notifications</p>
                  <p>• {activities.length} activités</p>
                </div>
              </div>
              
              {connectivity.lastCheck > 0 && (
                <div className="border-t pt-1 mt-2">
                  <p><strong>Dernière vérif:</strong> {new Date(connectivity.lastCheck).toLocaleTimeString('fr-FR')}</p>
                </div>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}