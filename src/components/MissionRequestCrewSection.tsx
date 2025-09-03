import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText,
  AlertCircle,
  CheckCircle,
  Send
} from 'lucide-react';
// Removed aircraftData import - should come from API
import { getMissingFields } from './MissionRequestHelpers';

interface MissionRequestCrewSectionProps {
  crew: any;
  onNotifyToComplete: () => void;
}

export default function MissionRequestCrewSection({ crew, onNotifyToComplete }: MissionRequestCrewSectionProps) {
  // Ensure crew data is valid before processing
  if (!crew) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Crew Member Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription>
              <p className="text-red-800 text-sm">No crew member data available</p>
              <p className="text-xs text-red-600">Please go back and select a crew member again.</p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const missingFields = getMissingFields(crew);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>Crew Member Details</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4>{crew.name || 'Unknown'}</h4>
              <p className="text-sm text-gray-600">{crew.position || 'Unknown Position'}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline">{crew.type || 'Unknown'}</Badge>
                <Badge variant="outline" className="text-xs">
                  {crew.ggid || 'N/A'}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <Mail className="h-4 w-4 text-gray-500" />
              <span>{crew.email || 'No email provided'}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <Phone className="h-4 w-4 text-gray-500" />
              <span>{crew.phone || 'No phone provided'}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span>{crew.address || 'No address provided'}</span>
            </div>
            {crew.emergencyContact && crew.emergencyContact.name && (
              <div className="text-sm text-gray-600">
                <span className="text-gray-500">Emergency: </span>
                {crew.emergencyContact.name} - {crew.emergencyContact.phone || 'No phone'}
              </div>
            )}
          </div>
        </div>

        {/* Qualifications */}
        <div className="space-y-3">
          <h5 className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Qualifications</span>
          </h5>
          <div className="flex flex-wrap gap-2">
            {crew.qualifications && crew.qualifications.length > 0 ? crew.qualifications.map((qual, idx) => {
              // Note: Aircraft type mapping was removed with mock data cleanup
              return (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {qual}
                </Badge>
              );
            }) : (
              <Badge variant="secondary" className="text-xs text-gray-500">
                No qualifications recorded
              </Badge>
            )}
          </div>
        </div>

        {/* Missing Profile Fields - Now shows warning but allows assignment */}
        {missingFields.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="space-y-3">
              <div>
                <p className="text-orange-800 text-sm">Incomplete Profile Information</p>
                <p className="text-xs text-orange-600 mb-2">
                  You can still create a mission with this crew member, but some information is missing.
                </p>
                <div className="mt-2 space-y-1">
                  {missingFields.map((field, idx) => (
                    <div key={field.field} className="flex items-center justify-between text-sm">
                      <span className="text-orange-700">{field.label}</span>
                      <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                        Missing
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onNotifyToComplete}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  <Send className="h-3 w-3 mr-1" />
                  Notify to Complete
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Show when profile is complete */}
        {missingFields.length === 0 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <p className="text-green-800 text-sm">Profile Complete</p>
              <p className="text-xs text-green-600">All required information is available for mission assignment.</p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}