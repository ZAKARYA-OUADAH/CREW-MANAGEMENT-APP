import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { 
  FileText,
  Terminal,
  Copy,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Play,
  Settings,
  Key,
  Cloud,
  Zap,
  Download,
  Code,
  Workflow
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface SupabaseDeploymentGuideProps {
  onComplete?: () => void;
  highlightStep?: string;
}

export default function SupabaseDeploymentGuide({ onComplete, highlightStep }: SupabaseDeploymentGuideProps) {
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('prerequisites');

  const markStepComplete = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
      toast.success(`Étape "${stepId}" marquée comme terminée`);
    }
  };

  const copyToClipboard = (text: string, description?: string) => {
    navigator.clipboard.writeText(text);
    toast.success(description ? `${description} copié` : 'Copié dans le presse-papiers');
  };

  const prerequisitesCommands = `# 1. Installer Supabase CLI globalement
npm install -g supabase

# 2. Vérifier l'installation
supabase --version

# 3. Se connecter à Supabase
supabase login

# 4. Lier votre projet local à Supabase
supabase link --project-ref ${projectId}`;

  const deploymentCommands = `# 1. Déployer la fonction Edge
supabase functions deploy make-server-9fd39b98

# 2. Vérifier le déploiement
supabase functions list

# 3. Voir les logs en temps réel
supabase functions logs make-server-9fd39b98 --follow`;

  const secretsCommands = `# Configuration des variables d'environnement (secrets)
supabase secrets set SUPABASE_URL=https://${projectId}.supabase.co
supabase secrets set SUPABASE_ANON_KEY=${publicAnonKey}
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Lister les secrets configurés
supabase secrets list

# Vérifier la configuration
curl -X GET "https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/secrets/status"`;

  const testingCommands = `# Test de base de la fonction
curl -X GET "https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/health"

# Test avec autorisation
curl -X GET "https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/debug/simple-test" \\
  -H "Authorization: Bearer ${publicAnonKey}"

# Test de l'endpoint de données
curl -X GET "https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/data/missions" \\
  -H "Authorization: Bearer ${publicAnonKey}" \\
  -H "Content-Type: application/json"`;

  const troubleshootingCommands = `# Voir les logs détaillés
supabase functions logs make-server-9fd39b98 --limit 50

# Redéployer en cas de problème
supabase functions deploy make-server-9fd39b98 --no-verify-jwt

# Vérifier les secrets
supabase secrets list

# Tester la connectivité réseau
ping ${projectId}.supabase.co

# Vérifier le statut du projet
supabase status`;

  const steps = [
    {
      id: 'prerequisites',
      title: 'Prérequis',
      icon: <Settings className="h-4 w-4" />,
      description: 'Installation et configuration initiale'
    },
    {
      id: 'deployment',
      title: 'Déploiement',
      icon: <Cloud className="h-4 w-4" />,
      description: 'Déployer la fonction Edge'
    },
    {
      id: 'secrets',
      title: 'Configuration',
      icon: <Key className="h-4 w-4" />,
      description: 'Variables d\'environnement'
    },
    {
      id: 'testing',
      title: 'Tests',
      icon: <Play className="h-4 w-4" />,
      description: 'Vérifier le fonctionnement'
    },
    {
      id: 'troubleshooting',
      title: 'Dépannage',
      icon: <AlertCircle className="h-4 w-4" />,
      description: 'Résoudre les problèmes'
    }
  ];

  const CommandBlock = ({ title, commands, stepId }: { title: string; commands: string; stepId: string }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">{title}</h4>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyToClipboard(commands, title)}
          >
            <Copy className="h-3 w-3 mr-1" />
            Copier
          </Button>
          <Button
            size="sm"
            variant={completedSteps.includes(stepId) ? "default" : "outline"}
            onClick={() => markStepComplete(stepId)}
          >
            {completedSteps.includes(stepId) ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Terminé
              </>
            ) : (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Marquer terminé
              </>
            )}
          </Button>
        </div>
      </div>
      <Textarea
        value={commands}
        readOnly
        className="text-xs font-mono bg-gray-900 text-green-400 border-gray-700 min-h-[120px]"
      />
    </div>
  );

  return (
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Workflow className="h-6 w-6 text-blue-600" />
          <span>Guide de Déploiement Supabase Edge Functions</span>
          <Badge variant="outline">
            {completedSteps.length}/{steps.length} étapes
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Guide complet pour déployer et configurer les Edge Functions CrewTech sur Supabase
        </p>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            {steps.map((step) => (
              <TabsTrigger 
                key={step.id} 
                value={step.id}
                className={`space-x-1 ${highlightStep === step.id ? 'ring-2 ring-orange-500' : ''}`}
              >
                {completedSteps.includes(step.id) ? (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                ) : (
                  step.icon
                )}
                <span className="hidden sm:inline">{step.title}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Prérequis */}
          <TabsContent value="prerequisites" className="space-y-6">
            <Alert className="bg-blue-50 border-blue-200">
              <Settings className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium text-blue-900">Prérequis pour le déploiement</div>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Node.js 18+ installé sur votre machine</li>
                    <li>• Accès en écriture au projet Supabase ({projectId})</li>
                    <li>• Terminal/Command Prompt disponible</li>
                    <li>• Connexion internet stable</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            <CommandBlock
              title="Installation et Configuration Initiale"
              commands={prerequisitesCommands}
              stepId="install-cli"
            />

            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Important :</strong> Si la commande <code>supabase link</code> échoue, 
                vérifiez que vous êtes bien authentifié et que l'ID du projet est correct.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Déploiement */}
          <TabsContent value="deployment" className="space-y-6">
            <Alert className="bg-green-50 border-green-200">
              <Cloud className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium text-green-900">Déploiement de la fonction Edge</div>
                  <p className="text-sm text-green-800">
                    Cette étape déploie le code de la fonction make-server-9fd39b98 sur l'infrastructure Supabase.
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <CommandBlock
              title="Déploiement de la Fonction"
              commands={deploymentCommands}
              stepId="deploy-function"
            />

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Vérifications post-déploiement</h4>
              <div className="text-sm text-gray-700 space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>La fonction apparaît dans <code>supabase functions list</code></span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Aucune erreur dans les logs</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>L'URL de la fonction est accessible</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Configuration des secrets */}
          <TabsContent value="secrets" className="space-y-6">
            <Alert className="bg-purple-50 border-purple-200">
              <Key className="h-4 w-4 text-purple-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium text-purple-900">Configuration des variables d'environnement</div>
                  <p className="text-sm text-purple-800">
                    Les secrets permettent à la fonction d'accéder à la base de données Supabase de manière sécurisée.
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <CommandBlock
              title="Configuration des Secrets"
              commands={secretsCommands}
              stepId="configure-secrets"
            />

            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>⚠️ IMPORTANT :</strong> Vous devez remplacer <code>your_service_role_key_here</code> 
                par votre vraie clé de service. Vous la trouverez dans votre dashboard Supabase sous 
                Settings {'>'} API {'>'} Project API keys.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}/settings/api`, '_blank')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Ouvrir Dashboard Supabase
              </Button>
            </div>
          </TabsContent>

          {/* Tests */}
          <TabsContent value="testing" className="space-y-6">
            <Alert className="bg-green-50 border-green-200">
              <Play className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium text-green-900">Tests de validation</div>
                  <p className="text-sm text-green-800">
                    Ces commandes vérifient que la fonction fonctionne correctement et peut accéder aux données.
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <CommandBlock
              title="Tests de Fonctionnement"
              commands={testingCommands}
              stepId="run-tests"
            />

            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Réponses attendues</h4>
              <div className="text-sm text-green-800 space-y-2">
                <div>
                  <strong>/health :</strong> 
                  <code className="ml-2 bg-white px-1 rounded">{'{"status": "healthy"}'}</code>
                </div>
                <div>
                  <strong>/debug/simple-test :</strong> 
                  <code className="ml-2 bg-white px-1 rounded">{'{"success": true}'}</code>
                </div>
                <div>
                  <strong>/data/missions :</strong> 
                  <code className="ml-2 bg-white px-1 rounded">[...] (liste des missions)</code>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Dépannage */}
          <TabsContent value="troubleshooting" className="space-y-6">
            <Alert className="bg-orange-50 border-orange-200">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium text-orange-900">Résolution des problèmes courants</div>
                  <p className="text-sm text-orange-800">
                    Utilisez ces commandes pour diagnostiquer et résoudre les problèmes de déploiement.
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <CommandBlock
              title="Commandes de Dépannage"
              commands={troubleshootingCommands}
              stepId="troubleshoot"
            />

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Problèmes courants et solutions</h4>
              
              <div className="space-y-3">
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertDescription>
                    <div className="space-y-1">
                      <strong className="text-yellow-900">Erreur "Function not found" (404)</strong>
                      <p className="text-sm text-yellow-800">
                        → La fonction n'est pas déployée. Relancez <code>supabase functions deploy make-server-9fd39b98</code>
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>

                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription>
                    <div className="space-y-1">
                      <strong className="text-red-900">Erreur "Unauthorized" (401)</strong>
                      <p className="text-sm text-red-800">
                        → Vérifiez que les secrets sont bien configurés avec <code>supabase secrets list</code>
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>

                <Alert className="bg-purple-50 border-purple-200">
                  <AlertDescription>
                    <div className="space-y-1">
                      <strong className="text-purple-900">Erreur "Internal Server Error" (500)</strong>
                      <p className="text-sm text-purple-800">
                        → Consultez les logs avec <code>supabase functions logs make-server-9fd39b98</code>
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Progress: {completedSteps.length} of {steps.length} steps completed
          </div>
          
          <div className="flex space-x-2">
            {completedSteps.length === steps.length && onComplete && (
              <Button onClick={onComplete}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Déploiement Terminé
              </Button>
            )}
            
            <Button 
              variant="outline"
              onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}`, '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Dashboard
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}