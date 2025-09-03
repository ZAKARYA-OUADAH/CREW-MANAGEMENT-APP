import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { useMissionOrders } from './MissionOrderService';
import { getStatusText, getStatusColor, formatMissionDuration, isMissionStartingSoon } from './MissionOrderHelpers';
import { 
  Calendar, 
  MapPin, 
  Plane, 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  Eye, 
  CheckCircle,
  User,
  FileText,
  ExternalLink
} from 'lucide-react';

interface PendingExecutionMissionsProps {
  userId: string;
}

export default function PendingExecutionMissions({ userId }: PendingExecutionMissionsProps) {
  const { missionOrders, loading, error } = useMissionOrders(userId);
  const [expandedMissions, setExpandedMissions] = useState<Set<string>>(new Set());

  // Filter missions that are pending execution or in progress
  const executionMissions = missionOrders.filter(mission => 
    mission.status === 'pending_execution' || mission.status === 'in_progress'
  );

  const toggleMissionExpansion = (missionId: string) => {
    const newExpanded = new Set(expandedMissions);
    if (newExpanded.has(missionId)) {
      newExpanded.delete(missionId);
    } else {
      newExpanded.add(missionId);
    }
    setExpandedMissions(newExpanded);
  };

  const handleStartMission = (missionId: string) => {
    // This would typically call an API to update mission status to "in_progress"
    console.log(`Starting mission ${missionId}`);
    // TODO: Implement API call to update mission status
  };

  const handleViewMissionDetails = (missionId: string) => {
    window.location.href = `/missions/${missionId}`;
  };

  const formatAmount = (amount: number | undefined, currency: string) => {
    if (!amount) return 'N/A';
    return `${amount.toLocaleString()} ${currency}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5); // Extract HH:MM from HH:MM:SS
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span>Missions en Attente d'Exécution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span>Missions en Attente d'Exécution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Erreur lors du chargement des missions: {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (executionMissions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span>Missions en Attente d'Exécution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg text-gray-900 mb-2">Aucune mission en attente</h3>
            <p className="text-sm text-gray-600">
              Vous n'avez actuellement aucune mission assignée en attente d'exécution.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span>Missions en Attente d'Exécution</span>
          </div>
          <Badge className="bg-blue-100 text-blue-800">
            {executionMissions.length} mission{executionMissions.length > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {executionMissions.map((mission) => {
          const isExpanded = expandedMissions.has(mission.id);
          const isStartingSoon = isMissionStartingSoon(mission.contract.startDate);
          const duration = formatMissionDuration(mission.contract.startDate, mission.contract.endDate);
          
          return (
            <Card 
              key={mission.id} 
              className={`border-l-4 ${
                mission.status === 'pending_execution' ? 'border-l-cyan-500' : 'border-l-indigo-500'
              } ${isStartingSoon ? 'bg-yellow-50' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h4 className="font-medium text-gray-900">{mission.id}</h4>
                      <p className="text-sm text-gray-600">
                        {mission.type === 'extra_day' ? 'Jour Supplémentaire' :
                         mission.type === 'freelance' ? 'Mission Freelance' : 'Service'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isStartingSoon && (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Bientôt
                      </Badge>
                    )}
                    <Badge className={getStatusColor(mission.status)}>
                      {getStatusText(mission.status)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Quick Info Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{formatDate(mission.contract.startDate)}</span>
                    <span className="text-gray-400">•</span>
                    <span>{duration}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Plane className="h-4 w-4 text-gray-500" />
                    <span>{mission.aircraft.immat}</span>
                    <span className="text-gray-600">({mission.aircraft.type})</span>
                  </div>
                </div>

                {/* Mission Location */}
                {mission.flights.length > 0 && (
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>
                      {mission.flights[0].departure} → {mission.flights[mission.flights.length - 1].arrival}
                    </span>
                  </div>
                )}

                {/* Compensation Info */}
                {mission.emailData?.fees && (
                  <div className="flex items-center space-x-2 text-sm">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">
                      {formatAmount(mission.emailData.fees.totalFees, mission.emailData.fees.currency)}
                    </span>
                    <span className="text-gray-600">
                      ({mission.emailData.fees.dailyRate} {mission.emailData.fees.currency}/jour
                      {mission.contract.hasPerDiem && mission.contract.perDiemAmount && 
                        ` + ${mission.contract.perDiemAmount} per diem`
                      })
                    </span>
                  </div>
                )}

                {/* Expand/Collapse Toggle */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleMissionExpansion(mission.id)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    {isExpanded ? 'Masquer les détails' : 'Voir tous les détails'}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleViewMissionDetails(mission.id)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Consulter
                    </Button>
                    
                    {mission.status === 'pending_execution' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartMission(mission.id)}
                        className="border-green-600 text-green-600 hover:bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Démarrer
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="pt-4 border-t space-y-4">
                    {/* Flight Details */}
                    {mission.flights.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <Plane className="h-4 w-4 mr-2" />
                          Détails des Vols
                        </h5>
                        <div className="space-y-2">
                          {mission.flights.map((flight, index) => (
                            <div key={flight.id} className="bg-gray-50 p-3 rounded-lg">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">{flight.flight}</span>
                                  <span className="text-gray-600 ml-2">
                                    {formatDate(flight.date)} à {formatTime(flight.time)}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span>{flight.departure} → {flight.arrival}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contract Details */}
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Détails du Contrat
                      </h5>
                      <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-gray-600">Période:</span>
                            <div className="font-medium">
                              {formatDate(mission.contract.startDate)} - {formatDate(mission.contract.endDate)}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Durée:</span>
                            <div className="font-medium">{duration}</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-gray-600">Salaire journalier:</span>
                            <div className="font-medium">
                              {mission.contract.salaryAmount} {mission.contract.salaryCurrency}
                            </div>
                          </div>
                          {mission.contract.hasPerDiem && mission.contract.perDiemAmount && (
                            <div>
                              <span className="text-gray-600">Per Diem:</span>
                              <div className="font-medium">
                                {mission.contract.perDiemAmount} {mission.contract.perDiemCurrency || mission.contract.salaryCurrency}
                              </div>
                            </div>
                          )}
                        </div>

                        {mission.contract.additionalNotes && (
                          <div>
                            <span className="text-gray-600">Notes supplémentaires:</span>
                            <div className="mt-1 p-2 bg-white rounded border text-sm">
                              {mission.contract.additionalNotes}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Client Information */}
                    {mission.emailData?.ownerEmail && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Informations Client
                        </h5>
                        <div className="bg-gray-50 p-3 rounded-lg text-sm">
                          <div>
                            <span className="text-gray-600">Email de contact:</span>
                            <div className="font-medium">{mission.emailData.ownerEmail}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}