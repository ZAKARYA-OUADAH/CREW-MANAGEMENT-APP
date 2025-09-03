import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner@2.0.3';
import EdgeFunctionConnectivityFixer from './EdgeFunctionConnectivityFixer';
import FetchErrorHandler from './FetchErrorHandler';
import { 
  UserPlus, 
  Mail, 
  User, 
  Plane, 
  FileText, 
  AlertCircle, 
  CheckCircle,
  Edit,
  Send,
  IdCard,
  Loader2,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Phone,
  MapPin,
  Users,
  Eye,
  Settings,
  Trash2,
  RefreshCw,
  Shield,
  CalendarDays,
  Clock,
  Globe,
  X,
  Wrench
} from 'lucide-react';

// Types
interface CrewUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  position: string;
  status: 'active' | 'inactive' | 'suspended';
  role: 'admin' | 'freelancer' | 'internal';
  ggid?: string;
  created_at: string;
  updated_at: string;
  profile_complete?: boolean;
  validation_status?: 'pending' | 'approved' | 'rejected';
  birth_date?: string;
  nationality?: string;
}

interface NewUserData {
  name: string;
  email: string;
  phone: string;
  address: string;
  position: string;
  role: 'freelancer' | 'internal';
  ggid: string;
}

// Get Supabase config
const getSupabaseConfig = async () => {
  try {
    const { projectId, publicAnonKey } = await import('../utils/supabase/info');
    return {
      url: `https://${projectId}.supabase.co`,
      key: publicAnonKey
    };
  } catch (error) {
    console.error('Failed to load Supabase config:', error);
    throw new Error('Supabase configuration not available');
  }
};

export default function ManageCrew() {
  const { user } = useAuth();
  
  // State management
  const [users, setUsers] = useState<CrewUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<CrewUser | null>(null);
  const [isViewingUser, setIsViewingUser] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [editUserData, setEditUserData] = useState<Partial<CrewUser>>({});
  const [newUserData, setNewUserData] = useState<NewUserData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    position: '',
    role: 'freelancer',
    ggid: ''
  });
  
  // Connection status tracking
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Generate mock crew data for fallback
  const generateMockCrewData = (): CrewUser[] => {
    return [
      {
        id: 'admin-1',
        name: 'Sophie Laurent',
        email: 'admin@crewtech.fr',
        phone: '+33 1 23 45 67 89',
        position: 'Operations Manager',
        status: 'active',
        role: 'admin',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        profile_complete: true,
        validation_status: 'approved'
      },
      {
        id: 'freelancer-1',
        name: 'Lisa Anderson',
        email: 'freelancer@aviation.com',
        phone: '+44 20 7123 4567',
        position: 'Flight Attendant',
        status: 'active',
        role: 'freelancer',
        created_at: '2024-01-20T14:30:00Z',
        updated_at: '2024-01-20T14:30:00Z',
        profile_complete: true,
        validation_status: 'pending'
      },
      {
        id: 'freelancer-2',
        name: 'Marco Rossi',
        email: 'captain@freelance.eu',
        phone: '+39 06 1234 5678',
        position: 'Captain',
        status: 'active',
        role: 'freelancer',
        created_at: '2024-01-25T09:15:00Z',
        updated_at: '2024-01-25T09:15:00Z',
        profile_complete: false,
        validation_status: 'pending'
      }
    ];
  };

  // Fetch all users from Edge Function with fallback
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setConnectionError(null);
      
      const config = await getSupabaseConfig();
      
      // Get access token from auth context
      const accessToken = user?.access_token || config.key;
      const endpoint = `${config.url}/functions/v1/make-server-9fd39b98/crew`;
      
      console.log('Fetching users from:', endpoint);
      console.log('Auth header:', `Bearer ${accessToken ? accessToken.substring(0, 20) + '...' : 'null'}`);
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      // Fetch from edge function /crew endpoint
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('Fetch response:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = await response.json();
        } catch (parseError) {
          errorData = { error: response.statusText };
        }
        console.error('Fetch error data:', errorData);
        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log('Raw response data:', data);
      
      if (!data.crew || !Array.isArray(data.crew)) {
        console.error('Invalid response format - no crew array:', data);
        throw new Error('Invalid response format from server');
      }
      
      const crewUsers: CrewUser[] = data.crew.map((user: any) => ({
        id: user.id,
        name: user.name || `${user.user_metadata?.firstName || ''} ${user.user_metadata?.lastName || ''}`.trim(),
        email: user.email,
        phone: user.user_metadata?.phone,
        address: user.user_metadata?.address,
        position: user.user_metadata?.position || 'Unknown',
        status: user.status || 'active',
        role: user.user_metadata?.role || 'freelancer',
        ggid: user.user_metadata?.ggid,
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at,
        profile_complete: user.profile?.completionStatus === 'documents' || user.profile?.documentsStatus === 'approved',
        validation_status: user.profile?.documentsStatus === 'approved' ? 'approved' : 
                          user.profile?.documentsStatus === 'rejected' ? 'rejected' : 'pending',
        birth_date: user.user_metadata?.birth_date,
        nationality: user.user_metadata?.nationality
      }));
      
      setUsers(crewUsers);
      console.log('Successfully mapped crew users:', crewUsers.length);
      toast.success(`Loaded ${crewUsers.length} crew members from server`);
      
    } catch (error: any) {
      console.error('Error fetching users:', error);
      
      // Set the actual error object for better handling
      setConnectionError(error);
      
      // Use mock data as fallback
      const mockData = generateMockCrewData();
      setUsers(mockData);
      
      // Show a user-friendly message instead of raw error
      console.log('🔄 Falling back to demo data due to server connectivity issues');
      toast.info(`Using demo data (${mockData.length} crew members)`, {
        description: 'Server connection unavailable. Demo mode active.'
      });
      
    } finally {
      setLoading(false);
    }
  };

  // Update user status
  const updateUserStatus = async (userId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      const config = await getSupabaseConfig();
      const accessToken = user?.access_token || config.key;
      
      // Map status to availability for the edge function
      const availability = newStatus === 'active' ? 'available' : 'busy';
      
      const response = await fetch(
        `${config.url}/functions/v1/make-server-9fd39b98/crew/${userId}/status`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            availability: availability
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user status');
      }

      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, status: newStatus, updated_at: new Date().toISOString() }
          : u
      ));

      toast.success(`User status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error(`Failed to update user status: ${error.message}`);
    }
  };

  // Validate user profile (Admin action)
  const validateUserProfile = async (userId: string, validationStatus: 'approved' | 'rejected', remarks?: string) => {
    try {
      const config = await getSupabaseConfig();
      const accessToken = user?.access_token || config.key;
      
      // Use the appropriate edge function endpoint
      const endpoint = validationStatus === 'approved' 
        ? `${config.url}/functions/v1/make-server-9fd39b98/crew/${userId}/approve-validation`
        : `${config.url}/functions/v1/make-server-9fd39b98/crew/${userId}/reject-validation`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          comments: remarks || (validationStatus === 'approved' ? 'Profile approved by admin' : 'Profile rejected by admin')
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update validation status');
      }

      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, validation_status: validationStatus, updated_at: new Date().toISOString() }
          : u
      ));

      toast.success(`Profile ${validationStatus} successfully`);
      
      // Refresh the users list to get updated data
      fetchUsers();
    } catch (error) {
      console.error('Error validating profile:', error);
      toast.error(`Failed to validate profile: ${error.message}`);
    }
  };

  // Diagnostic function to test edge function connectivity
  const testEdgeFunctionConnectivity = async () => {
    try {
      const config = await getSupabaseConfig();
      const accessToken = user?.access_token || config.key;
      
      console.log('Testing edge function connectivity...'); 
      console.log('Config:', config);
      console.log('User:', user);
      console.log('Access token available:', !!accessToken);
      
      // Test health endpoint first
      const healthResponse = await fetch(
        `${config.url}/functions/v1/make-server-9fd39b98/health`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Health check response:', {
        ok: healthResponse.ok,
        status: healthResponse.status,
        statusText: healthResponse.statusText
      });
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        console.log('Health data:', healthData);
        toast.success('Edge function connectivity OK');
      } else {
        toast.error(`Health check failed: ${healthResponse.status}`);
      }
      
    } catch (error) {
      console.error('Edge function connectivity test failed:', error);
      toast.error(`Connection test failed: ${error.message}`);
    }
  };

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load users on component mount
  useEffect(() => {
    testEdgeFunctionConnectivity();
    fetchUsers();
  }, []);

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    if (!user) return false;
    
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.ggid && user.ggid.toLowerCase().includes(searchTerm.toLowerCase())) ||
      user.position.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesPosition = positionFilter === 'all' || user.position === positionFilter;
    
    return matchesSearch && matchesRole && matchesStatus && matchesPosition;
  });

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'suspended':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'internal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'freelancer':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPositionColor = (position: string) => {
    switch (position.toLowerCase()) {
      case 'captain':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'first officer':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'flight attendant':
      case 'senior flight attendant':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getValidationStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUniquePositions = () => {
    const positions = [...new Set(users.map(user => user.position))].filter(Boolean);
    return positions.sort();
  };

  // Statistics calculations
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const inactiveUsers = users.filter(u => u.status === 'inactive').length;
  const suspendedUsers = users.filter(u => u.status === 'suspended').length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const internalUsers = users.filter(u => u.role === 'internal').length;
  const freelancerUsers = users.filter(u => u.role === 'freelancer').length;
  const pendingValidation = users.filter(u => u.profile_complete && u.validation_status === 'pending').length;
  const incompleteProfiles = users.filter(u => !u.profile_complete).length;

  return (
    <div className="space-y-6">
      {/* Connection Error Handler */}
      {connectionError && (
        <FetchErrorHandler 
          error={connectionError}
          onRetry={fetchUsers}
          onDismiss={() => setConnectionError(null)}
          showAutoFix={true}
        />
      )}

      {/* Network Status */}
      {!isOnline && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>No Internet Connection:</strong> You are currently offline. Some features may not work properly.
          </AlertDescription>
        </Alert>
      )}

      {/* Diagnostic Panel */}
      {showDiagnostic && (
        <Card className="border-blue-200">
          <CardContent className="p-0">
            <EdgeFunctionConnectivityFixer />
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl text-gray-900">Crew Management</h1>
          <p className="text-gray-600">
            {totalUsers} total users • {activeUsers} active • {inactiveUsers} inactive
            {connectionError && <span className="text-orange-600 ml-2">• Demo Mode</span>}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={testEdgeFunctionConnectivity}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Test Connection
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowDiagnostic(!showDiagnostic)}
            className={showDiagnostic ? 'bg-blue-100' : ''}
          >
            <Wrench className="h-4 w-4 mr-2" />
            Diagnostic
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl text-gray-900">{loading ? '...' : totalUsers}</p>
                <p className="text-xs text-gray-500">All accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl text-gray-900">{loading ? '...' : activeUsers}</p>
                <p className="text-xs text-gray-500">Currently active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Internal</p>
                <p className="text-2xl text-gray-900">{loading ? '...' : internalUsers}</p>
                <p className="text-xs text-gray-500">Company staff</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Globe className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Freelancers</p>
                <p className="text-2xl text-gray-900">{loading ? '...' : freelancerUsers}</p>
                <p className="text-xs text-gray-500">External crew</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Status Cards */}
      {(pendingValidation > 0 || incompleteProfiles > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingValidation > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-yellow-800">Pending Validation</p>
                    <p className="text-2xl text-yellow-900">{pendingValidation}</p>
                    <p className="text-xs text-yellow-700">Profiles awaiting approval</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {incompleteProfiles > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <User className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-orange-800">Incomplete Profiles</p>
                    <p className="text-2xl text-orange-900">{incompleteProfiles}</p>
                    <p className="text-xs text-orange-700">Users still setting up</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users by name, email, or GGID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="freelancer">Freelancer</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All positions</SelectItem>
                {getUniquePositions().map(position => (
                  <SelectItem key={position} value={position}>
                    {position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Badge variant="outline" className="text-xs">
              {filteredUsers.length} users
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-600" />
              <p className="text-gray-600">Loading users...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role & Position</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.ggid && (
                              <div className="text-xs text-gray-400">GGID: {user.ggid}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="outline" className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                          {user.position && (
                            <div>
                              <Badge variant="outline" className={getPositionColor(user.position)}>
                                {user.position}
                              </Badge>
                            </div>
                          )}
                          {/* Profile Status */}
                          {user.profile_complete ? (
                            <div>
                              <Badge variant="outline" className={getValidationStatusColor(user.validation_status || 'pending')}>
                                {user.validation_status === 'approved' ? 'Validated' : 
                                 user.validation_status === 'rejected' ? 'Rejected' : 'Pending'}
                              </Badge>
                            </div>
                          ) : (
                            <div>
                              <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
                                Profile Incomplete
                              </Badge>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          {user.phone && (
                            <div className="flex items-center text-gray-600">
                              <Phone className="h-3 w-3 mr-1" />
                              {user.phone}
                            </div>
                          )}
                          {user.address && (
                            <div className="flex items-center text-gray-600">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span className="truncate max-w-32">{user.address}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                          <Switch
                            checked={user.status === 'active'}
                            onCheckedChange={() => {
                              const newStatus = user.status === 'active' ? 'inactive' : 'active';
                              updateUserStatus(user.id, newStatus);
                            }}
                            disabled={user.role === 'admin'}
                          />
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center">
                            <CalendarDays className="h-3 w-3 mr-1" />
                            {formatDate(user.created_at)}
                          </div>
                          {user.updated_at !== user.created_at && (
                            <div className="flex items-center text-xs text-gray-400 mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              Updated {formatDate(user.updated_at)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Profile Validation Actions */}
                          {user.profile_complete && user.validation_status === 'pending' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => validateUserProfile(user.id, 'approved')}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Reject Profile</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to reject {user.name}'s profile? They will be notified and may need to update their information.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => validateUserProfile(user.id, 'rejected')}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Reject Profile
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
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
              <p className="text-gray-600 mb-2">No users found</p>
              <p className="text-sm text-gray-500">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || positionFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No crew members have been added yet'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}