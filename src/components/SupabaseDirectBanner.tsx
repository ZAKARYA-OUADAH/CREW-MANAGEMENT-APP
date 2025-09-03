import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle, AlertCircle, X, Database, Zap, Shield } from 'lucide-react';

export default function SupabaseDirectBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenShown, setHasBeenShown] = useState(false);

  useEffect(() => {
    // Vérifier si la bannière a déjà été affichée
    const bannerShown = localStorage.getItem('supabase-direct-banner-shown');
    if (!bannerShown) {
      setIsVisible(true);
    } else {
      setHasBeenShown(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('supabase-direct-banner-shown', 'true');
    setHasBeenShown(true);
  };

  const handleShowAgain = () => {
    localStorage.removeItem('supabase-direct-banner-shown');
    setIsVisible(true);
    setHasBeenShown(false);
  };

  if (!isVisible && !hasBeenShown) return null;

  return (
    <>
      {isVisible && (
        <Alert className="border-green-200 bg-green-50 relative">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-green-900">
                    Supabase Direct Integration Active
                  </h4>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                    NEW
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-green-600 hover:text-green-700 hover:bg-green-100 h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <AlertDescription className="text-green-800">
                <div className="space-y-2">
                  <p>
                    <strong>Migration réussie :</strong> L'application utilise maintenant Supabase Direct 
                    au lieu des Edge Functions. Cette nouvelle architecture offre :
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <Zap className="h-4 w-4 text-green-600" />
                      <span>Meilleure performance</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span>Sécurité RLS renforcée</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Database className="h-4 w-4 text-green-600" />
                      <span>Accès direct aux données</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-green-200">
                    <p className="text-sm">
                      <strong>Nouvelles fonctionnalités disponibles :</strong>
                    </p>
                    <ul className="text-sm mt-1 space-y-1">
                      <li>• <strong>Enhanced Crew Management</strong> - Gestion avancée des équipages</li>
                      <li>• <strong>Direct User Invitation</strong> - Création directe d'utilisateurs</li>
                      <li>• <strong>Diagnostic Tools</strong> - Outils de diagnostic et test</li>
                      <li>• <strong>Real-time Updates</strong> - Mises à jour en temps réel</li>
                    </ul>
                  </div>
                </div>
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {/* Bouton pour réafficher la bannière si elle a été fermée */}
      {!isVisible && hasBeenShown && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShowAgain}
            className="bg-white border-green-200 text-green-700 hover:bg-green-50"
          >
            <Database className="h-4 w-4 mr-2" />
            Supabase Direct Info
          </Button>
        </div>
      )}
    </>
  );
}