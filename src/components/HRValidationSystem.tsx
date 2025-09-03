import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { useAuth } from './AuthProvider';
import { 
  Users, 
  CheckCircle, 
  XCircle,
  Eye,
  FileText,
  AlertCircle,
  Clock,
  Loader2,
  User,
  Award,
  Shield,
  RefreshCw
} from 'lucide-react';

interface PendingUser {
  id: string;
  name: string;
  email: string;
  role: string;
  position: string;
  nationality: string;
  birth_date: string;
  phone: string;
  validation_status: string;
  profile_complete: boolean;
  created_at: string;
  updated_at: string;
}

interface UserDocument {
  id: string;
  type: string;
  title: string;
  storage_path: string;
  metadata: any;
  created_at: string;
}

interface UserQualification {
  id: string;
  type: string;
  code: string;
  aircraft_type: string;
  class: string;
  level: string;
  issued_date: string;
  expiry_date: string;
  valid: boolean;
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

export default function HRValidationSystem() {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Dialog states
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [userDocuments, setUserDocuments] = useState<UserDocument[]>([]);
  const [userQualifications, setUserQualifications] = useState<UserQualification[]>([]);
  const [dialogLoading, setDialogLoading] = useState(false);

  // Load pending users for validation
  const loadPendingUsers = async () => {
    if (!user?.access_token) {
      console.error('❌ No access token available');
      return;
    }

    try {
      setLoading(true);
      const config = await getSupabaseConfig();
      
      console.log('🔄 Loading pending users for validation...');
      
      const response = await fetch(
        `${config.url}/rest/v1/users?select=*&validation_status=eq.pending&profile_complete=eq.true&order=created_at.desc`,
        {
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'apikey': config.key,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load pending users: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Pending users loaded:', data);
      setPendingUsers(data || []);
      
    } catch (error) {
      console.error('❌ Error loading pending users:', error);
      toast.error(`Failed to load pending users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Load user details (documents and qualifications)
  const loadUserDetails = async (userId: string) => {
    if (!user?.access_token) return;

    try {
      setDialogLoading(true);
      const config = await getSupabaseConfig();

      // Load documents and qualifications in parallel
      const [documentsResponse, qualificationsResponse] = await Promise.all([
        fetch(
          `${config.url}/rest/v1/documents?select=*&user_id=eq.${userId}&order=created_at.desc`,
          {
            headers: {
              'Authorization': `Bearer ${user.access_token}`,
              'apikey': config.key,
              'Accept': 'application/json'
            }
          }
        ),
        fetch(
          `${config.url}/rest/v1/qualifications?select=*&user_id=eq.${userId}&order=created_at.desc`,
          {
            headers: {
              'Authorization': `Bearer ${user.access_token}`,
              'apikey': config.key,
              'Accept': 'application/json'
            }
          }
        )
      ]);

      if (documentsResponse.ok) {
        const documents = await documentsResponse.json();
        setUserDocuments(documents || []);
      }

      if (qualificationsResponse.ok) {
        const qualifications = await qualificationsResponse.json();
        setUserQualifications(qualifications || []);
      }

    } catch (error) {
      console.error('❌ Error loading user details:', error);
      toast.error('Failed to load user details');
    } finally {
      setDialogLoading(false);
    }
  };

  // Approve user
  const handleApproveUser = async (userId: string) => {
    if (!user?.access_token) return;

    try {
      setActionLoading(`approve-${userId}`);
      const config = await getSupabaseConfig();

      // Update user validation status
      const response = await fetch(
        `${config.url}/rest/v1/users?id=eq.${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'apikey': config.key,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            validation_status: 'approved',
            updated_at: new Date().toISOString()
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to approve user');
      }

      // Get user details for zero-hour contract creation
      const approvedUser = pendingUsers.find(u => u.id === userId);
      
      // Create zero-hour contract for freelancers
      if (approvedUser?.role === 'freelancer') {
        const contractResponse = await fetch(
          `${config.url}/rest/v1/zero_hour_contracts`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${user.access_token}`,
              'apikey': config.key,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_id: userId,
              start_date: new Date().toISOString().split('T')[0],
              active: true,
              document_url: null
            })
          }
        );

        if (contractResponse.ok) {
          console.log('✅ Zero-hour contract created for freelancer');
        }
      }

      // Create notification for the user
      await fetch(
        `${config.url}/rest/v1/notifications`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'apikey': config.key,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: userId,
            type: 'SYSTEM',
            title: 'Profile validated',
            message: 'Congratulations! Your profile has been validated. You can now add your certificates.',
            action_required: false,
            created_at: new Date().toISOString()
          })
        }
      );

      toast.success('User approved successfully!');
      
      // Reload pending users
      await loadPendingUsers();
      
    } catch (error) {
      console.error('❌ Error approving user:', error);
      toast.error(`Failed to approve user: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Reject user
  const handleRejectUser = async (userId: string) => {
    if (!user?.access_token) return;

    try {
      setActionLoading(`reject-${userId}`);
      const config = await getSupabaseConfig();

      // Update user validation status
      const response = await fetch(
        `${config.url}/rest/v1/users?id=eq.${userId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'apikey': config.key,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            validation_status: 'rejected',
            updated_at: new Date().toISOString()
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reject user');
      }

      // Create notification for the user
      await fetch(
        `${config.url}/rest/v1/notifications`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.access_token}`,
            'apikey': config.key,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: userId,
            type: 'ALERT',
            title: 'Profile validation issues',
            message: 'Your profile validation was rejected. Please contact HR for more information.',
            action_required: true,
            created_at: new Date().toISOString()
          })
        }
      );

      toast.success('User rejected');
      
      // Reload pending users
      await loadPendingUsers();
      
    } catch (error) {
      console.error('❌ Error rejecting user:', error);
      toast.error(`Failed to reject user: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (user?.access_token) {
      loadPendingUsers();
    }
  }, [user?.access_token]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getQualificationValidityStatus = (qualification: UserQualification) => {
    if (!qualification.valid) return 'pending';
    if (qualification.expiry_date && new Date(qualification.expiry_date) < new Date()) return 'expired';
    return 'valid';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-600" />
          <p>Loading pending validations...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900">HR Validation</h1>
          <p className="text-gray-600">Review and validate crew member profiles</p>
        </div>
        <Button 
          variant="outline" 
          onClick={loadPendingUsers}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {pendingUsers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending validations</h3>
            <p className="text-gray-600">All users have been validated or are still completing their profiles.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingUsers.map((pendingUser) => (
            <Card key={pendingUser.id} className="border-l-4 border-l-yellow-400">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center space-x-2">
                        <User className="h-5 w-5 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-900">{pendingUser.name}</h3>
                      </div>
                      <Badge variant="outline" className={pendingUser.role === 'internal' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                        {pendingUser.role}
                      </Badge>
                      {pendingUser.position && (
                        <Badge variant="outline" className="bg-purple-100 text-purple-800">
                          {pendingUser.position}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-500">Email:</span>
                        <p className="text-gray-900">{pendingUser.email}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Nationality:</span>
                        <p className="text-gray-900">{pendingUser.nationality || 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Date of Birth:</span>
                        <p className="text-gray-900">{pendingUser.birth_date ? formatDate(pendingUser.birth_date) : 'Not provided'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Submitted:</span>
                        <p className="text-gray-900">{formatDate(pendingUser.created_at)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedUser(pendingUser);
                            loadUserDetails(pendingUser.id);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Profile Review - {selectedUser?.name}</DialogTitle>
                          <DialogDescription>
                            Review the user's documents and qualifications before validation
                          </DialogDescription>
                        </DialogHeader>
                        
                        {dialogLoading ? (
                          <div className="text-center py-8">
                            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-600" />
                            <p>Loading user details...</p>
                          </div>
                        ) : (
                          <Tabs defaultValue="documents" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="documents">Documents</TabsTrigger>
                              <TabsTrigger value="qualifications">Qualifications</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="documents" className="space-y-4">
                              <h4 className="font-medium flex items-center">
                                <FileText className="h-4 w-4 mr-2" />
                                Uploaded Documents ({userDocuments.length})
                              </h4>
                              {userDocuments.length > 0 ? (
                                <div className="space-y-2">
                                  {userDocuments.map((doc) => (
                                    <div key={doc.id} className="p-3 border rounded-lg">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="font-medium">{doc.title}</p>
                                          <p className="text-sm text-gray-600">{doc.type}</p>
                                          <p className="text-xs text-gray-500">Uploaded: {formatDate(doc.created_at)}</p>
                                        </div>
                                        <Badge variant="outline">
                                          {doc.storage_path.split('.').pop()?.toUpperCase()}
                                        </Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-500 text-center py-4">No documents uploaded</p>
                              )}
                            </TabsContent>
                            
                            <TabsContent value="qualifications" className="space-y-4">
                              <h4 className="font-medium flex items-center">
                                <Award className="h-4 w-4 mr-2" />
                                Qualifications ({userQualifications.length})
                              </h4>
                              {userQualifications.length > 0 ? (
                                <div className="space-y-2">
                                  {userQualifications.map((qual) => (
                                    <div key={qual.id} className="p-3 border rounded-lg">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="font-medium">{qual.type}: {qual.code}</p>
                                          {qual.aircraft_type && <p className="text-sm text-gray-600">Aircraft: {qual.aircraft_type}</p>}
                                          <div className="flex space-x-4 text-xs text-gray-500">
                                            <span>Issued: {qual.issued_date ? formatDate(qual.issued_date) : 'N/A'}</span>
                                            <span>Expires: {qual.expiry_date ? formatDate(qual.expiry_date) : 'No expiry'}</span>
                                          </div>
                                        </div>
                                        <div className="flex space-x-2">
                                          <Badge 
                                            variant="outline" 
                                            className={
                                              getQualificationValidityStatus(qual) === 'valid' ? 'bg-green-100 text-green-800' :
                                              getQualificationValidityStatus(qual) === 'expired' ? 'bg-red-100 text-red-800' :
                                              'bg-yellow-100 text-yellow-800'
                                            }
                                          >
                                            {getQualificationValidityStatus(qual)}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-500 text-center py-4">No qualifications added</p>
                              )}
                            </TabsContent>
                          </Tabs>
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      size="sm" 
                      onClick={() => handleApproveUser(pendingUser.id)}
                      disabled={actionLoading === `approve-${pendingUser.id}`}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {actionLoading === `approve-${pendingUser.id}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Approve
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleRejectUser(pendingUser.id)}
                      disabled={actionLoading === `reject-${pendingUser.id}`}
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      {actionLoading === `reject-${pendingUser.id}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Validation Process:</strong> Review each user's documents and qualifications carefully. 
          Approved freelancers will automatically receive a zero-hour contract. Users will be notified of the validation result.
        </AlertDescription>
      </Alert>
    </div>
  );
}