import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { MissionWorkflowService } from './MissionWorkflowService';
import { toast } from 'sonner@2.0.3';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  DollarSign, 
  Plane, 
  Calendar,
  Mail,
  Phone,
  Building
} from 'lucide-react';

export default function ClientApprovalPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quote, setQuote] = useState<any>(null);
  const [mission, setMission] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [quoteItems, setQuoteItems] = useState<any[]>([]);
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'expired' | 'invalid'>('pending');
  const [error, setError] = useState<string | null>(null);

  // Load quote data from token
  useEffect(() => {
    const loadQuoteData = async () => {
      if (!token) {
        setError('Invalid approval link - no token provided');
        setStatus('invalid');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // In a real implementation, you'd have an endpoint to fetch quote by token
        // For now, we'll simulate the quote data
        // const quoteData = await MissionWorkflowService.getQuoteByToken(token);
        
        // Simulated data - in real implementation, this comes from the API
        const simulatedQuote = {
          id: 'quote-123',
          mission_id: 'mission-456',
          client_id: 'client-789',
          fee_pct: 15,
          currency: 'EUR',
          total_amount: 5500,
          status: 'pending',
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        };

        const simulatedMission = {
          id: 'mission-456',
          mission_number: 'MO-2024-001',
          aircraft_type: 'Citation CJ3',
          departure: {
            airport: 'LFPB (Le Bourget)',
            date: '2024-02-15',
            time: '08:00'
          },
          arrival: {
            airport: 'EGKB (Biggin Hill)',
            date: '2024-02-15', 
            time: '09:30'
          },
          pax_count: 4,
          description: 'Business meeting transport'
        };

        const simulatedClient = {
          id: 'client-789',
          name: 'Acme Corporation',
          contact_name: 'John Smith',
          contact_email: 'john.smith@acme.com',
          contact_phone: '+33 1 23 45 67 89'
        };

        const simulatedQuoteItems = [
          {
            id: '1',
            kind: 'flight_hour',
            description: 'Flight hours (1.5h)',
            qty: 1.5,
            unit_price: 2800,
            total: 4200
          },
          {
            id: '2', 
            kind: 'landing_fee',
            description: 'Landing fees',
            qty: 2,
            unit_price: 150,
            total: 300
          },
          {
            id: '3',
            kind: 'crew_cost',
            description: 'Crew costs',
            qty: 1,
            unit_price: 800,
            total: 800
          }
        ];

        // Check if quote has expired
        if (new Date(simulatedQuote.expires_at) < new Date()) {
          setStatus('expired');
          setError('This approval link has expired');
        } else if (simulatedQuote.status === 'approved') {
          setStatus('approved');
        } else if (simulatedQuote.status === 'rejected') {
          setStatus('rejected');
        } else {
          setStatus('pending');
        }

        setQuote(simulatedQuote);
        setMission(simulatedMission);
        setClient(simulatedClient);
        setQuoteItems(simulatedQuoteItems);

      } catch (error) {
        console.error('Error loading quote data:', error);
        setError('Failed to load quote information');
        setStatus('invalid');
      } finally {
        setLoading(false);
      }
    };

    loadQuoteData();
  }, [token]);

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      
      await MissionWorkflowService.clientApproveQuote(token!);
      
      setStatus('approved');
      toast.success('Quote approved successfully!');
      
    } catch (error) {
      console.error('Error approving quote:', error);
      toast.error('Failed to approve quote');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setSubmitting(true);
      
      await MissionWorkflowService.clientRejectQuote(token!);
      
      setStatus('rejected');
      toast.success('Quote rejected');
      
    } catch (error) {
      console.error('Error rejecting quote:', error);
      toast.error('Failed to reject quote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Clock className="h-8 w-8 mx-auto animate-spin text-blue-600 mb-4" />
            <p>Loading quote information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="h-8 w-8 mx-auto text-red-600 mb-4" />
            <h2 className="text-lg font-semibold mb-2">Unable to Load Quote</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mission Quote Approval</h1>
          <p className="text-gray-600">Please review and approve or reject this quote</p>
        </div>

        {/* Status Alert */}
        {status === 'approved' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              This quote has been approved. The mission will proceed as planned.
            </AlertDescription>
          </Alert>
        )}

        {status === 'rejected' && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              This quote has been rejected. Please contact us if you'd like to discuss alternatives.
            </AlertDescription>
          </Alert>
        )}

        {status === 'expired' && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <Clock className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              This approval link has expired. Please contact us for a new quote.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Client Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold">{client?.name}</h3>
                <p className="text-sm text-gray-600">{client?.contact_name}</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{client?.contact_email}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{client?.contact_phone}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mission Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plane className="h-5 w-5" />
                <span>Mission Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Mission Number</label>
                  <p className="font-semibold">{mission?.mission_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Aircraft Type</label>
                  <p className="font-semibold">{mission?.aircraft_type}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">Departure</label>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="font-semibold">{mission?.departure.airport}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(mission?.departure.date).toLocaleDateString()}</span>
                      <Clock className="h-4 w-4" />
                      <span>{mission?.departure.time}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">Arrival</label>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="font-semibold">{mission?.arrival.airport}</p>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(mission?.arrival.date).toLocaleDateString()}</span>
                      <Clock className="h-4 w-4" />
                      <span>{mission?.arrival.time}</span>
                    </div>
                  </div>
                </div>
              </div>

              {mission?.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-sm text-gray-600 mt-1">{mission.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quote Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Quote Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Quote Items */}
              <div className="space-y-2">
                {quoteItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex-1">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-gray-500">
                        {item.qty} × {item.unit_price.toLocaleString()} {quote?.currency}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {item.total.toLocaleString()} {quote?.currency}
                    </p>
                  </div>
                ))}
              </div>

              {/* Subtotal */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{(quoteItems.reduce((sum, item) => sum + item.total, 0)).toLocaleString()} {quote?.currency}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Service Fee ({quote?.fee_pct}%)</span>
                  <span>{Math.round(quoteItems.reduce((sum, item) => sum + item.total, 0) * (quote?.fee_pct / 100)).toLocaleString()} {quote?.currency}</span>
                </div>
                
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total Amount</span>
                  <span className="flex items-center space-x-1">
                    <DollarSign className="h-5 w-5" />
                    <span>{quote?.total_amount.toLocaleString()} {quote?.currency}</span>
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        {status === 'pending' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={handleReject}
                  variant="outline"
                  size="lg"
                  disabled={submitting}
                  className="px-8"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Quote
                </Button>
                
                <Button
                  onClick={handleApprove}
                  size="lg"
                  disabled={submitting}
                  className="px-8 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {submitting ? 'Processing...' : 'Approve Quote'}
                </Button>
              </div>
              
              <p className="text-center text-sm text-gray-500 mt-4">
                By approving this quote, you agree to the terms and the mission will be scheduled.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>If you have any questions about this quote, please contact us directly.</p>
          <p className="mt-1">This approval link expires on {new Date(quote?.expires_at).toLocaleDateString()}.</p>
        </div>
      </div>
    </div>
  );
}