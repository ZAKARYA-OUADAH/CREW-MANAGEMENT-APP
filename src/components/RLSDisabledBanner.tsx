import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { createClient } from '../utils/supabase/client';
import { 
  CheckCircle, 
  Shield, 
  Database, 
  X,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

export default function RLSDisabledBanner() {
  const [supabase] = useState(() => createClient());
  const [showBanner, setShowBanner] = useState(false);
  const [testing, setTesting] = useState(false);
  const [rlsEnabled, setRlsEnabled] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('rls_disabled_banner_dismissed') === 'true';
  });

  // Test RLS status on mount
  useEffect(() => {
    const testRLS = async () => {
      if (dismissed) return;

      try {
        setTesting(true);
        
        // Try to access users table
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .limit(1);
        
        if (!error && data) {
          // RLS is disabled if we can access data without errors
          setRlsEnabled(false);
          setShowBanner(true);
        } else if (error && error.message.includes('policy')) {
          // RLS is still enabled
          setRlsEnabled(true);
        }
      } catch (err) {
        console.log('RLS test error:', err);
      } finally {
        setTesting(false);
      }
    };

    testRLS();
  }, [supabase, dismissed]);

  const handleDismiss = () => {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem('rls_disabled_banner_dismissed', 'true');
  };

  const handleRetest = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1);
      
      if (!error && data) {
        setRlsEnabled(false);
        setShowBanner(true);
      } else if (error && error.message.includes('policy')) {
        setRlsEnabled(true);
        setShowBanner(false);
      }
    } catch (err) {
      console.log('RLS retest error:', err);
    } finally {
      setTesting(false);
    }
  };

  if (!showBanner || dismissed || rlsEnabled) {
    return null;
  }

  return (
    <Alert className="border-green-200 bg-green-50 mb-4">
      <CheckCircle className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>
              <strong>RLS désactivé</strong> - Le CrewPicker et les données utilisateur sont maintenant accessibles.
            </span>
            <Badge variant="outline" className="text-green-600 bg-green-100 border-green-300">
              <Database className="h-3 w-3 mr-1" />
              Données Supabase actives
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRetest}
              disabled={testing}
              className="text-green-600 border-green-300 hover:bg-green-100"
            >
              {testing ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Shield className="h-3 w-3 mr-1" />
              )}
              Vérifier RLS
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleDismiss}
              className="text-green-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}