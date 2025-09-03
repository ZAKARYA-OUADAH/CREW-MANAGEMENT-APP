import React, { useState } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  Info, 
  Database, 
  X, 
  CheckCircle,
  AlertTriangle,
  Monitor,
  Wifi
} from 'lucide-react';

interface DemoModeIndicatorProps {
  show?: boolean;
  onDismiss?: () => void;
  compact?: boolean;
}

export default function DemoModeIndicator({ 
  show = true, 
  onDismiss,
  compact = false 
}: DemoModeIndicatorProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!show || isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (compact) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                <Database className="h-3 w-3 mr-1" />
                Demo Mode
              </Badge>
              <span className="text-sm">Using demonstration data</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-blue-900">
            <Info className="h-5 w-5" />
            <span>Demo Mode Active</span>
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              Development
            </Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-blue-800">
          The application is currently running in demonstration mode using sample data. This happens when:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <strong>Edge Functions unavailable</strong><br />
              Supabase backend services not deployed
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <Wifi className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <strong>Connectivity issues</strong><br />
              Network or configuration problems
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <Monitor className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <strong>Local development</strong><br />
              Testing without live backend
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <strong>Fully functional</strong><br />
              All features work with demo data
            </div>
          </div>
        </div>
        
        <div className="bg-blue-100 rounded p-3 mt-3">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> Demo mode provides a realistic preview of the application with 5 sample crew members. 
            All interactions work normally but data changes are not persisted.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}