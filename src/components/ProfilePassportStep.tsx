import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner@2.0.3';
import { 
  FileText, 
  Upload, 
  Calendar,
  Globe,
  Loader2,
  Save,
  Check,
  AlertCircle,
  X
} from 'lucide-react';

interface ProfilePassportStepProps {
  userProfile: any;
  onComplete: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface PassportData {
  issue_country: string;
  expiry_date: string;
}

export default function ProfilePassportStep({ 
  userProfile, 
  onComplete, 
  onNext,
  onPrevious 
}: ProfilePassportStepProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [passportData, setPassportData] = useState<PassportData>({
    issue_country: '',
    expiry_date: ''
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  // Common countries for passport issuance
  const countries = [
    'United States', 'United Kingdom', 'Canada', 'France', 'Germany', 
    'Australia', 'Switzerland', 'Spain', 'Italy', 'Netherlands',
    'Belgium', 'Austria', 'Sweden', 'Norway', 'Denmark', 'Japan',
    'Singapore', 'New Zealand', 'Ireland', 'Portugal', 'Other'
  ];

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF, JPEG, or PNG file');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setUploadComplete(false);
    toast.success('File selected! You can now fill in the passport details.');
  };

  // Handle drag and drop
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      // Create a fake input event to reuse the same validation logic
      const fakeEvent = {
        target: { files: [file] }
      } as any;
      handleFileSelect(fakeEvent);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  // Simulate file upload (local mode)
  const simulateUpload = async () => {
    if (!selectedFile || !user) return false;

    try {
      setUploading(true);
      setUploadProgress(0);

      console.log('🔄 Simulating passport upload...');

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 20;
        });
      }, 200);

      // Wait for simulation to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadComplete(true);
      
      console.log('✅ Upload simulation successful');
      toast.success('Passport uploaded successfully!');
      
      return true;
    } catch (error) {
      console.error('Error simulating upload:', error);
      toast.error(`Upload failed: ${error.message}`);
      return false;
    } finally {
      setUploading(false);
    }
  };

  // Handle form field changes
  const handleChange = (field: keyof PassportData, value: string) => {
    setPassportData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Validate form
  const isFormValid = () => {
    return (
      passportData.issue_country.trim() !== '' &&
      passportData.expiry_date.trim() !== '' &&
      (selectedFile || uploadComplete) // File is selected OR already uploaded
    );
  };

  // Check if expiry date is valid (not expired and not too far in future)
  const isExpiryDateValid = () => {
    if (!passportData.expiry_date) return true; // Let required validation handle empty dates
    
    const expiryDate = new Date(passportData.expiry_date);
    const today = new Date();
    const tenYearsFromNow = new Date();
    tenYearsFromNow.setFullYear(today.getFullYear() + 10);
    
    return expiryDate > today && expiryDate <= tenYearsFromNow;
  };

  // Store passport data locally
  const storePassportDataLocally = () => {
    if (!user) return;

    try {
      console.log('💾 Storing passport data locally...');
      
      const passportInfo = {
        issue_country: passportData.issue_country,
        expiry_date: passportData.expiry_date,
        uploaded_at: new Date().toISOString(),
        passport_completed: true,
        file_name: selectedFile?.name,
        file_size: selectedFile?.size,
        file_type: selectedFile?.type
      };

      // Store in localStorage for this user
      const storageKey = `crewtech_passport_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(passportInfo));
      
      console.log('✅ Passport data stored locally:', passportInfo);
    } catch (error) {
      console.warn('Failed to store passport data locally:', error);
    }
  };

  // Save passport data
  const handleSave = async () => {
    if (!isFormValid()) {
      toast.error('Please fill in all required fields and select a passport file');
      return;
    }

    if (!isExpiryDateValid()) {
      toast.error('Please enter a valid expiry date (not expired and within 10 years)');
      return;
    }

    try {
      setLoading(true);
      console.log('💾 Saving passport information...');

      // Upload file if not already uploaded
      if (selectedFile && !uploadComplete) {
        console.log('Processing passport file...');
        const uploadSuccess = await simulateUpload();
        if (!uploadSuccess) {
          return;
        }
      }

      // Store data locally
      storePassportDataLocally();

      console.log('✅ Passport data prepared:', passportData);
      toast.success('Passport information saved successfully!');
      onComplete();
      
      // Small delay then auto-advance to next step
      setTimeout(() => {
        onNext();
      }, 1000);
      
    } catch (error) {
      console.error('Error preparing passport data:', error);
      toast.error('Failed to save passport information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg text-gray-900 mb-2">Passport Upload</h3>
        <p className="text-gray-600">Please upload a clear copy of your passport and provide the details below.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload */}
        <div className="space-y-4">
          <h4 className="text-sm text-gray-900 flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Passport Document
          </h4>

          <Card 
            className={`border-2 border-dashed transition-colors cursor-pointer ${
              selectedFile 
                ? 'border-green-300 bg-green-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <CardContent className="p-6 text-center">
              {selectedFile ? (
                <div className="space-y-3">
                  {uploadComplete ? (
                    <Check className="h-12 w-12 mx-auto text-green-600" />
                  ) : uploading ? (
                    <Loader2 className="h-12 w-12 mx-auto text-blue-600 animate-spin" />
                  ) : (
                    <FileText className="h-12 w-12 mx-auto text-green-600" />
                  )}
                  
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  
                  {uploading && (
                    <div className="space-y-2">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-gray-500">Processing... {uploadProgress}%</p>
                    </div>
                  )}
                  
                  {!uploading && !uploadComplete && (
                    <div className="space-y-2">
                      <p className="text-sm text-blue-600 font-medium">File ready</p>
                      <p className="text-xs text-gray-500">Will process when you save</p>
                    </div>
                  )}
                  
                  {uploadComplete && (
                    <p className="text-sm text-green-600 font-medium">File processed!</p>
                  )}
                  
                  <div className="flex space-x-2 justify-center">
                    {selectedFile && !uploadComplete && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await simulateUpload();
                        }}
                        disabled={uploading}
                      >
                        Process Now
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setUploadComplete(false);
                        setUploadProgress(0);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="h-12 w-12 mx-auto text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, JPEG, or PNG files (max 10MB)
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Passport Details */}
        <div className="space-y-4">
          <h4 className="text-sm text-gray-900 flex items-center">
            <Globe className="h-4 w-4 mr-2" />
            Passport Details
          </h4>

          <div>
            <Label htmlFor="issue_country">Issuing Country *</Label>
            <Select 
              value={passportData.issue_country} 
              onValueChange={(value) => handleChange('issue_country', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select issuing country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="expiry_date">Expiry Date *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="expiry_date"
                type="date"
                value={passportData.expiry_date}
                onChange={(e) => handleChange('expiry_date', e.target.value)}
                className="pl-10"
                required
              />
            </div>
            {passportData.expiry_date && !isExpiryDateValid() && (
              <div className="flex items-center mt-2 text-red-600">
                <AlertCircle className="h-4 w-4 mr-2" />
                <span className="text-sm">Please enter a valid expiry date</span>
              </div>
            )}
          </div>

          {/* Expiry warning */}
          {passportData.expiry_date && isExpiryDateValid() && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Important:</p>
                  <p>Make sure your passport is valid for at least 6 months from your planned travel dates.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onPrevious}>
          Previous Step
        </Button>
        
        <Button 
          onClick={handleSave}
          disabled={!isFormValid() || !isExpiryDateValid() || loading || uploading}
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