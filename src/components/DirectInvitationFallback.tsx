import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner@2.0.3';
import { useAuth } from './AuthProvider';
import { 
  UserPlus, 
  Mail, 
  MapPin, 
  Loader2,
  Users,
  Send,
  AlertTriangle,
  Info
} from 'lucide-react';

interface InviteFormData {
  email: string;
  first_name: string;
  last_name: string;
  country: string;
  city: string;
  role: 'internal' | 'freelancer' | '';
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

export default function DirectInvitationFallback() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<InviteFormData>({
    email: '',
    first_name: '',
    last_name: '',
    country: '',
    city: '',
    role: ''
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

  // Load pending invitations directly from Supabase
  const loadPendingInvitations = async () => {
    if (!user?.access_token) {
      console.error('❌ No access token available');
      return;
    }

    try {
      setLoadingInvitations(true);
      const config = await getSupabaseConfig();
      
      console.log('🔄 Loading pending invitations via direct API...');
      
      const response = await fetch(
        `${config.url}/rest/v1/users?profile_complete=eq.false&order=created_at.desc`,
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
        throw new Error(`Failed to load invitations: ${response.statusText} (${response.status})`);
      }

      const data = await response.json();
      console.log('✅ Invitations loaded via direct API:', data);
      setPendingInvitations(data || []);
      
    } catch (error) {
      console.error('❌ Error loading pending invitations:', error);
      toast.error(`Failed to load pending invitations: ${error.message}`);
    } finally {
      setLoadingInvitations(false);
    }
  };

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
      formData.country.trim() !== '' &&
      formData.city.trim() !== '' &&
      formData.role !== ''
    );
  };

  // Handle direct invitation creation (bypassing Edge Functions)
  const handleDirectInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!user?.access_token) {
      toast.error('Authentication required');
      return;
    }

    try {
      setIsLoading(true);
      const config = await getSupabaseConfig();
      
      console.log('🔄 Creating direct invitation for:', formData.email);
      
      // Generate a temporary UUID for the user
      const tempUserId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const fullName = `${formData.first_name} ${formData.last_name}`;
      
      // Create entry directly in users table
      const response = await fetch(
        `${config.url}/rest/v1/users`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'apikey': config.key,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            id: tempUserId,
            email: formData.email,
            name: fullName,
            role: formData.role,
            status: 'pending_invitation',
            nationality: formData.country,
            birth_date: null,
            phone: null,
            validation_status: 'pending',
            profile_complete: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`Request failed: ${response.statusText} (${response.status})`);
      }

      const result = await response.json();
      console.log('✅ Direct invitation created successfully:', result);
      
      toast.success(
        `User record created successfully! Note: This is a fallback method. The user will need to be properly set up in auth system separately.`,
        { duration: 6000 }
      );
      
      // Clear form
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        country: '',
        city: '',
        role: ''
      });
      
      // Reload pending invitations
      await loadPendingInvitations();
      
    } catch (error) {
      console.error('❌ Error creating direct invitation:', error);
      toast.error(`Failed to create invitation: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load invitations on component mount
  useEffect(() => {
    if (user?.access_token) {
      loadPendingInvitations();
    }
  }, [user?.access_token]);

  const getStatusBadgeColor = (invitation: PendingInvitation) => {
    if (invitation.profile_complete) {
      return invitation.validation_status === 'approved' 
        ? 'bg-green-100 text-green-800 border-green-200'
        : 'bg-blue-100 text-blue-800 border-blue-200';
    }
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const getStatusText = (invitation: PendingInvitation) => {
    if (invitation.status === 'pending_invitation') {
      return 'Pending Setup';
    }
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
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Fallback Mode:</strong> This method creates user records directly in the database. 
          It bypasses the Edge Functions system and email invitations. Users will need to be set up in the authentication system separately.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Direct Invitation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              Direct User Creation (Fallback)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDirectInvitation} className="space-y-4">
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
                  <Label htmlFor="country">Country *</Label>
                  <Select value={formData.country} onValueChange={(value) => handleChange('country', value)}>
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
                  <Label htmlFor="city">City *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="Paris"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

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

              <Button 
                type="submit" 
                disabled={!isFormValid() || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating User Record...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Create User Record
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Pending Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Pending Users
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
                <p className="text-gray-600">Loading users...</p>
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
                <h3 className="text-sm font-medium text-gray-900 mb-2">No pending users</h3>
                <p className="text-sm text-gray-600">All users have completed their profiles</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}