import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { useNotifications } from './NotificationContext';
import { apiClient } from '../utils/supabase/client';
import { 
  UserPlus, 
  Search, 
  Mail, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  Phone,
  MapPin,
  Calendar,
  Send,
  Loader2
} from 'lucide-react';

interface ExistingFreelancer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  position?: string;
  location?: string;
  status: 'active' | 'inactive' | 'pending_validation';
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    nationality?: string;
    licenses?: Array<{
      type: string;
      number: string;
      expiryDate: string;
      status: 'valid' | 'expired' | 'pending_validation';
    }>;
    documents?: Array<{
      type: string;
      status: 'pending' | 'approved' | 'rejected';
      uploadedAt: string;
    }>;
  };
  createdAt: string;
  lastActiveAt?: string;
}

export default function InviteFreelancer() {
  const { showToast } = useNotifications();
  const [email, setEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    exists: boolean;
    freelancer?: ExistingFreelancer;
  } | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSearch = async () => {
    if (!email.trim()) {
      showToast('error', 'Email requis', 'Veuillez saisir une adresse email');
      return;
    }

    if (!validateEmail(email)) {
      showToast('error', 'Email invalide', 'Veuillez saisir une adresse email valide');
      return;
    }

    setSearching(true);
    setSearchResult(null);

    try {
      console.log('Searching for freelancer:', email);
      const response = await apiClient.checkFreelancerExists(email);
      
      setSearchResult({
        exists: response.exists,
        freelancer: response.freelancer
      });

      if (response.exists) {
        showToast('info', 'Utilisateur trouvé', `L'utilisateur ${email} existe déjà dans le système`);
      } else {
        showToast('success', 'Email disponible', 'Cet email n\'est pas encore utilisé. Vous pouvez envoyer une invitation.');
      }
    } catch (error) {
      console.error('Error checking freelancer:', error);
      showToast('error', 'Erreur', 'Impossible de vérifier l\'email. Veuillez réessayer.');
    } finally {
      setSearching(false);
    }
  };

  const handleActivateFreelancer = async (freelancerId: string) => {
    setSending(true);
    try {
      await apiClient.activateFreelancer(freelancerId);
      showToast('success', 'Freelancer activé', 'Le freelancer a été activé avec succès');
      
      // Refresh the search result
      await handleSearch();
    } catch (error) {
      console.error('Error activating freelancer:', error);
      showToast('error', 'Erreur', 'Impossible d\'activer le freelancer');
    } finally {
      setSending(false);
    }
  };

  const handleSendInvitation = async () => {
    setSending(true);
    try {
      console.log('Sending invitation to:', email);
      const response = await apiClient.sendFreelancerInvitation(email);
      
      showToast('success', 'Invitation envoyée', `Une invitation a été envoyée à ${email}`);
      setShowInviteDialog(false);
      setEmail('');
      setSearchResult(null);
      
      console.log('Invitation sent successfully:', response);
    } catch (error) {
      console.error('Error sending invitation:', error);
      showToast('error', 'Erreur', 'Impossible d\'envoyer l\'invitation. Veuillez réessayer.');
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactif</Badge>;
      case 'pending_validation':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente de validation</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Inviter un Freelancer</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Recherchez un email pour vérifier s'il existe déjà ou envoyez une nouvelle invitation.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="email">Adresse Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="freelancer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleSearch}
                disabled={searching || !email.trim()}
                className="flex items-center space-x-2"
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span>Rechercher</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {searchResult.exists ? (
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-green-600" />
                )}
                <span>Résultat de la recherche</span>
              </div>
              <Badge variant={searchResult.exists ? "default" : "outline"}>
                {searchResult.exists ? 'Utilisateur existant' : 'Nouvel utilisateur'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {searchResult.exists && searchResult.freelancer ? (
              // Existing freelancer details
              <div className="space-y-4">
                <Alert className="border-blue-200 bg-blue-50">
                  <User className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    <p className="text-blue-800">
                      <strong>Utilisateur trouvé :</strong> Cet email est déjà associé à un compte freelancer.
                    </p>
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  {/* Basic Info */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-900">{searchResult.freelancer.email}</span>
                      </div>
                      {searchResult.freelancer.name && (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-900">{searchResult.freelancer.name}</span>
                        </div>
                      )}
                      {searchResult.freelancer.position && (
                        <p className="text-sm text-gray-600">{searchResult.freelancer.position}</p>
                      )}
                    </div>
                    {getStatusBadge(searchResult.freelancer.status)}
                  </div>

                  <Separator />

                  {/* Detailed Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">Créé le:</span>
                        <span className="text-gray-900">{formatDate(searchResult.freelancer.createdAt)}</span>
                      </div>
                      {searchResult.freelancer.lastActiveAt && (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600">Dernière activité:</span>
                          <span className="text-gray-900">{formatDate(searchResult.freelancer.lastActiveAt)}</span>
                        </div>
                      )}
                    </div>

                    {searchResult.freelancer.profile && (
                      <div className="space-y-2">
                        {searchResult.freelancer.profile.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-900">{searchResult.freelancer.profile.phone}</span>
                          </div>
                        )}
                        {searchResult.freelancer.profile.nationality && (
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-900">{searchResult.freelancer.profile.nationality}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Profile Status */}
                  {searchResult.freelancer.profile && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h4 className="text-sm text-gray-700">État du profil</h4>
                        
                        {/* Licenses */}
                        {searchResult.freelancer.profile.licenses && searchResult.freelancer.profile.licenses.length > 0 && (
                          <div>
                            <span className="text-xs text-gray-500">Licences :</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {searchResult.freelancer.profile.licenses.map((license, index) => (
                                <Badge 
                                  key={index} 
                                  variant={license.status === 'valid' ? 'default' : license.status === 'expired' ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {license.type} ({license.status})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Documents */}
                        {searchResult.freelancer.profile.documents && searchResult.freelancer.profile.documents.length > 0 && (
                          <div>
                            <span className="text-xs text-gray-500">Documents :</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {searchResult.freelancer.profile.documents.map((doc, index) => (
                                <Badge 
                                  key={index}
                                  variant={doc.status === 'approved' ? 'default' : doc.status === 'rejected' ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {doc.type} ({doc.status})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  {searchResult.freelancer.status === 'inactive' && (
                    <Button
                      onClick={() => handleActivateFreelancer(searchResult.freelancer!.id)}
                      disabled={sending}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      <span>Activer le freelancer</span>
                    </Button>
                  )}
                  
                  {searchResult.freelancer.status === 'pending_validation' && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription>
                        <p className="text-yellow-800 text-sm">
                          <strong>En attente de validation :</strong> Ce freelancer attend la validation de ses documents par un administrateur.
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            ) : (
              // New freelancer invitation
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <Send className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <p className="text-green-800">
                      <strong>Nouvel utilisateur :</strong> Cet email n'est pas encore utilisé. Vous pouvez envoyer une invitation.
                    </p>
                  </AlertDescription>
                </Alert>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-sm text-gray-900 mb-2">L'invitation contiendra :</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Un lien pour créer un mot de passe</li>
                    <li>• Instructions pour compléter le profil</li>
                    <li>• Information sur la validation admin des documents</li>
                    <li>• Guide de démarrage pour les freelancers</li>
                  </ul>
                </div>

                <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center space-x-2">
                      <Send className="h-4 w-4" />
                      <span>Envoyer l'invitation</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmer l'invitation</DialogTitle>
                      <DialogDescription>
                        Vous êtes sur le point d'envoyer une invitation à <strong>{email}</strong>.
                        <br /><br />
                        Le freelancer recevra un email avec un lien pour créer son compte et des instructions pour compléter son profil professionnel.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                        Annuler
                      </Button>
                      <Button 
                        onClick={handleSendInvitation}
                        disabled={sending}
                        className="flex items-center space-x-2"
                      >
                        {sending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        <span>Envoyer l'invitation</span>
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}