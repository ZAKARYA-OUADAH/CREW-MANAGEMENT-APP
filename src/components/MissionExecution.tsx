import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from './AuthProvider';
import { useNotifications } from './NotificationContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { 
  PlayCircle, 
  CheckCircle, 
  Clock, 
  Calendar,
  AlertTriangle,
  User,
  Plane,
  MapPin,
  FileText
} from 'lucide-react';
import type { MissionOrder } from './MissionOrderTypes';

interface MissionExecutionProps {
  mission: MissionOrder;
  onMissionUpdate?: () => void;
}

export default function MissionExecution({ mission, onMissionUpdate }: MissionExecutionProps) {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [actualEndDate, setActualEndDate] = useState(mission.contract?.endDate || '');
  const [extensionReason, setExtensionReason] = useState('');

  const isCrewMember = user && (
    mission.crew?.id === user.id ||
    mission.crew?.captain?.id === user.id ||
    mission.crew?.first_officer?.id === user.id ||
    (mission.crew?.cabin_crew && mission.crew.cabin_crew.some(cc => cc.id === user.id))
  );

  if (!isCrewMember) {
    return null; // Only show to crew members
  }

  const handleStartMission = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/missions/${mission.id}/start-execution`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          startedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.mission) {
        showToast('success', 'Mission Démarrée', 'La mission a été démarrée avec succès');
        onMissionUpdate?.();
        
        // Dispatch event for real-time updates
        window.dispatchEvent(new CustomEvent('missionOrderUpdated', {
          detail: { missionId: mission.id, newStatus: 'in_progress' }
        }));
      }
    } catch (error) {
      console.error('Error starting mission:', error);
      showToast('error', 'Erreur', 'Impossible de démarrer la mission');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteMission = async () => {
    if (!actualEndDate) {
      showToast('error', 'Date manquante', 'Veuillez saisir la date de fin réelle');
      return;
    }

    const originalEndDate = mission.contract?.endDate;
    const wasExtended = actualEndDate !== originalEndDate;

    if (wasExtended && !extensionReason.trim()) {
      showToast('error', 'Raison manquante', 'Veuillez expliquer la raison de l\'extension');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/missions/${mission.id}/complete-execution`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          completedAt: new Date().toISOString(),
          actualEndDate,
          extensionReason: wasExtended ? extensionReason : undefined
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.mission) {
        showToast('success', 'Mission Terminée', 'La mission a été marquée comme terminée');
        setShowCompleteDialog(false);
        onMissionUpdate?.();
        
        // Dispatch event for real-time updates
        window.dispatchEvent(new CustomEvent('missionOrderUpdated', {
          detail: { missionId: mission.id, newStatus: 'mission_over' }
        }));
      }
    } catch (error) {
      console.error('Error completing mission:', error);
      showToast('error', 'Erreur', 'Impossible de terminer la mission');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusInfo = () => {
    switch (mission.status) {
      case 'pending_execution':
        return {
          color: 'bg-cyan-100 text-cyan-800',
          icon: <Clock className="h-4 w-4" />,
          text: 'En Attente d\'Exécution'
        };
      case 'in_progress':
        return {
          color: 'bg-blue-100 text-blue-800',
          icon: <PlayCircle className="h-4 w-4" />,
          text: 'En Cours'
        };
      case 'mission_over':
        return {
          color: 'bg-orange-100 text-orange-800',
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Mission Terminée'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: <Clock className="h-4 w-4" />,
          text: mission.status
        };
    }
  };

  const statusInfo = getStatusInfo();
  const originalEndDate = mission.contract?.endDate;
  const wasExtended = actualEndDate && actualEndDate !== originalEndDate;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <PlayCircle className="h-5 w-5 text-blue-600" />
            <span>Exécution de Mission</span>
          </CardTitle>
          <Badge className={statusInfo.color}>
            {statusInfo.icon}
            <span className="ml-1">{statusInfo.text}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mission Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Équipage</p>
              <p className="font-medium">{mission.crew?.name}</p>
              <p className="text-xs text-gray-500">{mission.crew?.position}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Plane className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Aéronef</p>
              <p className="font-medium">{mission.aircraft?.immat}</p>
              <p className="text-xs text-gray-500">{mission.aircraft?.type}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Dates</p>
              <p className="font-medium">{formatDate(mission.contract?.startDate || '')}</p>
              <p className="text-xs text-gray-500">au {formatDate(mission.contract?.endDate || '')}</p>
            </div>
          </div>

          {mission.flights.length > 0 && (
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Itinéraire</p>
                <p className="font-medium">
                  {mission.flights[0].departure} → {mission.flights[mission.flights.length - 1].arrival}
                </p>
                <p className="text-xs text-gray-500">{mission.flights.length} vol(s)</p>
              </div>
            </div>
          )}
        </div>

        {/* Contract Information */}
        {mission.contract?.contractGenerated && (
          <Alert className="border-green-200 bg-green-50">
            <FileText className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Contrat 0-Heure Généré</strong>
              <p className="text-green-700 text-sm mt-1">
                Contrat #{mission.contract.contractNumber} généré automatiquement.
                Type: {mission.contract.contractType}, Rémunération: {mission.contract.salaryAmount} {mission.contract.salaryCurrency}/{mission.contract.salaryType === 'daily' ? 'jour' : 'mission'}
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Execution Actions */}
        {mission.status === 'pending_execution' && (
          <div className="flex flex-col space-y-4">
            <Alert className="border-cyan-200 bg-cyan-50">
              <PlayCircle className="h-4 w-4 text-cyan-600" />
              <AlertDescription className="text-cyan-800">
                <strong>Mission Prête à Démarrer</strong>
                <p className="text-cyan-700 text-sm mt-1">
                  Votre mission est assignée et prête à être exécutée. Cliquez sur "Démarrer la Mission" quand vous commencez l'exécution.
                </p>
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleStartMission}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <PlayCircle className="h-4 w-4 mr-2" />
              )}
              Démarrer la Mission
            </Button>
          </div>
        )}

        {mission.status === 'in_progress' && (
          <div className="flex flex-col space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <Clock className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Mission en Cours</strong>
                <p className="text-blue-700 text-sm mt-1">
                  Votre mission est actuellement en cours d'exécution. Une fois terminée, marquez-la comme "Terminée" pour procéder à la validation.
                </p>
              </AlertDescription>
            </Alert>

            <Button 
              onClick={() => setShowCompleteDialog(true)}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 w-full md:w-auto"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Marquer comme Terminée
            </Button>
          </div>
        )}

        {mission.status === 'mission_over' && (
          <Alert className="border-orange-200 bg-orange-50">
            <CheckCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Mission Terminée</strong>
              <p className="text-orange-700 text-sm mt-1">
                La mission a été marquée comme terminée. Veuillez maintenant procéder à la validation des détails de paiement et confirmer les informations finales.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Complete Mission Dialog */}
        <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Terminer la Mission</span>
              </DialogTitle>
              <DialogDescription>
                Veuillez confirmer les détails de fin de mission. Si les dates ont été modifiées, ajoutez un commentaire explicatif.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="actual-end-date">Date de fin réelle *</Label>
                <Input
                  id="actual-end-date"
                  type="date"
                  value={actualEndDate}
                  onChange={(e) => setActualEndDate(e.target.value)}
                  required
                />
                {originalEndDate && actualEndDate !== originalEndDate && (
                  <p className="text-xs text-orange-600">
                    ⚠️ Date modifiée (originale: {formatDate(originalEndDate)})
                  </p>
                )}
              </div>

              {wasExtended && (
                <div className="space-y-2">
                  <Label htmlFor="extension-reason">Raison de l'extension *</Label>
                  <Textarea
                    id="extension-reason"
                    placeholder="Expliquez pourquoi la mission a été prolongée..."
                    value={extensionReason}
                    onChange={(e) => setExtensionReason(e.target.value)}
                    rows={3}
                    required
                  />
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowCompleteDialog(false)}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                onClick={handleCompleteMission}
                disabled={loading || !actualEndDate || (wasExtended && !extensionReason.trim())}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Confirmer la Fin de Mission
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}