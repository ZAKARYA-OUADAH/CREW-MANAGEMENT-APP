import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { createClient } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Database,
  Users,
  Plane,
  Bell,

  XCircle,
  RefreshCw,
  Shield
} from 'lucide-react';

interface DatabaseStats {
  users: number;
  missions: number;
  notifications: number;
  total?: number;
}

interface CleanupResult {
  success: boolean;
  message: string;
  cleanup_summary?: {
    before: DatabaseStats;
    after: DatabaseStats;
    deleted_items: number;
    errors: number;
  };
  errors?: string[];
  performed_by?: {
    user_id: string;
    user_name: string;
    timestamp: string;
  };
}

export default function DatabaseCleaner() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const loadDatabaseStats = async () => {
    try {
      setLoading(true);
      
      // Try backend endpoint
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/data/status`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setStats(result.database_status || result);
    } catch (error) {
      console.error('Error loading database stats:', error);
      // Set empty stats to show that loading failed
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const performCleanup = async () => {
    try {
      setLoading(true);
      setShowConfirmDialog(false);
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/data/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setCleanupResult(result);
      
      // Reload stats after cleanup
      await loadDatabaseStats();
    } catch (error) {
      console.error('Error during database cleanup:', error);
      setCleanupResult({
        success: false,
        message: 'Error during database cleanup',
        errors: [error instanceof Error ? error.message : String(error)]
      });
    } finally {
      setLoading(false);
    }
  };

  // Load stats on component mount
  React.useEffect(() => {
    loadDatabaseStats();
  }, []);

  const getTotalItems = (stats: DatabaseStats) => {
    return (stats.users || 0) + (stats.missions || 0) + (stats.notifications || 0);
  };

  const isEmpty = stats && getTotalItems(stats) === 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Database Cleanup</span>
            <Badge variant="destructive" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Admin Only
            </Badge>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Delete all test data and reset the database. 
            This action is irreversible.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Database Status */}
          <div>
            <h3 className="text-lg mb-4 flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span>Current Database Status</span>
            </h3>
            
            {loading && !stats ? (
              <div className="flex items-center space-x-2 text-gray-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Loading statistics...</span>
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Users className="h-8 w-8 text-blue-500" />
                      <div>
                        <div className="text-2xl font-medium">{stats.users}</div>
                        <div className="text-sm text-gray-500">Users</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Plane className="h-8 w-8 text-green-500" />
                      <div>
                        <div className="text-2xl font-medium">{stats.missions}</div>
                        <div className="text-sm text-gray-500">Missions</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Bell className="h-8 w-8 text-purple-500" />
                      <div>
                        <div className="text-2xl font-medium">{stats.notifications}</div>
                        <div className="text-sm text-gray-500">Notifications</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Unable to load database statistics.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="mt-4 flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadDatabaseStats}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          <Separator />

          {/* Database Status Alert */}
          {isEmpty ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <p className="text-green-800">
                  <strong>Empty database:</strong> The database contains no data.
                  No cleanup is necessary.
                </p>
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-orange-200 bg-orange-50">
              <Database className="h-4 w-4 text-orange-600" />
              <AlertDescription>
                <p className="text-orange-800">
                  <strong>Active database:</strong> The database contains {stats ? getTotalItems(stats) : 0} items.
                  Cleanup will delete all this data.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Cleanup Action */}
          <div className="space-y-4">
            <h3 className="text-lg flex items-center space-x-2">
              <Trash2 className="h-4 w-4" />
              <span>Database Cleanup</span>
            </h3>
            
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <div className="text-red-800">
                  <p className="font-medium mb-2">⚠️ WARNING - Irreversible Action</p>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>All users will be deleted from Supabase Auth</li>
                    <li>All missions and mission orders will be lost</li>
                    <li>All notifications will be deleted</li>
                    <li>All service invoices will be lost</li>
                    <li>This action cannot be undone</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>

            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
              <DialogTrigger asChild>
                <Button 
                  variant="destructive"
                  disabled={loading || isEmpty}
                  className="flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clean Database</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <span>Confirm Cleanup</span>
                  </DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete all data from the database?
                    This action is irreversible and will delete:
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-2">
                  <div className="text-sm text-gray-700">
                    <strong>Data that will be deleted:</strong>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• {stats?.users || 0} users (including authentication accounts)</li>
                    <li>• {stats?.missions || 0} missions and mission orders</li>
                    <li>• {stats?.notifications || 0} notifications</li>
                    <li>• All associated service invoices</li>
                  </ul>
                </div>

                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowConfirmDialog(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={performCleanup}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Cleaning in progress...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Confirm Cleanup
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Cleanup Results */}
          {cleanupResult && (
            <div className="space-y-4">
              <Separator />
              
              <h3 className="text-lg flex items-center space-x-2">
                {cleanupResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span>Cleanup Result</span>
              </h3>

              <Alert className={cleanupResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                {cleanupResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription>
                  <div className={cleanupResult.success ? 'text-green-800' : 'text-red-800'}>
                    <p className="font-medium">{cleanupResult.message}</p>
                    
                    {cleanupResult.cleanup_summary && (
                      <div className="mt-3 space-y-2">
                        <div className="text-sm">
                          <strong>Cleanup Summary:</strong>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium">Before:</div>
                            <ul className="list-disc list-inside">
                              <li>{cleanupResult.cleanup_summary.before.users} users</li>
                              <li>{cleanupResult.cleanup_summary.before.missions} missions</li>
                              <li>{cleanupResult.cleanup_summary.before.notifications} notifications</li>
                            </ul>
                          </div>
                          <div>
                            <div className="font-medium">After:</div>
                            <ul className="list-disc list-inside">
                              <li>{cleanupResult.cleanup_summary.after.users} users</li>
                              <li>{cleanupResult.cleanup_summary.after.missions} missions</li>
                              <li>{cleanupResult.cleanup_summary.after.notifications} notifications</li>
                            </ul>
                          </div>
                        </div>
                        <div className="text-sm">
                          <strong>Items deleted:</strong> {cleanupResult.cleanup_summary.deleted_items}
                        </div>
                        {cleanupResult.cleanup_summary.errors > 0 && (
                          <div className="text-sm">
                            <strong>Errors:</strong> {cleanupResult.cleanup_summary.errors}
                          </div>
                        )}
                      </div>
                    )}

                    {cleanupResult.performed_by && (
                      <div className="mt-3 text-sm">
                        <strong>Performed by:</strong> {cleanupResult.performed_by.user_name} on{' '}
                        {new Date(cleanupResult.performed_by.timestamp).toLocaleString('en-US')}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {cleanupResult.errors && cleanupResult.errors.length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription>
                    <div className="text-red-800">
                      <p className="font-medium">Errors detected:</p>
                      <ul className="text-sm mt-2 space-y-1">
                        {cleanupResult.errors.slice(0, 5).map((error, index) => (
                          <li key={index} className="list-disc list-inside">
                            {error}
                          </li>
                        ))}
                        {cleanupResult.errors.length > 5 && (
                          <li className="text-xs text-red-600">
                            ... and {cleanupResult.errors.length - 5} other errors
                          </li>
                        )}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}