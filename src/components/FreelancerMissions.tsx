import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from './AuthProvider';
import { apiClient } from '../utils/supabase/client';
import { 
  useMissionOrders, 
  usePendingValidationMissions,
  getStatusColor, 
  getStatusText, 
  getMissionTypeText,
  type MissionOrder 
} from './MissionOrderService';
import { 
  FileText, 
  Eye, 
  Download, 
  Calendar, 
  User, 
  Plane, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  MapPin,
  Receipt
} from 'lucide-react';

export default function FreelancerMissions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Get missions for current user
  const { missionOrders, loading, refreshMissionOrders } = useMissionOrders(user?.id);
  const { pendingMissions, loading: validationLoading } = usePendingValidationMissions(user?.id || '');



  const filteredMissions = missionOrders?.filter(mission => {
    const matchesSearch = mission.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mission.aircraft?.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         mission.aircraft?.immat?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || mission.status === statusFilter;
    const matchesType = typeFilter === 'all' || mission.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  const getTypeColor = (type: MissionOrder['type']) => {
    switch (type) {
      case 'freelance': return 'bg-purple-100 text-purple-800';
      case 'extra_day': return 'bg-blue-100 text-blue-800';
      case 'service': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateMissionDuration = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const calculateTotalCompensation = (mission: MissionOrder) => {
    if (!mission.contract) {
      return { salary: 0, perDiem: 0, total: 0, currency: 'EUR' };
    }
    
    const days = calculateMissionDuration(mission.contract.startDate, mission.contract.endDate);
    const salaryAmount = mission.contract.salaryAmount || 0;
    const salary = mission.contract.salaryType === 'daily' 
      ? salaryAmount * days 
      : salaryAmount;
    
    const perDiem = mission.contract.hasPerDiem 
      ? (mission.contract.perDiemAmount || 0) * days 
      : 0;
    
    return {
      salary,
      perDiem,
      total: salary + perDiem,
      currency: mission.contract.salaryCurrency || 'EUR'
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleValidateMission = (missionId: string) => {
    navigate(`/missions/${missionId}/validate`);
  };

  if (loading || validationLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl text-gray-900">Mes Missions</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl text-gray-900">Mes Missions</h1>
        <Button variant="outline" onClick={refreshMissionOrders}>
          Actualiser
        </Button>
      </div>



      {/* Pending Validation Alert */}
      {pendingMissions && pendingMissions.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <p className="text-orange-800 text-sm">
                <strong>Validation requise :</strong> Vous avez {pendingMissions.length} mission(s) terminée(s) qui nécessitent votre validation.
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-orange-300 text-orange-800 hover:bg-orange-100"
                onClick={() => setStatusFilter('pending_validation')}
              >
                Voir les missions
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Rechercher missions, avions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="approved">Approuvé</SelectItem>
                <SelectItem value="pending_validation">En attente de validation</SelectItem>
                <SelectItem value="validated">Validé</SelectItem>
                <SelectItem value="completed">Complété</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="extra_day">Jour supplémentaire</SelectItem>
                <SelectItem value="freelance">Mission Freelance</SelectItem>
                <SelectItem value="service">Prestation de service</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Mission Tabs */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Liste des missions</TabsTrigger>
          <TabsTrigger value="calendar">Vue calendrier</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="grid gap-4">
            {filteredMissions.map((mission) => {
              const compensation = calculateTotalCompensation(mission);
              const duration = calculateMissionDuration(mission.contract?.startDate, mission.contract?.endDate);
              
              return (
                <Card key={mission.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3 flex-wrap">
                            <Badge variant="outline" className="text-sm">{mission.id}</Badge>
                            <Badge className={getStatusColor(mission.status)}>
                              {getStatusText(mission.status)}
                            </Badge>
                            <Badge className={getTypeColor(mission.type)}>
                              {getMissionTypeText(mission.type)}
                            </Badge>
                            
                            {/* Validation needed indicator */}
                            {mission.status === 'pending_validation' && (
                              <Badge className="bg-orange-100 text-orange-800 border-orange-200 animate-pulse">
                                <Clock className="h-3 w-3 mr-1" />
                                Validation requise
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/missions/${mission.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          
                          {/* Service Invoice button for service missions with invoice */}
                          {mission.type === 'service' && mission.serviceInvoice && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/missions/${mission.id}/invoice`)}
                              className="text-orange-600 border-orange-200 hover:bg-orange-50"
                              title="Voir la facture de service"
                            >
                              <Receipt className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Final Order button for validated missions */}
                          {mission.status === 'validated' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/missions/${mission.id}/final`)}
                              className="text-green-600 border-green-200 hover:bg-green-50"
                              title="Voir l'ordre de mission final"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {mission.status === 'pending_validation' && (
                            <Button 
                              size="sm" 
                              className="bg-orange-600 hover:bg-orange-700"
                              onClick={() => handleValidateMission(mission.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Valider
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Mission Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-gray-900">{mission.crew?.name || 'Unknown'}</p>
                            <p className="text-gray-500">{mission.crew?.position || 'Unknown'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Plane className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-gray-900">{mission.aircraft?.immat || 'Unknown'}</p>
                            <p className="text-gray-500">{mission.aircraft?.type || 'Unknown'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-gray-900">{duration} jour(s)</p>
                            <p className="text-gray-500">
                              {mission.contract?.startDate ? formatDate(mission.contract.startDate) : 'No start date'} - {mission.contract?.endDate ? formatDate(mission.contract.endDate) : 'No end date'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-gray-900">{compensation.total.toLocaleString()} {compensation.currency}</p>
                            <p className="text-gray-500">
                              {mission.contract?.salaryAmount || 0} {compensation.currency}/{mission.contract?.salaryType === 'daily' ? 'jour' : 'mois'}
                              {mission.contract?.hasPerDiem && ` + ${mission.contract.perDiemAmount || 0} per diem`}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Flights */}
                      <div className="space-y-2">
                        <h4 className="text-sm text-gray-700">Vols :</h4>
                        <div className="space-y-1">
                          {mission.flights && mission.flights.length > 0 ? mission.flights.map((flight) => (
                            <div key={flight.id || flight.flight} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">{flight.flight || 'Unknown'}</Badge>
                                <MapPin className="h-3 w-3 text-gray-400" />
                                <span>{flight.departure || 'Unknown'} → {flight.arrival || 'Unknown'}</span>
                              </div>
                              <div className="text-gray-600">
                                {flight.date ? formatDate(flight.date) : 'No date'} {flight.time || 'No time'}
                              </div>
                            </div>
                          )) : (
                            <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
                              Aucun vol associé à cette mission
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Validation Alert for pending missions */}
                      {mission.status === 'pending_validation' && (
                        <Alert className="border-orange-200 bg-orange-50">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <AlertDescription>
                            <div className="flex items-center justify-between">
                              <p className="text-orange-800 text-sm">
                                <strong>Action requise :</strong> Cette mission est terminée et nécessite votre validation. 
                                Veuillez vérifier les détails et confirmer vos informations de paiement.
                              </p>
                              <Button 
                                size="sm" 
                                className="bg-orange-600 hover:bg-orange-700"
                                onClick={() => handleValidateMission(mission.id)}
                              >
                                Valider maintenant
                              </Button>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Service Invoice Notification for service missions with invoice */}
                      {mission.type === 'service' && mission.serviceInvoice && (
                        <Alert className="border-orange-200 bg-orange-50">
                          <Receipt className="h-4 w-4 text-orange-600" />
                          <AlertDescription>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-orange-800 text-sm">
                                  <strong>Facture de service disponible :</strong> Facture #{mission.serviceInvoice.invoiceNumber} générée.
                                </p>
                                <p className="text-orange-600 text-xs mt-1">
                                  Total: {mission.serviceInvoice.total.toFixed(2)} {mission.serviceInvoice.currency} TTC
                                </p>
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => navigate(`/missions/${mission.id}/invoice`)}
                                className="text-orange-600 border-orange-200 hover:bg-orange-50"
                              >
                                <Receipt className="h-4 w-4 mr-1" />
                                Voir facture
                              </Button>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Final Order Notification for validated missions */}
                      {mission.status === 'validated' && mission.validation?.validatedAt && (
                        <Alert className="border-green-200 bg-green-50">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-green-800 text-sm">
                                  <strong>Mission validée :</strong> Validée le {formatDate(mission.validation.validatedAt)}. 
                                  {mission.validation.ribConfirmed ? ' RIB confirmé.' : ' Mise à jour RIB en attente.'}
                                </p>
                                <p className="text-green-600 text-xs mt-1">
                                  L'ordre de mission final est maintenant disponible.
                                </p>
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => navigate(`/missions/${mission.id}/final`)}
                                className="text-green-600 border-green-200 hover:bg-green-50"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Ordre final
                              </Button>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Additional Notes */}
                      {mission.contract?.additionalNotes && (
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          <strong>Notes :</strong> {mission.contract.additionalNotes}
                        </div>
                      )}

                      {/* Validation Comments (if user has validated) */}
                      {mission.validation?.crewComments && (
                        <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                          <strong>Mes commentaires :</strong> {mission.validation.crewComments}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          {filteredMissions.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg text-gray-900 mb-2">Aucune mission trouvée</h3>
                <p className="text-gray-600">Essayez d'ajuster vos critères de recherche</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg text-gray-900 mb-2">Vue Calendrier</h3>
                <p className="text-gray-600">La visualisation calendrier des missions sera implémentée ici</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}