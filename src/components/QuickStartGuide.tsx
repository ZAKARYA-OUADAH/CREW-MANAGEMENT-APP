import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { 
  Rocket,
  User,
  Users,
  Plane,
  Calendar,
  FileText,
  Settings,
  ArrowRight,
  CheckCircle,
  Play,
  Target
} from 'lucide-react';

interface QuickStartGuideProps {
  onClose?: () => void;
}

export default function QuickStartGuide({ onClose }: QuickStartGuideProps) {
  const userRoles = [
    {
      role: 'Administrator',
      email: 'admin@crewtech.fr',
      password: 'admin123!',
      name: 'Sophie Laurent',
      color: 'blue',
      features: [
        'Créer et gérer les demandes de mission',
        'Approuver/rejeter les ordres de mission',
        'Gérer les équipages et leurs profils',
        'Configurer les matrices de paie',
        'Accéder aux outils de développement'
      ]
    },
    {
      role: 'Personnel Interne',
      email: 'internal@crewtech.fr',
      password: 'internal123!',
      name: 'Pierre Dubois',
      color: 'green',
      features: [
        'Voir ses missions assignées',
        'Mettre à jour son profil',
        'Gérer ses documents',
        'Recevoir des notifications'
      ]
    },
    {
      role: 'Freelancer',
      email: 'freelancer@aviation.com',
      password: 'freelancer123!',
      name: 'Lisa Anderson',
      color: 'purple',
      features: [
        'Consulter les missions assignées',
        'Télécharger les ordres de mission',
        'Mettre à jour le profil et documents',
        'Gérer la disponibilité'
      ]
    }
  ];

  const nextSteps = [
    {
      icon: User,
      title: 'Connectez-vous avec différents rôles',
      description: 'Testez l\'expérience utilisateur en vous connectant avec les comptes admin, interne et freelancer.',
      action: 'Se connecter'
    },
    {
      icon: Plane,
      title: 'Explorez les missions',
      description: 'Consultez les missions d\'exemple dans différents états et testez le processus d\'approbation.',
      action: 'Voir les missions'
    },
    {
      icon: Calendar,
      title: 'Créez une nouvelle mission',
      description: 'Utilisez le compte admin pour créer une nouvelle demande de mission et l\'assigner à un équipage.',
      action: 'Créer une mission'
    },
    {
      icon: FileText,
      title: 'Générez des documents',
      description: 'Testez la génération d\'ordres de mission PDF depuis l\'interface freelancer.',
      action: 'Générer PDF'
    },
    {
      icon: Settings,
      title: 'Configurez les paramètres',
      description: 'Explorez les matrices de paie et les paramètres de notification.',
      action: 'Paramètres'
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-800">
            <Rocket className="h-5 w-5" />
            <span>Félicitations ! Votre plateforme CrewTech est prête</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-green-700">
          <p>
            La base de données a été peuplée avec succès avec des données de test réalistes. 
            Vous pouvez maintenant explorer toutes les fonctionnalités de la plateforme.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Comptes de Test Disponibles</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Utilisez ces identifiants pour tester différents rôles utilisateur
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {userRoles.map((user, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Badge className={`bg-${user.color}-100 text-${user.color}-800`}>
                      {user.role}
                    </Badge>
                    <span className="font-medium">{user.name}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${user.email} / ${user.password}`);
                    }}
                  >
                    Copier
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-mono">{user.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Mot de passe:</span>
                    <p className="font-mono">{user.password}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Fonctionnalités disponibles:
                  </p>
                  <ul className="text-xs space-y-1">
                    {user.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center space-x-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Prochaines Étapes Recommandées</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Suivez ces étapes pour explorer les fonctionnalités principales
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {nextSteps.map((step, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0">
                  <step.icon className="h-5 w-5 text-blue-600 mt-0.5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{step.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                </div>
                <div className="flex-shrink-0">
                  <Badge variant="outline" className="text-xs">
                    {index + 1}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Play className="h-4 w-4" />
        <AlertDescription>
          <strong>Conseil :</strong> Commencez par vous connecter avec le compte administrateur 
          pour avoir une vue d'ensemble, puis testez les interfaces utilisateur avec les comptes 
          interne et freelancer pour comprendre le workflow complet.
        </AlertDescription>
      </Alert>

      {onClose && (
        <div className="flex justify-end">
          <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
            Commencer l'exploration
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}