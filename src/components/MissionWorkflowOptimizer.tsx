import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { useSupabaseData } from './SupabaseDataProvider';
import { 
  Zap, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Plane,
  Calendar,
  Target,
  BarChart3,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface WorkflowOptimization {
  id: string;
  type: 'bottleneck' | 'efficiency' | 'automation' | 'resource';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  savings: string;
  action: string;
  metrics?: {
    current: number;
    potential: number;
    unit: string;
  };
}

interface WorkflowMetrics {
  averageProcessingTime: number;
  crewAssignmentTime: number;
  validationTime: number;
  completionRate: number;
  bottlenecks: string[];
  automationOpportunities: number;
}

export default function MissionWorkflowOptimizer() {
  const { missions, crewMembers, utils } = useSupabaseData();
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [showDetails, setShowDetails] = useState(false);

  // Calcul des métriques de workflow
  const workflowMetrics = useMemo(() => {
    const now = new Date();
    const timeframeMs = selectedTimeframe === '7d' ? 7 * 24 * 60 * 60 * 1000 :
                       selectedTimeframe === '30d' ? 30 * 24 * 60 * 60 * 1000 :
                       90 * 24 * 60 * 60 * 1000;
    
    const filteredMissions = missions.filter(m => {
      const missionDate = new Date(m.created_at);
      return now.getTime() - missionDate.getTime() <= timeframeMs;
    });

    // Temps moyen de traitement
    const completedMissions = filteredMissions.filter(m => m.status === 'completed');
    const averageProcessingTime = completedMissions.length > 0 ? 
      completedMissions.reduce((sum, m) => {
        const created = new Date(m.created_at);
        const updated = new Date(m.updated_at);
        return sum + (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      }, 0) / completedMissions.length : 0;

    // Temps d'assignation d'équipage
    const assignedMissions = filteredMissions.filter(m => 
      m.status !== 'pending' && Object.keys(m.assigned_crew || {}).length > 0
    );
    const crewAssignmentTime = assignedMissions.length > 0 ? 2.5 : 0; // Estimation

    // Temps de validation
    const validatedMissions = filteredMissions.filter(m => 
      m.validation_status === 'validated'
    );
    const validationTime = validatedMissions.length > 0 ? 1.8 : 0; // Estimation

    // Taux de completion
    const completionRate = filteredMissions.length > 0 ? 
      (completedMissions.length / filteredMissions.length) * 100 : 0;

    // Identification des goulots d'étranglement
    const bottlenecks = [];
    const pendingMissions = utils.getMissionsByStatus('pending');
    const crewAssignedMissions = utils.getMissionsByStatus('crew_assigned');
    
    if (pendingMissions.length > 5) bottlenecks.push('Validation initiale');
    if (crewAssignedMissions.length > 3) bottlenecks.push('Confirmation client');
    if (averageProcessingTime > 5) bottlenecks.push('Temps de traitement global');

    // Opportunités d'automatisation
    const manualSteps = ['crew_assignment', 'document_generation', 'client_notification'];
    const automationOpportunities = manualSteps.length;

    return {
      averageProcessingTime,
      crewAssignmentTime,
      validationTime,
      completionRate,
      bottlenecks,
      automationOpportunities
    };
  }, [missions, selectedTimeframe, utils]);

  // Génération des optimisations recommandées
  const optimizations = useMemo(() => {
    const opts: WorkflowOptimization[] = [];

    // Goulot d'étranglement dans la validation
    if (workflowMetrics.bottlenecks.includes('Validation initiale')) {
      opts.push({
        id: 'validation-bottleneck',
        type: 'bottleneck',
        title: 'Accélérer la validation initiale',
        description: 'Trop de missions en attente de validation initiale ralentit le processus.',
        impact: 'high',
        effort: 'low',
        savings: '2-3 jours par mission',
        action: 'Mettre en place des validations automatiques pour les missions standards',
        metrics: {
          current: workflowMetrics.averageProcessingTime,
          potential: workflowMetrics.averageProcessingTime * 0.7,
          unit: 'jours'
        }
      });
    }

    // Optimisation de l'assignation d'équipage
    if (workflowMetrics.crewAssignmentTime > 2) {
      opts.push({
        id: 'crew-assignment-optimization',
        type: 'efficiency',
        title: 'Optimiser l\'assignation d\'équipage',
        description: 'L\'assignation manuelle d\'équipage prend trop de temps.',
        impact: 'medium',
        effort: 'medium',
        savings: '40% du temps d\'assignation',
        action: 'Implémenter un système de recommandation automatique d\'équipage',
        metrics: {
          current: workflowMetrics.crewAssignmentTime,
          potential: workflowMetrics.crewAssignmentTime * 0.6,
          unit: 'jours'
        }
      });
    }

    // Automatisation des documents
    opts.push({
      id: 'document-automation',
      type: 'automation',
      title: 'Automatiser la génération de documents',
      description: 'La création manuelle de documents ralentit le processus.',
      impact: 'medium',
      effort: 'high',
      savings: '70% du temps administratif',
      action: 'Développer des modèles automatiques pour les ordres de mission et factures'
    });

    // Optimisation des ressources
    const activeCrew = crewMembers.filter(c => c.status === 'active');
    const activeMissions = utils.getMissionsByStatus('in_progress');
    const resourceUtilization = activeMissions.length / Math.max(activeCrew.length, 1);
    
    if (resourceUtilization < 0.6) {
      opts.push({
        id: 'resource-optimization',
        type: 'resource',
        title: 'Optimiser l\'utilisation des ressources',
        description: 'Sous-utilisation de l\'équipage disponible détectée.',
        impact: 'high',
        effort: 'low',
        savings: '+25% de capacité utilisable',
        action: 'Revoir la planification et redistribuer les missions',
        metrics: {
          current: resourceUtilization * 100,
          potential: 80,
          unit: '%'
        }
      });
    }

    // Amélioration du taux de completion
    if (workflowMetrics.completionRate < 85) {
      opts.push({
        id: 'completion-rate-improvement',
        type: 'efficiency',
        title: 'Améliorer le taux de completion',
        description: 'Trop de missions restent incomplètes ou annulées.',
        impact: 'high',
        effort: 'medium',
        savings: '+15% de missions complétées',
        action: 'Analyser les causes d\'échec et mettre en place des actions préventives',
        metrics: {
          current: workflowMetrics.completionRate,
          potential: 90,
          unit: '%'
        }
      });
    }

    return opts.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      const effortOrder = { low: 3, medium: 2, high: 1 };
      const scoreA = impactOrder[a.impact] * effortOrder[a.effort];
      const scoreB = impactOrder[b.impact] * effortOrder[b.effort];
      return scoreB - scoreA;
    });
  }, [workflowMetrics, crewMembers, utils]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bottleneck': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'efficiency': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'automation': return <Zap className="h-4 w-4 text-purple-600" />;
      case 'resource': return <Users className="h-4 w-4 text-green-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Optimiseur de Workflow</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7j</SelectItem>
                <SelectItem value="30d">30j</SelectItem>
                <SelectItem value="90d">90j</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Masquer' : 'Détails'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Métriques de performance */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-medium text-gray-900">
              {workflowMetrics.averageProcessingTime.toFixed(1)}j
            </div>
            <div className="text-xs text-gray-600">Temps moyen de traitement</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-medium text-gray-900">
              {workflowMetrics.completionRate.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-600">Taux de completion</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-medium text-red-600">
              {workflowMetrics.bottlenecks.length}
            </div>
            <div className="text-xs text-gray-600">Goulots identifiés</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-medium text-blue-600">
              {optimizations.length}
            </div>
            <div className="text-xs text-gray-600">Optimisations possibles</div>
          </div>
        </div>

        {/* Alertes pour les goulots d'étranglement */}
        {workflowMetrics.bottlenecks.length > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Goulots d'étranglement détectés:</strong> {workflowMetrics.bottlenecks.join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {/* Détails des métriques */}
        {showDetails && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm font-medium text-gray-900 mb-2">Temps par étape</div>
              <div className="space-y-1 text-xs text-gray-600">
                <div>Assignation équipage: {workflowMetrics.crewAssignmentTime.toFixed(1)}j</div>
                <div>Validation: {workflowMetrics.validationTime.toFixed(1)}j</div>
                <div>Traitement total: {workflowMetrics.averageProcessingTime.toFixed(1)}j</div>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 mb-2">Capacité</div>
              <div className="space-y-1 text-xs text-gray-600">
                <div>Équipage actif: {crewMembers.filter(c => c.status === 'active').length}</div>
                <div>Missions actives: {utils.getMissionsByStatus('in_progress').length}</div>
                <div>Utilisation: {((utils.getMissionsByStatus('in_progress').length / Math.max(crewMembers.filter(c => c.status === 'active').length, 1)) * 100).toFixed(0)}%</div>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 mb-2">Automatisation</div>
              <div className="space-y-1 text-xs text-gray-600">
                <div>Étapes manuelles: {workflowMetrics.automationOpportunities}</div>
                <div>Potentiel d'automatisation: Élevé</div>
                <div>Économies estimées: 30-50%</div>
              </div>
            </div>
          </div>
        )}

        {/* Recommandations d'optimisation */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Recommandations d'optimisation</h4>
          
          {optimizations.length > 0 ? (
            <div className="space-y-3">
              {optimizations.slice(0, 4).map(opt => (
                <div key={opt.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-3">
                    {getTypeIcon(opt.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-medium text-gray-900">{opt.title}</h5>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getImpactColor(opt.impact)}`}
                          >
                            Impact {opt.impact}
                          </Badge>
                          <Badge variant="outline" className={`text-xs ${getEffortColor(opt.effort)}`}>
                            Effort {opt.effort}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{opt.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-xs">
                          <span className="text-green-600 font-medium">Économies: {opt.savings}</span>
                        </div>
                        {opt.metrics && (
                          <div className="text-xs text-gray-600">
                            {opt.metrics.current.toFixed(1)} → {opt.metrics.potential.toFixed(1)} {opt.metrics.unit}
                          </div>
                        )}
                      </div>
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-gray-700 font-medium">Action: {opt.action}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-300" />
              <p className="text-sm">Workflow optimisé !</p>
              <p className="text-xs text-gray-400">Aucune amélioration critique détectée</p>
            </div>
          )}
        </div>

        {/* Score d'efficacité global */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Score d'efficacité global</div>
            <div className="flex items-center space-x-2">
              <div className="text-lg font-medium text-gray-900">
                {Math.max(0, 100 - (workflowMetrics.bottlenecks.length * 15) - (optimizations.filter(o => o.impact === 'high').length * 10))}%
              </div>
              <div className={`
                h-2 w-16 rounded-full
                ${workflowMetrics.bottlenecks.length === 0 ? 'bg-green-200' : 
                  workflowMetrics.bottlenecks.length <= 2 ? 'bg-yellow-200' : 'bg-red-200'}
              `} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}