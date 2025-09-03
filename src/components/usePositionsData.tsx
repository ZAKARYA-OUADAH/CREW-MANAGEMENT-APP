import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../utils/supabase/client';

export interface Position {
  id: number;
  code: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface UsePositionsDataReturn {
  positions: Position[];
  loading: boolean;
  error: string | null;
  refreshPositions: () => Promise<void>;
  createPosition: (positionData: Partial<Position>) => Promise<Position | null>;
  updatePosition: (id: number, updates: Partial<Position>) => Promise<Position | null>;
  deletePosition: (id: number) => Promise<boolean>;
  getPositionById: (id: number) => Position | undefined;
  getPositionByCode: (code: string) => Position | undefined;
}

export function usePositionsData(): UsePositionsDataReturn {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchPositions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching positions from Supabase...');

      const { data, error } = await supabase
        .from('position')
        .select('*')
        .order('name');

      if (error) {
        console.error('❌ Error fetching positions:', error.message);
        setError(error.message);
        return;
      }

      if (data) {
        console.log('✅ Positions fetched successfully:', data.length);
        setPositions(data);
      }

    } catch (error) {
      console.error('❌ Critical error in fetchPositions:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch positions');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const createPosition = useCallback(async (positionData: Partial<Position>): Promise<Position | null> => {
    try {
      setError(null);
      console.log('🔄 Creating position:', positionData);

      const { data, error } = await supabase
        .from('position')
        .insert([{
          code: positionData.code || '',
          name: positionData.name || 'New Position',
          description: positionData.description || null
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating position:', error.message);
        setError(error.message);
        return null;
      }

      if (data) {
        console.log('✅ Position created successfully:', data);
        setPositions(prev => [...prev, data]);
        return data;
      }

      return null;
    } catch (error) {
      console.error('❌ Critical error creating position:', error);
      setError(error instanceof Error ? error.message : 'Failed to create position');
      return null;
    }
  }, [supabase, positions]);

  const updatePosition = useCallback(async (id: number, updates: Partial<Position>): Promise<Position | null> => {
    try {
      setError(null);
      console.log('🔄 Updating position:', id, updates);

      const { data, error } = await supabase
        .from('position')
        .update({
          ...(updates.code && { code: updates.code }),
          ...(updates.name && { name: updates.name }),
          ...(updates.description !== undefined && { description: updates.description }),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating position:', error.message);
        setError(error.message);
        return null;
      }

      if (data) {
        console.log('✅ Position updated successfully:', data);
        setPositions(prev => prev.map(position => 
          position.id === id ? data : position
        ));
        return data;
      }

      return null;
    } catch (error) {
      console.error('❌ Critical error updating position:', error);
      setError(error instanceof Error ? error.message : 'Failed to update position');
      return null;
    }
  }, [supabase]);

  const deletePosition = useCallback(async (id: number): Promise<boolean> => {
    try {
      setError(null);
      console.log('🔄 Deleting position:', id);

      const { error } = await supabase
        .from('position')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting position:', error.message);
        setError(error.message);
        return false;
      }

      console.log('✅ Position deleted successfully');
      setPositions(prev => prev.filter(position => position.id !== id));
      return true;

    } catch (error) {
      console.error('❌ Critical error deleting position:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete position');
      return false;
    }
  }, [supabase]);

  const refreshPositions = useCallback(async () => {
    console.log('🔄 Force refreshing positions...');
    await fetchPositions();
  }, [fetchPositions]);

  const getPositionById = useCallback((id: number): Position | undefined => {
    return positions.find(position => position.id === id);
  }, [positions]);

  const getPositionByCode = useCallback((code: string): Position | undefined => {
    return positions.find(position => position.code === code);
  }, [positions]);

  // Initial fetch
  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  return {
    positions,
    loading,
    error,
    refreshPositions,
    createPosition,
    updatePosition,
    deletePosition,
    getPositionById,
    getPositionByCode,
  };
}