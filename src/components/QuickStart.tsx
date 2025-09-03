import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner@2.0.3';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  AlertTriangle,
  Server,
  Database,
  Users,
  ExternalLink,
  Play,
  Terminal,
  Book,
  Rocket
} from 'lucide-react';

interface SystemCheck {
  name: string;
  status: 'checking' | 'pass' | 'fail' | 'warning';
  message: string;
  action?: string;
  actionUrl?: string;
}

export default function QuickStart() {
  const [checks, setChecks] = useState<SystemCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [allPassed, setAllPassed] = useState(false);

  const runSystemChecks = async () => {
    setIsRunning(true);
    setAllPassed(false);
    
    const initialChecks: SystemCheck[] = [
      { name: 'Configuration', status: 'checking', message: 'Checking Supabase configuration...' },
      { name: 'Edge Functions', status: 'checking', message: 'Testing Edge Functions connectivity...' },
      { name: 'Authentication', status: 'checking', message: 'Verifying authentication system...' },
      { name: 'Data Access', status: 'checking', message: 'Testing data layer...' }
    ];
    
    setChecks(initialChecks);

    // Check Configuration
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      if (projectId && publicAnonKey) {
        setChecks(prev => prev.map(check => 
          check.name === 'Configuration' 
            ? { ...check, status: 'pass', message: 'Supabase configuration loaded successfully' }
            : check
        ));
      } else {
        throw new Error('Missing configuration');
      }
    } catch (error) {
      setChecks(prev => prev.map(check => 
        check.name === 'Configuration' 
          ? { ...check, status: 'fail', message: 'Supabase configuration missing or invalid' }
          : check
      ));
    }

    // Small delay for visual effect
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check Edge Functions
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const healthUrl = `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/health`;
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        signal: AbortSignal.timeout(8000)
      });

      if (response.ok) {
        setChecks(prev => prev.map(check => 
          check.name === 'Edge Functions' 
            ? { ...check, status: 'pass', message: 'Edge Functions are deployed and accessible' }
            : check
        ));
      } else if (response.status === 404) {
        setChecks(prev => prev.map(check => 
          check.name === 'Edge Functions' 
            ? { 
                ...check, 
                status: 'fail', 
                message: 'Edge Functions not deployed',
                action: 'Deploy Functions',
                actionUrl: `https://supabase.com/dashboard/project/${projectId}/functions`
              }
            : check
        ));
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error: any) {
      const isNetworkError = error.name === 'AbortError' || error.message.includes('Failed to fetch');
      setChecks(prev => prev.map(check => 
        check.name === 'Edge Functions' 
          ? { 
              ...check, 
              status: 'fail', 
              message: isNetworkError ? 'Network error - cannot connect to Edge Functions' : 'Edge Functions error',
              action: 'Enable Demo Mode'
            }
          : check
      ));
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // Check Authentication
    try {
      const storedAuth = localStorage.getItem('crewtech_auth_user');
      if (storedAuth) {
        setChecks(prev => prev.map(check => 
          check.name === 'Authentication' 
            ? { ...check, status: 'pass', message: 'Authentication system working with local storage' }
            : check
        ));
      } else {
        setChecks(prev => prev.map(check => 
          check.name === 'Authentication' 
            ? { ...check, status: 'warning', message: 'No active session - ready for login' }
            : check
        ));
      }
    } catch (error) {
      setChecks(prev => prev.map(check => 
        check.name === 'Authentication' 
          ? { ...check, status: 'fail', message: 'Authentication system error' }
          : check
      ));
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // Check Data Access
    try {
      // Test local storage access
      const testKey = 'crewtech_test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      setChecks(prev => prev.map(check => 
        check.name === 'Data Access' 
          ? { ...check, status: 'pass', message: 'Local data storage accessible' }
          : check
      ));
    } catch (error) {
      setChecks(prev => prev.map(check => 
        check.name === 'Data Access' 
          ? { ...check, status: 'fail', message: 'Local storage not accessible' }
          : check
      ));
    }

    setIsRunning(false);
    
    // Check if all passed
    const finalChecks = await new Promise<SystemCheck[]>(resolve => {
      setTimeout(() => {
        setChecks(current => {
          const hasCriticalFailures = current.some(check => 
            check.status === 'fail' && check.name !== 'Edge Functions'
          );
          setAllPassed(!hasCriticalFailures);
          resolve(current);
          return current;
        });
      }, 100);
    });
  };

  const enableDemoMode = () => {
    localStorage.setItem('USE_LOCAL_MODE', 'true');
    toast.success('Demo mode enabled - reloading application...');
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const getStatusIcon = (status: SystemCheck['status']) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: SystemCheck['status']) => {
    switch (status) {
      case 'checking':
        return <Badge className="bg-blue-100 text-blue-800">Checking...</Badge>;
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">OK</Badge>;
      case 'fail':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
    }
  };

  useEffect(() => {
    runSystemChecks();
  }, []);

  const passedChecks = checks.filter(c => c.status === 'pass').length;
  const failedChecks = checks.filter(c => c.status === 'fail').length;
  const warningChecks = checks.filter(c => c.status === 'warning').length;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Rocket className="h-5 w-5" />
          <span>CrewTech System Status</span>
          {allPassed && <Badge className="bg-green-100 text-green-800 ml-2">All Systems Go!</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status">System Status</TabsTrigger>
            <TabsTrigger value="solutions">Quick Solutions</TabsTrigger>
            <TabsTrigger value="help">Help & Docs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="status" className="space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{passedChecks}</div>
                  <div className="text-sm text-gray-600">Passed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{failedChecks}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{warningChecks}</div>
                  <div className="text-sm text-gray-600">Warnings</div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              {checks.map((check, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(check.status)}
                    <div>
                      <p className="font-medium">{check.name}</p>
                      <p className="text-sm text-gray-600">{check.message}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(check.status)}
                    {check.action && check.actionUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(check.actionUrl, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        {check.action}
                      </Button>
                    )}
                    {check.action === 'Enable Demo Mode' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={enableDemoMode}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        {check.action}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-4">
              <Button onClick={runSystemChecks} disabled={isRunning}>
                <Server className="h-4 w-4 mr-2" />
                Re-run Checks
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="solutions" className="space-y-4">
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Common Issues & Solutions</strong>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Edge Functions Not Deployed</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      The server functions haven't been deployed to your Supabase project yet.
                    </p>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => import('../utils/supabase/info').then(({ projectId }) => 
                          window.open(`https://supabase.com/dashboard/project/${projectId}/functions`, '_blank')
                        )}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Supabase Dashboard
                      </Button>
                      <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                        supabase functions deploy server --project-ref YOUR_PROJECT_ID
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-2">Use Demo Mode</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Continue with demo data while setting up the backend.
                    </p>
                    <Button onClick={enableDemoMode} variant="default" size="sm">
                      <Play className="h-4 w-4 mr-2" />
                      Enable Demo Mode
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="help" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium flex items-center mb-2">
                      <Book className="h-4 w-4 mr-2" />
                      Documentation
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Complete setup and usage documentation.
                    </p>
                    <div className="space-y-1 text-xs">
                      <div>• DEPLOIEMENT_COMPLET_ZERO.md</div>
                      <div>• GUIDE_VERIFICATION_RAPIDE.md</div>
                      <div>• DATABASE_SETUP.md</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium flex items-center mb-2">
                      <Terminal className="h-4 w-4 mr-2" />
                      Quick Commands
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Essential CLI commands for setup.
                    </p>
                    <div className="space-y-1 text-xs font-mono bg-gray-100 p-2 rounded">
                      <div>supabase login</div>
                      <div>supabase link --project-ref ID</div>
                      <div>supabase functions deploy server</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Need Help?</strong> Check the documentation files in your project root for detailed setup instructions.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}