import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { createClient } from '../utils/supabase/client';
import { 
  AlertTriangle, 
  Shield, 
  Database, 
  X,
  ExternalLink,
  RefreshCw,
  CheckCircle
} from 'lucide-react';

export default function RLSErrorBanner() {
  const [supabase] = useState(() => createClient());
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const [testing, setTesting] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('rls_error_dismissed') === 'true';
  });

  // Test for RLS error on mount
  useEffect(() => {
    const testRLS = async () => {
      if (dismissed || isFixed) return;

      try {
        setTesting(true);
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .limit(1);
        
        if (error && error.message.includes('infinite recursion')) {
          setShowBanner(true);
        } else if (!error) {
          setIsFixed(true);
        }
      } catch (err) {
        if (err.message && err.message.includes('infinite recursion')) {
          setShowBanner(true);
        }
      } finally {
        setTesting(false);
      }
    };

    testRLS();
  }, [supabase, dismissed, isFixed]);

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('rls_error_dismissed', 'true');
  };

  const handleRetest = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (!error) {
        setIsFixed(true);
        setShowBanner(false);
        localStorage.removeItem('rls_error_dismissed');
      }
    } catch (err) {
      // Still has error
    } finally {
      setTesting(false);
    }
  };

  if (!showBanner || dismissed || isFixed) {
    return null;
  }

  return (
    <>
      <Alert className="border-orange-200 bg-orange-50 mb-4">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <strong>Problème RLS détecté</strong> - Les données d'équipage utilisent un mode de test sécurisé.
              <Button 
                variant="link" 
                size="sm" 
                className="text-orange-600 p-0 ml-2 h-auto"
                onClick={() => setShowDetails(true)}
              >
                Voir détails
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRetest}
                disabled={testing}
              >
                {testing ? (
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <CheckCircle className="h-3 w-3 mr-1" />
                )}
                Re-tester
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-orange-600" />
              <span>Problème RLS Supabase Détecté</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Récursion infinie détectée</strong> dans les politiques RLS de la table `users`.
                L'application utilise automatiquement des données de test pour éviter les erreurs.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="font-medium flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>Cause du problème</span>
              </h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• Les politiques RLS (Row Level Security) de Supabase ont des références circulaires</p>
                <p>• Une politique fait référence à une autre qui fait référence à la première</p>
                <p>• Cela crée une boucle infinie lors des requêtes</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Solutions recommandées</span>
              </h3>
              
              <div className="space-y-3">
                <Card>
                  <CardHeader className="pb-2">
                    <h4 className="text-sm font-medium text-green-800">Solution immédiate</h4>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <p className="text-gray-600 mb-2">Désactiver temporairement RLS sur la table users :</p>
                    <code className="block bg-gray-100 p-2 rounded text-xs">
                      ALTER TABLE users DISABLE ROW LEVEL SECURITY;
                    </code>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <h4 className="text-sm font-medium text-blue-800">Solution permanente</h4>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="space-y-2 text-gray-600">
                      <p>1. Identifier les politiques problématiques dans Supabase Dashboard</p>
                      <p>2. Supprimer ou simplifier les politiques qui se référencent mutuellement</p>
                      <p>3. Créer des politiques plus simples sans dépendances circulaires</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <h4 className="text-sm font-medium text-purple-800">Accès Supabase</h4>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-600">Ouvrir Supabase Dashboard :</span>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 h-auto"
                        onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Dashboard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">État actuel</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    <Database className="h-3 w-3 mr-1" />
                    Mode données de test
                  </Badge>
                  <span className="text-sm text-gray-600">
                    L'application fonctionne normalement avec des données d'exemple
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    <Shield className="h-3 w-3 mr-1" />
                    Sélection d'équipage
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Fonctionnelle avec données de démonstration
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button 
                variant="outline"
                onClick={handleRetest}
                disabled={testing}
              >
                {testing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Test en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Re-tester la connexion
                  </>
                )}
              </Button>
              
              <div className="space-x-2">
                <Button variant="ghost" onClick={handleDismiss}>
                  Ignorer
                </Button>
                <Button onClick={() => setShowDetails(false)}>
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}