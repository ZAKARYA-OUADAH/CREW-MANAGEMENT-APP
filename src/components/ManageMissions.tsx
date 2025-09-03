import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Separator } from './ui/separator';
import { toast } from 'sonner@2.0.3';
import { useMissionsData } from './useMissionsData';
import { 
  FileText, 
  Mail, 
  Calendar, 
  List, 
  Plus, 
  DollarSign, 
  Plane,
  MapPin,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Send,
  RefreshCw,
  Euro,
  Settings,
  Database
} from 'lucide-react';

export default function ManageMissions() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentView, setCurrentView] = useState<'list' | 'calendar'>('list');
  const [selectedMission, setSelectedMission] = useState(null);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Use the new missions data hook
  const {
    missions,
    loading,
    error,
    refresh,
    updateMissionStatus,
    deleteMission,
    getPendingMissions,
    getActiveMissions,
    getCompletedMissions
  } = useMissionsData({
    statusFilter: statusFilter === 'all' ? undefined : statusFilter,
    searchQuery: searchTerm || undefined
  });

  // Filtrage des missions (now handled by the hook, but keeping for local filtering)
  const filteredMissions = missions.filter(mission => {
    if (!mission) return false;
    
    const matchesSearch = 
      mission.mission_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mission.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mission.aircraft_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mission.departure.airport.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mission.arrival.airport.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || mission.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800';
      case 'crew_assigned':
        return 'bg-purple-100 text-purple-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'crew_assigned':
        return <Users className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'crew_assigned':
        return 'Équipage assigné';
      case 'confirmed':
        return 'Confirmée';
      case 'in_progress':
        return 'En cours';
      case 'completed':
        return 'Terminée';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  };

  const handleUpdateMissionStatus = async (missionId: string, newStatus: string) => {
    try {
      setActionLoading(missionId);
      await updateMissionStatus(missionId, newStatus);
      toast.success('Statut de mission mis à jour');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteMission = async (missionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette mission ?')) {
      return;
    }
    
    try {
      setActionLoading(missionId);
      await deleteMission(missionId);
      toast.success('Mission supprimée');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression de la mission');
    } finally {
      setActionLoading(null);
    }
  };

  const handleForceSync = async () => {
    try {
      await refresh();
      toast.success('Données synchronisées');
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      toast.error('Erreur lors de la synchronisation');
    }
  };

  const getAssignedCrewMembers = (mission) => {
    return mission.assignedCrewMembers || [];
  };

  const handleViewMission = (mission) => {
    setSelectedMission(mission);
    setShowMissionModal(true);
  };

  // Statistiques
  const pendingMissions = getPendingMissions();
  const activeMissions = getActiveMissions();
  const completedMissions = getCompletedMissions();
  const confirmedMissions = missions.filter(m => m.status === 'confirmed');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl text-gray-900">Gestion des Missions</h1>
          <p className="text-sm text-gray-600">
            {filteredMissions.length} missions {error ? '• Mode local (fallback)' : '• Supabase connecté'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline"
            onClick={handleForceSync}
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Sync...' : 'Sync'}
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/mission-request/new')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Mission
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <FileText className="h-4 w-4 mr-2" />
            Rapport
          </Button>
        </div>
      </div>

      {/* Indicateur de chargement */}
      {loading && (
        <Alert className="border-blue-200 bg-blue-50">
          <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
          <AlertDescription className="text-blue-800">
            Chargement des données en cours...
          </AlertDescription>
        </Alert>
      )}
      
      {/* Indicateur d'erreur */}
      {error && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Erreur de connexion à Supabase : {error}. Utilisation des données de démonstration.
          </AlertDescription>
        </Alert>
      )}

      {/* Statistiques résumées */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">En Attente</p>
                <p className="text-2xl text-gray-900">{pendingMissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">En Cours</p>
                <p className="text-2xl text-gray-900">{activeMissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Confirmées</p>
                <p className="text-2xl text-gray-900">{confirmedMissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Terminées</p>
                <p className="text-2xl text-gray-900">{completedMissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Rechercher missions, clients, aéronefs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select 
              value={statusFilter} 
              onValueChange={(value) => setStatusFilter(value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmée</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminée</SelectItem>
                <SelectItem value="cancelled">Annulée</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border rounded-md">
              <Button 
                variant={currentView === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('list')}
                className="rounded-r-none"
              >
                <List className="h-4 w-4 mr-1" />
                Liste
              </Button>
              <Button 
                variant={currentView === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('calendar')}
                className="rounded-l-none"
              >
                <Calendar className="h-4 w-4 mr-1" />
                Calendrier
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des missions */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredMissions.length > 0 ? (
          filteredMissions.map((mission) => {
            const assignedCrew = getAssignedCrewMembers(mission);
            
            return (
              <Card key={mission.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Plane className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg text-gray-900">{mission.mission_number}</h3>
                            <Badge className={getStatusColor(mission.status)}>
                              {getStatusIcon(mission.status)}
                              <span className="ml-1">{getStatusLabel(mission.status)}</span>
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {mission.billing_type === 'direct' ? 'Direct' : 'Finance'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{mission.client}</p>
                          <p className="text-sm text-gray-600">{mission.aircraft_type}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Itinéraire */}
                        <div>
                          <h4 className="text-sm text-gray-900 mb-2 flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            Itinéraire
                          </h4>
                          <div className="text-sm text-gray-600">
                            <p>{mission.departure.airport} → {mission.arrival.airport}</p>
                            <p>{new Date(mission.departure.date).toLocaleDateString('fr-FR')}</p>
                            <p>{mission.departure.time} - {mission.arrival.time}</p>
                          </div>
                        </div>

                        {/* Équipage */}
                        <div>
                          <h4 className="text-sm text-gray-900 mb-2 flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            Équipage ({assignedCrew.length})
                          </h4>
                          <div className="space-y-1">
                            {assignedCrew.length > 0 ? (
                              assignedCrew.slice(0, 2).map((crew, idx) => (
                                <div key={idx} className="text-xs text-gray-600">
                                  {crew.name} ({crew.role})
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-orange-600">
                                Aucun équipage assigné
                              </div>
                            )}
                            {assignedCrew.length > 2 && (
                              <div className="text-xs text-gray-500">
                                +{assignedCrew.length - 2} autres
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Budget */}
                        <div>
                          <h4 className="text-sm text-gray-900 mb-2 flex items-center">
                            <Euro className="h-4 w-4 mr-1" />
                            Budget
                          </h4>
                          <div className="text-sm text-gray-600">
                            <p>Budget: {mission.budget?.toLocaleString() || 'N/A'}€</p>
                            <p>Estimé: {mission.estimated_cost?.toLocaleString() || 'N/A'}€</p>
                            {mission.actual_cost && (
                              <p>Réel: {mission.actual_cost.toLocaleString()}€</p>
                            )}
                          </div>
                        </div>

                        {/* Validation */}
                        <div>
                          <h4 className="text-sm text-gray-900 mb-2 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Validation
                          </h4>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1">
                              {mission.validation_status === 'validated' ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : mission.validation_status === 'rejected' ? (
                                <XCircle className="h-3 w-3 text-red-500" />
                              ) : (
                                <Clock className="h-3 w-3 text-yellow-500" />
                              )}
                              <span className="text-xs text-gray-600">
                                {mission.validation_status === 'validated' ? 'Validée' : 
                                 mission.validation_status === 'rejected' ? 'Rejetée' : 'En attente'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              {mission.owner_approval === 'approved' ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : mission.owner_approval === 'rejected' ? (
                                <XCircle className="h-3 w-3 text-red-500" />
                              ) : (
                                <Clock className="h-3 w-3 text-yellow-500" />
                              )}
                              <span className="text-xs text-gray-600">
                                {mission.owner_approval === 'approved' ? 'Approuvée' : 
                                 mission.owner_approval === 'rejected' ? 'Rejetée' : 'En attente'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2 ml-6">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewMission(mission)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/missions/${mission.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      {/* Actions de statut rapides */}
                      {mission.status === 'pending' && (
                        <Button 
                          size="sm"
                          onClick={() => handleUpdateMissionStatus(mission.id, 'confirmed')}
                          disabled={actionLoading === mission.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Confirmer
                        </Button>
                      )}
                      
                      {mission.status === 'confirmed' && (
                        <Button 
                          size="sm"
                          onClick={() => handleUpdateMissionStatus(mission.id, 'in_progress')}
                          disabled={actionLoading === mission.id}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Démarrer
                        </Button>
                      )}
                      
                      {mission.status === 'in_progress' && (
                        <Button 
                          size="sm"
                          onClick={() => handleUpdateMissionStatus(mission.id, 'completed')}
                          disabled={actionLoading === mission.id}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Terminer
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteMission(mission.id)}
                        disabled={actionLoading === mission.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Plane className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg text-gray-900 mb-2">Aucune mission trouvée</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Essayez d\'ajuster vos critères de recherche'
                  : 'Commencez par créer votre première mission'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <div className="flex justify-center space-x-2">
                  <Button 
                    onClick={() => navigate('/mission-request/new')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une Mission
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de détails de mission */}
      <Dialog open={showMissionModal} onOpenChange={setShowMissionModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Détails de la Mission {selectedMission?.mission_number}
            </DialogTitle>
          </DialogHeader>
          {selectedMission && (
            <div className="space-y-6 py-4">
              {/* Informations de base */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Client</Label>
                  <p className="text-sm text-gray-600">{selectedMission.client}</p>
                </div>
                <div>
                  <Label>Type d'aéronef</Label>
                  <p className="text-sm text-gray-600">{selectedMission.aircraft_type}</p>
                </div>
              </div>
              
              <Separator />
              
              {/* Itinéraire */}
              <div>
                <h3 className="text-lg font-medium mb-4">Itinéraire</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Départ</Label>
                    <p className="text-sm text-gray-600">
                      {selectedMission.departure.airport}<br />
                      {new Date(selectedMission.departure.date).toLocaleDateString('fr-FR')} à {selectedMission.departure.time}
                    </p>
                  </div>
                  <div>
                    <Label>Arrivée</Label>
                    <p className="text-sm text-gray-600">
                      {selectedMission.arrival.airport}<br />
                      {new Date(selectedMission.arrival.date).toLocaleDateString('fr-FR')} à {selectedMission.arrival.time}
                    </p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Équipage assigné */}
              <div>
                <h3 className="text-lg font-medium mb-4">Équipage Assigné</h3>
                <div className="space-y-2">
                  {getAssignedCrewMembers(selectedMission).map((crew, idx) => (
                    <div key={idx} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                      <div className="p-1 bg-blue-100 rounded">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{crew.name}</p>
                        <p className="text-sm text-gray-600">{crew.role} • {crew.email}</p>
                      </div>
                    </div>
                  ))}
                  {getAssignedCrewMembers(selectedMission).length === 0 && (
                    <p className="text-sm text-gray-500">Aucun équipage assigné</p>
                  )}
                </div>
              </div>
              
              <Separator />
              
              {/* Budget et coûts */}
              <div>
                <h3 className="text-lg font-medium mb-4">Budget et Coûts</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Budget prévu</Label>
                    <p className="text-sm text-gray-600">{selectedMission.budget?.toLocaleString() || 'N/A'}€</p>
                  </div>
                  <div>
                    <Label>Coût estimé</Label>
                    <p className="text-sm text-gray-600">{selectedMission.estimated_cost?.toLocaleString() || 'N/A'}€</p>
                  </div>
                  <div>
                    <Label>Coût réel</Label>
                    <p className="text-sm text-gray-600">{selectedMission.actual_cost?.toLocaleString() || 'N/A'}€</p>
                  </div>
                </div>
              </div>
              
              {selectedMission.notes && (
                <>
                  <Separator />
                  <div>
                    <Label>Notes</Label>
                    <p className="text-sm text-gray-600 mt-2">{selectedMission.notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}