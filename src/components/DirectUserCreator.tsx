import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  UserPlus, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Users,
  Key,
  Database,
  RefreshCw,
  Settings,
  Wrench,
  Globe,
  Shield,
  Code
} from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import EnhancedServerDiagnostic from './EnhancedServerDiagnostic';
import SupabaseDiagnostic from './SupabaseDiagnostic';
import ManualUserCreator from './ManualUserCreator';

interface DirectUserCreatorProps {
  onComplete: (success: boolean, credentials?: any) => void;
}

const TEST_USERS = [
  {
    email: 'admin@crewtech.fr',
    password: 'admin123!',
    name: 'Sophie Laurent',
    role: 'admin',
    type: 'admin',
    displayRole: 'Operations Manager'
  },
  {
    email: 'internal@crewtech.fr',
    password: 'internal123!',
    name: 'Pierre Dubois',
    role: 'internal',
    type: 'internal',
    displayRole: 'Internal Captain'
  },
  {
    email: 'freelancer@aviation.com',
    password: 'freelancer123!',
    name: 'Lisa Anderson',
    role: 'freelancer',
    type: 'freelancer',
    displayRole: 'Flight Attendant'
  },
  {
    email: 'captain@freelance.eu',
    password: 'captain123!',
    name: 'Marco Rossi',
    role: 'freelancer',
    type: 'freelancer',
    displayRole: 'Freelance Captain'
  },
  {
    email: 'sarah@crewaviation.com',
    password: 'sarah123!',
    name: 'Sarah Mitchell',
    role: 'freelancer',
    type: 'freelancer',
    displayRole: 'First Officer'
  }
];

export default function DirectUserCreator({ onComplete }: DirectUserCreatorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentUser, setCurrentUser] = useState('');
  const [createdUsers, setCreatedUsers] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [showServerDiagnostic, setShowServerDiagnostic] = useState(false);
  const [showSupabaseDiagnostic, setShowSupabaseDiagnostic] = useState(false);
  const [showManualCreator, setShowManualCreator] = useState(false);
  const [complete, setComplete] = useState(false);
  const [serverStatus, setServerStatus] = useState<'unknown' | 'healthy' | 'error'>('unknown');
  const [databaseStatus, setDatabaseStatus] = useState<'unknown' | 'healthy' | 'error'>('unknown');

  const addLog = (message: string) => {
    const logMessage = `${new Date().toISOString()}: ${message}`;
    console.log(`[DirectUserCreator] ${message}`);
    setLogs(prev => [...prev, logMessage]);
  };

  const quickHealthCheck = async (): Promise<boolean> => {
    try {
      addLog('Vérification rapide de santé...');
      
      // Test ultra-simple endpoint first
      const simpleResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/ultra-simple`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(10000)
        }
      );
      
      if (!simpleResponse.ok) {
        addLog(`❌ Vérification rapide échouée: Serveur ne répond pas (${simpleResponse.status})`);
        setServerStatus('error');
        return false;
      }
      
      // Test health endpoint
      const healthResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/health`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(10000)
        }
      );
      
      if (!healthResponse.ok) {
        addLog(`❌ Endpoint santé échoué: ${healthResponse.status}`);
        setServerStatus('error');
        return false;
      }
      
      const result = await healthResponse.json();
      addLog(`✅ Serveur en santé. Environnement: ${JSON.stringify(result.env_check)}`);
      
      // Check if all required environment variables are set
      const envCheck = result.env_check;
      if (envCheck.SUPABASE_URL !== 'SET' || envCheck.SUPABASE_SERVICE_ROLE_KEY !== 'SET') {
        addLog(`❌ Variables d'environnement manquantes: ${JSON.stringify(envCheck)}`);
        setServerStatus('error');
        return false;
      }
      
      setServerStatus('healthy');
      return true;
    } catch (error) {
      addLog(`❌ Erreur vérification rapide: ${error}`);
      setServerStatus('error');
      return false;
    }
  };

  const testUserExists = async (email: string, password: string): Promise<boolean> => {
    try {
      addLog(`Test si l'utilisateur ${email} existe...`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (!error && data.session) {
        // User exists and can authenticate - sign out immediately
        await supabase.auth.signOut();
        addLog(`✅ Utilisateur ${email} existe et peut s'authentifier`);
        return true;
      }
      
      addLog(`❌ Utilisateur ${email} n'existe pas ou ne peut pas s'authentifier`);
      return false;
    } catch (error) {
      addLog(`❌ Erreur test utilisateur ${email}: ${error}`);
      return false;
    }
  };

  const createUserViaBackend = async (): Promise<boolean> => {
    try {
      addLog(`Tentative de création d'utilisateurs via backend auto-seed...`);
      
      // Try the auto-seed-direct endpoint
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/auto-seed-direct`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(30000)
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        addLog(`❌ Réponse backend pas OK: ${response.status} - ${errorText}`);
        return false;
      }
      
      const result = await response.json();
      addLog(`Réponse backend: ${JSON.stringify(result, null, 2)}`);
      
      if (result.success) {
        addLog(`✅ Seeding backend réussi - Créé ${result.data?.users_created || 0} utilisateurs`);
        return true;
      } else {
        addLog(`❌ Seeding backend échoué: ${result.error || 'Erreur inconnue'}`);
        if (result.details) {
          addLog(`Détails: ${result.details}`);
        }
        return false;
      }
    } catch (error) {
      addLog(`❌ Erreur seeding backend: ${error}`);
      return false;
    }
  };

  const createUsersDirectly = async () => {
    setIsCreating(true);
    setProgress(0);
    setCreatedUsers([]);
    setErrors([]);
    setLogs([]);
    addLog('Démarrage du processus de création d\'utilisateurs amélioré...');

    try {
      // Step 1: Quick health check
      addLog('Étape 1: Vérification rapide de santé...');
      setProgress(10);
      const serverHealthy = await quickHealthCheck();
      
      if (!serverHealthy) {
        setErrors([
          'Vérification de santé du serveur échouée.',
          'Le serveur CrewTech ne répond pas correctement.',
          'Cela peut indiquer des problèmes de déploiement ou variables d\'environnement manquantes.',
          'Utilisez les outils de diagnostic ci-dessous pour un dépannage détaillé.'
        ]);
        setProgress(20);
        return;
      }
      
      setProgress(25);
      
      // Step 2: Check for existing users
      addLog('Étape 2: Vérification des utilisateurs existants...');
      const existingUsers = [];
      
      for (const user of TEST_USERS) {
        const exists = await testUserExists(user.email, user.password);
        if (exists) {
          existingUsers.push(user.email);
          setCreatedUsers(prev => [...prev, user.email]);
        }
      }

      setProgress(50);

      if (existingUsers.length === TEST_USERS.length) {
        addLog('✅ Tous les utilisateurs existent déjà et peuvent s\'authentifier');
        setProgress(100);
        setComplete(true);
        onComplete(true, {
          admin: TEST_USERS.find(u => u.role === 'admin'),
          internal: TEST_USERS.find(u => u.role === 'internal'),
          freelancers: TEST_USERS.filter(u => u.role === 'freelancer')
        });
        return;
      }

      addLog(`Trouvé ${existingUsers.length} utilisateurs existants, besoin de créer ${TEST_USERS.length - existingUsers.length} de plus`);

      // Step 3: Create missing users via backend
      addLog('Étape 3: Création des utilisateurs manquants via backend...');
      setProgress(60);
      
      const backendSuccess = await createUserViaBackend();
      
      if (backendSuccess) {
        setProgress(75);
        addLog('Seeding backend rapporte un succès, vérification des utilisateurs...');
        
        // Wait for backend to complete
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        setProgress(85);
        addLog('Vérification que tous les utilisateurs sont créés...');
        
        // Test if users were created
        let allCreated = true;
        const finalUserList = [...existingUsers];
        
        for (const user of TEST_USERS) {
          if (!existingUsers.includes(user.email)) {
            const exists = await testUserExists(user.email, user.password);
            if (exists) {
              finalUserList.push(user.email);
              setCreatedUsers(prev => [...prev, user.email]);
              addLog(`✅ Utilisateur vérifié: ${user.email}`);
            } else {
              addLog(`❌ Utilisateur non trouvé: ${user.email}`);
              allCreated = false;
            }
          }
        }
        
        if (allCreated) {
          addLog(`✅ Tous les ${TEST_USERS.length} utilisateurs créés et vérifiés avec succès`);
          setProgress(100);
          setComplete(true);
          onComplete(true, {
            admin: TEST_USERS.find(u => u.role === 'admin'),
            internal: TEST_USERS.find(u => u.role === 'internal'),
            freelancers: TEST_USERS.filter(u => u.role === 'freelancer')
          });
          return;
        } else {
          setProgress(90);
          addLog(`⚠️ Succès partiel: ${finalUserList.length}/${TEST_USERS.length} utilisateurs vérifiés`);
        }
      }

      // If we reach here, there were issues
      const missingUsers = TEST_USERS.filter(user => !createdUsers.includes(user.email));
      
      if (createdUsers.length === 0) {
        setErrors([
          'Échec complet de la création d\'utilisateurs backend.',
          'Cela indique un problème de configuration serveur ou de déploiement.',
          'Utilisez le Diagnostic Supabase pour identifier le problème.',
          'Vous pouvez également essayer l\'option de Création Manuelle d\'Utilisateurs comme solution de contournement.'
        ]);
        setProgress(30);
        setDatabaseStatus('error');
      } else if (missingUsers.length > 0) {
        setErrors([
          'Création partielle d\'utilisateurs terminée.',
          `Créé avec succès ${createdUsers.length}/${TEST_USERS.length} utilisateurs.`,
          `Utilisateurs manquants: ${missingUsers.map(u => u.email).join(', ')}`,
          'Vous pouvez procéder à la connexion avec les comptes créés avec succès.',
          'Utilisez la Création Manuelle d\'Utilisateurs pour créer les utilisateurs restants si nécessaire.'
        ]);
        setProgress(75);
        setDatabaseStatus('error');
      }
      
    } catch (error: any) {
      addLog(`❌ Processus de création d'utilisateurs échoué: ${error.message}`);
      setErrors([
        'Le processus de création d\'utilisateurs a rencontré une erreur.',
        error.message,
        'Utilisez le Diagnostic Supabase pour identifier le problème.'
      ]);
      setDatabaseStatus('error');
    } finally {
      setIsCreating(false);
    }
  };

  const retryCreation = () => {
    createUsersDirectly();
  };

  const skipToLogin = () => {
    addLog('L\'utilisateur a choisi de passer la création d\'utilisateurs et de procéder à la connexion');
    onComplete(true, {
      admin: TEST_USERS.find(u => u.role === 'admin'),
      internal: TEST_USERS.find(u => u.role === 'internal'),
      freelancers: TEST_USERS.filter(u => u.role === 'freelancer')
    });
  };

  const handleServerDiagnosticComplete = (results: any[], hasErrors: boolean) => {
    if (!hasErrors) {
      addLog('✅ Diagnostic serveur amélioré terminé avec succès - aucune erreur critique trouvée');
      setServerStatus('healthy');
    } else {
      addLog(`⚠️ Diagnostic serveur trouvé ${results.filter(r => r.status === 'error').length} erreurs`);
      setServerStatus('error');
    }
  };

  const handleSupabaseDiagnosticComplete = (results: any[], hasErrors: boolean) => {
    if (!hasErrors) {
      addLog('✅ Diagnostic Supabase terminé avec succès - base de données configurée correctement');
      setDatabaseStatus('healthy');
    } else {
      addLog(`⚠️ Diagnostic Supabase trouvé ${results.filter(r => r.status === 'error').length} erreurs de base de données`);
      setDatabaseStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-6xl w-full space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserPlus className="h-6 w-6" />
              <span>Configuration des Comptes Utilisateurs CrewTech</span>
              {complete && <Badge className="bg-green-100 text-green-800">Terminé</Badge>}
              {serverStatus === 'healthy' && <Badge className="bg-blue-100 text-blue-800">Serveur Sain</Badge>}
              {serverStatus === 'error' && <Badge className="bg-red-100 text-red-800">Problèmes Serveur</Badge>}
              {databaseStatus === 'healthy' && <Badge className="bg-emerald-100 text-emerald-800">Base OK</Badge>}
              {databaseStatus === 'error' && <Badge className="bg-orange-100 text-orange-800">Base à Corriger</Badge>}
            </CardTitle>
            <p className="text-sm text-gray-600">
              Configuration des comptes utilisateurs de test pour la plateforme de gestion d'équipages d'aviation CrewTech.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {!isCreating && !complete && errors.length === 0 && (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Comptes de Test à Créer</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    {TEST_USERS.map((user, index) => (
                      <div key={index} className="flex items-center justify-between py-1">
                        <span className="text-gray-700">{user.name} ({user.displayRole})</span>
                        <Badge variant="outline" className="text-xs">
                          {user.email}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button 
                  onClick={createUsersDirectly}
                  className="w-full"
                  size="lg"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Créer les Comptes Utilisateurs
                </Button>
              </div>
            )}

            {isCreating && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Création des comptes utilisateurs...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
                
                {currentUser && (
                  <div className="flex items-center space-x-2 text-sm text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Création: {currentUser}</span>
                  </div>
                )}
                
                {createdUsers.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Utilisateurs Créés ({createdUsers.length})
                      </span>
                    </div>
                    <div className="space-y-1">
                      {createdUsers.map((email, index) => (
                        <div key={index} className="text-xs text-green-700">{email}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {complete && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Comptes utilisateurs prêts!</strong>
                  <div className="mt-2 text-sm">
                    Tous les {createdUsers.length} comptes utilisateurs de test ont été vérifiés et sont prêts pour la connexion.
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {errors.length > 0 && (
              <div className="space-y-4">
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Problèmes de Création d'Utilisateurs:</strong>
                    <div className="mt-2 space-y-1">
                      {errors.map((error, index) => (
                        <div key={index} className="text-sm">{error}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Wrench className="h-4 w-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Options de Dépannage:</span>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-yellow-700">
                      Utilisez les outils ci-dessous pour diagnostiquer et résoudre les problèmes de configuration serveur et base de données, 
                      ou procédez à la création manuelle d'utilisateurs.
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={retryCreation}
                        disabled={isCreating}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Réessayer
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowServerDiagnostic(!showServerDiagnostic)}
                      >
                        <Wrench className="h-3 w-3 mr-1" />
                        {showServerDiagnostic ? 'Masquer' : 'Diagnostic'} Serveur
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSupabaseDiagnostic(!showSupabaseDiagnostic)}
                      >
                        <Database className="h-3 w-3 mr-1" />
                        {showSupabaseDiagnostic ? 'Masquer' : 'Diagnostic'} Supabase
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowManualCreator(!showManualCreator)}
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Création Manuelle
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowLogs(!showLogs)}
                      >
                        <Code className="h-3 w-3 mr-1" />
                        {showLogs ? 'Masquer' : 'Voir'} Logs
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={skipToLogin}
                      >
                        <Key className="h-3 w-3 mr-1" />
                        Passer à la Connexion
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showLogs && logs.length > 0 && (
              <div className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono max-h-60 overflow-y-auto">
                <div className="text-gray-300 mb-2">Logs de Création:</div>
                {logs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))}
              </div>
            )}

            {showServerDiagnostic && (
              <div className="mt-4">
                <EnhancedServerDiagnostic onComplete={handleServerDiagnosticComplete} />
              </div>
            )}

            {showSupabaseDiagnostic && (
              <div className="mt-4">
                <SupabaseDiagnostic onComplete={handleSupabaseDiagnosticComplete} />
              </div>
            )}

            {showManualCreator && (
              <div className="mt-4">
                <ManualUserCreator onUserCreated={(userEmail) => {
                  addLog(`✅ Utilisateur créé manuellement: ${userEmail}`);
                  setCreatedUsers(prev => [...prev, userEmail]);
                  
                  // Check if all users are now created
                  const allEmails = TEST_USERS.map(u => u.email);
                  const newCreatedUsers = [...createdUsers, userEmail];
                  
                  if (allEmails.every(email => newCreatedUsers.includes(email))) {
                    addLog('🎉 Tous les utilisateurs ont été créés!');
                    setComplete(true);
                    onComplete(true, {
                      admin: TEST_USERS.find(u => u.role === 'admin'),
                      internal: TEST_USERS.find(u => u.role === 'internal'),
                      freelancers: TEST_USERS.filter(u => u.role === 'freelancer')
                    });
                  }
                }} />
              </div>
            )}

            {/* Always show test credentials */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                <Key className="h-4 w-4 mr-2" />
                Identifiants des Comptes de Test
              </h4>
              <div className="space-y-1 text-xs text-gray-700">
                <div><strong>Administrateur:</strong> admin@crewtech.fr / admin123!</div>
                <div><strong>Personnel Interne:</strong> internal@crewtech.fr / internal123!</div>
                <div><strong>Freelancer:</strong> freelancer@aviation.com / freelancer123!</div>
                <div><strong>Capitaine:</strong> captain@freelance.eu / captain123!</div>
                <div><strong>Copilote:</strong> sarah@crewaviation.com / sarah123!</div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Ces identifiants fonctionneront une fois les comptes utilisateurs créés avec succès.
              </div>
            </div>

            {(showSupabaseDiagnostic || databaseStatus === 'error') && (
              <Alert className="bg-blue-50 border-blue-200">
                <Code className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Script SQL de Configuration:</strong>
                  <div className="mt-2 text-sm">
                    Si le diagnostic révèle des problèmes de base de données, exécutez le script SQL fourni dans le fichier 
                    <code className="bg-black/10 px-1 rounded mx-1">/database-setup.sql</code> dans votre éditeur SQL Supabase.
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}