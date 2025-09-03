import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';
import { useAuth } from './AuthProvider';
import InviteSystemDiagnostic from './InviteSystemDiagnostic';
import EdgeFunctionTester from './EdgeFunctionTester';
import DirectInvitationFallback from './DirectInvitationFallback';
import AuthTokenDiagnostic from './AuthTokenDiagnostic';
import AccessTokenFixer from './AccessTokenFixer';
import AuthTokenTest from './AuthTokenTest';
import AuthSessionCleaner from './AuthSessionCleaner';
import { 
  UserPlus, 
  Mail, 
  User, 
  MapPin, 
  Globe,
  Loader2,
  CheckCircle,
  Users,
  Send,
  Settings,
  AlertTriangle
} from 'lucide-react';

interface InviteFormData {
  email: string;
  first_name: string;
  last_name: string;
  base_city: string;
  base_country: string;
  role: 'internal' | 'freelancer' | '';
  position: string;
}

interface PendingInvitation {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  profile_complete: boolean;
  validation_status: string;
  created_at: string;
}

// Get Supabase config
const getSupabaseConfig = async () => {
  try {
    const { projectId, publicAnonKey } = await import('../utils/supabase/info');
    return {
      url: `https://${projectId}.supabase.co`,
      key: publicAnonKey
    };
  } catch (error) {
    console.error('Failed to load Supabase config:', error);
    throw new Error('Supabase configuration not available');
  }
};

export default function InviteUser() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<InviteFormData>({
    email: '',
    first_name: '',
    last_name: '',
    base_city: '',
    base_country: '',
    role: '',
    position: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  // Common countries for dropdown
  const commonCountries = [
    'France', 'United States', 'United Kingdom', 'Germany', 'Canada', 
    'Australia', 'Switzerland', 'Spain', 'Italy', 'Netherlands',
    'Belgium', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Other'
  ];

  // Load pending invitations
  const loadPendingInvitations = async () => {
    if (!user?.access_token) {
      console.error('❌ No access token available');
      toast.error('Authentication required');
      return;
    }

    try {
      setLoadingInvitations(true);
      const config = await getSupabaseConfig();
      
      console.log('🔄 Loading pending invitations...');
      
      const response = await fetch(
        `${config.url}/functions/v1/make-server-9fd39b98/invitations`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'apikey': config.key,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`Failed to load invitations: ${response.statusText} (${response.status})`);
      }

      const data = await response.json();
      console.log('✅ Invitations loaded:', data);
      setPendingInvitations(data.invitations || []);
      
    } catch (error) {
      console.error('❌ Error loading pending invitations:', error);
      toast.error(`Failed to load pending invitations: ${error.message}`);
    } finally {
      setLoadingInvitations(false);
    }
  };

  // Load invitations on component mount
  React.useEffect(() => {
    if (user?.access_token) {
      loadPendingInvitations();
    }
  }, [user?.access_token]);

  // Handle form field changes
  const handleChange = (field: keyof InviteFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validate form
  const isFormValid = () => {
    return (
      formData.email.trim() !== '' &&
      formData.first_name.trim() !== '' &&
      formData.last_name.trim() !== '' &&
      formData.base_country.trim() !== '' &&
      formData.base_city.trim() !== '' &&
      formData.role !== '' &&
      formData.position !== ''
    );
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!user?.access_token) {
      console.error('❌ No access token available');
      toast.error('Authentication required');
      return;
    }

    try {
      setIsLoading(true);
      const config = await getSupabaseConfig();
      
      console.log('🔄 Sending invitation for:', formData.email);
      
      const response = await fetch(
        `${config.url}/functions/v1/make-server-9fd39b98/invite-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'apikey': config.key,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || `Request failed: ${response.statusText} (${response.status})`);
      }

      const result = await response.json();
      console.log('✅ Invitation sent successfully:', result);
      
      toast.success('Invitation sent successfully!');
      
      // Clear form
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        base_city: '',
        base_country: '',
        role: '',
        position: ''
      });
      
      // Reload pending invitations
      await loadPendingInvitations();
      
    } catch (error) {
      console.error('❌ Error sending invitation:', error);
      toast.error(`Failed to send invitation: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (invitation: PendingInvitation) => {
    if (invitation.profile_complete) {
      return invitation.validation_status === 'approved' 
        ? 'bg-green-100 text-green-800 border-green-200'
        : 'bg-blue-100 text-blue-800 border-blue-200';
    }
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const getStatusText = (invitation: PendingInvitation) => {
    if (invitation.profile_complete) {
      return invitation.validation_status === 'approved' ? 'Approved' : 'Pending Validation';
    }
    return 'Profile Incomplete';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900">Invite New User</h1>
        <p className="text-gray-600">Send an invitation to a new crew member</p>
      </div>

      <Tabs defaultValue="invite" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invite">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Users
          </TabsTrigger>
          <TabsTrigger value="fallback">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Fallback Mode
          </TabsTrigger>
          <TabsTrigger value="diagnostic">
            <Settings className="h-4 w-4 mr-2" />
            System Diagnostic
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invite" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invitation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              User Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleChange('first_name', e.target.value)}
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleChange('last_name', e.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="john.doe@example.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="base_country">Base Country *</Label>
                  <Select value={formData.base_country} onValueChange={(value) => handleChange('base_country', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {commonCountries.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="base_city">Base City *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="base_city"
                      value={formData.base_city}
                      onChange={(e) => handleChange('base_city', e.target.value)}
                      placeholder="Paris"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select value={formData.role} onValueChange={(value) => handleChange('role', value as 'internal' | 'freelancer')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Internal Staff</SelectItem>
                      <SelectItem value="freelancer">Freelancer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="position">Default Position *</Label>
                  <Select value={formData.position} onValueChange={(value) => handleChange('position', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CPT">Captain (CPT)</SelectItem>
                      <SelectItem value="FO">First Officer (FO)</SelectItem>
                      <SelectItem value="FA">Flight Attendant (FA)</SelectItem>
                      <SelectItem value="PURSER">Purser</SelectItem>
                      <SelectItem value="MECHANIC">Mechanic</SelectItem>
                      <SelectItem value="GROUND_OPS">Ground Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={!isFormValid() || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Pending Invitations
              </div>
              <Button variant="outline" size="sm" onClick={loadPendingInvitations} disabled={loadingInvitations}>
                {loadingInvitations ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Refresh'
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingInvitations ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-600" />
                <p className="text-gray-600">Loading invitations...</p>
              </div>
            ) : pendingInvitations.length > 0 ? (
              <div className="space-y-3">
                {pendingInvitations.map((invitation) => (
                  <div key={invitation.id} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900">{invitation.name}</h4>
                          <Badge variant="outline" className={invitation.role === 'internal' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                            {invitation.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{invitation.email}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className={getStatusBadgeColor(invitation)}>
                            {getStatusText(invitation)}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatDate(invitation.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-2">No pending invitations</h3>
                <p className="text-sm text-gray-600">All invited users have completed their profiles</p>
              </div>
            )}
          </CardContent>
        </Card>
          </div>
        </TabsContent>

        <TabsContent value="fallback">
          <DirectInvitationFallback />
        </TabsContent>

        <TabsContent value="diagnostic" className="space-y-6">
          <AuthTokenTest />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AuthTokenDiagnostic />
            <AccessTokenFixer />
          </div>
          <AuthSessionCleaner />
          <EdgeFunctionTester />
          <InviteSystemDiagnostic />
        </TabsContent>
      </Tabs>
    </div>
  );
}