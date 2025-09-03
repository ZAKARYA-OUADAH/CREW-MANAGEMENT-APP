import React, { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Search, 
  Database, 
  Users, 
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Bug,
  Filter
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import DiagnosticUsageGuide from './DiagnosticUsageGuide';

interface DiagnosticResult {
  totalUsers: number;
  completeProfiles: number;
  byPosition: Record<string, number>;
  byRole: Record<string, number>;
  byStatus: Record<string, number>;
  byValidation: Record<string, number>;
  sampleUsers: any[];
}

export default function SimpleCrewPickerDiagnostic() {
  const [supabase] = useState(() => createClient());
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostic = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Running SimpleCrewPicker diagnostic...');

      // Get total count
      const { count: totalCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      console.log(`📊 Total users in database: ${totalCount}`);

      // Get users with complete profiles
      const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('*')
        .not('name', 'is', null);

      if (usersError) throw usersError;

      console.log(`👥 Users with names: ${allUsers.length}`);

      // Filter complete profiles
      const completeProfiles = allUsers.filter(user => user.profile_complete === true);
      console.log(`✅ Complete profiles: ${completeProfiles.length}`);

      // Analyze by position
      const byPosition: Record<string, number> = {};
      const byRole: Record<string, number> = {};
      const byStatus: Record<string, number> = {};
      const byValidation: Record<string, number> = {};

      completeProfiles.forEach(user => {
        // Position
        if (user.position) {
          byPosition[user.position] = (byPosition[user.position] || 0) + 1;
        }

        // Role
        if (user.role) {
          byRole[user.role] = (byRole[user.role] || 0) + 1;
        }

        // Status
        if (user.status) {
          byStatus[user.status] = (byStatus[user.status] || 0) + 1;
        }

        // Validation
        if (user.validation_status) {
          byValidation[user.validation_status] = (byValidation[user.validation_status] || 0) + 1;
        }
      });

      console.log('📈 Analysis results:', {
        byPosition,
        byRole,
        byStatus,
        byValidation
      });

      setDiagnostic({
        totalUsers: totalCount || 0,
        completeProfiles: completeProfiles.length,
        byPosition,
        byRole,
        byStatus,
        byValidation,
        sampleUsers: completeProfiles.slice(0, 5)
      });

    } catch (err: any) {
      console.error('❌ Diagnostic error:', err);
      setError(err.message);
      toast.error('Erreur de diagnostic', {
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const testQuery = async (filters: any) => {
    try {
      console.log('🧪 Testing query with filters:', filters);

      let query = supabase
        .from('users')
        .select(`
          id, name, email, role, status, position, validation_status, 
          preferred_bases, currency, experience_years, last_active, 
          profile_complete, created_at
        `)
        .eq('profile_complete', true)
        .not('name', 'is', null);

      // Apply filters
      if (filters.position) {
        query = query.eq('position', filters.position);
      }
      
      if (filters.roles && filters.roles.length > 0) {
        query = query.in('role', filters.roles);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.validation_status) {
        query = query.eq('validation_status', filters.validation_status);
      }

      const { data, error: queryError, count } = await query;

      if (queryError) throw queryError;

      const result = {
        filters,
        count: data?.length || 0,
        totalCount: count,
        sample: data?.slice(0, 3) || []
      };

      console.log('🧪 Query result:', result);
      return result;

    } catch (err: any) {
      console.error('❌ Query test error:', err);
      return {
        filters,
        error: err.message,
        count: 0
      };
    }
  };

  const runQueryTests = async () => {
    setLoading(true);
    
    const tests = [
      // Test basique - tous les utilisateurs
      {
        name: 'Tous les utilisateurs avec profil complet',
        filters: {}
      },
      // Test avec rôles uniquement
      {
        name: 'Interne + Freelance seulement',
        filters: {
          roles: ['internal', 'freelancer']
        }
      },
      // Test avec statut
      {
        name: 'Statut actif seulement',
        filters: {
          status: 'active'
        }
      },
      // Test avec validation
      {
        name: 'Validation approuvée seulement',
        filters: {
          validation_status: 'approved'
        }
      },
      // Test avec position captain
      {
        name: 'Position captain',
        filters: {
          position: 'captain'
        }
      },
      // Test combiné (comme SimpleCrewPicker par défaut)
      {
        name: 'Test complet SimpleCrewPicker',
        filters: {
          roles: ['internal', 'freelancer'],
          status: 'active',
          validation_status: 'approved'
        }
      },
      // Test avec position captain + filtres
      {
        name: 'Captain + filtres actifs',
        filters: {
          position: 'captain',
          roles: ['internal', 'freelancer'],
          status: 'active',
          validation_status: 'approved'
        }
      }
    ];

    const results = [];
    for (const test of tests) {
      const result = await testQuery(test.filters);
      results.push({
        name: test.name,
        ...result
      });
    }

    setTestResults(results);
    setLoading(false);
  };

  useEffect(() => {
    runDiagnostic();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bug className="h-5 w-5" />
            <span>SimpleCrewPicker Diagnostic</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="flex space-x-2 mb-6">
            <Button 
              onClick={runDiagnostic} 
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Database className="h-4 w-4 mr-2" />
              )}
              Analyser les données
            </Button>
            
            <Button 
              onClick={runQueryTests} 
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Filter className="h-4 w-4 mr-2" />
              )}
              Tester les requêtes
            </Button>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50 mb-4">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="guide" className="w-full">
            <TabsList>
              <TabsTrigger value="guide">Guide d'utilisation</TabsTrigger>
              <TabsTrigger value="analysis">Analyse des données</TabsTrigger>
              <TabsTrigger value="tests">Tests de requêtes</TabsTrigger>
              <TabsTrigger value="samples">Échantillons</TabsTrigger>
            </TabsList>

            <TabsContent value="guide">
              <DiagnosticUsageGuide />
            </TabsContent>

            <TabsContent value="analysis">
              {diagnostic && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {diagnostic.totalUsers}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Total utilisateurs
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {diagnostic.completeProfiles}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Profils complets
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {Object.keys(diagnostic.byPosition).length}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Positions définies
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {diagnostic.byValidation.approved || 0}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Validés
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Positions */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Par Position</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(diagnostic.byPosition).map(([position, count]) => (
                            <div key={position} className="flex justify-between">
                              <span className="text-sm">{position}</span>
                              <Badge variant="outline">{count}</Badge>
                            </div>
                          ))}
                          {Object.keys(diagnostic.byPosition).length === 0 && (
                            <p className="text-sm text-red-600">❌ Aucune position définie</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Rôles */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Par Rôle</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(diagnostic.byRole).map(([role, count]) => (
                            <div key={role} className="flex justify-between">
                              <span className="text-sm">{role}</span>
                              <Badge variant="outline">{count}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Statuts */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Par Statut</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(diagnostic.byStatus).map(([status, count]) => (
                            <div key={status} className="flex justify-between">
                              <span className="text-sm">{status}</span>
                              <Badge variant="outline">{count}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Validation */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Par Validation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {Object.entries(diagnostic.byValidation).map(([validation, count]) => (
                            <div key={validation} className="flex justify-between">
                              <span className="text-sm">{validation}</span>
                              <Badge variant="outline">{count}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tests">
              <div className="space-y-4">
                {testResults.map((result, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{result.name}</h4>
                        <div className="flex items-center space-x-2">
                          {result.error ? (
                            <Badge variant="destructive">Erreur</Badge>
                          ) : result.count > 0 ? (
                            <Badge variant="default" className="bg-green-600">
                              {result.count} résultats
                            </Badge>
                          ) : (
                            <Badge variant="secondary">0 résultat</Badge>
                          )}
                        </div>
                      </div>
                      
                      {result.error ? (
                        <p className="text-sm text-red-600">{result.error}</p>
                      ) : (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">
                            Filtres: {JSON.stringify(result.filters)}
                          </p>
                          {result.sample && result.sample.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-xs font-medium">Échantillon:</p>
                              {result.sample.map((user: any) => (
                                <div key={user.id} className="text-xs text-muted-foreground">
                                  {user.name} - {user.position} - {user.role} - {user.status} - {user.validation_status}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="samples">
              {diagnostic?.sampleUsers && (
                <div className="space-y-4">
                  <h3 className="font-medium">Échantillon d'utilisateurs avec profil complet</h3>
                  {diagnostic.sampleUsers.map((user) => (
                    <Card key={user.id}>
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-muted-foreground">{user.email}</p>
                          </div>
                          <div>
                            <p><strong>Position:</strong> {user.position || 'Non définie'}</p>
                            <p><strong>Rôle:</strong> {user.role || 'Non défini'}</p>
                          </div>
                          <div>
                            <p><strong>Statut:</strong> {user.status || 'Non défini'}</p>
                            <p><strong>Validation:</strong> {user.validation_status || 'Non définie'}</p>
                          </div>
                          <div>
                            <p><strong>Profil complet:</strong> {user.profile_complete ? 'Oui' : 'Non'}</p>
                            <p><strong>Expérience:</strong> {user.experience_years || 0} ans</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}