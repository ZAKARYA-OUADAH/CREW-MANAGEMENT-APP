import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { getMissionOrderById, type MissionOrder } from './MissionOrderService';
import { 
  ArrowLeft,
  Download,
  Receipt,
  Building,
  Calendar,
  FileText,
  Hash,
  Euro,
  User,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

export default function ServiceInvoiceDocument() {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const [mission, setMission] = useState<MissionOrder | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadMission = async () => {
      if (!missionId) {
        navigate('/');;
        return;
      }

      try {
        console.log('Loading mission for invoice with ID:', missionId);
        const missionData = await getMissionOrderById(missionId);
        console.log('Mission data loaded for invoice:', missionData);
        setMission(missionData || null);
      } catch (error) {
        console.error('Error loading mission for invoice:', error);
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
  
  if (!mission || mission.type !== 'service' || !mission.serviceInvoice) {
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
            <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg text-gray-900 mb-2">Facture non disponible</h3>
            <p className="text-gray-600">
              Cette mission n'a pas de facture de service ou n'est pas de type service.
            </p>
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

  const getCategoryLabel = (category: string): string => {
    const categories: Record<string, string> = {
      'transport': 'Transport',
      'accommodation': 'Hébergement',
      'meals': 'Repas',
      'fuel': 'Carburant',
      'maintenance': 'Maintenance',
      'equipment': 'Équipement',
      'communication': 'Communication',
      'other': 'Autre'
    };
    return categories[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

  const handleDownload = () => {
    // In a real application, this would generate and download a PDF
    window.print();
  };

  const invoice = mission.serviceInvoice;

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
          <span>Retour à la mission</span>
        </Button>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleDownload}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Télécharger PDF</span>
          </Button>
        </div>
      </div>

      {/* Invoice Document */}
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="border-b bg-gray-50 print:bg-white">
          <div className="space-y-6">
            {/* Company Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Building className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl text-gray-900">AVIATION COMPANY</h1>
                  <p className="text-sm text-gray-600">Service Prestations Aéronautiques</p>
                </div>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p>123 Rue de l'Aviation</p>
                <p>75001 Paris, France</p>
                <p>Tel: +33 1 23 45 67 89</p>
                <p>Email: billing@aviation-company.com</p>
              </div>
            </div>

            {/* Invoice Title */}
            <div className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center space-x-2">
                <Receipt className="h-6 w-6" />
                <span>FACTURE DE SERVICE</span>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Service Invoice</p>
            </div>

            {/* Invoice Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg text-gray-900 mb-3">Informations Facture</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Numéro:</span>
                    <span className="text-gray-900 font-mono">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date d'émission:</span>
                    <span className="text-gray-900">{formatDate(invoice.invoiceDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mission:</span>
                    <span className="text-gray-900">{mission.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Devise:</span>
                    <span className="text-gray-900">{invoice.currency}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg text-gray-900 mb-3">Prestataire</h3>
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
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="text-gray-900">{mission.crew?.email || 'N/A'}</span>
                  </div>
                  {invoice.vatNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">N° TVA:</span>
                      <span className="text-gray-900">{invoice.vatNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-8">
          {/* Mission Period */}
          <div>
            <h3 className="text-lg text-gray-900 mb-4 flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Période de Prestation</span>
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
                <span className="text-gray-600">Aéronef:</span>
                <span className="text-gray-900">{mission.aircraft?.immat || 'N/A'}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* External Invoice File */}
          {invoice.externalInvoiceFile && (
            <>
              <Alert className="border-blue-200 bg-blue-50">
                <FileText className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="text-blue-800">
                      <strong>Document externe joint:</strong> {invoice.externalInvoiceFile.name}
                    </p>
                    <p className="text-blue-600 text-sm">
                      Uploadé le {formatDateTime(invoice.externalInvoiceFile.uploadedAt)} 
                      ({(invoice.externalInvoiceFile.size / 1024).toFixed(1)} KB - {invoice.externalInvoiceFile.type})
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
              <Separator />
            </>
          )}

          {/* Invoice Lines */}
          <div>
            <h3 className="text-lg text-gray-900 mb-4">Détail des Prestations</h3>
            
            {/* Table Header */}
            <div className="bg-gray-100 rounded-t-lg p-3 grid grid-cols-12 gap-2 text-sm font-medium text-gray-700">
              <div className="col-span-5">Description</div>
              <div className="col-span-1 text-center">Qté</div>
              <div className="col-span-2 text-right">Prix Unit. HT</div>
              <div className="col-span-2 text-center">Catégorie</div>
              <div className="col-span-2 text-right">Total HT</div>
            </div>
            
            {/* Table Rows */}
            <div className="border border-t-0 rounded-b-lg">
              {invoice.lines.map((line, index) => (
                <div key={line.id} className={`p-3 grid grid-cols-12 gap-2 text-sm ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <div className="col-span-5">
                    <span className="text-gray-900">{line.description}</span>
                  </div>
                  <div className="col-span-1 text-center text-gray-700">
                    {line.quantity}
                  </div>
                  <div className="col-span-2 text-right text-gray-700">
                    {line.unitPrice.toFixed(2)} €
                  </div>
                  <div className="col-span-2 text-center">
                    <Badge variant="outline" className="text-xs">
                      {getCategoryLabel(line.category)}
                    </Badge>
                  </div>
                  <div className="col-span-2 text-right text-gray-900 font-medium">
                    {line.total.toFixed(2)} €
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Invoice Totals */}
          <div className="space-y-4">
            <h3 className="text-lg text-gray-900">Récapitulatif</h3>
            
            <div className="bg-gray-50 p-6 rounded-lg space-y-3">
              <div className="flex justify-between text-base">
                <span className="text-gray-600">Sous-total HT:</span>
                <span className="text-gray-900">{invoice.subtotal.toFixed(2)} {invoice.currency}</span>
              </div>
              
              <div className="flex justify-between text-base">
                <span className="text-gray-600">TVA ({invoice.taxRate}%):</span>
                <span className="text-gray-900">{invoice.taxAmount.toFixed(2)} {invoice.currency}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between text-xl font-medium">
                <span className="text-gray-900">Total TTC:</span>
                <span className="text-gray-900">{invoice.total.toFixed(2)} {invoice.currency}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg text-gray-900 mb-3">Notes</h3>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-sm text-gray-700">{invoice.notes}</p>
                </div>
              </div>
            </>
          )}

          {/* Payment Information */}
          <Separator />
          <div>
            <h3 className="text-lg text-gray-900 mb-3">Informations de Paiement</h3>
            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
              <p><strong>Conditions de paiement:</strong> 30 jours à réception de facture</p>
              <p><strong>Mode de paiement:</strong> Virement bancaire</p>
              <p className="mt-2 text-xs text-blue-600">
                Cette facture est établie conformément aux prestations de service effectuées dans le cadre de la mission {mission.id}.
                En cas de question, veuillez contacter le service comptabilité.
              </p>
            </div>
          </div>

          {/* Legal Footer */}
          <Separator />
          <div className="text-center text-xs text-gray-500 space-y-2">
            <p>
              Aviation Company - SIRET: 12345678901234 - APE: 5110Z
            </p>
            <p>
              TVA Intracommunautaire: FR12345678901 - Capital social: 100.000 €
            </p>
            <p>
              Document généré le {formatDateTime(new Date().toISOString())}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}