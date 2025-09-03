import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner@2.0.3';
import { 
  User, 
  FileText, 
  Award,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Home
} from 'lucide-react';
import SimpleProfileRedirect from './SimpleProfileRedirect';

// Import step components
import ProfileIdentityStep from './ProfileIdentityStep';
import ProfilePassportStep from './ProfilePassportStep';
import ProfileCertificatesStep from './ProfileCertificatesStep';

interface ProfileSetupWizardProps {
  onComplete: () => void;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  birth_date?: string;
  nationality?: string;
  phone?: string;
  profile_complete: boolean;
  validation_status: string;
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

export default function ProfileSetupWizard({ onComplete }: ProfileSetupWizardProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCompletionRedirect, setShowCompletionRedirect] = useState(false);

  // Protection: Si c'est un admin, rediriger immédiatement
  useEffect(() => {
    if (user && user.role === 'admin') {
      console.log('👑 Admin detected in ProfileSetupWizard - redirecting to dashboard');
      toast.info('Redirection vers le dashboard administrateur...');
      setTimeout(() => {
        onComplete();
      }, 1000);
    }
  }, [user, onComplete]);
  
  // Step completion states
  const [stepCompletions, setStepCompletions] = useState({
    identity: false,
    passport: false,
    certificates: false
  });

  const steps = [
    { 
      number: 1, 
      title: 'Identity', 
      icon: User, 
      description: 'Personal information',
      key: 'identity' as const
    },
    { 
      number: 2, 
      title: 'Passport', 
      icon: FileText, 
      description: 'Upload passport document',
      key: 'passport' as const
    },
    { 
      number: 3, 
      title: 'Certificates', 
      icon: Award, 
      description: 'Upload qualifications',
      key: 'certificates' as const
    }
  ];

  // Initialize new user profile (create if doesn't exist)
  const initializeUserProfile = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      console.log('🔍 Initializing profile for new user:', user.email);
      
      // Create a new user profile based on available auth information
      const initialProfile = {
        id: user.id,
        email: user.email,
        name: user.name || user.user_metadata?.name || '',
        role: user.role || 'freelancer',
        profile_complete: false,
        validation_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Basic fields that will be filled during setup
        birth_date: null,
        nationality: null,
        phone: null
      };
      
      setUserProfile(initialProfile);
      
      // All steps start as incomplete for new users
      setStepCompletions({
        identity: false,
        passport: false,
        certificates: false
      });
      
      console.log('✅ New user profile initialized:', initialProfile);
      
    } catch (error) {
      console.error('Error initializing profile:', error);
      toast.error('Failed to initialize profile setup');
    } finally {
      setLoading(false);
    }
  };

  // Check if all steps are completed and create user in database
  const checkAllStepsCompleted = async () => {
    if (stepCompletions.identity && stepCompletions.passport && stepCompletions.certificates) {
      try {
        console.log('🎉 All steps completed, finalizing profile...');
        
        // Simply mark the profile as complete in auth metadata
        // The actual user creation will be handled by the backend when user logs in again
        
        toast.success('Profile completed successfully!');
        
        // Show completion redirect screen instead of calling onComplete immediately
        setShowCompletionRedirect(true);
        
      } catch (error) {
        console.error('Error completing profile:', error);
        toast.error('Failed to complete profile setup');
        // Even if there's an error, show the completion screen
        // The user can still access the dashboard
        setShowCompletionRedirect(true);
      }
    }
  };

  // Handle step completion
  const handleStepComplete = (stepKey: keyof typeof stepCompletions) => {
    setStepCompletions(prev => {
      const newCompletions = { ...prev, [stepKey]: true };
      
      // Check if this was the last step
      if (Object.values(newCompletions).every(completed => completed)) {
        setTimeout(() => checkAllStepsCompleted(), 500);
      }
      
      return newCompletions;
    });
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleGoToDashboard = () => {
    setShowCompletionRedirect(true);
  };

  const handleFinalRedirect = () => {
    onComplete();
  };

  useEffect(() => {
    initializeUserProfile();
  }, [user]);

  const currentStepData = steps[currentStep - 1];
  const progressPercentage = (currentStep / steps.length) * 100;
  const allStepsCompleted = Object.values(stepCompletions).every(completed => completed);

  // Show completion redirect screen when profile is completed
  if (showCompletionRedirect && user) {
    return (
      <SimpleProfileRedirect user={user} />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading profile setup...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600">Please complete all steps to access your dashboard</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-600">Step {currentStep} of {steps.length}</span>
            <span className="text-sm text-gray-600">{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Steps indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-8">
            {steps.map((step) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = stepCompletions[step.key];
              
              return (
                <div 
                  key={step.number}
                  className={`flex flex-col items-center cursor-pointer transition-all duration-200 ${
                    isActive ? 'scale-110' : ''
                  }`}
                  onClick={() => setCurrentStep(step.number)}
                >
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-200
                    ${isCompleted 
                      ? 'bg-green-100 border-2 border-green-500' 
                      : isActive 
                        ? 'bg-blue-100 border-2 border-blue-500' 
                        : 'bg-gray-100 border-2 border-gray-300'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <StepIcon className={`h-6 w-6 ${
                        isActive ? 'text-blue-600' : 'text-gray-400'
                      }`} />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                  <span className="text-xs text-gray-400 text-center max-w-20">
                    {step.description}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <currentStepData.icon className="h-6 w-6 mr-3" />
                Step {currentStep}: {currentStepData.title}
              </CardTitle>
              {stepCompletions[currentStepData.key] && (
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Completed
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Render appropriate step component */}
            {currentStep === 1 && (
              <ProfileIdentityStep 
                userProfile={userProfile}
                onComplete={() => handleStepComplete('identity')}
                onNext={handleNext}
              />
            )}
            {currentStep === 2 && (
              <ProfilePassportStep 
                userProfile={userProfile}
                onComplete={() => handleStepComplete('passport')}
                onNext={handleNext}
                onPrevious={handlePrevious}
              />
            )}
            {currentStep === 3 && (
              <ProfileCertificatesStep 
                userProfile={userProfile}
                onComplete={() => handleStepComplete('certificates')}
                onPrevious={handlePrevious}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button 
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="text-center">
            {allStepsCompleted ? (
              <Button onClick={handleGoToDashboard} className="bg-green-600 hover:bg-green-700">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            ) : (
              <span className="text-sm text-gray-500">
                Complete all steps to continue
              </span>
            )}
          </div>

          <Button 
            onClick={handleNext}
            disabled={currentStep === steps.length || !stepCompletions[currentStepData.key]}
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}