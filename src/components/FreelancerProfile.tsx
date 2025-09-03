import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { useNotifications } from './NotificationContext';
import { 
  User, 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  Plane,
  Save,
  Download,
  IdCard,
  Edit,
  X
} from 'lucide-react';

// Mock aircraft data to map qualifications
const mockAircraft = [
  { id: 'AC001', immat: 'F-HBCD', type: 'Citation CJ3' },
  { id: 'AC002', immat: 'F-GXYZ', type: 'King Air 350' },
  { id: 'AC003', immat: 'F-HABC', type: 'Phenom 300' },
  { id: 'AC004', immat: 'F-HDEF', type: 'Citation CJ3' },
  { id: 'AC005', immat: 'F-HGHJ', type: 'King Air 350' }
];

export default function FreelancerProfile() {
  const { user } = useOutletContext<{ user: any }>();
  const { addNotification, showToast } = useNotifications();
  
  const [profile, setProfile] = useState({
    personalInfo: {
      firstName: user.name.split(' ')[0] || '',
      lastName: user.name.split(' ')[1] || '',
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      dateOfBirth: '1985-03-15',
      nationality: 'France',
      emergencyContact: user.emergencyContact ? `${user.emergencyContact.name} - ${user.emergencyContact.phone}` : ''
    },
    qualifications: user.qualifications || [],
    certifications: {
      license: {
        type: user.position === 'Captain' ? 'ATPL' : user.position === 'First Officer' ? 'CPL' : 'CCAF',
        number: user.licenseNumber || 'Not provided',
        issued: '2020-05-15',
        expires: '2025-05-15',
        status: 'valid',
        fileUploaded: true
      },
      medical: {
        type: 'Class 1 Medical',
        number: 'MED-987654321',
        issued: '2023-12-01',
        expires: user.medicalExpiry || '2024-12-01',
        status: new Date(user.medicalExpiry || '2024-12-01') > new Date() ? 'valid' : 'expired',
        fileUploaded: true
      },
      passport: {
        type: 'Passport',
        number: user.passportNumber || 'Not provided',
        issued: '2019-08-20',
        expires: '2029-08-20',
        status: 'valid',
        fileUploaded: true
      },
      visa: {
        type: 'Work Visa',
        number: 'V987654321',
        issued: '2024-01-15',
        expires: '2025-01-15',
        status: 'valid',
        fileUploaded: false
      }
    },
    availability: {
      status: user.availability || 'available',
      unavailableDates: ['2024-08-25', '2024-08-26'],
      maxConsecutiveDays: 14,
      preferredRegions: ['Europe', 'North America'],
      notes: 'Available for short notice assignments. Prefer multi-day missions.'
    }
  });
  
  const [originalProfile, setOriginalProfile] = useState(profile);
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(profile) !== JSON.stringify(originalProfile);
    setHasUnsavedChanges(hasChanges);
  }, [profile, originalProfile]);

  const getAircraftByImmat = (immat: string) => {
    return mockAircraft.find(ac => ac.immat === immat);
  };

  const getCertificationStatus = (cert: any) => {
    if (!cert.fileUploaded) return { color: 'text-red-600', icon: AlertCircle, text: 'Missing File', bgColor: 'bg-red-100' };
    if (cert.status === 'expired') return { color: 'text-red-600', icon: AlertCircle, text: 'Expired', bgColor: 'bg-red-100' };
    if (cert.status === 'valid') return { color: 'text-green-600', icon: CheckCircle, text: 'Valid', bgColor: 'bg-green-100' };
    return { color: 'text-gray-600', icon: AlertCircle, text: 'Unknown', bgColor: 'bg-gray-100' };
  };

  const handlePersonalInfoChange = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  };

  const handleAvailabilityChange = (field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [field]: value
      }
    }));
  };

  const handleFileUpload = (certType: string) => {
    console.log(`Uploading file for ${certType}`);
    
    showToast('success', 'File Uploaded', `${certType} document uploaded successfully`);
    
    addNotification({
      type: 'success',
      title: 'Document Uploaded',
      message: `${certType} document has been uploaded and is pending review`,
      category: 'document',
      metadata: { documentType: certType }
    });
    
    setProfile(prev => ({
      ...prev,
      certifications: {
        ...prev.certifications,
        [certType]: {
          ...prev.certifications[certType],
          fileUploaded: true
        }
      }
    }));
  };

  const saveProfile = () => {
    console.log('Saving profile:', profile);
    
    // Update the user data in localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const updatedUser = {
      ...currentUser,
      phone: profile.personalInfo.phone,
      address: profile.personalInfo.address,
      emergencyContact: profile.personalInfo.emergencyContact ? {
        name: profile.personalInfo.emergencyContact.split(' - ')[0],
        phone: profile.personalInfo.emergencyContact.split(' - ')[1]
      } : currentUser.emergencyContact
    };
    
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    // Update original profile to reflect saved state
    setOriginalProfile(profile);
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('profileUpdated'));
    
    showToast('success', 'Profile Saved', 'Your profile has been updated successfully');
    
    addNotification({
      type: 'success',
      title: 'Profile Updated',
      message: 'Your profile information has been saved',
      category: 'profile'
    });
    
    setIsEditing(false);
    setHasUnsavedChanges(false);
  };

  const cancelEdit = () => {
    setProfile(originalProfile);
    setIsEditing(false);
    setHasUnsavedChanges(false);
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  const completionPercentage = () => {
    const totalFields = Object.keys(profile.certifications).length + 5; // 5 required personal fields
    let completedFields = Object.values(profile.certifications).filter(cert => 
      cert.fileUploaded && cert.status === 'valid'
    ).length;
    
    // Check personal info completion
    if (profile.personalInfo.phone) completedFields++;
    if (profile.personalInfo.address) completedFields++;
    if (profile.personalInfo.emergencyContact) completedFields++;
    if (profile.personalInfo.dateOfBirth) completedFields++;
    if (profile.personalInfo.nationality) completedFields++;
    
    return Math.round((completedFields / totalFields) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-yellow-800">You have unsaved changes</p>
                <p className="text-xs text-yellow-600">Don't forget to save your profile updates</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={cancelEdit}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                <X className="h-4 w-4 mr-1" />
                Discard
              </Button>
              <Button
                size="sm"
                onClick={saveProfile}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                <Save className="h-4 w-4 mr-1" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl text-gray-900">My Profile</h1>
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${completionPercentage()}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600">{completionPercentage()}% complete</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <IdCard className="h-4 w-4" />
              <span>GGID: {user.ggid}</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={cancelEdit}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={saveProfile} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!hasUnsavedChanges}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={startEditing} variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Personal Information
                </CardTitle>
                {hasUnsavedChanges && (
                  <Button
                    size="sm"
                    onClick={saveProfile}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={profile.personalInfo.firstName}
                    onChange={(e) => handlePersonalInfoChange('firstName', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={profile.personalInfo.lastName}
                    onChange={(e) => handlePersonalInfoChange('lastName', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.personalInfo.email}
                    onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={profile.personalInfo.phone}
                    onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                    disabled={!isEditing}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={profile.personalInfo.dateOfBirth}
                    onChange={(e) => handlePersonalInfoChange('dateOfBirth', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality *</Label>
                  <Input
                    id="nationality"
                    value={profile.personalInfo.nationality}
                    onChange={(e) => handlePersonalInfoChange('nationality', e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  value={profile.personalInfo.address}
                  onChange={(e) => handlePersonalInfoChange('address', e.target.value)}
                  disabled={!isEditing}
                  placeholder="123 Aviation Street, Nice, France"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact *</Label>
                <Input
                  id="emergencyContact"
                  value={profile.personalInfo.emergencyContact}
                  onChange={(e) => handlePersonalInfoChange('emergencyContact', e.target.value)}
                  disabled={!isEditing}
                  placeholder="Name - Phone Number"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Certifications & Documents
              </CardTitle>
              <p className="text-sm text-gray-600">
                Keep your certifications up to date to remain eligible for missions
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(profile.certifications).map(([key, cert]: [string, any]) => {
                  const status = getCertificationStatus(cert);
                  const StatusIcon = status.icon;
                  
                  return (
                    <div key={key} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg text-gray-900 capitalize">{key}</h4>
                            <Badge className={`${status.bgColor} ${status.color}`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.text}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <p>Type: {cert.type}</p>
                            </div>
                            <div>
                              <p>Number: {cert.number}</p>
                            </div>
                            <div>
                              <p>Issued: {cert.issued}</p>
                            </div>
                            <div>
                              <p>Expires: {cert.expires}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          {cert.fileUploaded ? (
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleFileUpload(key)}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              Upload
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {cert.status === 'expired' && (
                        <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-800">
                          <AlertCircle className="h-4 w-4 inline mr-1" />
                          This certification has expired. Please renew to remain eligible for missions.
                        </div>
                      )}
                      
                      {!cert.fileUploaded && (
                        <div className="mt-3 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
                          <AlertCircle className="h-4 w-4 inline mr-1" />
                          Please upload the required document to complete your profile.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Qualifications Tab */}
        <TabsContent value="qualifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plane className="h-5 w-5 mr-2" />
                Aircraft Qualifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="text-sm text-gray-700">Current Qualifications</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile.qualifications.map((qual, idx) => {
                      const aircraft = getAircraftByImmat(qual);
                      return (
                        <Badge key={idx} variant="secondary" className="text-sm p-2">
                          <div className="flex items-center space-x-2">
                            <Plane className="h-3 w-3" />
                            <span>{qual}</span>
                            {aircraft && (
                              <span className="text-xs text-gray-500">({aircraft.type})</span>
                            )}
                          </div>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="text-sm text-blue-800 mb-2">Position: {user.position}</h4>
                  <p className="text-sm text-blue-600">
                    Contact your administrator to add or modify aircraft qualifications.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Availability Tab */}
        <TabsContent value="availability" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Availability Settings
                </CardTitle>
                {hasUnsavedChanges && (
                  <Button
                    size="sm"
                    onClick={saveProfile}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Current Status</Label>
                  <Badge className={profile.availability.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {profile.availability.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label>Max Consecutive Days</Label>
                  <Input
                    type="number"
                    value={profile.availability.maxConsecutiveDays}
                    onChange={(e) => handleAvailabilityChange('maxConsecutiveDays', parseInt(e.target.value))}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Preferred Regions</Label>
                <div className="flex flex-wrap gap-2">
                  {profile.availability.preferredRegions.map((region, idx) => (
                    <Badge key={idx} variant="outline">{region}</Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Unavailable Dates</Label>
                <div className="flex flex-wrap gap-2">
                  {profile.availability.unavailableDates.map((date, idx) => (
                    <Badge key={idx} variant="outline" className="text-red-600 border-red-300">
                      {date}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={profile.availability.notes}
                  onChange={(e) => handleAvailabilityChange('notes', e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fixed Bottom Save Bar - appears when editing and has changes */}
      {isEditing && hasUnsavedChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span className="text-sm text-gray-700">You have unsaved changes</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={cancelEdit}
                  size="sm"
                >
                  <X className="h-4 w-4 mr-1" />
                  Discard Changes
                </Button>
                <Button
                  onClick={saveProfile}
                  className="bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}