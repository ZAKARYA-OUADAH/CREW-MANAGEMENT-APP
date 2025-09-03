import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import { useAuth } from './AuthProvider';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import MissionExecution from './MissionExecution';
import { 
  FileText, 
  Download, 
  Calendar, 
  User, 
  Plane, 
  MapPin, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import type { MissionOrder } from './MissionOrderTypes';

export default function MissionOrderDocument() {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mission, setMission] = useState<MissionOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (missionId) {
      fetchMission();
    }
  }, [missionId]);

  // Listen for mission updates
  useEffect(() => {
    const handleMissionUpdate = (event: any) => {
      if (event.detail?.missionId === missionId) {
        fetchMission();
      }
    };

    window.addEventListener('missionOrderUpdated', handleMissionUpdate);
    return () => window.removeEventListener('missionOrderUpdated', handleMissionUpdate);
  }, [missionId]);

  const fetchMission = async () => {
    try {
      setLoading(true);
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/missions/${missionId}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.mission) {
        setMission(result.mission);
        setError(null);
      } else {
        setError('Mission not found');
      }
    } catch (error) {
      console.error('Error fetching mission:', error);
      setError('Failed to load mission details');
    } finally {
      setLoading(false);
    }
  };

  const handleMissionUpdate = () => {
    fetchMission();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return timeString.substring(0, 5); // HH:MM
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_execution':
        return 'bg-cyan-100 text-cyan-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'mission_over':
        return 'bg-orange-100 text-orange-800';
      case 'pending_validation':
        return 'bg-yellow-100 text-yellow-800';
      case 'validated':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending_execution':
        return 'En Attente d\'Exécution';
      case 'in_progress':
        return 'En Cours';
      case 'mission_over':
        return 'Mission Terminée';
      case 'pending_validation':
        return 'En Attente de Validation';
      case 'validated':
        return 'Validée';
      case 'completed':
        return 'Complétée';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !mission) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Mission introuvable'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isCrewMember = user && (
    mission.crew?.id === user.id ||
    mission.crew?.captain?.id === user.id ||
    mission.crew?.first_officer?.id === user.id ||
    (mission.crew?.cabin_crew && mission.crew.cabin_crew.some(cc => cc.id === user.id))
  );

  const canExecute = isCrewMember && ['pending_execution', 'in_progress'].includes(mission.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl text-gray-900">Ordre de Mission</h1>
            <p className="text-gray-600">{mission.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(mission.status)}>
            {getStatusText(mission.status)}
          </Badge>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Mission Execution Component (for crew members) */}
      {canExecute && (
        <MissionExecution 
          mission={mission}
          onMissionUpdate={handleMissionUpdate}
        />
      )}

      {/* Mission Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Détails de la Mission</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Équipage</p>
                <p className="font-medium">{mission.crew?.name || 'Non assigné'}</p>
                <p className="text-sm text-gray-500">{mission.crew?.position || ''}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Plane className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Aéronef</p>
                <p className="font-medium">{mission.aircraft?.immat || 'Non défini'}</p>
                <p className="text-sm text-gray-500">{mission.aircraft?.type || ''}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Période</p>
                <p className="font-medium">{formatDate(mission.contract?.startDate)}</p>
                <p className="text-sm text-gray-500">au {formatDate(mission.contract?.endDate)}</p>
              </div>
            </div>

            {mission.emailData?.fees && (
              <div className="flex items-center space-x-3">
                <DollarSign className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Rémunération</p>
                  <p className="font-medium">
                    {mission.emailData.fees.totalFees?.toFixed(2)} {mission.emailData.fees.currency}
                  </p>
                  <p className="text-sm text-gray-500">
                    {mission.emailData.fees.dailyRate} {mission.emailData.fees.currency}/jour
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Contract Information */}
          {mission.contract && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Informations Contractuelles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Type de contrat</p>
                  <p className="font-medium">
                    {mission.contract.contractType || 'Standard'}
                    {mission.contract.contractGenerated && (
                      <Badge className="ml-2 bg-green-100 text-green-800">
                        Contrat généré
                      </Badge>
                    )}
                  </p>
                  {mission.contract.contractNumber && (
                    <p className="text-xs text-gray-500">#{mission.contract.contractNumber}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-600">Rémunération</p>
                  <p className="font-medium">
                    {mission.contract.salaryAmount} {mission.contract.salaryCurrency || 'EUR'}
                    /{mission.contract.salaryType === 'daily' ? 'jour' : 'mission'}
                  </p>
                  {mission.contract.hasPerDiem && (
                    <p className="text-sm text-gray-500">
                      + {mission.contract.perDiemAmount} {mission.contract.perDiemCurrency || mission.contract.salaryCurrency} per diem
                    </p>
                  )}
                </div>
              </div>

              {mission.contract.additionalNotes && (
                <div>
                  <p className="text-sm text-gray-600">Notes additionnelles</p>
                  <p className="text-sm text-gray-800 mt-1 p-3 bg-gray-50 rounded">
                    {mission.contract.additionalNotes}
                  </p>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Flight Details */}
          {mission.flights && mission.flights.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Détails des Vols</h3>
              <div className="space-y-3">
                {mission.flights.map((flight, index) => (
                  <div key={flight.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{flight.flight || `Vol ${index + 1}`}</span>
                      </div>
                      <div>
                        <p className="font-medium">{flight.departure} → {flight.arrival}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(flight.date)} à {formatTime(flight.time)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mission Timeline (if applicable) */}
          {mission.missionFlow && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Historique de la Mission</h3>
              <div className="space-y-2">
                {mission.assignedToCrewAt && (
                  <div className="flex items-center space-x-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-gray-600">Assignée à l'équipage</span>
                    <span className="text-gray-500">
                      {new Date(mission.assignedToCrewAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
                
                {mission.executionStartedAt && (
                  <div className="flex items-center space-x-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    <span className="text-gray-600">Exécution démarrée</span>
                    <span className="text-gray-500">
                      {new Date(mission.executionStartedAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                )}
                
                {mission.executionCompletedAt && (
                  <div className="flex items-center space-x-3 text-sm">
                    <CheckCircle className="h-4 w-4 text-orange-500" />
                    <span className="text-gray-600">Mission terminée</span>
                    <span className="text-gray-500">
                      {new Date(mission.executionCompletedAt).toLocaleDateString('fr-FR')}
                    </span>
                    {mission.wasExtended && (
                      <Badge className="bg-orange-100 text-orange-800">
                        Prolongée
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Actions */}
      {isCrewMember && mission.status === 'mission_over' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-orange-600" />
              <span>Validation Requise</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-orange-200 bg-orange-50 mb-4">
              <Clock className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Mission terminée - Validation requise</strong>
                <p className="text-orange-700 text-sm mt-1">
                  Votre mission est terminée. Veuillez maintenant procéder à la validation des détails de paiement, 
                  confirmer vos informations bancaires et, si nécessaire, télécharger votre facture.
                </p>
              </AlertDescription>
            </Alert>

            <Button 
              onClick={() => navigate(`/missions/${mission.id}/validate`)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Procéder à la Validation
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}