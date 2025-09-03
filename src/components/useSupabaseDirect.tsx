import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import supabaseDirectService, { User, Qualification } from './SupabaseDirectService';

export const useSupabaseDirect = () => {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialiser le token d'accès
  useEffect(() => {
    if (session?.access_token) {
      supabaseDirectService.setAccessToken(session.access_token);
    }
  }, [session]);

  // Wrapper pour gérer les erreurs et le loading
  const executeAction = useCallback(async (
    action: () => Promise<any>,
    errorMessage: string = 'Une erreur est survenue'
  ): Promise<any> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await action();
      return result;
    } catch (err: any) {
      console.error(errorMessage, err);
      setError(err.message || errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Users
  const getUsers = useCallback(async () => {
    return executeAction(
      () => supabaseDirectService.getUsers(),
      'Erreur lors du chargement des utilisateurs'
    );
  }, [executeAction]);

  const createUser = useCallback(async (userData: Partial<User>) => {
    return executeAction(
      () => supabaseDirectService.createUser(userData),
      'Erreur lors de la création de l\'utilisateur'
    );
  }, [executeAction]);

  const updateUser = useCallback(async (userId: string, updates: Partial<User>) => {
    return executeAction(
      () => supabaseDirectService.updateUser(userId, updates),
      'Erreur lors de la mise à jour de l\'utilisateur'
    );
  }, [executeAction]);

  const deleteUser = useCallback(async (userId: string) => {
    return executeAction(
      () => supabaseDirectService.deleteUser(userId),
      'Erreur lors de la suppression de l\'utilisateur'
    );
  }, [executeAction]);

  // Qualifications
  const getQualifications = useCallback(async (userId?: string) => {
    return executeAction(
      () => supabaseDirectService.getQualifications(userId),
      'Erreur lors du chargement des qualifications'
    );
  }, [executeAction]);

  const saveQualifications = useCallback(async (
    userId: string, 
    qualifications: Omit<Qualification, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]
  ) => {
    return executeAction(
      () => supabaseDirectService.saveQualifications(userId, qualifications),
      'Erreur lors de la sauvegarde des qualifications'
    );
  }, [executeAction]);

  // Storage
  const uploadPassport = useCallback(async (userId: string, file: File) => {
    return executeAction(
      () => supabaseDirectService.uploadPassport(userId, file),
      'Erreur lors de l\'upload du passeport'
    );
  }, [executeAction]);

  const uploadCertificate = useCallback(async (
    userId: string, 
    type: string, 
    code: string, 
    file: File
  ) => {
    return executeAction(
      () => supabaseDirectService.uploadCertificate(userId, type, code, file),
      'Erreur lors de l\'upload du certificat'
    );
  }, [executeAction]);

  const getSignedUrl = useCallback(async (bucket: string, path: string) => {
    return executeAction(
      () => supabaseDirectService.getSignedUrl(bucket, path),
      'Erreur lors de la génération de l\'URL signée'
    );
  }, [executeAction]);

  // Data loading
  const getPositions = useCallback(async () => {
    return executeAction(
      () => supabaseDirectService.getPositions(),
      'Erreur lors du chargement des positions'
    );
  }, [executeAction]);

  const getAircraft = useCallback(async () => {
    return executeAction(
      () => supabaseDirectService.getAircraft(),
      'Erreur lors du chargement des appareils'
    );
  }, [executeAction]);

  const fetchTableData = useCallback(async (
    table: string, 
    columns: string = '*', 
    orderBy?: string
  ) => {
    return executeAction(
      () => supabaseDirectService.fetchTableData(table, columns, orderBy),
      `Erreur lors du chargement des données de ${table}`
    );
  }, [executeAction]);

  // Health check
  const healthCheck = useCallback(async () => {
    return executeAction(
      () => supabaseDirectService.healthCheck(),
      'Erreur lors de la vérification de santé'
    );
  }, [executeAction]);

  return {
    // État
    loading,
    error,
    isAuthenticated: !!user,
    
    // Users
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    
    // Qualifications
    getQualifications,
    saveQualifications,
    
    // Storage
    uploadPassport,
    uploadCertificate,
    getSignedUrl,
    
    // Data
    getPositions,
    getAircraft,
    fetchTableData,
    
    // Utils
    healthCheck,
    clearError: () => setError(null)
  };
};

export default useSupabaseDirect;