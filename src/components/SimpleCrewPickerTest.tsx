import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { toast } from 'sonner@2.0.3';
import SimpleCrewPicker from './SimpleCrewPicker';
import CrewPickerFilterGuide from './CrewPickerFilterGuide';
import { 
  Users, 
  TestTube, 
  Settings,
  CheckCircle2,
  Filter
} from 'lucide-react';

interface SelectedCrew {
  id: string;
  name: string;
  position: string;
  role: string;
  currency: string;
}

export default function SimpleCrewPickerTest() {
  const [selectedCrew, setSelectedCrew] = useState<SelectedCrew[]>([]);
  const [testPosition, setTestPosition] = useState('captain');
  const [testRoles, setTestRoles] = useState<string[]>(['internal', 'freelancer']);
  const [testStatus, setTestStatus] = useState('active');
  const [testValidationStatus, setTestValidationStatus] = useState('approved');
  const [maxSelections, setMaxSelections] = useState(5);
  const [allowMultiple, setAllowMultiple] = useState(true);

  const handleCrewSelectionChange = (selected: SelectedCrew[]) => {
    setSelectedCrew(selected);
    console.log('✅ Crew selection changed:', selected);
  };

  const handleCrewConfirm = (confirmedCrew: SelectedCrew[]) => {
    console.log('🎯 Crew confirmed:', confirmedCrew);
    toast.success('Équipage confirmé !', {
      description: `${confirmedCrew.length} membre(s) ajouté(s) à la mission.`
    });
  };

  const clearSelection = () => {
    setSelectedCrew([]);
    toast.info('Sélection effacée');
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="h-5 w-5" />
            <span>Test SimpleCrewPicker</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Test Configuration */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <Label>Configuration de test (simule Mission Details)</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              {/* Position */}
              <div className="space-y-2">
                <Label>Position requise</Label>
                <Select value={testPosition} onValueChange={setTestPosition}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="captain">Capitaine</SelectItem>
                    <SelectItem value="first_officer">Copilote</SelectItem>
                    <SelectItem value="cabin_crew">Personnel de Cabine</SelectItem>
                    <SelectItem value="engineer">Ingénieur de Vol</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={testStatus} onValueChange={setTestStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Validation Status */}
              <div className="space-y-2">
                <Label>Validation</Label>
                <Select value={testValidationStatus} onValueChange={setTestValidationStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approuvé</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="rejected">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Max Selections */}
              <div className="space-y-2">
                <Label>Sélections max</Label>
                <Select value={maxSelections.toString()} onValueChange={(val) => setMaxSelections(parseInt(val))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Allow Multiple */}
              <div className="space-y-2">
                <Label>Sélection multiple</Label>
                <Select value={allowMultiple.toString()} onValueChange={(val) => setAllowMultiple(val === 'true')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Oui</SelectItem>
                    <SelectItem value="false">Non</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Selected Crew Display */}
          {selectedCrew.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Équipage sélectionné ({selectedCrew.length})</span>
                </Label>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Effacer
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {selectedCrew.map((crew) => (
                  <Badge key={crew.id} variant="secondary" className="space-x-1">
                    <span>{crew.name}</span>
                    <span>({crew.position})</span>
                    <span>[{crew.role}]</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Filtres appliqués */}
          <div className="space-y-2">
            <Label className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filtres appliqués au CrewPicker</span>
            </Label>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Position: {testPosition}</Badge>
              <Badge variant="outline">Statut: {testStatus}</Badge>
              <Badge variant="outline">Validation: {testValidationStatus}</Badge>
              <Badge variant="outline">Rôles: {testRoles.join(', ')}</Badge>
              <Badge variant="outline">Max: {maxSelections}</Badge>
              <Badge variant="outline">Multiple: {allowMultiple ? 'Oui' : 'Non'}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SimpleCrewPicker */}
      <SimpleCrewPicker
        selectedCrew={selectedCrew}
        onChange={handleCrewSelectionChange}
        onConfirm={handleCrewConfirm}
        requiredPosition={testPosition}
        maxSelections={maxSelections}
        allowMultiple={allowMultiple}
        presetFilters={{
          position: testPosition,
          roles: testRoles,
          status: testStatus,
          validation_status: testValidationStatus,
        }}
      />

      {/* Guide */}
      <CrewPickerFilterGuide />

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5" />
            <span>Résultats du test</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-2">
            <p><strong>Équipage sélectionné :</strong> {selectedCrew.length} membre(s)</p>
            <p><strong>Configuration :</strong> Position {testPosition}, {testStatus}, {testValidationStatus}</p>
            <p><strong>Limites :</strong> Max {maxSelections}, Multiple {allowMultiple ? 'activé' : 'désactivé'}</p>
            
            {selectedCrew.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-green-800 font-medium">✅ Test réussi !</p>
                <p className="text-green-600 text-sm">
                  Le SimpleCrewPicker fonctionne correctement avec les filtres prédéfinis.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}