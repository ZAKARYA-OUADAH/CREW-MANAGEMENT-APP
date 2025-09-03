import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Info, 
  Database, 
  Filter, 
  Users, 
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export default function DiagnosticUsageGuide() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Info className="h-5 w-5" />
          <span>Guide d'utilisation - Diagnostic SimpleCrewPicker</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Objectif :</strong> Analyser les données utilisateur pour résoudre les problèmes de sélection d'équipage dans SimpleCrewPicker.
          </AlertDescription>
        </Alert>

        {/* Fonctionnalités */}
        <div className="space-y-4">
          <h3 className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Fonctionnalités du diagnostic</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-dashed">
              <CardContent className="p-4 text-center">
                <Database className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <h4 className="font-medium mb-2">Analyse des données</h4>
                <p className="text-sm text-muted-foreground">
                  Statistiques complètes sur les utilisateurs, positions, rôles, statuts
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-dashed">
              <CardContent className="p-4 text-center">
                <Filter className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <h4 className="font-medium mb-2">Tests de requêtes</h4>
                <p className="text-sm text-muted-foreground">
                  Simulation des filtres utilisés par SimpleCrewPicker
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-dashed">
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                <h4 className="font-medium mb-2">Échantillons</h4>
                <p className="text-sm text-muted-foreground">
                  Exemples d'utilisateurs pour comprendre la structure des données
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Workflow de diagnostic */}
        <div className="space-y-4">
          <h3>Workflow de diagnostic</h3>
          
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            <Badge variant="outline" className="whitespace-nowrap">
              1. Analyser les données
            </Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="whitespace-nowrap">
              2. Tester les requêtes
            </Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="whitespace-nowrap">
              3. Examiner les échantillons
            </Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline" className="whitespace-nowrap">
              4. Identifier les problèmes
            </Badge>
          </div>
        </div>

        {/* Problèmes courants */}
        <div className="space-y-4">
          <h3>Problèmes courants et solutions</h3>
          
          <div className="space-y-3">
            <div className="p-3 border-l-4 border-red-500 bg-red-50">
              <h4 className="font-medium text-red-800">❌ Aucun utilisateur trouvé</h4>
              <p className="text-sm text-red-700">
                <strong>Cause :</strong> Positions non définies ou validation_status incorrect<br/>
                <strong>Solution :</strong> Vérifier les données utilisateur dans l'onglet "Échantillons"
              </p>
            </div>
            
            <div className="p-3 border-l-4 border-yellow-500 bg-yellow-50">
              <h4 className="font-medium text-yellow-800">⚠️ Peu d'utilisateurs actifs</h4>
              <p className="text-sm text-yellow-700">
                <strong>Cause :</strong> Statut 'inactive' ou validation 'pending'<br/>
                <strong>Solution :</strong> Mettre à jour les statuts dans EnhancedManageCrew
              </p>
            </div>
            
            <div className="p-3 border-l-4 border-green-500 bg-green-50">
              <h4 className="font-medium text-green-800">✅ Données correctes</h4>
              <p className="text-sm text-green-700">
                <strong>Résultat :</strong> Les tests montrent des utilisateurs pour chaque filtre<br/>
                <strong>Action :</strong> SimpleCrewPicker devrait fonctionner normalement
              </p>
            </div>
          </div>
        </div>

        {/* Actions recommandées */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Actions recommandées :</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Lancer d'abord "Analyser les données" pour avoir une vue d'ensemble</li>
            <li>• Utiliser "Tester les requêtes" pour simuler les filtres SimpleCrewPicker</li>
            <li>• Si des tests échouent, examiner les échantillons pour comprendre pourquoi</li>
            <li>• Corriger les données utilisateur via EnhancedManageCrew si nécessaire</li>
            <li>• Re-tester pour confirmer que les corrections fonctionnent</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}