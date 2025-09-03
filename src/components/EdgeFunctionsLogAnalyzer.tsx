import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  FileText,
  Search,
  AlertCircle,
  CheckCircle,
  Copy,
  Terminal,
  Lightbulb,
  TrendingUp,
  Bug,
  Zap,
  Clock
} from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface LogAnalysis {
  errors: Array<{ message: string; count: number; suggestion: string }>;
  warnings: Array<{ message: string; count: number }>;
  patterns: Array<{ pattern: string; description: string; severity: 'info' | 'warning' | 'error' }>;
  suggestions: string[];
  summary: {
    totalLines: number;
    errorLines: number;
    warningLines: number;
    deploymentIssues: boolean;
    configurationIssues: boolean;
    networkIssues: boolean;
  };
}

interface EdgeFunctionsLogAnalyzerProps {
  onSolutionFound?: (solution: string) => void;
}

export default function EdgeFunctionsLogAnalyzer({ onSolutionFound }: EdgeFunctionsLogAnalyzerProps) {
  const [logs, setLogs] = useState('');
  const [analysis, setAnalysis] = useState<LogAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const errorPatterns = [
    {
      pattern: /Function not found|404/gi,
      message: 'Fonction non trouvée',
      suggestion: 'La fonction n\'est pas déployée. Utilisez: supabase functions deploy make-server-9fd39b98',
      severity: 'error' as const
    },
    {
      pattern: /unauthorized|401/gi,
      message: 'Non autorisé',
      suggestion: 'Vérifiez les secrets avec: supabase secrets list',
      severity: 'error' as const
    },
    {
      pattern: /internal server error|500/gi,
      message: 'Erreur serveur interne',
      suggestion: 'Consultez les logs détaillés de la fonction',
      severity: 'error' as const
    },
    {
      pattern: /timeout|timed out/gi,
      message: 'Timeout',
      suggestion: 'Problème de réseau ou fonction trop lente',
      severity: 'warning' as const
    },
    {
      pattern: /SUPABASE_URL.*undefined|SUPABASE_SERVICE_ROLE_KEY.*undefined/gi,
      message: 'Variables d\'environnement manquantes',
      suggestion: 'Configurez les secrets Supabase avec supabase secrets set',
      severity: 'error' as const
    },
    {
      pattern: /edge runtime/gi,
      message: 'Problème Edge Runtime',
      suggestion: 'Vérifiez la compatibilité du code avec l\'Edge Runtime',
      severity: 'warning' as const
    },
    {
      pattern: /database.*connection|postgres.*error/gi,
      message: 'Erreur de connexion base de données',
      suggestion: 'Vérifiez les permissions et la configuration de la base',
      severity: 'error' as const
    },
    {
      pattern: /cors|cross-origin/gi,
      message: 'Problème CORS',
      suggestion: 'Vérifiez la configuration CORS dans la fonction',
      severity: 'warning' as const
    }
  ];

  const analyzeLogs = () => {
    if (!logs.trim()) {
      toast.error('Veuillez coller des logs à analyser');
      return;
    }

    setIsAnalyzing(true);

    setTimeout(() => {
      const lines = logs.split('\n');
      const errors: Array<{ message: string; count: number; suggestion: string }> = [];
      const warnings: Array<{ message: string; count: number }> = [];
      const patterns: Array<{ pattern: string; description: string; severity: 'info' | 'warning' | 'error' }> = [];
      const suggestions: string[] = [];

      let errorLines = 0;
      let warningLines = 0;
      let deploymentIssues = false;
      let configurationIssues = false;
      let networkIssues = false;

      // Analyser chaque ligne
      lines.forEach(line => {
        const lowerLine = line.toLowerCase();
        
        // Compter les erreurs et warnings
        if (lowerLine.includes('error')) errorLines++;
        if (lowerLine.includes('warning') || lowerLine.includes('warn')) warningLines++;

        // Détecter les patterns d'erreur
        errorPatterns.forEach(pattern => {
          if (pattern.pattern.test(line)) {
            const existing = errors.find(e => e.message === pattern.message);
            if (existing) {
              existing.count++;
            } else {
              errors.push({
                message: pattern.message,
                count: 1,
                suggestion: pattern.suggestion
              });
              
              if (!suggestions.includes(pattern.suggestion)) {
                suggestions.push(pattern.suggestion);
              }
            }

            patterns.push({
              pattern: pattern.pattern.source,
              description: pattern.message,
              severity: pattern.severity
            });

            // Catégoriser les problèmes
            if (pattern.message.includes('non trouvée') || pattern.message.includes('deploy')) {
              deploymentIssues = true;
            }
            if (pattern.message.includes('Variables') || pattern.message.includes('secrets')) {
              configurationIssues = true;
            }
            if (pattern.message.includes('Timeout') || pattern.message.includes('connection')) {
              networkIssues = true;
            }
          }
        });
      });

      // Ajouter des suggestions générales basées sur l'analyse
      if (deploymentIssues) {
        suggestions.unshift('Déployez ou redéployez la fonction Edge');
      }
      if (configurationIssues) {
        suggestions.unshift('Vérifiez la configuration des variables d\'environnement');
      }
      if (networkIssues) {
        suggestions.push('Vérifiez la connectivité réseau et les timeouts');
      }

      const analysis: LogAnalysis = {
        errors,
        warnings,
        patterns: patterns.slice(0, 10), // Limiter à 10 patterns
        suggestions: [...new Set(suggestions)], // Supprimer les doublons
        summary: {
          totalLines: lines.length,
          errorLines,
          warningLines,
          deploymentIssues,
          configurationIssues,
          networkIssues
        }
      };

      setAnalysis(analysis);
      setIsAnalyzing(false);

      // Notifier si une solution claire est trouvée
      if (analysis.suggestions.length > 0 && onSolutionFound) {
        onSolutionFound(analysis.suggestions[0]);
      }
    }, 1500);
  };

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command);
    toast.success('Commande copiée');
  };

  const sampleCommands = `# Obtenir les logs Edge Functions
supabase functions logs make-server-9fd39b98 --limit 50

# Logs en temps réel
supabase functions logs make-server-9fd39b98 --follow

# Logs avec filtre d'erreur
supabase functions logs make-server-9fd39b98 | grep -i error`;

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bug className="h-5 w-5 text-red-600" />
          <span>Analyseur de Logs Edge Functions</span>
          {analysis && (
            <Badge variant={analysis.summary.errorLines > 0 ? 'destructive' : 'default'}>
              {analysis.summary.errorLines} erreurs détectées
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Collez vos logs Edge Functions pour une analyse automatique des problèmes
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Instructions pour obtenir les logs */}
        <Alert className="bg-blue-50 border-blue-200">
          <Terminal className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium text-blue-900">Obtenir les logs</div>
              <p className="text-sm text-blue-800">
                Utilisez les commandes suivantes pour obtenir les logs de votre fonction Edge :
              </p>
              <div className="relative mt-2">
                <Textarea
                  value={sampleCommands}
                  readOnly
                  className="text-xs font-mono bg-gray-900 text-green-400 border-gray-700"
                  rows={4}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyCommand(sampleCommands)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Zone de saisie des logs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-900">
              Logs Edge Functions
            </label>
            <Button 
              onClick={analyzeLogs} 
              disabled={isAnalyzing || !logs.trim()}
              size="sm"
            >
              {isAnalyzing ? (
                <>
                  <Search className="h-3 w-3 mr-1 animate-spin" />
                  Analyse...
                </>
              ) : (
                <>
                  <Search className="h-3 w-3 mr-1" />
                  Analyser
                </>
              )}
            </Button>
          </div>

          <Textarea
            value={logs}
            onChange={(e) => setLogs(e.target.value)}
            placeholder="Collez ici les logs de votre fonction Edge Functions..."
            className="min-h-[200px] font-mono text-xs"
          />
        </div>

        {/* Résultats de l'analyse */}
        {analysis && (
          <div className="space-y-6">
            <Separator />
            
            <div>
              <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Résumé de l'Analyse
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600">Total Lignes</div>
                  <div className="text-lg font-medium">{analysis.summary.totalLines}</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <div className="text-xs text-red-600">Erreurs</div>
                  <div className="text-lg font-medium text-red-800">{analysis.summary.errorLines}</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3">
                  <div className="text-xs text-yellow-600">Avertissements</div>
                  <div className="text-lg font-medium text-yellow-800">{analysis.summary.warningLines}</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-blue-600">Problèmes Uniques</div>
                  <div className="text-lg font-medium text-blue-800">{analysis.errors.length}</div>
                </div>
              </div>
            </div>

            {/* Catégories de problèmes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Alert className={analysis.summary.deploymentIssues ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}>
                <div className="flex items-center space-x-2">
                  {analysis.summary.deploymentIssues ? (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <span className="font-medium">Déploiement</span>
                </div>
                <p className="text-xs mt-1">
                  {analysis.summary.deploymentIssues ? 'Problèmes détectés' : 'Semble OK'}
                </p>
              </Alert>

              <Alert className={analysis.summary.configurationIssues ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}>
                <div className="flex items-center space-x-2">
                  {analysis.summary.configurationIssues ? (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <span className="font-medium">Configuration</span>
                </div>
                <p className="text-xs mt-1">
                  {analysis.summary.configurationIssues ? 'Problèmes détectés' : 'Semble OK'}
                </p>
              </Alert>

              <Alert className={analysis.summary.networkIssues ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}>
                <div className="flex items-center space-x-2">
                  {analysis.summary.networkIssues ? (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <span className="font-medium">Réseau</span>
                </div>
                <p className="text-xs mt-1">
                  {analysis.summary.networkIssues ? 'Problèmes détectés' : 'Semble OK'}
                </p>
              </Alert>
            </div>

            {/* Erreurs détectées */}
            {analysis.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                  Erreurs Détectées
                </h4>
                <div className="space-y-3">
                  {analysis.errors.map((error, index) => (
                    <Alert key={index} className="bg-red-50 border-red-200">
                      <AlertDescription>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-red-900">{error.message}</span>
                            <Badge variant="destructive">{error.count}x</Badge>
                          </div>
                          <div className="bg-red-100 rounded p-2">
                            <div className="flex items-center space-x-1 mb-1">
                              <Lightbulb className="h-3 w-3 text-red-700" />
                              <span className="text-xs font-medium text-red-800">Solution suggérée:</span>
                            </div>
                            <p className="text-xs text-red-700">{error.suggestion}</p>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            {/* Actions recommandées */}
            {analysis.suggestions.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Zap className="h-4 w-4 mr-2 text-blue-600" />
                  Actions Recommandées
                </h4>
                <div className="space-y-2">
                  {analysis.suggestions.slice(0, 5).map((suggestion, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                        {index + 1}
                      </div>
                      <span className="text-sm text-blue-800">{suggestion}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pas d'erreur détectée */}
            {analysis.errors.length === 0 && analysis.summary.errorLines === 0 && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium text-green-900">Aucune erreur critique détectée</div>
                    <p className="text-sm text-green-800">
                      Les logs semblent normaux. Si vous rencontrez toujours des problèmes, 
                      vérifiez la connectivité réseau et la configuration du projet.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}