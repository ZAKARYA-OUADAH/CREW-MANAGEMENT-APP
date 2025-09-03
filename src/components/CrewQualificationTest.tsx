import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import EnhancedCrewList from './EnhancedCrewList';
import { useCrewManagement } from './useCrewManagement';

export default function CrewQualificationTest() {
  const {
    aircraft,
    crewMembers,
    loading,
    error,
    refresh
  } = useCrewManagement({
    aircraftRegistration: 'F-HCTC', // Aircraft F-HCTC (Phenom 300)
    positionFilter: '', // Tous les postes
    searchQuery: ''
  });

  const handleRequestMission = (crewId: string, requestType: 'extra_day' | 'freelance' | 'service') => {
    console.log('Mission request:', { crewId, requestType });
  };

  const handleNotifyToComplete = (crewId: string) => {
    console.log('Notify to complete:', crewId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test des Crew Qualifiés pour F-HCTC</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Ce composant teste la récupération dynamique des crew members depuis la table public.users 
            et leur qualification pour l'aircraft F-HCTC (Phenom 300).
          </p>
          
          {aircraft && (
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <p><strong>Aircraft:</strong> {aircraft.registration} ({aircraft.type})</p>
              <p><strong>Status:</strong> {aircraft.status}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <EnhancedCrewList
        crewMembers={crewMembers}
        loading={loading}
        error={error}
        searchQuery=""
        onSearchChange={() => {}}
        positionFilter=""
        onPositionFilterChange={() => {}}
        onRefresh={refresh}
        onRequestMission={handleRequestMission}
        onNotifyToComplete={handleNotifyToComplete}
        aircraft={aircraft}
      />
    </div>
  );
}