import React from 'react';
import DataSeeder from './DataSeeder';

export default function DataManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900">Gestion des Données</h1>
        <p className="text-muted-foreground">
          Gérez les données de votre application CrewTech
        </p>
      </div>
      
      <DataSeeder />
    </div>
  );
}