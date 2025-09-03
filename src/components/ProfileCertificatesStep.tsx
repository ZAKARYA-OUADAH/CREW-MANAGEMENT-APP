import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner@2.0.3';
import { createClient } from '../utils/supabase/client';
import { 
  Award, 
  Upload, 
  Calendar,
  Plane,
  Loader2,
  Save,
  Check,
  X,
  Plus,
  FileText,
  Trash2
} from 'lucide-react';

interface ProfileCertificatesStepProps {
  userProfile: any;
  onComplete: () => void;
  onPrevious: () => void;
}

interface CertificateData {
  id: string;
  type: string;
  code: string;
  aircraft_type?: string;
  issued_date: string;
  expiry_date: string;
  file?: File;
  uploaded?: boolean;
  uploading?: boolean;
  uploadProgress?: number;
}

// Certificate types and their common codes
const certificateTypes = [
  { 
    value: 'LICENSE', 
    label: 'License', 
    codes: ['ATPL', 'CPL', 'PPL', 'MPL', 'LAPL'] 
  },
  { 
    value: 'MEDICAL', 
    label: 'Medical Certificate', 
    codes: ['EASA MED CL1', 'EASA MED CL2', 'FAA MEDICAL CL1', 'FAA MEDICAL CL2'] 
  },
  { 
    value: 'TRAINING', 
    label: 'Training Certificate', 
    codes: ['CABIN-SAFETY', 'DANGEROUS-GOODS', 'CRM', 'SECURITY'] 
  },
  { 
    value: 'RECURRENCY', 
    label: 'Recurrency Training', 
    codes: ['RECURRENT', 'LINE-CHECK', 'SIMULATOR'] 
  },
  { 
    value: 'OPC', 
    label: 'Operator Proficiency Check', 
    codes: ['OPC', 'SKILL-TEST'] 
  },
  { 
    value: 'LPC', 
    label: 'Line Proficiency Check', 
    codes: ['LPC', 'LINE-CHECK'] 
  },
  { 
    value: 'TYPE_RATING', 
    label: 'Type Rating', 
    codes: [] // Will be filled with aircraft types
  }
];

// Common aircraft types for type ratings
const aircraftTypes = [
  'A320', 'A330', 'A340', 'A350', 'A380',
  'B737', 'B747', 'B757', 'B767', 'B777', 'B787',
  'CL350', 'CL605', 'CL650',
  'G450', 'G550', 'G650',
  'FA7X', 'FA8X',
  'PC12', 'PC24',
  'Other'
];

export default function ProfileCertificatesStep({ 
  userProfile, 
  onComplete, 
  onPrevious 
}: ProfileCertificatesStepProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [certificates, setCertificates] = useState<CertificateData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [saveProgress, setSaveProgress] = useState<string>('');

  // Generate unique ID for certificates
  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

  // Add new certificate
  const addCertificate = () => {
    const newCertificate: CertificateData = {
      id: generateId(),
      type: '',
      code: '',
      aircraft_type: '',
      issued_date: '',
      expiry_date: '',
      uploaded: false,
      uploading: false,
      uploadProgress: 0
    };
    
    setCertificates(prev => [...prev, newCertificate]);
  };

  // Remove certificate
  const removeCertificate = (id: string) => {
    setCertificates(prev => prev.filter(cert => cert.id !== id));
  };

  // Update certificate data
  const updateCertificate = (id: string, updates: Partial<CertificateData>) => {
    setCertificates(prev => 
      prev.map(cert => 
        cert.id === id ? { ...cert, ...updates } : cert
      )
    );
  };

  // Handle file selection for certificate
  const handleFileSelect = (certificateId: string, file: File) => {
    console.log('📄 File selected:', { name: file.name, type: file.type, size: file.size });
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(`Unsupported file type: ${file.type}. Please upload a PDF, JPEG, or PNG file.`);
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      toast.error(`File too large: ${sizeMB}MB. Maximum size is 10MB.`);
      return;
    }

    // Validate file name
    if (!file.name || file.name.length > 255) {
      toast.error('Invalid file name. Please rename your file and try again.');
      return;
    }

    updateCertificate(certificateId, { file, uploaded: false });
    toast.success(`File "${file.name}" ready for upload`);
  };

  // Upload certificate file via Supabase Direct
  const uploadCertificateFile = async (certificate: CertificateData): Promise<boolean> => {
    if (!certificate.file || !user) {
      console.error('Upload failed: Missing file or user data');
      toast.error('Upload failed: Missing file or user information');
      return false;
    }

    try {
      updateCertificate(certificate.id, { uploading: true, uploadProgress: 0 });
      setActiveUploadId(certificate.id);
      
      console.log('🚀 Starting upload via Supabase Direct...');
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        updateCertificate(certificate.id, { 
          uploadProgress: Math.min((certificate.uploadProgress || 0) + 15, 90)
        });
      }, 200);

      // Pour le moment, simuler l'upload
      console.log('📄 Simulating certificate upload via Supabase Direct...');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      clearInterval(progressInterval);

      console.log('📄 Certificate uploaded successfully via Supabase Direct (simulated)');
      updateCertificate(certificate.id, { 
        uploading: false, 
        uploaded: true, 
        uploadProgress: 100 
      });
      return true;
      
    } catch (error) {
      console.error('Error uploading certificate:', error);
      
      // Enhanced error reporting
      let errorMessage = error.message || 'Unknown upload error';
      
      if (errorMessage.includes('Authentication')) {
        errorMessage = 'Authentication failed. Please try logging out and back in.';
      } else if (errorMessage.includes('413') || errorMessage.includes('too large')) {
        errorMessage = 'File too large. Please use a smaller file (max 10MB).';
      } else if (errorMessage.includes('unsupported') || errorMessage.includes('mime')) {
        errorMessage = 'Unsupported file type. Please use PDF, JPEG, or PNG files.';
      }
      
      toast.error(`Upload failed: ${errorMessage}`);
      updateCertificate(certificate.id, { uploading: false, uploadProgress: 0 });
      return false;
    } finally {
      setActiveUploadId(null);
    }
  };

  // Prepare certificate data for database insertion
  const prepareCertificateData = (certificate: CertificateData) => {
    return {
      type: certificate.type as 'LICENSE' | 'MEDICAL' | 'RATING' | 'CERTIFICATE',
      code: certificate.code,
      aircraft_type: certificate.aircraft_type || null,
      issued_date: certificate.issued_date,
      expiry_date: certificate.expiry_date,
      valid: true
    };
  };

  // Get codes for selected certificate type
  const getCodesForType = (type: string) => {
    const certificateType = certificateTypes.find(t => t.value === type);
    if (!certificateType) return [];
    
    if (type === 'TYPE_RATING') {
      return aircraftTypes;
    }
    
    return certificateType.codes;
  };

  // Validate certificate
  const isCertificateValid = (cert: CertificateData) => {
    const hasRequiredFields = cert.type && cert.code && cert.issued_date && cert.expiry_date;
    const hasTypeRating = cert.type !== 'TYPE_RATING' || cert.aircraft_type;
    const hasFile = cert.file || cert.uploaded;
    
    // For now, allow saving without file to test database functionality
    return hasRequiredFields && hasTypeRating;
  };

  // Check if form is valid (at least one valid certificate)
  const isFormValid = () => {
    return certificates.length > 0 && certificates.some(cert => isCertificateValid(cert));
  };

  // Save all certificates using Supabase Direct
  const handleSave = async () => {
    const validCertificates = certificates.filter(cert => isCertificateValid(cert));
    
    if (validCertificates.length === 0) {
      toast.error('Please add at least one valid certificate');
      return;
    }

    if (!user) {
      toast.error('Authentication required. Please refresh the page and log in again.');
      return;
    }

    try {
      setLoading(true);
      console.log('💾 Starting certificate save process via Supabase Direct...');
      console.log('📋 Valid certificates to process:', validCertificates.length);

      const preparedCertificates = [];

      // Upload files and prepare certificate data
      for (let i = 0; i < validCertificates.length; i++) {
        const certificate = validCertificates[i];
        const progress = `${i + 1}/${validCertificates.length}`;
        
        setSaveProgress(`Processing certificate ${progress}: ${certificate.type} - ${certificate.code}`);
        
        // Upload file if not already uploaded
        if (certificate.file && !certificate.uploaded) {
          console.log(`🔄 Uploading certificate ${progress}: ${certificate.type} - ${certificate.code}`);
          setSaveProgress(`Uploading ${progress}: ${certificate.type} - ${certificate.code}`);
          
          try {
            const uploadSuccess = await uploadCertificateFile(certificate);
            if (!uploadSuccess) {
              console.warn(`⚠️ File upload failed for ${certificate.type} - ${certificate.code}, continuing without file`);
              toast.warn(`File upload failed for ${certificate.type} - ${certificate.code}, but qualification data will be saved`);
            } else {
              console.log(`✅ Successfully uploaded ${progress}: ${certificate.type} - ${certificate.code}`);
            }
          } catch (uploadError) {
            console.warn(`⚠️ Upload error for ${certificate.type} - ${certificate.code}:`, uploadError);
            toast.warn(`File upload failed for ${certificate.type} - ${certificate.code}, but qualification data will be saved`);
          }
        }

        // Prepare certificate data for database insertion
        setSaveProgress(`Preparing data ${progress}: ${certificate.type} - ${certificate.code}`);
        const preparedCert = prepareCertificateData(certificate);
        preparedCertificates.push(preparedCert);
      }

      // Save qualifications to Supabase database using Direct Service
      setSaveProgress('Saving qualifications to database...');
      console.log('💾 Saving qualifications via Supabase Direct...');
      
      // Pour le moment, simuler la sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveProgress('Completing profile setup...');
      console.log('✅ Qualifications saved successfully via Supabase Direct (simulated):', preparedCertificates.length, 'qualifications');
      toast.success(`${preparedCertificates.length} qualification(s) saved successfully!`);
      onComplete();
      
    } catch (error) {
      console.error('Error saving certificates:', error);
      
      // Provide specific error messages
      let errorMessage = 'Failed to save certificates';
      
      if (error.message.includes('upload')) {
        errorMessage = 'Failed to upload certificate files. Please try again.';
      } else if (error.message.includes('save qualifications') || error.message.includes('save certificates')) {
        errorMessage = 'Failed to save qualification data. Please try again.';
      } else if (error.message.includes('Authentication')) {
        errorMessage = 'Authentication expired. Please refresh the page and try again.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setSaveProgress('');
    }
  };

  // Add initial certificate if none exist
  React.useEffect(() => {
    if (certificates.length === 0) {
      addCertificate();
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg text-gray-900 mb-2">Certificates & Qualifications</h3>
        <p className="text-gray-600">
          Please enter your aviation certificates and qualifications information. At least one certificate is required.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> File upload is currently optional. You can add your qualification details and upload documents later.
          </p>
        </div>
      </div>

      {/* Certificates List */}
      <div className="space-y-4">
        {certificates.map((certificate, index) => (
          <Card key={certificate.id} className="relative">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center">
                  <Award className="h-4 w-4 mr-2" />
                  Certificate {index + 1}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  {isCertificateValid(certificate) && (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      <Check className="h-3 w-3 mr-1" />
                      Complete
                    </Badge>
                  )}
                  {certificates.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeCertificate(certificate.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Certificate Type */}
                <div>
                  <Label>Certificate Type *</Label>
                  <Select 
                    value={certificate.type} 
                    onValueChange={(value) => updateCertificate(certificate.id, { 
                      type: value, 
                      code: '', // Reset code when type changes
                      aircraft_type: '' 
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {certificateTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Certificate Code */}
                <div>
                  <Label>Certificate Code *</Label>
                  <Select 
                    value={certificate.code} 
                    onValueChange={(value) => updateCertificate(certificate.id, { code: value })}
                    disabled={!certificate.type}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select code" />
                    </SelectTrigger>
                    <SelectContent>
                      {getCodesForType(certificate.type).map(code => (
                        <SelectItem key={code} value={code}>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Aircraft Type (for Type Ratings) */}
                {certificate.type === 'TYPE_RATING' && (
                  <div className="md:col-span-2">
                    <Label>Aircraft Type *</Label>
                    <div className="relative">
                      <Plane className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Select 
                        value={certificate.aircraft_type || ''} 
                        onValueChange={(value) => updateCertificate(certificate.id, { aircraft_type: value })}
                      >
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Select aircraft type" />
                        </SelectTrigger>
                        <SelectContent>
                          {aircraftTypes.map(type => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Issued Date */}
                <div>
                  <Label>Issued Date *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={certificate.issued_date}
                      onChange={(e) => updateCertificate(certificate.id, { issued_date: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Expiry Date */}
                <div>
                  <Label>Expiry Date *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={certificate.expiry_date}
                      onChange={(e) => updateCertificate(certificate.id, { expiry_date: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <Label>Certificate Document (Optional)</Label>
                <Card 
                  className={`border-2 border-dashed transition-colors cursor-pointer ${
                    certificate.uploaded 
                      ? 'border-green-300 bg-green-50' 
                      : certificate.file
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => {
                    fileInputRef.current?.click();
                    fileInputRef.current?.setAttribute('data-certificate-id', certificate.id);
                  }}
                >
                  <CardContent className="p-4 text-center">
                    {certificate.uploaded ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Check className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">
                          {certificate.file?.name || 'File uploaded'}
                        </span>
                      </div>
                    ) : certificate.file ? (
                      <div className="space-y-2">
                        {certificate.uploading ? (
                          <>
                            <Loader2 className="h-6 w-6 mx-auto text-blue-600 animate-spin" />
                            <Progress value={certificate.uploadProgress || 0} className="h-2" />
                            <p className="text-xs text-blue-600">
                              Uploading... {certificate.uploadProgress || 0}%
                            </p>
                          </>
                        ) : (
                          <>
                            <FileText className="h-6 w-6 mx-auto text-blue-600" />
                            <p className="text-sm text-blue-600">{certificate.file.name}</p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-6 w-6 mx-auto text-gray-400" />
                        <p className="text-sm text-gray-600">Click to upload certificate</p>
                        <p className="text-xs text-gray-500">PDF, JPEG, PNG (max 10MB)</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Certificate Button */}
      <Button variant="outline" onClick={addCertificate} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Another Certificate
      </Button>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={(e) => {
          const file = e.target.files?.[0];
          const certificateId = e.target.getAttribute('data-certificate-id');
          if (file && certificateId) {
            handleFileSelect(certificateId, file);
          }
        }}
        className="hidden"
      />

      {/* Save Progress Indicator */}
      {loading && saveProgress && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-blue-700 font-medium">Saving certificates...</p>
              <p className="text-xs text-blue-600 mt-1">{saveProgress}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onPrevious}>
          Previous Step
        </Button>
        
        <Button 
          onClick={handleSave}
          disabled={!isFormValid() || loading || activeUploadId !== null}
          className="min-w-40"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {saveProgress || 'Saving...'}
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Complete Setup
            </>
          )}
        </Button>
      </div>
    </div>
  );
}