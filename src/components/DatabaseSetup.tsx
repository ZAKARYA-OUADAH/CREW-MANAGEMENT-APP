import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  CheckCircle2, 
  Database, 
  Users, 
  Plane, 
  Bell,
  ArrowRight,
  Info
} from 'lucide-react';

export default function DatabaseSetup() {
  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Info className="h-5 w-5" />
            <span>Configuration Initiale de la Base de Données</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <p>
            Pour commencer à utiliser la plateforme CrewTech, vous devez d'abord peupler la base de données 
            avec des données de test. Suivez les étapes ci-dessous pour configurer votre environnement.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <span>Accès aux Paramètres</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Naviguez vers la section <strong>Settings</strong> depuis le menu principal.
              </p>
              <div className="flex items-center space-x-2 text-xs">
                <Badge variant="outline">Menu</Badge>
                <ArrowRight className="h-3 w-3" />
                <Badge variant="outline">Settings</Badge>
                <ArrowRight className="h-3 w-3" />
                <Badge variant="outline">Development</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <span>Test de Connexion</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Cliquez sur <strong>"Test Connection"</strong> pour vérifier la connectivité avec Supabase.
              </p>
              <div className="flex items-center space-x-1 text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                <span>Vérifie l'API et la base de données</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <span>Peuplement</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Cliquez sur <strong>"Seed Database"</strong> pour créer les données de test.
              </p>
              <div className="flex items-center space-x-1 text-xs text-purple-600">
                <Database className="h-3 w-3" />
                <span>Crée utilisateurs, missions et notifications</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Données Créées par le Seeding</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium">Utilisateurs (5)</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-blue-100 text-blue-800 text-xs">Admin</Badge>
                  <span>Sophie Laurent</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-800 text-xs">Interne</Badge>
                  <span>Pierre Dubois</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-purple-100 text-purple-800 text-xs">Freelance</Badge>
                  <span>3 équipiers externes</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Plane className="h-5 w-5 text-green-600" />
                <h4 className="font-medium">Missions (3)</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-green-100 text-green-800 text-xs">MO-20241212001</Badge>
                  <span>Approuvée</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">MO-20241212002</Badge>
                  <span>En attente</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-red-100 text-red-800 text-xs">MO-20241212003</Badge>
                  <span>Rejetée</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-purple-600" />
                <h4 className="font-medium">Notifications</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div>✓ Mission approuvée</div>
                <div>⏰ Nouvelle assignation</div>
                <div>❌ Mission rejetée</div>
                <div>📋 Mise à jour profil</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          <strong>Comptes de Test Disponibles :</strong>
          <br />
          Une fois le seeding terminé, vous recevrez les identifiants de connexion pour tester tous les rôles utilisateur :
          Admin, Personnel Interne, et Freelancers.
        </AlertDescription>
      </Alert>
    </div>
  );
}