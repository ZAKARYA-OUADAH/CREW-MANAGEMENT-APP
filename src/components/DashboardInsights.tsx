import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { useSupabaseData } from './SupabaseDataProvider';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Users, 
  Plane, 
  Euro,
  Calendar,
  Target,
  BarChart3,
  Activity,
  ArrowRight
} from 'lucide-react';

interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  category: 'performance' | 'crew' | 'finance' | 'operations';
  title: string;
  description: string;
  metric?: string;
  action?: {
    label: string;
    url: string;
  };
  priority: 'high' | 'medium' | 'low';
}

export default function DashboardInsights() {
  const { missions, crewMembers, utils } = useSupabaseData();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Calcul des insights intelligents
  const insights = useMemo(() => {
    const insights: Insight[] = [];
    
    // Analyse des missions
    const pendingMissions = utils.getMissionsByStatus('pending');
    const activeMissions = utils.getMissionsByStatus('in_progress');
    const completedMissions = utils.getMissionsByStatus('completed');
    
    // Analyse de l'équipage
    const activeCrew = crewMembers.filter(c => c.status === 'active');
    const pendingCrew = crewMembers.filter(c => c.status === 'pending');
    
    // Calculs financiers
    const totalRevenue = completedMissions.reduce((sum, m) => sum + (m.budget || 0), 0);
    const totalCosts = completedMissions.reduce((sum, m) => sum + (m.estimated_cost || 0), 0);
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0;
    
    // Missions en attente critique
    if (pendingMissions.length > 5) {
      insights.push({
        id: 'pending-missions-high',
        type: 'warning',
        category: 'operations',
        title: 'Forte charge de missions en attente',
        description: `${pendingMissions.length} missions attendent validation. Cela peut impacter les délais.`,
        metric: `${pendingMissions.length} missions`,
        action: { label: 'Voir les missions', url: '/manage-missions' },
        priority: 'high'
      });
    }
    
    // Équipage en attente de validation
    if (pendingCrew.length > 0) {
      insights.push({
        id: 'pending-crew-validation',
        type: 'warning',
        category: 'crew',
        title: 'Équipage en attente de validation',
        description: `${pendingCrew.length} membre(s) d'équipage attendent la validation de leurs documents.`,
        metric: `${pendingCrew.length} membres`,
        action: { label: 'Gérer l\'équipage', url: '/enhanced-crew' },
        priority: 'medium'
      });
    }
    
    // Performance financière
    if (profitMargin > 20) {
      insights.push({
        id: 'excellent-margins',
        type: 'success',
        category: 'finance',
        title: 'Excellente marge bénéficiaire',
        description: `Vos marges atteignent ${profitMargin.toFixed(1)}%, bien au-dessus des standards du secteur.`,
        metric: `${profitMargin.toFixed(1)}%`,
        priority: 'low'
      });
    } else if (profitMargin < 10) {
      insights.push({
        id: 'low-margins',
        type: 'error',
        category: 'finance',
        title: 'Marges faibles détectées',
        description: `Vos marges de ${profitMargin.toFixed(1)}% sont en dessous des standards. Optimisation nécessaire.`,
        metric: `${profitMargin.toFixed(1)}%`,
        action: { label: 'Analyser les coûts', url: '/cost-simulation' },
        priority: 'high'
      });
    }
    
    // Capacité opérationnelle
    const capacityRatio = activeMissions.length / Math.max(activeCrew.length, 1);
    if (capacityRatio > 0.8) {
      insights.push({
        id: 'high-capacity-usage',
        type: 'warning',
        category: 'operations',
        title: 'Utilisation élevée des ressources',
        description: `${(capacityRatio * 100).toFixed(0)}% de votre équipage est mobilisé. Risque de surcharge.`,
        metric: `${(capacityRatio * 100).toFixed(0)}%`,
        action: { label: 'Planifier les ressources', url: '/manage-crew' },
        priority: 'medium'
      });
    }
    
    // Tendance des missions ce mois
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthMissions = missions.filter(m => {
      const missionDate = new Date(m.departure.date);
      return missionDate.getMonth() === currentMonth && missionDate.getFullYear() === currentYear;
    });
    
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthMissions = missions.filter(m => {
      const missionDate = new Date(m.departure.date);
      return missionDate.getMonth() === lastMonth && missionDate.getFullYear() === lastMonthYear;
    });
    
    const growthRate = lastMonthMissions.length > 0 
      ? ((thisMonthMissions.length - lastMonthMissions.length) / lastMonthMissions.length) * 100 
      : 0;
    
    if (growthRate > 15) {
      insights.push({
        id: 'strong-growth',
        type: 'success',
        category: 'performance',
        title: 'Croissance exceptionnelle',
        description: `+${growthRate.toFixed(0)}% de missions ce mois vs le mois dernier. Excellent momentum !`,
        metric: `+${growthRate.toFixed(0)}%`,
        priority: 'low'
      });
    } else if (growthRate < -10) {
      insights.push({
        id: 'declining-activity',
        type: 'warning',
        category: 'performance',
        title: 'Baisse d\'activité détectée',
        description: `${growthRate.toFixed(0)}% de missions ce mois. Surveiller les tendances du marché.`,
        metric: `${growthRate.toFixed(0)}%`,
        priority: 'medium'
      });
    }
    
    // Efficacité opérationnelle
    const completionRate = missions.length > 0 
      ? (completedMissions.length / missions.length) * 100 
      : 0;
    
    if (completionRate > 90) {
      insights.push({
        id: 'high-completion-rate',
        type: 'success',
        category: 'operations',
        title: 'Excellence opérationnelle',
        description: `${completionRate.toFixed(0)}% de taux de completion. Processus très efficaces !`,
        metric: `${completionRate.toFixed(0)}%`,
        priority: 'low'
      });
    }
    
    // Recommandations proactives
    if (insights.length === 0 || insights.every(i => i.priority === 'low')) {
      insights.push({
        id: 'optimization-opportunities',
        type: 'info',
        category: 'performance',
        title: 'Opportunités d\'optimisation',
        description: 'Vos opérations sont stables. Explorez les nouvelles fonctionnalités pour améliorer l\'efficacité.',
        action: { label: 'Découvrir les fonctionnalités', url: '/settings' },
        priority: 'low'
      });
    }
    
    return insights;
  }, [missions, crewMembers, utils]);

  // Filtrage par catégorie
  const filteredInsights = selectedCategory === 'all' 
    ? insights 
    : insights.filter(insight => insight.category === selectedCategory);

  // Trier par priorité
  const sortedInsights = filteredInsights.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default: return <Activity className="h-5 w-5 text-blue-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <TrendingUp className="h-4 w-4" />;
      case 'crew': return <Users className="h-4 w-4" />;
      case 'finance': return <Euro className="h-4 w-4" />;
      case 'operations': return <Plane className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const categoryLabels = {
    performance: 'Performance',
    crew: 'Équipage',
    finance: 'Finance',
    operations: 'Opérations'
  };

  const categories = ['all', ...Object.keys(categoryLabels)];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Insights Intelligents</span>
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {sortedInsights.length} insight{sortedInsights.length > 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtres par catégorie */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="text-xs"
            >
              {category === 'all' ? (
                <>
                  <Target className="h-3 w-3 mr-1" />
                  Tous
                </>
              ) : (
                <>
                  {getCategoryIcon(category)}
                  <span className="ml-1">{categoryLabels[category]}</span>
                </>
              )}
            </Button>
          ))}
        </div>

        {/* Liste des insights */}
        <div className="space-y-3">
          {sortedInsights.length > 0 ? (
            sortedInsights.map(insight => (
              <Alert key={insight.id} className={`
                ${insight.type === 'success' ? 'border-green-200 bg-green-50' : ''}
                ${insight.type === 'warning' ? 'border-yellow-200 bg-yellow-50' : ''}
                ${insight.type === 'error' ? 'border-red-200 bg-red-50' : ''}
                ${insight.type === 'info' ? 'border-blue-200 bg-blue-50' : ''}
              `}>
                <div className="flex items-start space-x-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        {insight.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        {insight.metric && (
                          <Badge variant="outline" className="text-xs">
                            {insight.metric}
                          </Badge>
                        )}
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            insight.priority === 'high' ? 'border-red-200 text-red-700' :
                            insight.priority === 'medium' ? 'border-yellow-200 text-yellow-700' :
                            'border-gray-200 text-gray-700'
                          }`}
                        >
                          {insight.priority === 'high' ? 'Priorité élevée' :
                           insight.priority === 'medium' ? 'Priorité moyenne' :
                           'Info'}
                        </Badge>
                      </div>
                    </div>
                    <AlertDescription className="text-sm">
                      {insight.description}
                    </AlertDescription>
                    {insight.action && (
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = insight.action.url}
                          className="text-xs"
                        >
                          {insight.action.label}
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Alert>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Aucun insight pour cette catégorie</p>
            </div>
          )}
        </div>

        {/* Résumé des tendances */}
        {sortedInsights.length > 0 && (
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-600">Critiques</div>
                <div className="text-lg font-medium text-red-600">
                  {sortedInsights.filter(i => i.priority === 'high').length}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Importantes</div>
                <div className="text-lg font-medium text-yellow-600">
                  {sortedInsights.filter(i => i.priority === 'medium').length}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Positives</div>
                <div className="text-lg font-medium text-green-600">
                  {sortedInsights.filter(i => i.type === 'success').length}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Score Santé</div>
                <div className="text-lg font-medium text-blue-600">
                  {Math.max(0, 100 - (sortedInsights.filter(i => i.priority === 'high').length * 20) - (sortedInsights.filter(i => i.priority === 'medium').length * 10))}%
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}