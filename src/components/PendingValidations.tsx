import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useNotifications } from './NotificationContext';
import { apiClient } from '../utils/supabase/client';
import { 
  AlertTriangle,
  CheckCircle, 
  XCircle,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Shield,
  Clock,
  Eye,
  Loader2,
  RefreshCw,
  Plus,
  Database
} from 'lucide-react';

interface PendingFreelancer {
  id: string;
  email: string;
  name: string;
  status: 'pending_validation' | 'inactive' | 'active';
  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    position: string;
    dateOfBirth?: string;
    nationality?: string;
    address?: string;
    completionStatus: string;
    documentsStatus: 'pending' | 'approved' | 'rejected';
    licenses?: Array<{
      type: string;
      number: string;
      expiryDate: string;
      status: 'pending' | 'approved' | 'rejected';
    }>;
    documents?: Array<{
      type: string;
      status: 'pending' | 'approved' | 'rejected';
      uploadedAt: string;
      comments?: string;
    }>;
  };
  createdAt: string;
  acceptedInvitationAt?: string;
}

export default function PendingValidations() {
  const { showToast } = useNotifications();
  const [pendingFreelancers, setPendingFreelancers] = useState<PendingFreelancer[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedFreelancer, setSelectedFreelancer] = useState<PendingFreelancer | null>(null);
  const [validationAction, setValidationAction] = useState<'approve' | 'reject' | null>(null);
  const [validationComments, setValidationComments] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creatingTestData, setCreatingTestData] = useState(false);

  useEffect(() => {
    loadPendingValidations();
  }, []);

  const loadPendingValidations = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading pending validations...');
      const response = await apiClient.getPendingValidations();
      setPendingFreelancers(response.freelancers || []);
      console.log('Loaded pending validations:', response.freelancers?.length || 0);
    } catch (error) {
      console.error('Error loading pending validations:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check if it's an authentication error
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        setError('Accès refusé: Vous devez être administrateur pour voir les validations en attente.');
        showToast('error', 'Accès refusé', 'Droits administrateur requis');
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        setError('Non authentifié: Veuillez vous reconnecter.');
        showToast('error', 'Authentification requise', 'Veuillez vous reconnecter');
      } else if (errorMessage.includes('Network error')) {
        setError('Erreur réseau: Impossible de contacter le serveur.');
        showToast('error', 'Erreur réseau', 'Serveur indisponible');
      } else {
        setError(`Erreur lors du chargement des validations: ${errorMessage}`);
        showToast('error', 'Erreur', 'Impossible de charger les validations');
      }
      
      // Don't set mock data on error, let user create test data if needed
      setPendingFreelancers([]);
    } finally {
      setLoading(false);
    }
  };

  const createTestData = async () => {
    setCreatingTestData(true);
    try {
      console.log('Creating test pending validations...');
      const response = await apiClient.createTestPendingValidations();
      console.log('Test data created:', response);
      showToast('success', 'Données de test créées', `${response.users?.length || 0} freelancers en attente créés`);
      
      // Reload data
      await loadPendingValidations();
    } catch (error) {
      console.error('Error creating test data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      showToast('error', 'Erreur', `Impossible de créer les données de test: ${errorMessage}`);
    } finally {
      setCreatingTestData(false);
    }
  };

  const handleValidateFreelancer = async (freelancerId: string, action: 'approve' | 'reject', comments?: string) => {
    setProcessing(freelancerId);
    try {
      console.log(`${action}ing freelancer:`, freelancerId);
      
      if (action === 'approve') {
        await apiClient.approveFreelancerValidation(freelancerId, comments);
        showToast('success', 'Freelancer approuvé', 'Le freelancer a été validé et activé');
      } else {
        await apiClient.rejectFreelancerValidation(freelancerId, comments || 'Documents non conformes');
        showToast('success', 'Freelancer rejeté', 'La validation a été refusée');
      }
      
      // Refresh the list
      await loadPendingValidations();
      
      // Close dialog
      setSelectedFreelancer(null);
      setValidationAction(null);
      setValidationComments('');
      
    } catch (error) {
      console.error('Error validating freelancer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      showToast('error', 'Erreur', `Impossible de traiter la validation: ${errorMessage}`);
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approuvé</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityColor = (createdAt: string) => {
    const daysSinceCreated = Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceCreated > 7) return 'border-red-200 bg-red-50';
    if (daysSinceCreated > 3) return 'border-yellow-200 bg-yellow-50';
    return 'border-blue-200 bg-blue-50';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Chargement des validations en attente...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Validations en attente</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadPendingValidations}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              {pendingFreelancers.length === 0 && !error && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={createTestData}
                  disabled={creatingTestData}
                >
                  <Database className={`h-4 w-4 mr-2 ${creatingTestData ? 'animate-spin' : ''}`} />
                  Créer données de test
                </Button>
              )}
              <Badge className="bg-yellow-100 text-yellow-800">
                {pendingFreelancers.length} en attente
              </Badge>
            </div>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Validez les profils et documents des nouveaux freelancers avant leur activation.
          </p>
        </CardHeader>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <p className="text-red-800 text-sm">
              <strong>Erreur:</strong> {error}
            </p>
            <div className="flex space-x-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadPendingValidations}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={createTestData}
                disabled={creatingTestData}
              >
                <Database className={`h-4 w-4 mr-2 ${creatingTestData ? 'animate-spin' : ''}`} />
                Créer données de test
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* No pending validations */}
      {!error && pendingFreelancers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg text-gray-900 mb-2">Aucune validation en attente</h3>
            <p className="text-gray-600 mb-4">Toutes les demandes ont été traitées.</p>
            <Button
              variant="outline"
              onClick={createTestData}
              disabled={creatingTestData}
            >
              <Database className={`h-4 w-4 mr-2 ${creatingTestData ? 'animate-spin' : ''}`} />
              Créer des données de test
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pending freelancers list */}
      <div className="space-y-4">
        {pendingFreelancers.map((freelancer) => (
          <Card key={freelancer.id} className={`${getPriorityColor(freelancer.createdAt)}`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-4 flex-1">
                  {/* Header info */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="text-lg text-gray-900">{freelancer.name}</h3>
                          <p className="text-sm text-gray-600">{freelancer.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(freelancer.profile.documentsStatus)}
                      <Badge variant="outline" className="text-xs">
                        {freelancer.profile.position}
                      </Badge>
                    </div>
                  </div>

                  {/* Timeline info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="text-gray-600">Inscription:</span>
                        <p className="text-gray-900">{formatDate(freelancer.createdAt)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="text-gray-600">Téléphone:</span>
                        <p className="text-gray-900">{freelancer.profile.phone}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="text-gray-600">Nationalité:</span>
                        <p className="text-gray-900">{freelancer.profile.nationality || 'Non renseignée'}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Documents and licenses summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Licenses */}
                    <div>
                      <h4 className="text-sm text-gray-700 mb-2 flex items-center">
                        <FileText className="h-4 w-4 mr-1" />
                        Licences ({freelancer.profile.licenses?.length || 0})
                      </h4>
                      <div className="space-y-1">
                        {freelancer.profile.licenses?.map((license, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{license.type}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">Exp: {new Date(license.expiryDate).toLocaleDateString('fr-FR')}</span>
                              {getStatusBadge(license.status)}
                            </div>
                          </div>
                        )) || (
                          <p className="text-xs text-gray-500">Aucune licence</p>
                        )}
                      </div>
                    </div>

                    {/* Documents */}
                    <div>
                      <h4 className="text-sm text-gray-700 mb-2 flex items-center">
                        <Shield className="h-4 w-4 mr-1" />
                        Documents ({freelancer.profile.documents?.length || 0})
                      </h4>
                      <div className="space-y-1">
                        {freelancer.profile.documents?.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{doc.type}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {formatDate(doc.uploadedAt)}
                              </span>
                              {getStatusBadge(doc.status)}
                            </div>
                          </div>
                        )) || (
                          <p className="text-xs text-gray-500">Aucun document</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Priority notice */}
                  {Math.floor((new Date().getTime() - new Date(freelancer.createdAt).getTime()) / (1000 * 60 * 60 * 24)) > 7 && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <AlertDescription>
                        <p className="text-red-800 text-sm">
                          <strong>Urgent :</strong> Cette demande est en attente depuis plus de 7 jours.
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2 ml-6">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedFreelancer(freelancer)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Examiner
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Validation du profil - {freelancer.name}</DialogTitle>
                        <DialogDescription>
                          Examinez les détails du profil et validez ou rejetez la demande.
                        </DialogDescription>
                      </DialogHeader>

                      {selectedFreelancer && (
                        <div className="space-y-6">
                          {/* Personal Info */}
                          <div>
                            <h4 className="text-sm text-gray-900 mb-3">Informations personnelles</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Nom complet:</span>
                                <p className="text-gray-900">{selectedFreelancer.name}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Email:</span>
                                <p className="text-gray-900">{selectedFreelancer.email}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Téléphone:</span>
                                <p className="text-gray-900">{selectedFreelancer.profile.phone}</p>
                              </div>
                              <div>
                                <span className="text-gray-600">Position:</span>
                                <p className="text-gray-900">{selectedFreelancer.profile.position}</p>
                              </div>
                              {selectedFreelancer.profile.dateOfBirth && (
                                <div>
                                  <span className="text-gray-600">Date de naissance:</span>
                                  <p className="text-gray-900">{new Date(selectedFreelancer.profile.dateOfBirth).toLocaleDateString('fr-FR')}</p>
                                </div>
                              )}
                              {selectedFreelancer.profile.nationality && (
                                <div>
                                  <span className="text-gray-600">Nationalité:</span>
                                  <p className="text-gray-900">{selectedFreelancer.profile.nationality}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <Separator />

                          {/* Validation Actions */}
                          <div className="space-y-4">
                            <h4 className="text-sm text-gray-900">Action de validation</h4>
                            
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label htmlFor="comments">Commentaires (optionnel)</Label>
                                <Textarea
                                  id="comments"
                                  placeholder="Ajoutez des commentaires sur cette validation..."
                                  value={validationComments}
                                  onChange={(e) => setValidationComments(e.target.value)}
                                  rows={3}
                                />
                              </div>
                              
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => handleValidateFreelancer(selectedFreelancer.id, 'approve', validationComments)}
                                  disabled={processing === selectedFreelancer.id}
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                  {processing === selectedFreelancer.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                  )}
                                  Approuver et Activer
                                </Button>
                                
                                <Button
                                  variant="destructive"
                                  onClick={() => handleValidateFreelancer(selectedFreelancer.id, 'reject', validationComments)}
                                  disabled={processing === selectedFreelancer.id}
                                  className="flex-1"
                                >
                                  {processing === selectedFreelancer.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : (
                                    <XCircle className="h-4 w-4 mr-2" />
                                  )}
                                  Rejeter
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}