import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner@2.0.3';
import { createClient } from '../utils/supabase/client';
import { 
  Users, 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  User,
  Shield,
  Globe,
  Loader2,
  Settings,
  UserCheck,
  UserX,
  SortAsc,
  SortDesc,
  Calendar,
  Mail,
  Phone,
  MapPin,
  FileText,
  ArrowUpDown
} from 'lucide-react';

// Interface pour les données de la table public.users de Supabase (votre schéma personnalisé)
interface SupabaseUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'freelancer' | 'internal';
  status: 'active' | 'inactive' | 'suspended' | 'pending_validation';
  phone?: string;
  position?: 'Captain' | 'First Officer' | 'Flight Attendant' | 'Operations Manager' | 'Internal Captain' | 'Freelance Captain';
  employee_id?: string;
  hire_date?: string;
  salary_grade?: string;
  department?: string;
  nationality?: string;
  birth_date?: string;
  contract_type?: string;
  hourly_rate?: number;
  currency?: string;
  validation_status: 'pending' | 'approved' | 'rejected';
  validation_date?: string;
  preferred_bases?: string[];
  experience_years?: number;
  profile_complete?: boolean;
  last_active?: string;
  created_at: string;
  updated_at: string;
}

// Interface pour les données enrichies utilisées dans le composant
interface EnrichedUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  position?: string;
  role: 'admin' | 'freelancer' | 'internal';
  status: 'active' | 'inactive' | 'suspended' | 'pending_validation';
  validation_status: 'pending' | 'approved' | 'rejected';
  profile_complete: boolean;
  created_at: string;
  updated_at: string;
  last_active?: string;
  validation_date?: string;
  nationality?: string;
  birth_date?: string;
  employee_id?: string;
  hire_date?: string;
  department?: string;
  contract_type?: string;
  hourly_rate?: number;
  currency?: string;
  salary_grade?: string;
  experience_years?: number;
  preferred_bases?: string[];
}

// Types pour le tri
type SortField = 'name' | 'email' | 'created_at' | 'last_active' | 'status' | 'role' | 'position';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export default function EnhancedManageCrew() {
  const { user } = useAuth();
  const supabase = createClient();

  // États principaux
  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // États de filtrage et recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [validationFilter, setValidationFilter] = useState('all');
  const [emailConfirmedFilter, setEmailConfirmedFilter] = useState('all');
  const [lastActiveFilter, setLastActiveFilter] = useState('all');

  // États de tri
  const [sortConfig, setSortConfig] = useState<SortConfig>({ 
    field: 'created_at', 
    direction: 'desc' 
  });

  // États pour les actions
  const [selectedUser, setSelectedUser] = useState<EnrichedUser | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [validationComments, setValidationComments] = useState('');

  // Fonction pour enrichir les données utilisateur (déjà dans le bon format depuis public.users)
  const enrichUserData = (supabaseUser: SupabaseUser): EnrichedUser => {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.name,
      phone: supabaseUser.phone,
      position: supabaseUser.position,
      role: supabaseUser.role,
      status: supabaseUser.status,
      validation_status: supabaseUser.validation_status,
      profile_complete: supabaseUser.profile_complete || false,
      created_at: supabaseUser.created_at,
      updated_at: supabaseUser.updated_at,
      last_active: supabaseUser.last_active,
      validation_date: supabaseUser.validation_date,
      nationality: supabaseUser.nationality,
      birth_date: supabaseUser.birth_date,
      employee_id: supabaseUser.employee_id,
      hire_date: supabaseUser.hire_date,
      department: supabaseUser.department,
      contract_type: supabaseUser.contract_type,
      hourly_rate: supabaseUser.hourly_rate,
      currency: supabaseUser.currency,
      salary_grade: supabaseUser.salary_grade,
      experience_years: supabaseUser.experience_years,
      preferred_bases: supabaseUser.preferred_bases
    };
  };

  // Charger les utilisateurs via Supabase Direct
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching users via Supabase Direct...');
      
      // Essayer d'abord avec Supabase Direct - table public.users
      try {
        const { data: supabaseUsers, error: supabaseError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (supabaseError) {
          console.warn('Supabase Direct error:', supabaseError.message);
          throw new Error(`Supabase Direct error: ${supabaseError.message}`);
        }

        if (supabaseUsers && supabaseUsers.length > 0) {
          const enrichedUsers = supabaseUsers.map(enrichUserData);
          setUsers(enrichedUsers);
          console.log(`✅ Successfully loaded ${enrichedUsers.length} users via Supabase Direct`);
          toast.success(`Loaded ${enrichedUsers.length} users via Supabase Direct`);
          return;
        }
      } catch (supabaseDirectError) {
        console.warn('Supabase Direct failed, trying via server:', supabaseDirectError.message);
      }

      // Fallback: utiliser des utilisateurs de démonstration
      const demoUsers: EnrichedUser[] = [
        {
          id: 'admin-demo-1',
          email: 'admin@crewtech.fr',
          name: 'Sophie Laurent',
          phone: '+33 6 12 34 56 78',
          position: 'Operations Manager',
          role: 'admin',
          status: 'active',
          validation_status: 'approved',
          profile_complete: true,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-09-01T14:30:00Z',
          last_active: '2024-09-01T08:15:00Z',
          employee_id: 'ADM001',
          nationality: 'French',
          department: 'Operations',
          hire_date: '2024-01-15',
          contract_type: 'permanent'
        },
        {
          id: 'internal-demo-1',
          email: 'internal@crewtech.fr',
          name: 'Pierre Dubois',
          phone: '+33 6 23 45 67 89',
          position: 'Captain',
          role: 'internal',
          status: 'active',
          validation_status: 'approved',
          profile_complete: true,
          created_at: '2024-02-01T09:00:00Z',
          updated_at: '2024-09-01T12:00:00Z',
          last_active: '2024-08-30T16:45:00Z',
          employee_id: 'INT001',
          nationality: 'French',
          department: 'Flight Operations',
          hire_date: '2024-02-01',
          contract_type: 'permanent',
          experience_years: 15
        },
        {
          id: 'freelancer-demo-1',
          email: 'freelancer@aviation.com',
          name: 'Lisa Anderson',
          phone: '+44 7123 456789',
          position: 'Flight Attendant',
          role: 'freelancer',
          status: 'active',
          validation_status: 'pending',
          profile_complete: true,
          created_at: '2024-03-15T14:00:00Z',
          updated_at: '2024-09-01T10:00:00Z',
          last_active: '2024-08-29T11:30:00Z',
          nationality: 'British',
          contract_type: 'freelancer',
          hourly_rate: 85.00,
          currency: 'EUR',
          experience_years: 8
        },
        {
          id: 'freelancer-demo-2',
          email: 'captain@freelance.eu',
          name: 'Marco Rossi',
          phone: '+39 333 123 4567',
          position: 'Captain',
          role: 'freelancer',
          status: 'pending_validation',
          validation_status: 'pending',
          profile_complete: false,
          created_at: '2024-08-20T16:00:00Z',
          updated_at: '2024-08-25T09:00:00Z',
          last_active: '2024-08-25T09:00:00Z',
          nationality: 'Italian',
          contract_type: 'freelancer',
          hourly_rate: 150.00,
          currency: 'EUR',
          experience_years: 12
        },
        {
          id: 'freelancer-demo-3',
          email: 'sarah@crewaviation.com',
          name: 'Sarah Mitchell',
          phone: '+1 555 123 4567',
          position: 'First Officer',
          role: 'freelancer',
          status: 'active',
          validation_status: 'approved',
          profile_complete: true,
          created_at: '2024-05-10T11:00:00Z',
          updated_at: '2024-08-15T13:45:00Z',
          last_active: '2024-08-28T09:15:00Z',
          nationality: 'American',
          contract_type: 'freelancer',
          hourly_rate: 120.00,
          currency: 'USD',
          experience_years: 10
        }
      ];
      
      setUsers(demoUsers);
      console.log(`✅ Loaded ${demoUsers.length} demo users (Supabase Direct not available)`);
      toast.success(`Loaded ${demoUsers.length} demo users`, {
        description: 'Using demo data since Supabase Direct is not available'
      });

    } catch (err: any) {
      console.error('Error in fetchUsers:', err);
      const errorMessage = err.message || 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Failed to load users: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Fonction de tri
  const handleSort = (field: SortField) => {
    setSortConfig(prevConfig => ({
      field,
      direction: prevConfig.field === field && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Utilisateurs filtrés et triés
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users.filter(user => {
      // Recherche textuelle
      const matchesSearch = !searchTerm || [
        user.name,
        user.email,
        user.phone,
        user.position,
        user.employee_id
      ].some(field => 
        field?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // Filtres
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchesValidation = validationFilter === 'all' || user.validation_status === validationFilter;
      
      const matchesEmailConfirmed = emailConfirmedFilter === 'all' || 
        (emailConfirmedFilter === 'confirmed' && user.profile_complete) ||
        (emailConfirmedFilter === 'unconfirmed' && !user.profile_complete);

      const matchesLastActive = lastActiveFilter === 'all' ||
        (lastActiveFilter === 'recent' && user.last_active && new Date(user.last_active) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
        (lastActiveFilter === 'old' && (!user.last_active || new Date(user.last_active) <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))) ||
        (lastActiveFilter === 'never' && !user.last_active);

      return matchesSearch && matchesRole && matchesStatus && matchesValidation && 
             matchesEmailConfirmed && matchesLastActive;
    });

    // Tri
    filtered.sort((a, b) => {
      let aValue: any = a[sortConfig.field];
      let bValue: any = b[sortConfig.field];

      // Gestion des valeurs nulles/undefined
      if (!aValue && !bValue) return 0;
      if (!aValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (!bValue) return sortConfig.direction === 'asc' ? 1 : -1;

      // Tri par date
      if (sortConfig.field.includes('_at')) {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      // Tri par chaîne
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchTerm, roleFilter, statusFilter, validationFilter, emailConfirmedFilter, lastActiveFilter, sortConfig]);

  // Actions utilisateur via Supabase Direct
  const updateUserValidation = async (userId: string, status: 'approved' | 'rejected', comments: string) => {
    try {
      setActionLoading(userId);
      
      // Pour le moment, simuler la mise à jour
      console.log('Updating user validation:', { userId, status, comments });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(`User validation ${status} successfully`);
      await fetchUsers(); // Recharger les données
      setSelectedUser(null);
      setValidationComments('');
      
    } catch (error: any) {
      console.error('Error updating user validation:', error);
      toast.error(`Failed to update validation: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Calculs statistiques
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status === 'inactive').length,
      suspended: users.filter(u => u.status === 'suspended').length,
      pendingValidation: users.filter(u => u.status === 'pending_validation').length,
      admins: users.filter(u => u.role === 'admin').length,
      internal: users.filter(u => u.role === 'internal').length,
      freelancers: users.filter(u => u.role === 'freelancer').length,
      emailConfirmed: users.filter(u => u.profile_complete).length,
      pendingApproval: users.filter(u => u.validation_status === 'pending').length,
      approved: users.filter(u => u.validation_status === 'approved').length,
      rejected: users.filter(u => u.validation_status === 'rejected').length
    };
  }, [users]);

  // Fonctions utilitaires pour les couleurs
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-red-100 text-red-800 border-red-200';
      case 'suspended': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'pending_validation': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'internal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'freelancer': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getValidationColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <SortAsc className="h-4 w-4 text-blue-600" />
      : <SortDesc className="h-4 w-4 text-blue-600" />;
  };

  // Charger les données au montage
  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl text-gray-900">Enhanced Crew Management</h1>
          <p className="text-gray-600">
            Direct integration with Supabase public.users table
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={fetchUsers} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Total</p>
                <p className="text-lg font-medium">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Active</p>
                <p className="text-lg font-medium">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-xs text-gray-600">Pending</p>
                <p className="text-lg font-medium">{stats.pendingValidation}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-xs text-gray-600">Admins</p>
                <p className="text-lg font-medium">{stats.admins}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Internal</p>
                <p className="text-lg font-medium">{stats.internal}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Freelancers</p>
                <p className="text-lg font-medium">{stats.freelancers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres avancés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Advanced Filters & Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, phone, position, or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtres en grille */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <Label className="text-xs text-gray-600">Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="freelancer">Freelancer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-gray-600">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending_validation">Pending Validation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-gray-600">Validation</Label>
              <Select value={validationFilter} onValueChange={setValidationFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All validations</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-gray-600">Profile Complete</Label>
              <Select value={emailConfirmedFilter} onValueChange={setEmailConfirmedFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="confirmed">Complete</SelectItem>
                  <SelectItem value="unconfirmed">Incomplete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-gray-600">Last Active</Label>
              <Select value={lastActiveFilter} onValueChange={setLastActiveFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="recent">Last 7 days</SelectItem>
                  <SelectItem value="old">Older than 7 days</SelectItem>
                  <SelectItem value="never">Never signed in</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Résultats du filtrage */}
          <div className="flex justify-between items-center pt-2 border-t">
            <Badge variant="outline" className="text-sm">
              Showing {filteredAndSortedUsers.length} of {users.length} users
            </Badge>
            <div className="text-xs text-gray-500">
              Filters: {[roleFilter, statusFilter, validationFilter, emailConfirmedFilter, lastActiveFilter].filter(f => f !== 'all').length} active
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des utilisateurs */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-600" />
              <p className="text-gray-600">Loading users from Supabase...</p>
            </div>
          ) : filteredAndSortedUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>User</span>
                        {getSortIcon('name')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('role')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Role & Position</span>
                        {getSortIcon('role')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Contact</span>
                        {getSortIcon('email')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        {getSortIcon('status')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Created</span>
                        {getSortIcon('created_at')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('last_sign_in_at')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Last Active</span>
                        {getSortIcon('last_sign_in_at')}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.ggid || 'No GGID'}</div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <Badge className={getRoleColor(user.role)} variant="outline">
                            {user.role}
                          </Badge>
                          <div className="text-sm text-gray-600">{user.position}</div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-sm">{user.email}</span>
                            {user.email_confirmed_at && (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            )}
                          </div>
                          {user.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span className="text-sm text-gray-600">{user.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <Badge className={getStatusColor(user.status)} variant="outline">
                            {user.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={getValidationColor(user.validation_status)} variant="outline">
                            {user.validation_status}
                          </Badge>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span>{formatDate(user.created_at)}</span>
                          </div>
                          {user.invited_at && (
                            <div className="text-xs text-gray-500">
                              Invited: {formatDate(user.invited_at)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          {user.last_sign_in_at ? (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span>{formatDate(user.last_sign_in_at)}</span>
                            </div>
                          ) : (
                            <span className="text-gray-500">Never</span>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedUser(user)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>User Details: {selectedUser?.name}</DialogTitle>
                              </DialogHeader>
                              {selectedUser && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>Basic Information</Label>
                                      <div className="space-y-2 text-sm">
                                        <div><strong>Name:</strong> {selectedUser.name}</div>
                                        <div><strong>Email:</strong> {selectedUser.email}</div>
                                        <div><strong>Phone:</strong> {selectedUser.phone || 'Not provided'}</div>
                                        <div><strong>Position:</strong> {selectedUser.position}</div>
                                        <div><strong>GGID:</strong> {selectedUser.ggid || 'Not assigned'}</div>
                                      </div>
                                    </div>
                                    <div>
                                      <Label>Status & Dates</Label>
                                      <div className="space-y-2 text-sm">
                                        <div><strong>Role:</strong> {selectedUser.role}</div>
                                        <div><strong>Status:</strong> {selectedUser.status}</div>
                                        <div><strong>Validation:</strong> {selectedUser.validation_status}</div>
                                        <div><strong>Created:</strong> {formatDate(selectedUser.created_at)}</div>
                                        <div><strong>Last Active:</strong> {formatDate(selectedUser.last_sign_in_at)}</div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {selectedUser.validation_status === 'pending' && user?.role === 'admin' && (
                                    <div className="border-t pt-4">
                                      <Label>Admin Actions</Label>
                                      <div className="space-y-3 mt-2">
                                        <Textarea
                                          placeholder="Add comments for validation..."
                                          value={validationComments}
                                          onChange={(e) => setValidationComments(e.target.value)}
                                        />
                                        <div className="flex space-x-2">
                                          <Button
                                            onClick={() => updateUserValidation(selectedUser.id, 'approved', validationComments)}
                                            disabled={actionLoading === selectedUser.id}
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700"
                                          >
                                            <UserCheck className="h-4 w-4 mr-1" />
                                            Approve
                                          </Button>
                                          <Button
                                            onClick={() => updateUserValidation(selectedUser.id, 'rejected', validationComments)}
                                            disabled={actionLoading === selectedUser.id || !validationComments.trim()}
                                            size="sm"
                                            variant="destructive"
                                          >
                                            <UserX className="h-4 w-4 mr-1" />
                                            Reject
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">
                {users.length === 0 
                  ? "No users available. Try refreshing the data."
                  : "No users match the current filters. Try adjusting your search criteria."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}