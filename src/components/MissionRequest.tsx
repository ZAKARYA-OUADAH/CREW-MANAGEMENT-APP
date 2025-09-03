import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { useNotifications } from './NotificationContext';
import { useAuth } from './AuthProvider';
import { useAircraftData } from './useAircraftData';
import PositionSelect from './PositionSelect';
import SimpleCrewPicker from './SimpleCrewPicker';

import { CalendarDays, Plane, Info, Users } from 'lucide-react';

export default function MissionRequest() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { 
    aircraft, 
    loading: aircraftLoading, 
    error: aircraftError,
    refreshAircraft 
  } = useAircraftData();
  
  // Get data from AdminDashboard if available
  const { selectedFlights: dashboardFlights, missionData: dashboardMissionData } = location.state || {};
  
  const [formData, setFormData] = useState({
    aircraftId: dashboardMissionData?.aircraftId || '',
    position: '',
    startDate: dashboardMissionData?.startDate || '',
    endDate: dashboardMissionData?.endDate || '',
    notes: dashboardMissionData?.notes || ''
  });
  const [selectedFlights, setSelectedFlights] = useState(dashboardFlights || []);
  const [selectedCrew, setSelectedCrew] = useState([]);

  // Get selected aircraft details
  const selectedAircraftData = aircraft.find(ac => ac.id === formData.aircraftId);
  
  const { addNotification, showToast } = useNotifications();

  // Handle crew selection
  const handleCrewSelectionChange = (crew) => {
    setSelectedCrew(crew);
    console.log('Crew selection changed:', crew);
  };

  const handleCrewConfirm = (crew) => {
    if (crew.length === 0) {
      showToast('warning', 'Aucun équipage sélectionné', 'Veuillez sélectionner au moins un membre d\'équipage.');
      return;
    }

    // Validate required fields
    if (!formData.aircraftId) {
      showToast('warning', 'Aéronef requis', 'Veuillez sélectionner un aéronef pour cette mission.');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      showToast('warning', 'Dates requises', 'Veuillez spécifier les dates de début et de fin de mission.');
      return;
    }

    // Navigate to mission request detail with selected crew
    const selectedAircraft = aircraft.find(ac => ac.id === formData.aircraftId);
    const missionData = {
      aircraftId: formData.aircraftId,
      aircraftRegistration: selectedAircraft?.registration || '',
      aircraftType: selectedAircraft?.type || '',
      position: formData.position,
      startDate: formData.startDate,
      endDate: formData.endDate,
      notes: formData.notes
    };

    console.log('Navigating to mission request detail with data:', {
      selectedCrew: crew,
      selectedFlights: selectedFlights.length > 0 ? selectedFlights : [],
      missionData
    });

    // Navigate to detail page with state
    navigate('/mission-request/new', {
      state: {
        selectedCrew: crew,
        selectedFlights: selectedFlights.length > 0 ? selectedFlights : [],
        missionData
      }
    });
  };

  // Log data received from AdminDashboard
  React.useEffect(() => {
    if (dashboardFlights && dashboardFlights.length > 0) {
      console.log('MissionRequest - Received data from AdminDashboard:', {
        flights: dashboardFlights,
        missionData: dashboardMissionData
      });
    }
  }, [dashboardFlights, dashboardMissionData]);

  const handleInputChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Clear flights when aircraft is deselected (only if not from dashboard)
    if (field === 'aircraftId' && !value) {
      if (!dashboardFlights || dashboardFlights.length === 0) {
        setSelectedFlights([]);
      }
    }
  };

  const hasNoFlights = !selectedFlights || selectedFlights.length === 0;
  const hasValidPeriod = formData.startDate && formData.endDate;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl text-gray-900">Mission Request</h1>
        <div className="flex items-center space-x-2">
          {selectedCrew.length > 0 && (
            <Badge className="bg-blue-100 text-blue-800">
              <Users className="h-3 w-3 mr-1" />
              {selectedCrew.length} sélectionné{selectedCrew.length > 1 ? 's' : ''}
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refreshAircraft}
            className="text-green-600"
            disabled={aircraftLoading}
          >
            {aircraftLoading ? 'Loading...' : 'Refresh Aircraft'}
          </Button>
        </div>
      </div>

      {/* Pre-filled Data Info */}
      {dashboardFlights && dashboardFlights.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarDays className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm text-blue-800">Data from Dashboard</h3>
              <p className="text-xs text-blue-600 mt-1">
                Pre-filled with {dashboardFlights.length} selected flight{dashboardFlights.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Period Mission Info - Show when no specific flights */}
      {hasNoFlights && hasValidPeriod && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Info className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm text-amber-800">Period Mission</h3>
              <p className="text-xs text-amber-600 mt-1">
                This mission request covers the period from {new Date(formData.startDate).toLocaleDateString()} to {new Date(formData.endDate).toLocaleDateString()} without specific flights. Crew will be assigned for the entire duration.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Request Form */}
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Mission Details</CardTitle>
            <p className="text-sm text-gray-600">Define mission requirements and criteria</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="aircraft">Aircraft Registration *</Label>
                {aircraftError && (
                  <Badge variant="outline" className="text-xs text-red-600">
                    Error loading aircraft
                  </Badge>
                )}
                {aircraftLoading && (
                  <Badge variant="outline" className="text-xs text-blue-600">
                    Loading...
                  </Badge>
                )}
              </div>
              <Select 
                value={formData.aircraftId} 
                onValueChange={(value) => handleInputChange('aircraftId', value)}
                disabled={aircraftLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an aircraft" />
                </SelectTrigger>
                <SelectContent>
                  {aircraft.map(aircraftItem => (
                    <SelectItem key={aircraftItem.id} value={aircraftItem.id}>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{aircraftItem.registration}</span>
                        <span className="text-xs text-gray-500">({aircraftItem.type})</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            aircraftItem.status === 'available' 
                              ? 'text-green-700 bg-green-50' 
                              : aircraftItem.status === 'maintenance'
                              ? 'text-amber-700 bg-amber-50'
                              : 'text-red-700 bg-red-50'
                          }`}
                        >
                          {aircraftItem.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <PositionSelect
              value={formData.position}
              onValueChange={(value) => handleInputChange('position', value)}
              label="Position Required"
              placeholder="Select a position"
              required={false}
              allowAll={true}
            />

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter any additional requirements or notes..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Crew Picker */}
        <div className="xl:col-span-2">
          <SimpleCrewPicker
            selectedCrew={selectedCrew}
            onChange={handleCrewSelectionChange}
            onConfirm={handleCrewConfirm}
            requiredPosition={formData.position}
            allowMultiple={true}
            maxSelections={10}
            presetFilters={{
              status: 'active',
              validation_status: 'approved',
              roles: ['internal', 'freelancer']
            }}
          />
        </div>
      </div>
    </div>
  );
}