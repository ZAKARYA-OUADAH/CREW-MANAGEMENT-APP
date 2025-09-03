import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner@2.0.3';
import { 
  User, 
  Calendar, 
  MapPin, 
  Phone,
  Globe,
  Loader2,
  Save
} from 'lucide-react';

interface ProfileIdentityStepProps {
  userProfile: any;
  onComplete: () => void;
  onNext: () => void;
}

interface IdentityFormData {
  name: string;
  surname: string;
  birth_date: string;
  place_of_birth: string;
  nationality: string;
  gender: string;
  phone: string;
  address: string;
  postal_code: string;
  city: string;
  country: string;
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

export default function ProfileIdentityStep({ 
  userProfile, 
  onComplete, 
  onNext 
}: ProfileIdentityStepProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<IdentityFormData>({
    name: '',
    surname: '',
    birth_date: '',
    place_of_birth: '',
    nationality: '',
    gender: '',
    phone: '',
    address: '',
    postal_code: '',
    city: '',
    country: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Common nationalities
  const nationalities = [
    'American', 'British', 'Canadian', 'French', 'German', 'Australian',
    'Swiss', 'Spanish', 'Italian', 'Dutch', 'Belgian', 'Austrian',
    'Swedish', 'Norwegian', 'Danish', 'Other'
  ];

  // Common countries
  const countries = [
    'United States', 'United Kingdom', 'Canada', 'France', 'Germany', 
    'Australia', 'Switzerland', 'Spain', 'Italy', 'Netherlands',
    'Belgium', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Other'
  ];

  // Initialize form with basic user information
  useEffect(() => {
    const initializeFormData = async () => {
      if (!user) return;
      
      try {
        console.log('🔄 Initializing identity form with user data:', user);
        
        // Parse existing name from auth or user metadata
        const fullName = user.name || user.user_metadata?.name || '';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Get any existing metadata from auth
        const existingMetadata = user.user_metadata?.profile || {};

        setFormData({
          name: firstName,
          surname: lastName,
          birth_date: existingMetadata.birth_date || '',
          place_of_birth: existingMetadata.place_of_birth || '',
          nationality: existingMetadata.nationality || '',
          gender: existingMetadata.gender || '',
          phone: existingMetadata.phone || '',
          address: existingMetadata.address || '',
          postal_code: existingMetadata.postal_code || '',
          city: existingMetadata.city || '',
          country: existingMetadata.country || ''
        });
        
        console.log('✅ Form initialized with data:', { firstName, lastName, existingMetadata });
        
      } catch (error) {
        console.error('Error initializing form data:', error);
      } finally {
        setInitialLoad(false);
      }
    };

    initializeFormData();
  }, [user]);

  // Handle form field changes
  const handleChange = (field: keyof IdentityFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validate form
  const isFormValid = () => {
    const requiredFields = [
      'name', 'surname', 'birth_date', 'place_of_birth', 
      'nationality', 'gender', 'phone', 'address', 'city', 'country'
    ];
    
    return requiredFields.every(field => formData[field as keyof IdentityFormData].trim() !== '');
  };

  // Save profile data (prepare for database insertion)
  const handleSave = async () => {
    if (!isFormValid()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      console.log('💾 Saving identity information...');
      
      // Prepare the complete profile data for the parent component
      const fullName = `${formData.name} ${formData.surname}`;
      const profileData = {
        name: fullName,
        birth_date: formData.birth_date,
        nationality: formData.nationality,
        phone: formData.phone,
        // Additional profile metadata
        place_of_birth: formData.place_of_birth,
        gender: formData.gender,
        address: formData.address,
        postal_code: formData.postal_code,
        city: formData.city,
        country: formData.country
      };
      
      // Store profile data in the user's metadata using Edge Function
      try {
        const config = await getSupabaseConfig();
        
        // Use Edge Function for better reliability
        const response = await fetch(
          `${config.url}/functions/v1/make-server-9fd39b98/auth/update-metadata`,
          {
            method: 'POST',
            headers: {
              'apikey': config.key,
              'Authorization': `Bearer ${user?.access_token || config.key}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              metadata: {
                profile: {
                  ...profileData,
                  identity_completed: true
                }
              }
            })
          }
        );

        if (!response.ok) {
          console.warn('Failed to update auth metadata, but continuing...');
        }
      } catch (metadataError) {
        console.warn('Metadata update failed, but continuing:', metadataError);
      }

      console.log('✅ Identity data prepared:', profileData);
      toast.success('Identity information saved successfully!');
      onComplete();
      
      // Small delay then auto-advance to next step
      setTimeout(() => {
        onNext();
      }, 1000);
      
    } catch (error) {
      console.error('Error preparing identity data:', error);
      toast.error('Failed to save identity information');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoad) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-600" />
        <p className="text-gray-600">Loading your information...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg text-gray-900 mb-2">Personal Identity</h3>
        <p className="text-gray-600">Please provide your personal information as it appears on official documents.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="text-sm text-gray-900 flex items-center">
            <User className="h-4 w-4 mr-2" />
            Basic Information
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">First Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="John"
                required
              />
            </div>
            <div>
              <Label htmlFor="surname">Last Name *</Label>
              <Input
                id="surname"
                value={formData.surname}
                onChange={(e) => handleChange('surname', e.target.value)}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="birth_date">Date of Birth *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleChange('birth_date', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="place_of_birth">Place of Birth *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="place_of_birth"
                value={formData.place_of_birth}
                onChange={(e) => handleChange('place_of_birth', e.target.value)}
                placeholder="Paris, France"
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nationality">Nationality *</Label>
              <Select value={formData.nationality} onValueChange={(value) => handleChange('nationality', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select nationality" />
                </SelectTrigger>
                <SelectContent>
                  {nationalities.map(nationality => (
                    <SelectItem key={nationality} value={nationality}>{nationality}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="gender">Gender *</Label>
              <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+1 234 567 8900"
                className="pl-10"
                required
              />
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="space-y-4">
          <h4 className="text-sm text-gray-900 flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            Current Address
          </h4>

          <div>
            <Label htmlFor="address">Street Address *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="123 Main Street, Apartment 4B"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => handleChange('postal_code', e.target.value)}
                placeholder="12345"
              />
            </div>
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="New York"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="country">Country *</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Select value={formData.country} onValueChange={(value) => handleChange('country', value)}>
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map(country => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t">
        <Button 
          onClick={handleSave}
          disabled={!isFormValid() || loading}
          className="min-w-40"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save & Continue
            </>
          )}
        </Button>
      </div>
    </div>
  );
}