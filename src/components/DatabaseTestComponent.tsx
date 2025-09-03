import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Database, 
  Users, 
  Plane, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Loader2 
} from 'lucide-react';
import { apiClient } from '../utils/supabase/client';

interface DatabaseStats {
  users: number;
  crew: number;
  missions: number;
  notifications: number;
}

export default function DatabaseTestComponent() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [crewData, setCrewData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const testDatabaseConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Testing database connection...');
      
      // Test basic health check first
      try {
        const health = await apiClient.healthCheck();
        console.log('Health check passed:', health);
      } catch (healthError) {
        console.warn('Health check failed:', healthError);
      }

      // Get crew data
      const crewResult = await apiClient.getCrew();
      console.log('Crew API result:', crewResult);
      
      if (crewResult && crewResult.crew) {
        setCrewData(crewResult.crew);
        console.log(`Found ${crewResult.crew.length} crew members`);
      }

      // Get database status
      try {
        const statusResult = await apiClient.getDatabaseStatus();
        console.log('Database status:', statusResult);
        
        if (statusResult) {
          setStats({
            users: statusResult.users || 0,
            crew: crewResult?.crew?.length || 0,
            missions: statusResult.missions || 0,
            notifications: statusResult.notifications || 0
          });
        }
      } catch (statusError) {
        console.warn('Could not get database status:', statusError);
        setStats({
          users: 0,
          crew: crewResult?.crew?.length || 0,
          missions: 0,
          notifications: 0
        });
      }

    } catch (err) {
      console.error('Database test failed:', err);
      setError(err instanceof Error ? err.message : 'Database connection failed');
    } finally {
      setLoading(false);
    }
  };

  const populateDatabase = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Attempting to populate database...');
      const result = await apiClient.autoSeedDatabase();
      console.log('Auto seed result:', result);
      
      // Refresh data after seeding
      setTimeout(() => {
        testDatabaseConnection();
      }, 1000);
      
    } catch (err) {
      console.error('Database population failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to populate database');
      setLoading(false);
    }
  };

  useEffect(() => {
    testDatabaseConnection();
  }, []);

  const getStatusColor = (count: number) => {
    if (count > 0) return 'text-green-600';
    return 'text-red-600';
  };

  const getStatusIcon = (count: number) => {
    if (count > 0) return <CheckCircle className="h-4 w-4 text-green-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-6 w-6" />
          <span>Database Test & Population</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Test database connectivity and populate with sample data
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button 
            onClick={testDatabaseConnection}
            disabled={loading}
            variant="outline"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Test Connection
          </Button>
          <Button 
            onClick={populateDatabase}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Database className="h-4 w-4 mr-2" />
            )}
            Populate Database
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Database Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Users</p>
                    <p className={`text-2xl ${getStatusColor(stats.users)}`}>
                      {stats.users}
                    </p>
                  </div>
                  {getStatusIcon(stats.users)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Crew</p>
                    <p className={`text-2xl ${getStatusColor(stats.crew)}`}>
                      {stats.crew}
                    </p>
                  </div>
                  {getStatusIcon(stats.crew)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Missions</p>
                    <p className={`text-2xl ${getStatusColor(stats.missions)}`}>
                      {stats.missions}
                    </p>
                  </div>
                  {getStatusIcon(stats.missions)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Notifications</p>
                    <p className={`text-2xl ${getStatusColor(stats.notifications)}`}>
                      {stats.notifications}
                    </p>
                  </div>
                  {getStatusIcon(stats.notifications)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Crew Data Preview */}
        {crewData.length > 0 && (
          <div className="space-y-2">
            <h3 className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Crew Members Found</span>
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {crewData.map((crew, index) => (
                <div key={crew.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm">{crew.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-600">
                      {crew.user_metadata?.position || crew.position || 'Unknown Position'}
                    </p>
                    {/* Show aircraft qualifications */}
                    {crew.aircraft_qualifications && crew.aircraft_qualifications.length > 0 && (
                      <div className="mt-1">
                        <p className="text-xs text-blue-600">
                          Aircraft: {crew.aircraft_qualifications.join(', ')}
                        </p>
                      </div>
                    )}
                    {/* Fallback: show type ratings from complex qualifications */}
                    {(!crew.aircraft_qualifications || crew.aircraft_qualifications.length === 0) && 
                     crew.qualifications && Array.isArray(crew.qualifications) && (
                      <div className="mt-1">
                        <p className="text-xs text-purple-600">
                          Type Ratings: {crew.qualifications
                            .filter(q => q.type === 'type_rating')
                            .map(q => q.aircraft)
                            .join(', ') || 'None'}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {crew.user_metadata?.role || crew.role || 'unknown'}
                    </Badge>
                    <Badge variant={crew.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {crew.status || 'active'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <Alert className="border-blue-200 bg-blue-50">
          <Database className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="space-y-1">
              <p className="font-medium">Instructions:</p>
              <p className="text-sm">1. Click "Test Connection" to check if the database is accessible</p>
              <p className="text-sm">2. If you see 0 crew members, click "Populate Database" to create sample data</p>
              <p className="text-sm">3. The crew data should then be visible in Mission Request</p>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}