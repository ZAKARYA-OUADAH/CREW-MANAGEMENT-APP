import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { 
  Play,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Copy,
  ExternalLink,
  Globe
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface TestSimpleEdgeFunctionProps {
  onClose?: () => void;
}

const TestSimpleEdgeFunction: React.FC<TestSimpleEdgeFunctionProps> = ({ onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [rawResponse, setRawResponse] = useState<string>('');
  const [error, setError] = useState<string>('');

  const PROJECT_ID = 'nrvzifxdmllgcidfhlzh';
  const FUNCTION_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/make-server-9fd39b98/health`;

  const testEdgeFunction = async () => {
    setIsLoading(true);
    setResult(null);
    setRawResponse('');
    setError('');

    console.log('🧪 Test simple Edge Function...');
    console.log('URL:', FUNCTION_URL);

    try {
      const startTime = Date.now();
      
      const response = await fetch(FUNCTION_URL, {
        method: 'GET',
        signal: AbortSignal.timeout(15000) // 15s timeout
      });
      
      const duration = Date.now() - startTime;
      const text = await response.text();
      
      console.log('Status:', response.status);
      console.log('Raw response:', text);
      
      setRawResponse(text);

      if (response.ok) {
        try {
          const data = JSON.parse(text);
          setResult({
            success: true,
            status: response.status,
            duration,
            data
          });
          
          if (data.status === 'healthy') {
            toast.success('✅ Edge Function fonctionne !');
          } else {
            toast.warning('⚠️ Edge Function répond mais pas healthy');
          }
        } catch (parseError) {
          setError(`Réponse OK mais JSON invalide: ${parseError.message}`);
          toast.error('❌ JSON invalide');
        }
      } else {
        setError(`HTTP ${response.status}: ${text || 'Réponse vide'}`);
        toast.error(`❌ Erreur HTTP ${response.status}`);
      }
    } catch (fetchError) {
      const errorMessage = fetchError.message || 'Erreur inconnue';
      setError(`Erreur de requête: ${errorMessage}`);
      console.error('Fetch error:', fetchError);
      toast.error('❌ Impossible de contacter l\'Edge Function');
    } finally {
      setIsLoading(false);
    }
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(rawResponse);
    toast.success('Réponse copiée !');
  };

  const openSupabaseFunction = () => {
    window.open(`https://supabase.com/dashboard/project/${PROJECT_ID}/functions`, '_blank');
  };

  const openSupabaseLogs = () => {
    window.open(`https://supabase.com/dashboard/project/${PROJECT_ID}/logs/edge-functions`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-6 w-6 text-blue-500" />
              <span>🧪 Test Simple Edge Function</span>
            </CardTitle>
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* URL de test */}
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription>
              <div className="space-y-2">
                <strong className="text-blue-800">URL testée :</strong>
                <div className="font-mono text-xs bg-blue-100 p-2 rounded break-all">
                  {FUNCTION_URL}
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Bouton de test */}
          <div className="flex space-x-2">
            <Button 
              onClick={testEdgeFunction} 
              disabled={isLoading}
              className="flex-1 bg-blue-500 hover:bg-blue-600"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              {isLoading ? 'Test en cours...' : 'Tester Edge Function'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={openSupabaseFunction}
              size="sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            
            <Button 
              variant="outline"
              onClick={openSupabaseLogs}
              size="sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Logs
            </Button>
          </div>

          {/* Résultat du test */}
          {result && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">✅ Test réussi !</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {result.duration}ms
                    </Badge>
                  </div>
                  
                  <div className="bg-white p-3 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Réponse JSON :</span>
                      <Button size="sm" variant="outline" onClick={copyResponse}>
                        <Copy className="h-3 w-3 mr-1" />
                        Copier
                      </Button>
                    </div>
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Erreur */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-800">❌ Test échoué</span>
                  </div>
                  
                  <Alert className="border-red-200 bg-red-100">
                    <AlertDescription className="text-red-800 text-sm">
                      <strong>Erreur :</strong> {error}
                    </AlertDescription>
                  </Alert>

                  {rawResponse && (
                    <div className="bg-white p-3 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Réponse brute :</span>
                        <Button size="sm" variant="outline" onClick={copyResponse}>
                          <Copy className="h-3 w-3 mr-1" />
                          Copier
                        </Button>
                      </div>
                      <Textarea
                        value={rawResponse}
                        readOnly
                        className="font-mono text-xs h-20"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions de débogage */}
          {error && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <h4 className="font-medium text-orange-800 mb-2">🔧 Instructions de débogage</h4>
                <div className="text-sm text-orange-700 space-y-1">
                  {error.includes('Failed to fetch') && (
                    <div>• Problème de réseau ou Edge Function non déployée</div>
                  )}
                  {error.includes('404') && (
                    <div>• Edge Function n'existe pas - vérifiez le nom exact</div>
                  )}
                  {error.includes('500') && (
                    <div>• Erreur serveur - vérifiez les logs Edge Function</div>
                  )}
                  {error.includes('timeout') && (
                    <div>• Timeout - Edge Function trop lente ou bloquée</div>
                  )}
                  <div>• Nom requis: <code className="bg-orange-100 px-1 rounded">make-server-9fd39b98</code></div>
                  <div>• Vérifiez les logs Supabase pour plus de détails</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test manuel cURL */}
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2">🛠️ Test manuel avec cURL</h4>
              <div className="bg-black text-green-400 p-3 rounded font-mono text-xs overflow-auto">
                curl -X GET "{FUNCTION_URL}"
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Copiez cette commande dans votre terminal pour tester depuis l'extérieur.
              </p>
            </CardContent>
          </Card>

        </CardContent>
      </Card>
    </div>
  );
};

export default TestSimpleEdgeFunction;