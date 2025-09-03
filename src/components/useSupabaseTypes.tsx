import { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';

// Types pour les enums Supabase
export interface SupabaseEnums {
  user_role: string[];
  user_status: string[];
  crew_position: string[];
  validation_status: string[];
}

export const useSupabaseTypes = () => {
  const [enums, setEnums] = useState<SupabaseEnums>({
    user_role: ['internal', 'freelancer', 'admin'],
    user_status: ['active', 'inactive', 'pending'],
    crew_position: ['captain', 'first_officer', 'cabin_crew', 'engineer'],
    validation_status: ['approved', 'pending', 'rejected']
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnumTypes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const supabase = createClient();
        
        // Query pour récupérer les types d'enum depuis la DB
        // Cette requête peut ne pas fonctionner selon les permissions RLS
        // On utilise des valeurs par défaut si ça échoue
        
        console.log('Using default enum values for CrewPicker');
        
        // Valeurs par défaut basées sur les spécifications
        setEnums({
          user_role: ['internal', 'freelancer', 'admin'],
          user_status: ['active', 'inactive', 'pending'],
          crew_position: ['captain', 'first_officer', 'cabin_crew', 'engineer'],
          validation_status: ['approved', 'pending', 'rejected']
        });
        
      } catch (err: any) {
        console.warn('Could not fetch enum types, using defaults:', err.message);
        setError(err.message);
        
        // Utiliser des valeurs par défaut en cas d'erreur
        setEnums({
          user_role: ['internal', 'freelancer', 'admin'],
          user_status: ['active', 'inactive', 'pending'],
          crew_position: ['captain', 'first_officer', 'cabin_crew', 'engineer'],
          validation_status: ['approved', 'pending', 'rejected']
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEnumTypes();
  }, []);

  return {
    enums,
    loading,
    error
  };
};

// Utilitaires pour les labels français
export const getPositionLabel = (position: string): string => {
  const labels: Record<string, string> = {
    'captain': 'Capitaine',
    'first_officer': 'Copilote', 
    'cabin_crew': 'Personnel de Cabine',
    'engineer': 'Ingénieur de Vol'
  };
  return labels[position] || position;
};

export const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    'internal': 'Interne',
    'freelancer': 'Freelance',
    'admin': 'Administrateur'
  };
  return labels[role] || role;
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'active': 'Actif',
    'inactive': 'Inactif',
    'pending': 'En attente'
  };
  return labels[status] || status;
};

export const getValidationStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'approved': 'Approuvé',
    'pending': 'En attente',
    'rejected': 'Rejeté'
  };
  return labels[status] || status;
};