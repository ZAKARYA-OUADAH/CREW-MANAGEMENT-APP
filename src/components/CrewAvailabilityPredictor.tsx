import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { useSupabaseData } from './SupabaseDataProvider';
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Brain,
  Search,
  Filter
} from 'lucide-react';

interface AvailabilityPrediction {
  date: string;
  availableCrew: {
    captain: number;
    first_officer: number;
    cabin_crew: number;
    engineer: number;
  };
  demand: {
    captain: number;
    first_officer: number;
    cabin_crew: number;
    engineer: number;
  };
  utilization: number;
  riskLevel: 'low' | 'medium' | 'high';
  conflicts: string[];
  recommendations: string[];
}

interface CrewMember {
  id: string;
  name: string;
  role: string;
  availability: any[];
  status: string;
}

export default function CrewAvailabilityPredictor() {
  const { missions, crewMembers } = useSupabaseData();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [predictionDays, setPredictionDays] = useState('7');
  const [filterRole, setFilterRole] = useState('all');

  // Calcul des prédictions de disponibilité
  const predictions = useMemo(() => {
    const predictions: AvailabilityPrediction[] = [];
    const startDate = new Date(selectedDate);
    const days = parseInt(predictionDays);
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Calculer l'équipage disponible par rôle
      const availableCrew = {
        captain: 0,
        first_officer: 0,
        cabin_crew: 0,
        engineer: 0
      };
      
      // Compter l'équipage actif par rôle
      crewMembers.forEach(crew => {
        if (crew.status === 'active') {
          const role = crew.role.toLowerCase();
          if (role in availableCrew) {
            // Simuler la disponibilité basée sur les missions existantes
            const isAvailable = !missions.some(mission => {
              const missionDate = new Date(mission.departure.date);
              const missionEndDate = new Date(mission.arrival.date);
              return currentDate >= missionDate && currentDate <= missionEndDate &&
                     mission.assigned_crew && 
                     Object.values(mission.assigned_crew).flat().includes(crew.id);
            });
            
            if (isAvailable) {
              availableCrew[role]++;
            }
          }
        }
      });
      
      // Calculer la demande basée sur les missions programmées
      const demand = {
        captain: 0,
        first_officer: 0,
        cabin_crew: 0,
        engineer: 0
      };
      
      missions.forEach(mission => {
        const missionDate = new Date(mission.departure.date);
        if (missionDate.toDateString() === currentDate.toDateString()) {
          if (mission.crew_requirements) {
            demand.captain += mission.crew_requirements.captain || 0;
            demand.first_officer += mission.crew_requirements.first_officer || 0;
            demand.cabin_crew += mission.crew_requirements.cabin_crew || 0;
            demand.engineer += mission.crew_requirements.engineer || 0;
          }
        }
      });
      
      // Calculer le taux d'utilisation
      const totalAvailable = Object.values(availableCrew).reduce((sum, count) => sum + count, 0);
      const totalDemand = Object.values(demand).reduce((sum, count) => sum + count, 0);
      const utilization = totalAvailable > 0 ? (totalDemand / totalAvailable) * 100 : 0;
      
      // Déterminer le niveau de risque
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (utilization > 90) riskLevel = 'high';
      else if (utilization > 75) riskLevel = 'medium';
      
      // Identifier les conflits
      const conflicts = [];
      Object.keys(availableCrew).forEach(role => {
        if (demand[role] > availableCrew[role]) {
          conflicts.push(`Manque de ${role}: ${demand[role] - availableCrew[role]} personne(s)`);
        }
      });
      
      // Générer des recommandations
      const recommendations = [];
      if (utilization > 85) {
        recommendations.push('Considérer l\'embauche de freelancers');
      }
      if (conflicts.length > 0) {
        recommendations.push('Réaffecter l\'équipage ou reporter certaines missions');
      }
      if (utilization < 40 && totalDemand > 0) {
        recommendations.push('Capacité excédentaire - opportunité pour nouvelles missions');
      }
      
      predictions.push({
        date: dateStr,
        availableCrew,
        demand,
        utilization,
        riskLevel,
        conflicts,
        recommendations
      });
    }
    
    return predictions;
  }, [selectedDate, predictionDays, missions, crewMembers]);

  // Filtrer par rôle si sélectionné
  const filteredPredictions = predictions.map(pred => {
    if (filterRole === 'all') return pred;
    
    return {
      ...pred,
      availableCrew: {
        captain: filterRole === 'captain' ? pred.availableCrew.captain : 0,
        first_officer: filterRole === 'first_officer' ? pred.availableCrew.first_officer : 0,
        cabin_crew: filterRole === 'cabin_crew' ? pred.availableCrew.cabin_crew : 0,
        engineer: filterRole === 'engineer' ? pred.availableCrew.engineer : 0
      },
      demand: {
        captain: filterRole === 'captain' ? pred.demand.captain : 0,
        first_officer: filterRole === 'first_officer' ? pred.demand.first_officer : 0,
        cabin_crew: filterRole === 'cabin_crew' ? pred.demand.cabin_crew : 0,
        engineer: filterRole === 'engineer' ? pred.demand.engineer : 0
      }
    };
  });

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (date.toDateString() === tomorrow.toDateString()) return "Demain";
    
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Statistiques globales
  const globalStats = useMemo(() => {
    const totalUtilization = predictions.reduce((sum, p) => sum + p.utilization, 0) / predictions.length;
    const highRiskDays = predictions.filter(p => p.riskLevel === 'high').length;
    const conflictDays = predictions.filter(p => p.conflicts.length > 0).length;
    const averageAvailable = predictions.reduce((sum, p) => 
      sum + Object.values(p.availableCrew).reduce((s, c) => s + c, 0), 0
    ) / predictions.length;
    
    return {
      totalUtilization,
      highRiskDays,
      conflictDays,
      averageAvailable
    };
  }, [predictions]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>Prédicteur de Disponibilité</span>
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            IA Prédictive
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contrôles */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-xs text-gray-600">Date de début</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-600">Période</Label>
            <Select value={predictionDays} onValueChange={setPredictionDays}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 jours</SelectItem>
                <SelectItem value="14">14 jours</SelectItem>
                <SelectItem value="30">30 jours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-600">Filtrer par rôle</Label>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="captain">Capitaine</SelectItem>
                <SelectItem value="first_officer">Copilote</SelectItem>
                <SelectItem value="cabin_crew">PNC</SelectItem>
                <SelectItem value="engineer">Mécanicien</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button size="sm" className="w-full">
              <Search className="h-4 w-4 mr-2" />
              Analyser
            </Button>
          </div>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-medium text-gray-900">
              {globalStats.totalUtilization.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-600">Utilisation moyenne</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-medium text-red-600">
              {globalStats.highRiskDays}
            </div>
            <div className="text-xs text-gray-600">Jours à risque</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-medium text-yellow-600">
              {globalStats.conflictDays}
            </div>
            <div className="text-xs text-gray-600">Jours de conflit</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-medium text-blue-600">
              {globalStats.averageAvailable.toFixed(0)}
            </div>
            <div className="text-xs text-gray-600">Équipage disponible (moy.)</div>
          </div>
        </div>

        {/* Alertes générales */}
        {globalStats.highRiskDays > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Attention:</strong> {globalStats.highRiskDays} jour(s) avec risque élevé de surcharge détecté(s).
            </AlertDescription>
          </Alert>
        )}

        {/* Timeline des prédictions */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Prévisions détaillées</span>
          </h4>
          
          <div className="space-y-3">
            {filteredPredictions.map(prediction => (
              <div 
                key={prediction.date}
                className={`border rounded-lg p-4 ${getRiskColor(prediction.riskLevel)}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <h5 className="font-medium text-sm">{formatDate(prediction.date)}</h5>
                    <Badge variant="outline" className={`text-xs ${getRiskColor(prediction.riskLevel)}`}>
                      {getRiskIcon(prediction.riskLevel)}
                      <span className="ml-1">
                        {prediction.riskLevel === 'high' ? 'Risque élevé' :
                         prediction.riskLevel === 'medium' ? 'Risque modéré' : 'Risque faible'}
                      </span>
                    </Badge>
                  </div>
                  <div className="text-sm font-medium">
                    Utilisation: {prediction.utilization.toFixed(0)}%
                  </div>
                </div>

                {/* Détails par rôle */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                  {Object.entries(prediction.availableCrew).map(([role, available]) => {
                    const demand = prediction.demand[role];
                    const roleLabels = {
                      captain: 'Capitaine',
                      first_officer: 'Copilote',
                      cabin_crew: 'PNC',
                      engineer: 'Mécanicien'
                    };
                    
                    return (
                      <div key={role} className="text-center">
                        <div className="text-xs text-gray-600 mb-1">{roleLabels[role]}</div>
                        <div className="text-sm">
                          <span className={demand > available ? 'text-red-600 font-medium' : 'text-gray-900'}>
                            {available}
                          </span>
                          <span className="text-gray-500 mx-1">/</span>
                          <span className="text-gray-600">{demand}</span>
                        </div>
                        <div className="text-xs text-gray-500">dispo/demande</div>
                      </div>
                    );
                  })}
                </div>

                {/* Conflits */}
                {prediction.conflicts.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-red-600 mb-1">Conflits détectés:</div>
                    <div className="space-y-1">
                      {prediction.conflicts.map((conflict, idx) => (
                        <div key={idx} className="text-xs text-red-600">• {conflict}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommandations */}
                {prediction.recommendations.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-blue-600 mb-1">Recommandations:</div>
                    <div className="space-y-1">
                      {prediction.recommendations.map((rec, idx) => (
                        <div key={idx} className="text-xs text-blue-600">• {rec}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/manage-crew'}>
            <Users className="h-4 w-4 mr-2" />
            Gérer l'Équipage
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/invite-user'}>
            <Target className="h-4 w-4 mr-2" />
            Recruter Freelancers
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/manage-missions'}>
            <Calendar className="h-4 w-4 mr-2" />
            Ajuster Missions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}