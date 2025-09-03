import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { 
  Key, 
  CheckCircle, 
  Copy,
  ExternalLink,
  Shield,
  Database,
  Clock
} from 'lucide-react';

export default function SupabaseKeysStatus() {
  const [copied, setCopied] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, keyType: string) => {
    navigator.clipboard.writeText(text);
    setCopied(keyType);
    setTimeout(() => setCopied(null), 2000);
  };

  // Analyse des clés
  const keyAnalysis = {
    projectId: {
      value: projectId,
      valid: !!(projectId && projectId.length === 20 && projectId !== 'your-project-id'),
      updated: projectId === 'nrvzifxdmllgcidfhlzh'
    },
    anonKey: {
      value: publicAnonKey,
      valid: !!(publicAnonKey && publicAnonKey.length > 100),
      updated: publicAnonKey.includes('eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydnppZnhkbWxsZ2NpZGZobHpoIiwicm9sZSI6ImFub24i'),
      expires: new Date(2071972690 * 1000) // timestamp from JWT
    }
  };

  const allKeysValid = keyAnalysis.projectId.valid && keyAnalysis.anonKey.valid;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Key className="h-5 w-5 text-blue-600" />
          <span>Statut des Clés Supabase</span>
          {allKeysValid && <Badge className="bg-green-100 text-green-800">✅ Configuré</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Statut global */}
        <Alert className={allKeysValid ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
          {allKeysValid ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <Shield className="h-4 w-4 text-orange-600" />
          )}
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span className={allKeysValid ? 'text-green-800' : 'text-orange-800'}>
                <strong>Configuration :</strong> {allKeysValid ? 'Toutes les clés sont valides et mises à jour' : 'Configuration incomplète'}
              </span>
              <Badge variant={allKeysValid ? 'default' : 'destructive'}>
                {allKeysValid ? 'Prêt' : 'Action requise'}
              </Badge>
            </div>
          </AlertDescription>
        </Alert>

        {/* Détails des clés */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Project ID */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Project ID</span>
              <div className="flex items-center space-x-2">
                {keyAnalysis.projectId.valid && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                    ✅ Valide
                  </Badge>
                )}
                {keyAnalysis.projectId.updated && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                    🆕 Mis à jour
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <code className="text-xs bg-gray-100 p-2 rounded flex-1 font-mono">
                {keyAnalysis.projectId.value || 'Non défini'}
              </code>
              {keyAnalysis.projectId.value && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="p-1"
                  onClick={() => copyToClipboard(keyAnalysis.projectId.value, 'projectId')}
                >
                  {copied === 'projectId' ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Clé publique anonyme */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Clé Publique Anonyme</span>
              <div className="flex items-center space-x-2">
                {keyAnalysis.anonKey.valid && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                    ✅ Valide
                  </Badge>
                )}
                {keyAnalysis.anonKey.updated && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                    🆕 Mis à jour
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <code className="text-xs bg-gray-100 p-2 rounded flex-1 font-mono truncate">
                {keyAnalysis.anonKey.value ? 
                  `${keyAnalysis.anonKey.value.substring(0, 30)}...` : 
                  'Non définie'
                }
              </code>
              {keyAnalysis.anonKey.value && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="p-1"
                  onClick={() => copyToClipboard(keyAnalysis.anonKey.value, 'anonKey')}
                >
                  {copied === 'anonKey' ? (
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
            {keyAnalysis.anonKey.expires && (
              <p className="text-xs text-gray-500 flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Expire le: {keyAnalysis.anonKey.expires.toLocaleDateString()}</span>
              </p>
            )}
          </div>
        </div>

        {/* URLs générées */}
        {allKeysValid && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">URLs Générées</h4>
            <div className="bg-blue-50 p-3 rounded-lg space-y-2">
              {[
                { 
                  label: 'Base URL', 
                  url: `https://${projectId}.supabase.co`,
                  icon: <Database className="h-3 w-3" />
                },
                { 
                  label: 'Edge Functions', 
                  url: `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98`,
                  icon: <Shield className="h-3 w-3" />
                },
                { 
                  label: 'Dashboard', 
                  url: `https://supabase.com/dashboard/project/${projectId}`,
                  icon: <ExternalLink className="h-3 w-3" />
                }
              ].map(({ label, url, icon }) => (
                <div key={label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    {icon}
                    <span className="text-gray-600">{label}:</span>
                  </div>
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-mono truncate max-w-xs"
                  >
                    {url}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Intégration serveur */}
        <Alert className="border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <p className="font-medium mb-1">Intégration Serveur</p>
            <p className="text-sm">
              ✅ Clé de service intégrée dans <code>/supabase/functions/server/secrets.tsx</code>
              <br />
              ✅ Fallback automatique si variables d'environnement non configurées
              <br />
              ✅ Validation des secrets au démarrage du serveur
            </p>
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <div className="flex justify-between items-center pt-2">
          <div className="text-xs text-gray-500">
            Dernière mise à jour: {new Date().toLocaleString()}
          </div>
          <div className="flex space-x-2">
            <a
              href={`https://supabase.com/dashboard/project/${projectId}/settings/api`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="outline">
                <ExternalLink className="h-3 w-3 mr-1" />
                Dashboard API
              </Button>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}