import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useSupabaseData } from './SupabaseDataProvider';
import { useAuth } from './AuthProvider';
import { 
  Plus, 
  Calendar, 
  Users, 
  FileText, 
  Settings, 
  Download,
  Upload,
  Search,
  CheckCircle,
  AlertTriangle,
  Zap,
  ArrowRight,
  Clock,
  Database
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    color?: string;
  };
  priority: 'high' | 'medium' | 'low';
  category: 'mission' | 'crew' | 'admin' | 'finance';
}

export default function QuickActionsPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { missions, crewMembers, utils } = useSupabaseData();

  // Calcul des actions contextuelles
  const pendingMissions = utils.getMissionsByStatus('pending');
  const activeMissions = utils.getMissionsByStatus('in_progress');
  const pendingCrew = crewMembers.filter(c => c.status === 'pending');
  const completedMissions = utils.getMissionsByStatus('completed');

  const quickActions: QuickAction[] = [
    // Actions missions
    {
      id: 'new-mission',
      title: 'Créer une Mission',
      description: 'Nouvelle demande de mission',
      icon: <Plus className="h-5 w-5" />,
      action: () => navigate('/mission-request/new'),
      priority: 'high',
      category: 'mission'
    },
    {
      id: 'pending-missions',
      title: 'Missions en Attente',
      description: 'Valider les missions pendantes',
      icon: <Clock className="h-5 w-5" />,
      action: () => navigate('/manage-missions'),
      badge: pendingMissions.length > 0 ? {
        text: pendingMissions.length.toString(),
        variant: 'destructive'
      } : undefined,
      priority: pendingMissions.length > 0 ? 'high' : 'medium',
      category: 'mission'
    },
    {
      id: 'active-missions',
      title: 'Missions Actives',
      description: 'Suivi des missions en cours',
      icon: <Calendar className="h-5 w-5" />,
      action: () => navigate('/manage-missions'),
      badge: activeMissions.length > 0 ? {
        text: activeMissions.length.toString(),
        variant: 'default'
      } : undefined,
      priority: 'medium',
      category: 'mission'
    },

    // Actions équipage
    {
      id: 'crew-validation',
      title: 'Valider Équipage',
      description: 'Documents en attente de validation',
      icon: <Users className="h-5 w-5" />,
      action: () => navigate('/enhanced-crew'),
      badge: pendingCrew.length > 0 ? {
        text: pendingCrew.length.toString(),
        variant: 'outline',
        color: 'text-yellow-600'
      } : undefined,
      priority: pendingCrew.length > 0 ? 'high' : 'low',
      category: 'crew'
    },
    {
      id: 'invite-crew',
      title: 'Inviter un Membre',
      description: 'Nouveau freelancer ou interne',
      icon: <Upload className="h-5 w-5" />,
      action: () => navigate('/invite-user'),
      priority: 'medium',
      category: 'crew'
    },
    {
      id: 'manage-crew',
      title: 'Gérer l\'Équipage',
      description: 'Vue d\'ensemble des équipages',
      icon: <Search className="h-5 w-5" />,
      action: () => navigate('/enhanced-crew'),
      priority: 'low',
      category: 'crew'
    },

    // Actions finance
    {
      id: 'finance-export',
      title: 'Export Finance',
      description: 'Génération des rapports',
      icon: <Download className="h-5 w-5" />,
      action: () => navigate('/finance-export'),
      badge: completedMissions.length > 0 ? {
        text: `${completedMissions.length} prêtes`,
        variant: 'secondary'
      } : undefined,
      priority: 'medium',
      category: 'finance'
    },
    {
      id: 'cost-simulation',
      title: 'Simulation Coûts',
      description: 'Outil d\'estimation',
      icon: <FileText className="h-5 w-5" />,
      action: () => navigate('/cost-simulation'),
      priority: 'low',
      category: 'finance'
    },

    // Actions admin
    {
      id: 'crew-picker-test',
      title: 'Test Crew Picker',
      description: 'Test sélection équipage Supabase',
      icon: <Users className="h-5 w-5" />,
      action: () => navigate('/crew-picker-test'),
      priority: 'medium',
      category: 'admin'
    },
    {
      id: 'rls-diagnostic',
      title: 'Diagnostic RLS',
      description: 'Diagnostic politiques Supabase',
      icon: <Settings className="h-5 w-5" />,
      action: () => navigate('/rls-diagnostic'),
      priority: 'low',
      category: 'admin'
    },
    {
      id: 'document-reminder-test',
      title: 'Test Notifications Docs',
      description: 'Système de rappel automatique',
      icon: <FileText className="h-5 w-5" />,
      action: () => navigate('/document-reminder-test'),
      priority: 'low',
      category: 'admin'
    },
    {
      id: 'data-management',
      title: 'Gestion des Données',
      description: 'Seeding et maintenance DB',
      icon: <Database className="h-5 w-5" />,
      action: () => navigate('/data-management'),
      priority: missions.length === 0 && crewMembers.length === 0 ? 'high' : 'low',
      category: 'admin'
    },
    {
      id: 'settings',
      title: 'Paramètres',
      description: 'Configuration système',
      icon: <Settings className="h-5 w-5" />,
      action: () => navigate('/settings'),
      priority: 'low',
      category: 'admin'
    }
  ];

  // Filtrer les actions selon le rôle
  const userActions = user?.role === 'admin' 
    ? quickActions
    : quickActions.filter(action => 
        ['new-mission', 'active-missions', 'crew-validation'].includes(action.id)
      );

  // Trier par priorité
  const sortedActions = userActions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  // Grouper par catégorie
  const actionsByCategory = sortedActions.reduce((acc, action) => {
    if (!acc[action.category]) {
      acc[action.category] = [];
    }
    acc[action.category].push(action);
    return acc;
  }, {} as Record<string, QuickAction[]>);

  const categoryLabels = {
    mission: 'Missions',
    crew: 'Équipage',
    finance: 'Finance',
    admin: 'Administration'
  };

  const categoryIcons = {
    mission: <Calendar className="h-4 w-4" />,
    crew: <Users className="h-4 w-4" />,
    finance: <FileText className="h-4 w-4" />,
    admin: <Settings className="h-4 w-4" />
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5" />
          <span>Actions Rapides</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(actionsByCategory).map(([category, actions]) => (
          <div key={category} className="space-y-3">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              {categoryIcons[category]}
              <span className="font-medium">{categoryLabels[category]}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {actions.map(action => (
                <div
                  key={action.id}
                  className={`
                    p-4 border rounded-lg cursor-pointer transition-all duration-200
                    hover:shadow-md hover:border-blue-300 hover:bg-blue-50/50
                    ${action.priority === 'high' ? 'border-red-200 bg-red-50/30' : ''}
                    ${action.priority === 'medium' ? 'border-yellow-200 bg-yellow-50/30' : ''}
                  `}
                  onClick={action.action}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`
                        p-2 rounded-lg
                        ${action.priority === 'high' ? 'bg-red-100 text-red-600' : ''}
                        ${action.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' : ''}
                        ${action.priority === 'low' ? 'bg-blue-100 text-blue-600' : ''}
                      `}>
                        {action.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">
                          {action.title}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {action.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {action.badge && (
                        <Badge 
                          variant={action.badge.variant}
                          className={`text-xs ${action.badge.color || ''}`}
                        >
                          {action.badge.text}
                        </Badge>
                      )}
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Actions rapides en bas */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/manage-missions')}
              className="justify-start"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Toutes les Missions
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/enhanced-crew')}
              className="justify-start"
            >
              <Users className="h-4 w-4 mr-2" />
              Tout l'Équipage
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/finance-export')}
              className="justify-start"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Finance
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/settings')}
              className="justify-start"
            >
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}