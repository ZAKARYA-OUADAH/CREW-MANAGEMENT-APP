import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useSupabaseData } from './SupabaseDataProvider';
import { 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Plane,
  Calendar,
  MapPin,
  Timer
} from 'lucide-react';

interface MissionProgress {
  missionId: string;
  missionNumber: string;
  client: string;
  aircraftType: string;
  route: string;
  departureDate: string;
  status: string;
  progress: number;
  nextStep: string;
  assignedCrew: number;
  requiredCrew: number;
  urgency: 'low' | 'medium' | 'high';
  daysUntilDeparture: number;
}

export default function MissionStatusTracker() {
  const { missions, crewMembers } = useSupabaseData();

  // Calculer le progrès et les prochaines étapes pour chaque mission
  const missionProgress: MissionProgress[] = missions
    .filter(mission => !['completed', 'cancelled'].includes(mission.status))
    .map(mission => {
      const departureDate = new Date(mission.departure.date);
      const today = new Date();
      const daysUntilDeparture = Math.ceil((departureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculer le progrès basé sur le statut
      let progress = 0;
      let nextStep = '';
      
      switch (mission.status) {
        case 'pending':
          progress = 10;
          nextStep = 'Assignation équipage';
          break;
        case 'crew_assigned':
          progress = 35;
          nextStep = 'Validation mission';
          break;
        case 'confirmed':
          progress = 60;
          nextStep = 'Début de mission';
          break;
        case 'in_progress':
          progress = 85;
          nextStep = 'Completion mission';
          break;
        default:
          progress = 0;
          nextStep = 'En attente';
      }

      // Calculer l'équipage assigné
      const assignedCrewIds = Object.values(mission.assigned_crew || {}).flat();
      const assignedCrew = assignedCrewIds.length;
      const requiredCrew = Object.values(mission.crew_requirements || {})
        .reduce((sum, count) => sum + (count || 0), 0);

      // Déterminer l'urgence
      let urgency: 'low' | 'medium' | 'high' = 'low';
      if (daysUntilDeparture <= 2) urgency = 'high';
      else if (daysUntilDeparture <= 7) urgency = 'medium';

      return {
        missionId: mission.id,
        missionNumber: mission.mission_number,
        client: mission.client,
        aircraftType: mission.aircraft_type,
        route: `${mission.departure.airport} → ${mission.arrival.airport}`,
        departureDate: mission.departure.date,
        status: mission.status,
        progress,
        nextStep,
        assignedCrew,
        requiredCrew,
        urgency,
        daysUntilDeparture
      };
    })
    .sort((a, b) => {
      // Trier par urgence puis par date de départ
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      if (urgencyOrder[b.urgency] !== urgencyOrder[a.urgency]) {
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      }
      return a.daysUntilDeparture - b.daysUntilDeparture;
    });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-orange-600" />;
      case 'crew_assigned': return <Users className="h-4 w-4 text-blue-600" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Plane className="h-4 w-4 text-purple-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'crew_assigned': return 'Équipage assigné';
      case 'confirmed': return 'Confirmée';
      case 'in_progress': return 'En cours';
      default: return status;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-gray-200 bg-white';
    }
  };

  const getDaysText = (days: number) => {
    if (days < 0) return `En retard de ${Math.abs(days)} jour(s)`;
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Demain";
    return `Dans ${days} jour(s)`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Timer className="h-5 w-5" />
          <span>Suivi des Missions</span>
          <Badge variant="outline" className="ml-auto">
            {missionProgress.length} actives
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {missionProgress.length > 0 ? (
          <div className="space-y-4">
            {missionProgress.slice(0, 6).map(mission => (
              <div 
                key={mission.missionId}
                className={`p-4 border rounded-lg transition-all hover:shadow-sm ${getUrgencyColor(mission.urgency)}`}
              >
                <div className="space-y-3">
                  {/* En-tête de mission */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(mission.status)}
                        <span className="font-medium text-sm">{mission.missionNumber}</span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                      >
                        {getStatusLabel(mission.status)}
                      </Badge>
                      {mission.urgency === 'high' && (
                        <Badge variant="destructive" className="text-xs">
                          Urgent
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-600">
                      {getDaysText(mission.daysUntilDeparture)}
                    </div>
                  </div>

                  {/* Détails de mission */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3 w-3" />
                      <span>{mission.route}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Plane className="h-3 w-3" />
                      <span>{mission.aircraftType}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="h-3 w-3" />
                      <span>{mission.assignedCrew}/{mission.requiredCrew} équipage</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(mission.departureDate).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>

                  {/* Barre de progrès */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Progrès</span>
                      <span className="text-gray-900 font-medium">{mission.progress}%</span>
                    </div>
                    <Progress value={mission.progress} className="h-2" />
                    <div className="text-xs text-gray-600">
                      Prochaine étape: {mission.nextStep}
                    </div>
                  </div>

                  {/* Alertes si nécessaire */}
                  {mission.assignedCrew < mission.requiredCrew && (
                    <div className="flex items-center space-x-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                      <AlertCircle className="h-3 w-3" />
                      <span>
                        Équipage incomplet ({mission.requiredCrew - mission.assignedCrew} membre(s) manquant(s))
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {missionProgress.length > 6 && (
              <div className="text-center py-2">
                <Badge variant="outline" className="text-xs">
                  +{missionProgress.length - 6} autres missions
                </Badge>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Aucune mission active</p>
            <p className="text-xs text-gray-400">Toutes les missions sont complétées</p>
          </div>
        )}

        {/* Résumé en bas */}
        {missionProgress.length > 0 && (
          <div className="pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div>
                <div className="text-red-600 font-medium">
                  {missionProgress.filter(m => m.urgency === 'high').length}
                </div>
                <div className="text-gray-600">Urgentes</div>
              </div>
              <div>
                <div className="text-yellow-600 font-medium">
                  {missionProgress.filter(m => m.assignedCrew < m.requiredCrew).length}
                </div>
                <div className="text-gray-600">Équipage incomplet</div>
              </div>
              <div>
                <div className="text-green-600 font-medium">
                  {Math.round(missionProgress.reduce((sum, m) => sum + m.progress, 0) / missionProgress.length)}%
                </div>
                <div className="text-gray-600">Progrès moyen</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}