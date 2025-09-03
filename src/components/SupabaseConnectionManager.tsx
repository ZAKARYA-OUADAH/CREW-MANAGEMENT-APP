import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import SupabaseConfigUpdater from './SupabaseConfigUpdater';
import { 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink,
  Settings
} from 'lucide-react';

export default function SupabaseConnectionManager() {
  // Validation de la configuration actuelle
  const isConfigValid = (): boolean => {
    return !!(
      projectId && 
      publicAnonKey && 
      projectId.length === 20 && 
      publicAnonKey.length > 100 &&
      projectId !== 'your-project-id'
    );
  };

  const isValidConfig = isConfigValid();

  // URLs générées automatiquement
  const urls = {
    base: `https://${projectId}.supabase.co`,
    functions: `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98`,
    dashboard: `https://supabase.com/dashboard/project/${projectId}`
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Connexion Supabase</span>
          </div>
          <SupabaseConfigUpdater />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Statut de la configuration */}
        <Alert className={isValidConfig ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
          {isValidConfig ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          )}
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span className={isValidConfig ? 'text-green-800' : 'text-orange-800'}>
                <strong>Statut:</strong> {isValidConfig ? 'Configuration valide' : 'Configuration incomplète'}
              </span>
              <Badge variant={isValidConfig ? 'default' : 'destructive'} className="ml-2">
                {isValidConfig ? 'Connecté' : 'Déconnecté'}
              </Badge>
            </div>
          </AlertDescription>
        </Alert>

        {/* Informations de connexion */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Project ID:</span>
              {projectId ? (
                <Badge variant="outline" className="font-mono text-xs">
                  {projectId}
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  Non défini
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Clé publique:</span>
              {publicAnonKey ? (
                <Badge variant="outline" className="font-mono text-xs">
                  {publicAnonKey.substring(0, 15)}...
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  Non définie
                </Badge>
              )}
            </div>
          </div>

          {/* URLs générées */}
          {isValidConfig && (
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">URLs générées:</div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600">Base:</span>
                  <a 
                    href={urls.base} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-xs flex items-center space-x-1"
                  >
                    <span className="font-mono">{urls.base}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600">Functions:</span>
                  <span className="text-xs font-mono text-gray-800">
                    {urls.functions}/*
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-600">Dashboard:</span>
                  <a 
                    href={urls.dashboard} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-xs flex items-center space-x-1"
                  >
                    <span>Ouvrir Dashboard</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions si configuration invalide */}
        {!isValidConfig && (
          <Alert className="border-blue-200 bg-blue-50">
            <Settings className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <p className="font-medium">Configuration requise</p>
              <p className="text-sm mt-1">
                Cliquez sur "Configuration Supabase" ci-dessus pour configurer votre connexion 
                avec le nouveau projet Supabase.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Informations de compatibilité */}
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium mb-1">Compatibilité:</p>
          <p>• Tous les composants utilisent automatiquement ces configurations</p>
          <p>• ComprehensiveDataDiagnostic, CrewDataService, et tous les appels API</p>
          <p>• Rechargement de l'application requis après modification</p>
        </div>
      </CardContent>
    </Card>
  );
}