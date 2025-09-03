import { createClient } from '../utils/supabase/client';

// Configuration Supabase
const SUPABASE_URL = 'https://nrvzifxdmllgcidfhlzh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydnppZnhkbWxsZ2NpZGZobHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUxMzY4NDEsImV4cCI6MjA1MDcxMjg0MX0.d_AukJIYCKFMH7u-3YGQSXgfF8zBXF4e9vC6rS6l6NU';

// Interfaces
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  position?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  role: 'ADMIN' | 'FREELANCER' | 'OWNER';
  employee_id?: string;
  created_at: string;
  updated_at: string;
  profile_complete: boolean;
  validation_status: 'PENDING' | 'VALIDATED' | 'REJECTED';
  birth_date?: string;
  nationality?: string;
}

export interface Qualification {
  id?: string;
  user_id: string;
  type: 'LICENSE' | 'MEDICAL' | 'RATING' | 'CERTIFICATE';
  code: string;
  aircraft_type?: string;
  class?: string;
  level?: string;
  issued_date: string;
  expiry_date: string;
  valid: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StorageFile {
  bucket: string;
  path: string;
  file: File;
}

// Service principal
class SupabaseDirectService {
  private supabase;
  private accessToken: string | null = null;

  constructor() {
    this.supabase = createClient();
  }

  // Gestion de l'authentification
  async setAccessToken(token: string) {
    this.accessToken = token;
    // Le client utilise déjà la session courante
  }

  async getCurrentUser() {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  }

  // Users Management
  async getUsers() {
    try {
      console.log('Loading users from Supabase...');
      const { data, error } = await this.supabase
        .from('users')
        .select('id,email,name,phone,position,status,role,employee_id,created_at,updated_at,profile_complete,validation_status,birth_date,nationality')
        .order('name', { ascending: true });

      if (error) {
        console.error('Supabase error loading users:', error);
        throw error;
      }

      console.log(`Loaded ${data?.length || 0} users successfully`);
      return data as User[];
    } catch (error) {
      console.error('Error loading users:', error);
      throw error;
    }
  }

  async createUser(userData: Partial<User>) {
    try {
      console.log('Creating user:', userData);
      const { data, error } = await this.supabase
        .from('users')
        .insert([userData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating user:', error);
        throw error;
      }

      console.log('User created successfully:', data);
      return data as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(userId: string, updates: Partial<User>) {
    try {
      console.log('Updating user:', userId, updates);
      const { data, error } = await this.supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating user:', error);
        throw error;
      }

      console.log('User updated successfully:', data);
      return data as User;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(userId: string) {
    try {
      console.log('Deleting user:', userId);
      const { error } = await this.supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Supabase error deleting user:', error);
        throw error;
      }

      console.log('User deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Qualifications Management
  async getQualifications(userId?: string) {
    try {
      console.log('Loading qualifications...');
      let query = this.supabase
        .from('qualifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Supabase error loading qualifications:', error);
        throw error;
      }

      console.log(`Loaded ${data?.length || 0} qualifications successfully`);
      return data as Qualification[];
    } catch (error) {
      console.error('Error loading qualifications:', error);
      throw error;
    }
  }

  async saveQualifications(userId: string, qualifications: Omit<Qualification, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]) {
    try {
      console.log('Saving qualifications for user:', userId);
      
      // Préparer les données
      const rows = qualifications.map(q => ({
        user_id: userId,
        type: q.type,
        code: q.code,
        aircraft_type: q.aircraft_type ?? null,
        class: q.class ?? null,
        level: q.level ?? null,
        issued_date: q.issued_date,
        expiry_date: q.expiry_date,
        valid: q.valid
      }));

      // Supprimer les qualifications existantes pour ce user
      const { error: deleteError } = await this.supabase
        .from('qualifications')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error deleting existing qualifications:', deleteError);
        throw deleteError;
      }

      // Insérer les nouvelles qualifications
      const { data, error } = await this.supabase
        .from('qualifications')
        .insert(rows)
        .select();

      if (error) {
        console.error('Supabase error saving qualifications:', error);
        throw error;
      }

      console.log(`Saved ${data?.length || 0} qualifications successfully`);
      return data as Qualification[];
    } catch (error) {
      console.error('Error saving qualifications:', error);
      throw error;
    }
  }

  // Storage Management
  async uploadFile(bucket: string, path: string, file: File) {
    try {
      console.log(`Uploading file to ${bucket}/${path}`);
      
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(path, file, { 
          upsert: true,
          contentType: file.type 
        });

      if (error) {
        console.error('Supabase storage error:', error);
        throw error;
      }

      console.log('File uploaded successfully:', data);
      return data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async getSignedUrl(bucket: string, path: string, expiresIn: number = 3600) {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        console.error('Error creating signed URL:', error);
        throw error;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      throw error;
    }
  }

  async uploadPassport(userId: string, file: File) {
    try {
      const path = `passports/${userId}/passport.pdf`;
      await this.uploadFile('user-docs', path, file);
      return path;
    } catch (error) {
      console.error('Error uploading passport:', error);
      throw error;
    }
  }

  async uploadCertificate(userId: string, type: string, code: string, file: File) {
    try {
      const path = `certs/${userId}/${type}_${code}.pdf`;
      await this.uploadFile('user-docs', path, file);
      return path;
    } catch (error) {
      console.error('Error uploading certificate:', error);
      throw error;
    }
  }

  // Positions Management
  async getPositions() {
    try {
      console.log('Loading positions...');
      const { data, error } = await this.supabase
        .from('positions')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Supabase error loading positions:', error);
        throw error;
      }

      console.log(`Loaded ${data?.length || 0} positions successfully`);
      return data;
    } catch (error) {
      console.error('Error loading positions:', error);
      throw error;
    }
  }

  // Aircraft Management
  async getAircraft() {
    try {
      console.log('Loading aircraft...');
      const { data, error } = await this.supabase
        .from('aircraft')
        .select('*')
        .order('model', { ascending: true });

      if (error) {
        console.error('Supabase error loading aircraft:', error);
        throw error;
      }

      console.log(`Loaded ${data?.length || 0} aircraft successfully`);
      return data;
    } catch (error) {
      console.error('Error loading aircraft:', error);
      throw error;
    }
  }

  // Generic data fetching
  async fetchTableData(table: string, columns: string = '*', orderBy?: string) {
    try {
      console.log(`Loading data from table: ${table}`);
      let query = this.supabase.from(table).select(columns);
      
      if (orderBy) {
        query = query.order(orderBy, { ascending: true });
      }
      
      const { data, error } = await query;

      if (error) {
        console.error(`Supabase error loading ${table}:`, error);
        throw error;
      }

      console.log(`Loaded ${data?.length || 0} records from ${table} successfully`);
      return data;
    } catch (error) {
      console.error(`Error loading data from ${table}:`, error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('count', { count: 'exact', head: true });

      if (error) throw error;

      return {
        status: 'healthy',
        userCount: data?.length || 0,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Instance singleton
export const supabaseDirectService = new SupabaseDirectService();

// Fonctions utilitaires
export const withAuth = async (fn: Function, accessToken?: string) => {
  if (accessToken) {
    await supabaseDirectService.setAccessToken(accessToken);
  }
  return await fn();
};

export const logError = (operation: string, error: any) => {
  console.error(`SupabaseDirectService Error in ${operation}:`, {
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
    code: error?.code,
    timestamp: new Date().toISOString()
  });
};

export default supabaseDirectService;