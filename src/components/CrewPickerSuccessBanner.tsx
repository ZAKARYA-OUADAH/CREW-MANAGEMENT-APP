import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { createClient } from '../utils/supabase/client';
import { 
  CheckCircle, 
  Users, 
  Database, 
  X,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export default function CrewPickerSuccessBanner() {
  const [supabase] = useState(() => createClient());
  const [showBanner, setShowBanner] = useState(false);
  const [testing, setTesting] = useState(false);
  const [crewCount, setCrewCount] = useState(0);
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('crew_picker_success_dismissed') === 'true';
  });

  // Test crew data availability on mount
  useEffect(() => {
    const testCrewData = async () => {
      if (dismissed) return;

      try {
        setTesting(true);
        
        // Try to count crew members
        const { count, error } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('profile_complete', true)
          .not('name', 'is', null);
        
        if (!error && count !== null && count > 0) {
          setCrewCount(count);
          setShowBanner(true);
        }
      } catch (err) {
        console.log('Crew data test error:', err);
      } finally {
        setTesting(false);
      }
    };

    testCrewData();
  }, [supabase, dismissed]);

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('crew_picker_success_dismissed', 'true');
  };

  const handleRetest = async () => {
    setTesting(true);
    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('profile_complete', true)
        .not('name', 'is', null);
      
      if (!error && count !== null) {
        setCrewCount(count);
        if (count > 0) {
          setShowBanner(true);
        }
      }
    } catch (err) {
      console.log('Crew data retest error:', err);
    } finally {
      setTesting(false);
    }
  };

  if (!showBanner || dismissed || crewCount === 0) {
    return null;
  }

  return (
    <Alert className="border-blue-200 bg-blue-50 mb-4">
      <Sparkles className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>
              <strong>CrewPicker opérationnel !</strong> - {crewCount} membre{crewCount > 1 ? 's' : ''} d'équipage disponible{crewCount > 1 ? 's' : ''} pour sélection.
            </span>
            <Badge variant="outline" className="text-blue-600 bg-blue-100 border-blue-300">
              <Users className="h-3 w-3 mr-1" />
              {crewCount} crew{crewCount > 1 ? 's' : ''}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRetest}
              disabled={testing}
              className="text-blue-600 border-blue-300 hover:bg-blue-100"
            >
              {testing ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Database className="h-3 w-3 mr-1" />
              )}
              Actualiser
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleDismiss}
              className="text-blue-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}