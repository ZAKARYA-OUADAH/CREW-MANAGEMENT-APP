import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Info, 
  Filter, 
  Users, 
  CheckCircle,
  Settings,
  ArrowRight
} from 'lucide-react';

export default function CrewPickerFilterGuide() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Info className="h-5 w-5" />
          <span>Guide des Filtres - CrewPicker</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Nouveau :</strong> Les filtres avancés ont été déplacés vers les détails de mission pour simplifier l'interface.
          </AlertDescription>
        </Alert>

        {/* Workflow */}
        <div className="space-y-4">
          <h3 className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Workflow de filtrage</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-dashed">
              <CardContent className="p-4 text-center">
                <Filter className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <h4 className="font-medium mb-2">1. Mission Details</h4>
                <p className="text-sm text-muted-foreground">
                  Définissez les critères de recherche (position, base, rôle, etc.)
                </p>
              </CardContent>
            </Card>
            
            <div className="flex items-center justify-center">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </div>
            
            <Card className="border-dashed">
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <h4 className="font-medium mb-2">2. CrewPicker</h4>
                <p className="text-sm text-muted-foreground">
                  Visualisez et sélectionnez l'équipage filtré
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filtres disponibles */}
        <div className="space-y-4">
          <h3>Filtres disponibles dans Mission Details</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Badge variant="outline" className="justify-center p-2">
              Position requise
            </Badge>
            <Badge variant="outline" className="justify-center p-2">
              Type de rôle
            </Badge>
            <Badge variant="outline" className="justify-center p-2">
              Statut actif/inactif
            </Badge>
            <Badge variant="outline" className="justify-center p-2">
              Validation approuvé
            </Badge>
            <Badge variant="outline" className="justify-center p-2">
              Bases préférées
            </Badge>
            <Badge variant="outline" className="justify-center p-2">
              Devise de paiement
            </Badge>
          </div>
        </div>

        {/* Fonctionnalités conservées */}
        <div className="space-y-4">
          <h3>Fonctionnalités du CrewPicker simplifié</h3>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Recherche en temps réel par nom</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Sélection multiple avec limites</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Pagination et chargement progressif</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Affichage des détails crew (expérience, bases, etc.)</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Indication des filtres appliqués</span>
            </div>
          </div>
        </div>

        {/* Avantages */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">Avantages de cette approche :</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Interface plus épurée et focalisée</li>
            <li>• Pas de duplication des filtres</li>
            <li>• Workflow logique : configuration → sélection</li>
            <li>• Performance améliorée (moins de composants)</li>
            <li>• Filtres centralisés dans Mission Details</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}