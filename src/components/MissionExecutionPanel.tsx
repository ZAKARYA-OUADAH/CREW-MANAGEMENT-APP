import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { MissionWorkflowService } from './MissionWorkflowService';
import { useAuth } from './AuthProvider';
import { toast } from 'sonner@2.0.3';
import { 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign, 
  FileText, 
  Calendar, 
  Users, 
  Plane,
  MapPin,
  Phone,
  Mail,
  RefreshCw,
  Upload,
  Eye,
  Download
} from 'lucide-react';

interface MissionExecutionPanelProps {
  missionId: string;
  mission?: any;
  assignments?: any[];
}

interface PaymentStatus {
  assignment_id: string;
  user_id: string;
  user_name: string;
  position: string;
  engagement: string;
  expected_amount: number;
  paid_amount: number;
  currency: string;
  payment_status: 'pending' | 'partial' | 'completed';
  invoice_status?: 'none' | 'uploaded' | 'approved' | 'rejected';
  invoice_id?: string;
}

interface MissionDay {
  date: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  crew_present: string[];
  crew_absent: string[];
  notes?: string;
}

export default function MissionExecutionPanel({ missionId, mission, assignments = [] }: MissionExecutionPanelProps) {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Execution data
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus[]>([]);
  const [missionDays, setMissionDays] = useState<MissionDay[]>([]);
  const [supplierInvoices, setSupplierInvoices] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  
  // UI states
  const [selectedInvoiceFile, setSelectedInvoiceFile] = useState<File | null>(null);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);

  // Generate mission days from start/end dates
  const generateMissionDays = (startDate: string, endDate: string): MissionDay[] => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days: MissionDay[] = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const isToday = new Date().toDateString() === d.toDateString();
      const isPast = d < new Date();
      
      days.push({
        date: dateStr,
        status: isPast ? 'completed' : isToday ? 'active' : 'planned',
        crew_present: assignments.map(a => a.user_id), // Assume all present for now
        crew_absent: [],
        notes: ''
      });
    }
    
    return days;
  };

  // Calculate payment status for each assignment
  const calculatePaymentStatus = (assignments: any[]): PaymentStatus[] => {
    return assignments.map(assignment => {
      // Calculate expected payment based on duration and day rate
      const startDate = new Date(assignment.start_date);
      const endDate = new Date(assignment.end_date);
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const expectedAmount = assignment.day_rate * duration;
      
      // For demo purposes, simulate some payments
      const paidAmount = Math.random() > 0.5 ? expectedAmount : Math.random() * expectedAmount;
      
      let paymentStatus: 'pending' | 'partial' | 'completed' = 'pending';
      if (paidAmount >= expectedAmount) {
        paymentStatus = 'completed';
      } else if (paidAmount > 0) {
        paymentStatus = 'partial';
      }
      
      return {
        assignment_id: assignment.id,
        user_id: assignment.user_id,
        user_name: assignment.user?.name || 'Unknown',
        position: assignment.position,
        engagement: assignment.engagement,
        expected_amount: expectedAmount,
        paid_amount: paidAmount,
        currency: assignment.currency,
        payment_status: paymentStatus,
        invoice_status: assignment.engagement.includes('freelance') ? 
          (Math.random() > 0.7 ? 'approved' : Math.random() > 0.5 ? 'uploaded' : 'none') : 
          undefined
      };
    });
  };

  // Load execution data
  const loadExecutionData = async () => {
    try {
      setLoading(true);
      
      // Generate mission days based on mission dates
      if (mission && assignments.length > 0) {
        const firstAssignment = assignments.reduce((earliest, current) => 
          new Date(current.start_date) < new Date(earliest.start_date) ? current : earliest
        );
        const lastAssignment = assignments.reduce((latest, current) => 
          new Date(current.end_date) > new Date(latest.end_date) ? current : latest
        );
        
        const days = generateMissionDays(firstAssignment.start_date, lastAssignment.end_date);
        setMissionDays(days);
      }
      
      // Calculate payment status
      const payments = calculatePaymentStatus(assignments);
      setPaymentStatus(payments);
      
      // Load supplier invoices (simulated for now)
      const mockInvoices = assignments
        .filter(a => a.engagement.includes('freelance'))
        .map(a => ({
          id: `invoice_${a.id}`,
          assignment_id: a.id,
          user_id: a.user_id,
          user_name: a.user?.name,
          invoice_number: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          amount: a.day_rate * 2, // Simulate 2-day invoice
          currency: a.currency,
          status: ['uploaded', 'approved', 'rejected'][Math.floor(Math.random() * 3)],
          upload_date: new Date().toISOString(),
          pdf_path: `/invoices/${a.user_id}_${Date.now()}.pdf`
        }));
      
      setSupplierInvoices(mockInvoices);
      
    } catch (error) {
      console.error('Error loading execution data:', error);
      toast.error('Failed to load mission execution data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (missionId && assignments.length > 0) {
      loadExecutionData();
    }
  }, [missionId, assignments]);

  // Handle invoice upload
  const handleInvoiceUpload = async (assignmentId: string) => {
    if (!selectedInvoiceFile) {
      toast.error('Please select a file first');
      return;
    }

    try {
      setUploadingInvoice(true);
      
      // Simulate file upload to storage
      const fileName = `invoice_${assignmentId}_${Date.now()}.pdf`;
      const storagePath = `/invoices/${fileName}`;
      
      // Create supplier invoice record
      await MissionWorkflowService.createSupplierInvoice(
        assignmentId,
        `INV-${Date.now()}`,
        1000, // Amount from form
        'EUR',
        storagePath,
        user?.access_token
      );
      
      // Reload invoices
      await loadExecutionData();
      
      setSelectedInvoiceFile(null);
      toast.success('Invoice uploaded successfully');
      
    } catch (error) {
      console.error('Error uploading invoice:', error);
      toast.error('Failed to upload invoice');
    } finally {
      setUploadingInvoice(false);
    }
  };

  // Handle invoice status update
  const handleInvoiceStatusUpdate = async (invoiceId: string, newStatus: string) => {
    try {
      setActionLoading(invoiceId);
      
      await MissionWorkflowService.updateSupplierInvoiceStatus(
        invoiceId,
        newStatus,
        user?.access_token
      );
      
      // Update local state
      setSupplierInvoices(prev => 
        prev.map(inv => 
          inv.id === invoiceId 
            ? { ...inv, status: newStatus }
            : inv
        )
      );
      
      toast.success(`Invoice ${newStatus}`);
      
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Failed to update invoice status');
    } finally {
      setActionLoading(null);
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'uploaded':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'none':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDayStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'planned':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOverallProgress = () => {
    const completedDays = missionDays.filter(day => day.status === 'completed').length;
    return missionDays.length > 0 ? (completedDays / missionDays.length) * 100 : 0;
  };

  const getPaymentProgress = () => {
    const totalExpected = paymentStatus.reduce((sum, p) => sum + p.expected_amount, 0);
    const totalPaid = paymentStatus.reduce((sum, p) => sum + p.paid_amount, 0);
    return totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="h-8 w-8 mx-auto animate-spin text-blue-600 mb-4" />
          <p>Loading mission execution data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mission Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Mission Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round(getOverallProgress())}%</span>
              </div>
              <Progress value={getOverallProgress()} className="w-full" />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Days Completed:</span>
                  <p className="font-medium">
                    {missionDays.filter(d => d.status === 'completed').length} / {missionDays.length}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Current Status:</span>
                  <p className="font-medium">
                    {missionDays.some(d => d.status === 'active') ? 'In Progress' : 
                     missionDays.every(d => d.status === 'completed') ? 'Completed' : 'Planned'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Payment Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Payment Progress</span>
                <span>{Math.round(getPaymentProgress())}%</span>
              </div>
              <Progress value={getPaymentProgress()} className="w-full" />
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Total Expected:</span>
                  <p className="font-medium">
                    {paymentStatus.reduce((sum, p) => sum + p.expected_amount, 0).toLocaleString()} EUR
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Total Paid:</span>
                  <p className="font-medium">
                    {paymentStatus.reduce((sum, p) => sum + p.paid_amount, 0).toLocaleString()} EUR
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Execution Management */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Check Dates & Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Crew Status */}
                <div className="space-y-4">
                  <h3 className="font-medium">Crew Status</h3>
                  {paymentStatus.map((payment) => (
                    <div key={payment.assignment_id} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{payment.user_name}</p>
                          <p className="text-sm text-gray-600">{payment.position}</p>
                        </div>
                        <Badge className={getPaymentStatusColor(payment.payment_status)}>
                          {payment.payment_status}
                        </Badge>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Expected: {payment.expected_amount} {payment.currency}</span>
                        <span>Paid: {Math.round(payment.paid_amount)} {payment.currency}</span>
                      </div>
                      
                      {payment.invoice_status && (
                        <div className="mt-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getInvoiceStatusColor(payment.invoice_status)}`}
                          >
                            Invoice: {payment.invoice_status}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Recent Activity */}
                <div className="space-y-4">
                  <h3 className="font-medium">Recent Activity</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm p-2 bg-blue-50 rounded">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span>Mission day 1 completed successfully</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm p-2 bg-green-50 rounded">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span>Invoice uploaded by John Doe</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm p-2 bg-yellow-50 rounded">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span>Payment pending for Jane Smith</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mission Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {missionDays.map((day) => (
                  <Card key={day.date} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">
                              {new Date(day.date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </span>
                            <Badge className={getDayStatusColor(day.status)}>
                              {day.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Present: {day.crew_present.length}</span>
                            {day.crew_absent.length > 0 && (
                              <span>Absent: {day.crew_absent.length}</span>
                            )}
                          </div>
                          
                          {day.notes && (
                            <p className="text-sm text-gray-600">{day.notes}</p>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          {day.status === 'active' && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paymentStatus.map((payment) => (
                  <Card key={payment.assignment_id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">{payment.user_name}</span>
                            <Badge className={getPaymentStatusColor(payment.payment_status)}>
                              {payment.payment_status}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600">
                            {payment.position} • {payment.engagement}
                          </p>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Expected:</span>
                              <p className="font-medium">{payment.expected_amount} {payment.currency}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Paid:</span>
                              <p className="font-medium">{Math.round(payment.paid_amount)} {payment.currency}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Remaining:</span>
                              <p className="font-medium">
                                {Math.round(payment.expected_amount - payment.paid_amount)} {payment.currency}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          {payment.payment_status !== 'completed' && (
                            <Button size="sm">
                              Process Payment
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Freelance Invoice Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {supplierInvoices.map((invoice) => (
                  <Card key={invoice.id} className="border-l-4 border-l-purple-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">{invoice.invoice_number}</span>
                            <Badge className={getInvoiceStatusColor(invoice.status)}>
                              {invoice.status}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600">
                            {invoice.user_name} • {invoice.amount} {invoice.currency}
                          </p>
                          
                          <p className="text-xs text-gray-500">
                            Uploaded: {new Date(invoice.upload_date).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          
                          {invoice.status === 'uploaded' && (
                            <>
                              <Button 
                                size="sm"
                                onClick={() => handleInvoiceStatusUpdate(invoice.id, 'approved')}
                                disabled={actionLoading === invoice.id}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Approve
                              </Button>
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => handleInvoiceStatusUpdate(invoice.id, 'rejected')}
                                disabled={actionLoading === invoice.id}
                                className="text-red-600 hover:text-red-700"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Upload new invoice */}
                <Card className="border-dashed border-2 border-gray-300">
                  <CardContent className="p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-sm font-medium mb-2">Upload Freelance Invoice</h3>
                    <p className="text-xs text-gray-500 mb-4">
                      Freelancers can upload their invoices here for approval
                    </p>
                    
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setSelectedInvoiceFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      
                      {selectedInvoiceFile && (
                        <Button
                          onClick={() => handleInvoiceUpload('assignment_123')}
                          disabled={uploadingInvoice}
                          size="sm"
                        >
                          {uploadingInvoice ? 'Uploading...' : 'Upload Invoice'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}