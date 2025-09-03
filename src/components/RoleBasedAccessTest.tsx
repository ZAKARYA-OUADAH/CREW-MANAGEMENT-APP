import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { useAuth } from './AuthProvider';
import { Shield, Users, CheckCircle, AlertCircle } from 'lucide-react';

export default function RoleBasedAccessTest() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
            Test d'Accès Basé sur le Rôle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Aucun utilisateur connecté</p>
        </CardContent>
      </Card>
    );
  }

  const getAccessInfo = () => {
    if (user.role === 'admin') {
      return {
        icon: <Shield className="w-6 h-6 text-blue-600" />,
        title: 'Accès Administrateur',
        description: 'Accès direct au dashboard sans setup de profil requis',
        status: 'success',
        profileRequired: false,
        accessLevel: 'Complet'
      };
    } else {
      return {
        icon: <Users className="w-6 h-6 text-green-600" />,
        title: 'Accès Crew/Freelancer',
        description: 'Setup de profil requis avant accès au dashboard',
        status: 'warning',
        profileRequired: true,
        accessLevel: 'Après setup profil'
      };
    }
  };

  const accessInfo = getAccessInfo();

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          {accessInfo.icon}
          <span className="ml-2">Test d'Accès Basé sur le Rôle</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Email:</span>
            <span className="text-sm font-medium">{user.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Nom:</span>
            <span className="text-sm font-medium">{user.name || 'Non défini'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Rôle:</span>
            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
              {user.role === 'admin' ? 'Administrateur' : 'Freelancer'}
            </Badge>
          </div>
        </div>

        {/* Access Status */}
        <div className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{accessInfo.title}</span>
            <CheckCircle className={`w-4 h-4 ${
              accessInfo.status === 'success' ? 'text-green-500' : 'text-orange-500'
            }`} />
          </div>
          <p className="text-xs text-gray-600">{accessInfo.description}</p>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Setup profil requis:</span>
            <Badge variant={accessInfo.profileRequired ? 'destructive' : 'outline'} className="text-xs">
              {accessInfo.profileRequired ? 'Oui' : 'Non'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Niveau d'accès:</span>
            <span className="font-medium">{accessInfo.accessLevel}</span>
          </div>
        </div>

        {/* Expected Behavior */}
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="text-sm font-medium mb-2">Comportement Attendu:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            {user.role === 'admin' ? (
              <>
                <li>• Redirection directe vers dashboard admin</li>
                <li>• Aucun wizard de setup de profil</li>
                <li>• Accès à toutes les fonctionnalités</li>
              </>
            ) : (
              <>
                <li>• Wizard de setup de profil affiché</li>
                <li>• 3 étapes à compléter</li>
                <li>• Redirection après completion</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}