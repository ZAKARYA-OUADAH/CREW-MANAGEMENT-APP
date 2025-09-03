import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import CrewPicker from './CrewPicker';
import { useSupabaseTypes } from './useSupabaseTypes';
import { useAuth } from './AuthProvider';
import { 
  Users, 
  TestTube, 
  CheckCircle, 
  Database,
  Settings,
  AlertTriangle 
} from 'lucide-react';

export default function CrewPickerTest() {
  const { user } = useAuth();
  const { enums, loading: enumsLoading } = useSupabaseTypes();
  
  // Test states
  const [selectedCrew, setSelectedCrew] = useState([]);
  const [testPosition, setTestPosition] = useState('captain');
  const [testResults, setTestResults] = useState([]);

  const handleCrewChange = (crew) => {
    setSelectedCrew(crew);
    console.log('✅ CrewPicker onChange triggered:', crew);
    
    // Add to test results
    setTestResults(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      type: 'selection',
      message: `${crew.length} membre(s) sélectionné(s)`,
      data: crew
    }]);
  };

  const handleCrewConfirm = (crew) => {
    console.log('✅ CrewPicker onConfirm triggered:', crew);
    
    // Add to test results
    setTestResults(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      type: 'confirm',
      message: `Confirmation: ${crew.length} membre(s) prêt(s) pour mission`,
      data: crew
    }]);
  };

  const runConnectivityTest = () => {
    setTestResults(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      type: 'test',
      message: 'Test de connectivité Supabase lancé...',
      data: null
    }]);
  };

  const clearResults = () => {
    setTestResults([]);
    setSelectedCrew([]);
  };

  if (user?.role !== 'admin') {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Cette page de test est réservée aux administrateurs.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900">Test CrewPicker Dynamic</h1>
          <p className="text-muted-foreground">
            Test et validation du composant de sélection d'équipage avec Supabase
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            <Database className="h-3 w-3 mr-1" />
            Supabase RLS
          </Badge>
          <Button variant="outline" onClick={runConnectivityTest}>
            <TestTube className="h-4 w-4 mr-2" />
            Test Connectivité
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Équipage sélectionné</p>
                <p className="text-2xl font-bold text-blue-600">{selectedCrew.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Position de test</p>
                <p className="text-lg font-bold text-green-600 capitalize">{testPosition}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TestTube className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Événements test</p>
                <p className="text-2xl font-bold text-purple-600">{testResults.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration de test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configuration du Test</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Position à tester:</label>
            <div className="flex space-x-2">
              {enums.crew_position.map(position => (
                <Button
                  key={position}
                  variant={testPosition === position ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTestPosition(position)}
                >
                  {position}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button onClick={clearResults} variant="outline" size="sm">
              Effacer les résultats
            </Button>
            <span className="text-xs text-muted-foreground">
              Enums chargés: {enumsLoading ? 'Loading...' : 'OK'}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CrewPicker Component Test */}
        <div className="lg:col-span-2">
          <CrewPicker
            selectedCrew={selectedCrew}
            onChange={handleCrewChange}
            onConfirm={handleCrewConfirm}
            requiredPosition={testPosition}
            allowMultiple={true}
            maxSelections={5}
          />
        </div>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TestTube className="h-5 w-5" />
                <span>Résultats des Tests</span>
              </div>
              {testResults.length > 0 && (
                <Badge variant="secondary">{testResults.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TestTube className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Aucun test effectué</p>
                <p className="text-xs mt-1">Sélectionnez des membres d'équipage pour commencer</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge 
                        variant={
                          result.type === 'confirm' ? 'default' : 
                          result.type === 'selection' ? 'secondary' : 'outline'
                        }
                      >
                        {result.type === 'confirm' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {result.type === 'selection' && <Users className="h-3 w-3 mr-1" />}
                        {result.type === 'test' && <TestTube className="h-3 w-3 mr-1" />}
                        {result.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{result.timestamp}</span>
                    </div>
                    <p className="text-sm">{result.message}</p>
                    {result.data && result.data.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {result.data.map((crew, i) => (
                          <div key={i} className="text-xs text-muted-foreground">
                            {crew.name} - {crew.position} ({crew.role})
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selected Crew Details */}
      {selectedCrew.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Équipage Sélectionné ({selectedCrew.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedCrew.map((crew, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{crew.name}</p>
                      <p className="text-xs text-muted-foreground">{crew.position}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Badge variant="outline" className="text-xs">
                      {crew.role}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {crew.currency}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Alert>
        <TestTube className="h-4 w-4" />
        <AlertDescription>
          <strong>Instructions de test:</strong>
          <br />• Sélectionnez différentes positions pour tester les filtres
          <br />• Testez la sélection multiple et les limites
          <br />• Vérifiez que les callbacks onChange et onConfirm fonctionnent
          <br />• Surveillez les logs de la console pour le debug
        </AlertDescription>
      </Alert>
    </div>
  );
}