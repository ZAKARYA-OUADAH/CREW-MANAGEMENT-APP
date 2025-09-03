import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { useNotifications } from './NotificationContext';
import { createClient } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { 
  UserPlus, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Mail,
  User,
  Phone,
  Briefcase,
  Shield
} from 'lucide-react';

const positions = [
  'Captain',
  'First Officer',
  'Flight Engineer',
  'Cabin Crew Manager',
  'Flight Attendant',
  'Maintenance Technician',
  'Ground Operations',
  'Other'
];

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    position: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const invitationToken = searchParams.get('token');
    if (!invitationToken) {
      showToast('error', 'Token manquant', 'Le lien d\'invitation est invalide');
      navigate('/');
      return;
    }

    setToken(invitationToken);
    validateInvitation(invitationToken);
  }, [searchParams, navigate, showToast]);

  const validateInvitation = async (invitationToken: string) => {
    setLoading(true);
    try {
      console.log('Validating invitation token:', invitationToken);
      // For now, we'll simulate validation since we don't have a specific endpoint
      // In a real implementation, you'd validate the token on the server
      
      // Simulate token validation
      setTimeout(() => {
        setInvitation({
          email: 'freelancer@example.com', // This would come from the server
          inviterName: 'Admin User',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error validating invitation:', error);
      showToast('error', 'Invitation invalide', 'Ce lien d\'invitation est invalide ou a expiré');
      navigate('/');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      showToast('error', 'Prénom requis', 'Veuillez saisir votre prénom');
      return false;
    }

    if (!formData.lastName.trim()) {
      showToast('error', 'Nom requis', 'Veuillez saisir votre nom de famille');
      return false;
    }

    if (!formData.phone.trim()) {
      showToast('error', 'Téléphone requis', 'Veuillez saisir votre numéro de téléphone');
      return false;
    }

    if (!formData.position) {
      showToast('error', 'Position requise', 'Veuillez sélectionner votre position');
      return false;
    }

    if (!formData.password || formData.password.length < 8) {
      showToast('error', 'Mot de passe invalide', 'Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      showToast('error', 'Mots de passe différents', 'Les mots de passe ne correspondent pas');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      console.log('Accepting invitation with token:', token);
      
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        position: formData.position,
        password: formData.password
      };

      // Use Supabase backend endpoint for accepting invitation
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/auth/accept-invitation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: token!,
          userData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création du compte');
      }

      const result = await response.json();
      
      showToast('success', 'Compte créé', 'Votre compte a été créé avec succès. Veuillez vous connecter.');
      
      console.log('Account created successfully:', result);
      
      // Redirect to login page
      navigate('/login', { 
        state: { 
          message: 'Compte créé avec succès. Veuillez compléter votre profil après connexion.',
          email: invitation?.email 
        } 
      });
      
    } catch (error) {
      console.error('Error accepting invitation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création du compte';
      showToast('error', 'Erreur', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Validation de l'invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg text-gray-900 mb-2">Invitation invalide</h3>
            <p className="text-gray-600 mb-4">Ce lien d'invitation est invalide ou a expiré.</p>
            <Button onClick={() => navigate('/')}>
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <UserPlus className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl text-gray-900 mb-2">Bienvenue chez Aviation Company</h1>
          <p className="text-gray-600">
            Vous avez été invité par <strong>{invitation.inviterName}</strong> à rejoindre notre équipe de freelancers.
          </p>
        </div>

        {/* Invitation Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Détails de l'invitation</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Email :</span>
              <span className="text-gray-900">{invitation.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Invité par :</span>
              <span className="text-gray-900">{invitation.inviterName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Expire le :</span>
              <span className="text-gray-900">
                {new Date(invitation.expiresAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Account Creation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Créer votre compte</span>
            </CardTitle>
            <p className="text-sm text-gray-600">
              Complétez les informations ci-dessous pour créer votre compte freelancer.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="text-sm text-gray-900 border-b pb-2">Informations personnelles</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input
                    id="firstName"
                    placeholder="Votre prénom"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input
                    id="lastName"
                    placeholder="Votre nom de famille"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Select 
                  value={formData.position} 
                  onValueChange={(value) => handleInputChange('position', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez votre position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map(position => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Security */}
            <div className="space-y-4">
              <h4 className="text-sm text-gray-900 border-b pb-2">Sécurité</h4>
              
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Au moins 8 caractères"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Le mot de passe doit contenir au moins 8 caractères.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirmez votre mot de passe"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                />
              </div>
            </div>

            {/* Important Notice */}
            <Alert className="border-blue-200 bg-blue-50">
              <Shield className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <p className="text-blue-800 text-sm">
                  <strong>Étapes suivantes :</strong> Après création de votre compte, vous devrez compléter votre profil professionnel avec vos certifications, licences et documents. Votre profil sera validé par un administrateur avant activation complète.
                </p>
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Création du compte...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Créer mon compte
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Des questions ? Contactez l'équipe administrative.</p>
        </div>
      </div>
    </div>
  );
}