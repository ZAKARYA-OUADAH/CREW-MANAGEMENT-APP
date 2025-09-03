import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { getMissionOrderById, getStatusColor, getStatusText, getMissionTypeText, type MissionOrder } from './MissionOrderService';
import { 
  ArrowLeft,
  Download,
  Plane,
  Calendar,
  DollarSign,
  User,
  FileText,
  Building,
  CheckCircle,
  Stamp,
  Shield
} from 'lucide-react';

export default function FinalMissionOrder() {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const [mission, setMission] = useState<MissionOrder | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadMission = async () => {
      if (!missionId) {
        navigate('/');
        return;
      }

      try {
        console.log('Loading final mission order with ID:', missionId);
        const missionData = await getMissionOrderById(missionId);
        console.log('Mission data loaded:', missionData);
        
        // Ensure the mission is validated before showing final order
        if (missionData && missionData.status !== 'validated') {
          console.warn('Mission is not validated, redirecting to regular view');
          navigate(`/missions/${missionId}`);
          return;
        }
        
        setMission(missionData || null);
      } catch (error) {
        console.error('Error loading final mission order:', error);
        setMission(null);
      } finally {
        setLoading(false);
      }
    };

    loadMission();
  }, [missionId, navigate]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour</span>
          </Button>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }
  
  if (!mission) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour</span>
          </Button>
        </div>
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg text-gray-900 mb-2">Ordre de mission final non trouvé</h3>
            <p className="text-gray-600">L'ordre de mission final demandé n'existe pas ou n'est pas encore validé.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateMissionDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const calculateTotalCompensation = () => {
    // Si une facture existe, utiliser ses montants pour l'ordre final
    if (mission?.serviceInvoice) {
      return {
        contractSubtotal: mission.serviceInvoice.contractSubtotal,
        expensesSubtotal: mission.serviceInvoice.expensesSubtotal,
        subtotal: mission.serviceInvoice.subtotal,
        taxAmount: mission.serviceInvoice.taxAmount,
        total: mission.serviceInvoice.total,
        currency: mission.serviceInvoice.currency,
        taxRate: mission.serviceInvoice.taxRate,
        invoiceLines: mission.serviceInvoice.lines,
        hasInvoice: true
      };
    }
    
    // Sinon, utiliser le calcul basé sur le contrat (ancien comportement)
    if (!mission?.contract?.startDate || !mission?.contract?.endDate) {
      return {
        salary: 0,
        perDiem: 0,
        total: 0,
        currency: 'EUR',
        hasInvoice: false
      };
    }
    
    const days = calculateMissionDuration(mission.contract.startDate, mission.contract.endDate);
    const salary = mission.contract.salaryType === 'daily' 
      ? (mission.contract.salaryAmount || 0) * days 
      : (mission.contract.salaryAmount || 0);
    
    const perDiem = mission.contract.hasPerDiem 
      ? (mission.contract.perDiemAmount || 0) * days 
      : 0;
    
    return {
      salary,
      perDiem,
      total: salary + perDiem,
      currency: mission.contract.salaryCurrency || 'EUR',
      hasInvoice: false
    };
  };

  const handleDownloadFinal = () => {
    // In a real application, this would generate and download a final PDF with official stamps
    window.print();
  };

  const compensation = calculateTotalCompensation();
  const duration = mission?.contract?.startDate && mission?.contract?.endDate 
    ? calculateMissionDuration(mission.contract.startDate, mission.contract.endDate)
    : 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Actions */}
      <div className="flex items-center justify-between print:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour aux missions</span>
        </Button>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleDownloadFinal}
            className="flex items-center space-x-2 bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
          >
            <Download className="h-4 w-4" />
            <span>Télécharger Ordre Final</span>
          </Button>
        </div>
      </div>

      {/* Final Order Confirmation */}
      <Alert className="border-green-200 bg-green-50 print:border-green-400">
        <Shield className="h-4 w-4 text-green-600" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="text-green-800">
              <strong>ORDRE DE MISSION OFFICIEL ET DÉFINITIF</strong>
            </p>
            <p className="text-green-700 text-sm">
              Ce document constitue l'ordre de mission final, officiel et légalement contraignant. 
              Toutes les informations ont été validées par l'équipage et approuvées par l'administration.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Final Mission Order Document */}
      <Card className="print:shadow-none print:border-2 print:border-green-600">
        <CardHeader className="text-center border-b bg-green-50 print:bg-white">
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-2 text-2xl text-gray-900">
              <Building className="h-8 w-8" />
              <span>AVIATION COMPANY</span>
            </div>
            <div>
              <CardTitle className="text-xl text-green-800">
                ORDRE DE MISSION FINAL
              </CardTitle>
              <p className="text-sm text-green-600 mt-1">
                Final Mission Order - Official Document
              </p>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <Badge className="bg-green-100 text-green-800 text-sm">
                VALIDÉ
              </Badge>
              <Badge variant="outline" className="text-sm border-green-200">
                {getMissionTypeText(mission.type)}
              </Badge>
              <Badge className="bg-green-600 text-white text-sm">
                <Stamp className="h-3 w-3 mr-1" />
                FINAL
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          {/* Official Validation Notice */}
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <p className="text-green-800 text-sm">
                <strong>DOCUMENT OFFICIEL VALIDÉ :</strong> Cette mission a été completée, 
                validée par l'équipage et approuvée définitivement par l'administration le{' '}
                {mission.validatedAt ? formatDateTime(mission.validatedAt) : 'N/A'}. 
                Ce document fait foi pour tous les aspects contractuels et financiers.
                {compensation.hasInvoice && (
                  <span className="block mt-2">
                    <strong>MONTANTS BASÉS SUR FACTURE :</strong> Les montants finaux de cet ordre 
                    sont basés sur la facture de service validée (numéro: {mission.serviceInvoice?.invoiceNumber}).
                  </span>
                )}
              </p>
            </AlertDescription>
          </Alert>

          <Separator />

          {/* Mission ID and Dates - Final */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg text-gray-900 mb-3">Référence Mission</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Numéro d'ordre:</span>
                  <span className="text-gray-900">{mission.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date de création:</span>
                  <span className="text-gray-900">{formatDate(mission.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date de validation finale:</span>
                  <span className="text-green-700">
                    {mission.validatedAt ? formatDateTime(mission.validatedAt) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut:</span>
                  <span className="text-green-700">
                    <strong>Ordre définitif et final</strong>
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg text-gray-900 mb-3">
                Période de Mission (Définitive)
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date de début:</span>
                  <span className="text-gray-900">
                    {mission.contract?.startDate ? formatDate(mission.contract.startDate) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date de fin:</span>
                  <span className="text-gray-900">
                    {mission.contract?.endDate ? formatDate(mission.contract.endDate) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Durée totale:</span>
                  <span className="text-gray-900">
                    <strong>{duration} jour(s)</strong>
                  </span>
                </div>
                {mission.dateModificationApprovedAt && (
                  <p className="text-xs text-green-600 mt-2">
                    Dates modifiées et approuvées le {formatDateTime(mission.dateModificationApprovedAt)}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Crew Information */}
          <div>
            <h3 className="text-lg text-gray-900 mb-4 flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Membre d'Équipage</span>
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nom:</span>
                  <span className="text-gray-900">{mission.crew?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Position:</span>
                  <span className="text-gray-900">{mission.crew?.position || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GGID:</span>
                  <span className="text-gray-900">{mission.crew?.ggid || 'N/A'}</span>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="text-gray-900">{mission.crew?.email || 'N/A'}</span>
                </div>
                {mission.crew?.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Téléphone:</span>
                    <span className="text-gray-900">{mission.crew.phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="text-gray-900">{mission.crew?.type === 'freelancer' ? 'Freelance' : 'Interne'}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Aircraft Information */}
          <div>
            <h3 className="text-lg text-gray-900 mb-4 flex items-center space-x-2">
              <Plane className="h-5 w-5" />
              <span>Aéronef Assigné</span>
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Immatriculation:</span>
                  <span className="text-gray-900">{mission.aircraft?.immat || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type d'aéronef:</span>
                  <span className="text-gray-900">{mission.aircraft?.type || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">AC ID:</span>
                  <span className="text-gray-900">#{mission.aircraft?.id || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Flight Schedule - Final */}
          <div>
            <h3 className="text-lg text-gray-900 mb-4 flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Programme de Vol Réalisé</span>
            </h3>
            <div className="space-y-3">
              {mission.flights && mission.flights.length > 0 ? (
                mission.flights.map((flight, index) => (
                  <div key={flight.id || index} className="bg-gray-50 p-4 rounded-lg border-l-4 border-green-500">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Vol:</span>
                        <div className="text-gray-900">{flight.flight || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Route:</span>
                        <div className="text-gray-900">{flight.departure || 'N/A'} → {flight.arrival || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Date:</span>
                        <div className="text-gray-900">
                          {flight.date ? formatDate(flight.date) : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Heure:</span>
                        <div className="text-gray-900">
                          {flight.time || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                  Aucun vol programmé
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Final Compensation Details */}
          <div>
            <h3 className="text-lg text-gray-900 mb-4 flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Rémunération Finale</span>
              {compensation.hasInvoice && (
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  Basé sur facture
                </Badge>
              )}
            </h3>
            <div className="bg-green-50 p-4 rounded-lg space-y-4 border border-green-200">
              <Alert className="border-green-300 bg-green-100">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <p className="text-green-800 text-xs">
                    <strong>MONTANTS DÉFINITIFS :</strong> {compensation.hasInvoice 
                      ? 'Ces montants sont issus de la facture de service validée et incluent le contrat de base ainsi que les dépenses annexes.' 
                      : 'Ces montants sont finaux et ont été calculés selon la durée réelle de la mission validée.'
                    }
                  </p>
                </AlertDescription>
              </Alert>
              
              {compensation.hasInvoice ? (
                // Affichage basé sur la facture
                <div className="space-y-4">
                  {/* Détail des lignes de facturation */}
                  <div>
                    <h4 className="text-sm text-gray-900 mb-3">Détail des Prestations Facturées</h4>
                    <div className="space-y-2">
                      {compensation.invoiceLines?.map((line, index) => (
                        <div key={line.id} className="flex justify-between items-center p-2 bg-white rounded text-sm">
                          <div className="flex-1">
                            <span className="text-gray-900">{line.description}</span>
                            <span className="text-gray-500 ml-2">({line.quantity} x {line.unitPrice.toLocaleString()} {compensation.currency})</span>
                          </div>
                          <span className="text-gray-900 font-medium">
                            {line.total.toLocaleString()} {compensation.currency}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Récapitulatif financier */}
                  <div className="space-y-2">
                    {compensation.contractSubtotal > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-700">Contrat de base:</span>
                        <span className="text-blue-700 font-medium">
                          {compensation.contractSubtotal.toLocaleString()} {compensation.currency}
                        </span>
                      </div>
                    )}
                    {compensation.expensesSubtotal > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">Dépenses annexes:</span>
                        <span className="text-gray-700 font-medium">
                          {compensation.expensesSubtotal.toLocaleString()} {compensation.currency}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sous-total HT:</span>
                      <span className="text-gray-900 font-medium">
                        {compensation.subtotal.toLocaleString()} {compensation.currency}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">TVA ({compensation.taxRate}%):</span>
                      <span className="text-gray-900 font-medium">
                        {compensation.taxAmount.toLocaleString()} {compensation.currency}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                // Affichage basé sur le contrat (ancien comportement)
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type de tarif:</span>
                      <span className="text-gray-900">
                        {mission.contract?.salaryType === 'daily' ? 'Tarif journalier' : 'Tarif mensuel'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Montant unitaire:</span>
                      <span className="text-gray-900">
                        {(mission.contract?.salaryAmount || 0).toLocaleString()} {mission.contract?.salaryCurrency || 'EUR'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Salaire total:</span>
                      <span className="text-gray-900">
                        <strong>{compensation.salary?.toLocaleString()} {compensation.currency}</strong>
                      </span>
                    </div>
                  </div>
                  
                  {mission.contract?.hasPerDiem && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Per Diem journalier:</span>
                        <span className="text-gray-900">
                          {(mission.contract.perDiemAmount || 0).toLocaleString()} {mission.contract.perDiemCurrency || 'EUR'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Per Diem total:</span>
                        <span className="text-gray-900">
                          <strong>{compensation.perDiem?.toLocaleString()} {compensation.currency}</strong>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between text-xl text-gray-900 bg-white p-4 rounded-lg border-2 border-green-300">
                <span><strong>Total {compensation.hasInvoice ? 'Facturé' : 'Rémunération'} Final{compensation.hasInvoice ? ' TTC' : ''}:</strong></span>
                <span className="text-green-700">
                  <strong>{compensation.total.toLocaleString()} {compensation.currency}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          {mission.contract?.additionalNotes && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg text-gray-900 mb-3">Notes de Mission</h3>
                <div className="bg-yellow-50 p-4 rounded-lg text-sm text-gray-700 border border-yellow-200">
                  {mission.contract.additionalNotes.replace(/ORDRE PROVISOIRE.*?mission\./g, '').trim()}
                </div>
              </div>
            </>
          )}

          {/* Final Validation Details */}
          <Separator />
          <div>
            <h3 className="text-lg text-gray-900 mb-3">Validation Finale</h3>
            <div className="bg-green-50 p-4 rounded-lg text-sm border border-green-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mission complétée le:</span>
                    <span className="text-gray-900">
                      {mission.completedAt ? formatDate(mission.completedAt) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Validation finale le:</span>
                    <span className="text-green-700">
                      <strong>{mission.validatedAt ? formatDateTime(mission.validatedAt) : 'N/A'}</strong>
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Statut final:</span>
                    <span className="text-green-700">
                      <strong>Mission validée et finalisée</strong>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Document:</span>
                    <span className="text-green-700">
                      <strong>Version officielle finale</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Official Legal Footer */}
          <Separator />
          <div className="text-center text-xs text-gray-500 space-y-2 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-green-700 text-sm">
                <strong>DOCUMENT OFFICIEL FINAL</strong>
              </span>
            </div>
            <p className="text-gray-700">
              <strong>Ce document constitue l'ordre de mission officiel final et définitif.</strong>
            </p>
            <p>
              Il fait foi pour tous les aspects contractuels, financiers et légaux de cette mission.
              Veuillez le conserver dans vos dossiers officiels.
            </p>
            <p>
              Aviation Company - Département Ressources Humaines
            </p>
            <p>
              Document final généré le {formatDateTime(new Date().toISOString())}
            </p>
            <p className="text-green-600">
              <strong>Version finale - Document officiel</strong>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}