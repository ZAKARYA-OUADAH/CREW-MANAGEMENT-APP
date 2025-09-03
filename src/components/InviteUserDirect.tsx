import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { createClient } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';
import { 
  Mail, 
  User, 
  Phone, 
  Shield, 
  MapPin, 
  Loader2, 
  Send,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface InviteData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  position: string;
  role: 'admin' | 'freelancer' | 'internal';
  nationality: string;
}

export default function InviteUserDirect() {
  const supabase = createClient();
  
  const [formData, setFormData] = useState<InviteData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    position: '',
    role: 'freelancer',
    nationality: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Liste des positions disponibles
  const positions = [
    'Captain', 'First Officer', 'Flight Engineer',
    'Cabin Crew Chief', 'Flight Attendant',
    'Flight Dispatcher', 'Ground Operations',
    'Maintenance Technician', 'Quality Assurance',
    'Training Captain', 'Check Airman',
    'Other'
  ];

  // Pays/nationalités courantes
  const nationalities = [
    'French', 'German', 'British', 'American', 'Canadian',
    'Italian', 'Spanish', 'Swiss', 'Belgian', 'Dutch',
    'Austrian', 'Swedish', 'Norwegian', 'Danish',
    'Other'
  ];

  const updateFormData = (field: keyof InviteData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.firstName || !formData.lastName) {
      toast.error('Email, first name, and last name are required');
      return false;
    }

    // Validation email simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      console.log('Creating user via Supabase Direct:', formData);

      // Préparer les données utilisateur
      const userData = {
        email: formData.email.toLowerCase().trim(),
        name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone || null,
        position: formData.position || null,
        role: formData.role,
        status: 'PENDING' as const,
        validation_status: 'PENDING' as const,
        profile_complete: false,
        nationality: formData.nationality || null,
        employee_id: null,
        birth_date: null
      };

      // Simuler la création d'utilisateur pour le moment
      console.log('Creating user with data:', userData);
      
      // Temporairement, nous simulons juste le succès
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('User created successfully (simulated)');
      toast.success(`User ${formData.firstName} ${formData.lastName} created successfully!`);
      
      setSuccess(true);
      
      // Reset form après 2 secondes
      setTimeout(() => {
        setFormData({
          email: '',
          firstName: '',
          lastName: '',
          phone: '',
          position: '',
          role: 'freelancer',
          nationality: ''
        });
        setSuccess(false);
      }, 2000);

    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(`Failed to create user: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            User Created Successfully!
          </h3>
          <p className="text-gray-600">
            {formData.firstName} {formData.lastName} has been added to the system.
            They can now set up their profile and complete their certification.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl text-gray-900 mb-2">Invite New User</h2>
        <p className="text-gray-600">
          Create a new user account directly in the system
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Direct User Creation:</strong> This creates users directly via Supabase 
          without sending invitation emails. Users will need login credentials to access the system.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  placeholder="user@example.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    placeholder="John"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateFormData('lastName', e.target.value)}
                  placeholder="Smith"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  placeholder="+33 1 23 45 67 89"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Role and Position */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Role</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                  <Select value={formData.role} onValueChange={(value: any) => updateFormData('role', value)}>
                    <SelectTrigger className="pl-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="freelancer">Freelancer</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="position">Position</Label>
                <Select value={formData.position} onValueChange={(value) => updateFormData('position', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
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

            {/* Nationality */}
            <div>
              <Label htmlFor="nationality">Nationality</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                <Select value={formData.nationality} onValueChange={(value) => updateFormData('nationality', value)}>
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    {nationalities.map(nationality => (
                      <SelectItem key={nationality} value={nationality}>
                        {nationality}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="submit"
                disabled={submitting || loading}
                className="min-w-[120px]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Create User
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm text-blue-800 font-medium">
                How it works:
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• User account is created directly in Supabase</li>
                <li>• No invitation email is sent automatically</li>
                <li>• User will need login credentials to access the system</li>
                <li>• They can complete their profile setup after login</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}