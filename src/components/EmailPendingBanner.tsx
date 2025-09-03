import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { useNotifications } from './NotificationContext';
import { useAuth } from './AuthProvider';
import { 
  Mail, 
  AlertTriangle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  X
} from 'lucide-react';

export default function EmailPendingBanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notifications, markAsRead, getNotificationsByCategory, getUnreadEmailPendingCount } = useNotifications();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Only show for admin users
  if (!user || user.role !== 'admin') return null;

  const emailPendingNotifications = getNotificationsByCategory('email_pending').filter(n => !n.read);
  const unreadEmailCount = getUnreadEmailPendingCount();

  // Don't show if no pending emails or if dismissed
  if (unreadEmailCount === 0 || isDismissed) return null;

  // Categorize by urgency
  const criticalEmails = emailPendingNotifications.filter(n => n.metadata?.urgencyLevel === 'critical');
  const urgentEmails = emailPendingNotifications.filter(n => n.metadata?.urgencyLevel === 'urgent');
  const normalEmails = emailPendingNotifications.filter(n => n.metadata?.urgencyLevel === 'normal');

  const getBannerStyle = () => {
    if (criticalEmails.length > 0) return 'border-red-200 bg-red-50';
    if (urgentEmails.length > 0) return 'border-orange-200 bg-orange-50';
    return 'border-blue-200 bg-blue-50';
  };

  const getIconColor = () => {
    if (criticalEmails.length > 0) return 'text-red-600';
    if (urgentEmails.length > 0) return 'text-orange-600';
    return 'text-blue-600';
  };

  const getTextColor = () => {
    if (criticalEmails.length > 0) return 'text-red-800';
    if (urgentEmails.length > 0) return 'text-orange-800';
    return 'text-blue-800';
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Mark all email notifications as read
    emailPendingNotifications.forEach(notification => {
      markAsRead(notification.id);
    });
  };

  const handleManageEmails = () => {
    // Navigate to manage missions with email filter using React Router
    navigate('/manage-missions?filter=pending_client_approval');
  };

  const formatTimeAgo = (hours: number) => {
    if (hours < 1) return 'Moins d\'1h';
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}j ${remainingHours}h`;
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
      <Alert className={`${getBannerStyle()} shadow-lg max-w-4xl mx-auto`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <Mail className={`h-5 w-5 ${getIconColor()}`} />
            <div className="flex-1">
              <AlertDescription>
                <div className={`${getTextColor()} space-y-2`}>
                  <div className="flex items-center space-x-3 flex-wrap">
                    <span className="font-medium">
                      {criticalEmails.length > 0 && '🚨 '} 
                      {unreadEmailCount} email{unreadEmailCount > 1 ? 's' : ''} client{unreadEmailCount > 1 ? 's' : ''} en attente d'envoi
                    </span>
                    
                    {/* Urgency badges */}
                    <div className="flex space-x-2">
                      {criticalEmails.length > 0 && (
                        <Badge className="bg-red-100 text-red-800 border-red-200">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {criticalEmails.length} Critique{criticalEmails.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {urgentEmails.length > 0 && (
                        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                          <Clock className="h-3 w-3 mr-1" />
                          {urgentEmails.length} Urgent{urgentEmails.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {normalEmails.length > 0 && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          {normalEmails.length} Normal{normalEmails.length > 1 ? 'aux' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Quick summary */}
                  <p className="text-sm">
                    {criticalEmails.length > 0 && 'Certains emails sont en attente depuis plus de 24h. '}
                    Cliquez pour gérer les envois d'emails clients.
                  </p>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-4 space-y-3">
                      {emailPendingNotifications.slice(0, 5).map((notification) => (
                        <Card key={notification.id} className="bg-white bg-opacity-80">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-3">
                                <Badge 
                                  variant="outline" 
                                  className={
                                    notification.metadata?.urgencyLevel === 'critical' ? 'border-red-200 text-red-700' :
                                    notification.metadata?.urgencyLevel === 'urgent' ? 'border-orange-200 text-orange-700' :
                                    'border-blue-200 text-blue-700'
                                  }
                                >
                                  {notification.metadata?.missionId}
                                </Badge>
                                <span className="font-medium">{notification.metadata?.crewName}</span>
                                <span className="text-gray-600">{notification.metadata?.clientEmail}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span>{formatTimeAgo(notification.metadata?.hoursAgo || 0)}</span>
                                <span>{notification.metadata?.totalAmount?.toLocaleString()} {notification.metadata?.currency}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {emailPendingNotifications.length > 5 && (
                        <p className="text-sm text-center text-gray-600">
                          ... et {emailPendingNotifications.length - 5} autre{emailPendingNotifications.length - 5 > 1 ? 's' : ''} email{emailPendingNotifications.length - 5 > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 ml-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-600 hover:text-gray-800"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              size="sm"
              onClick={handleManageEmails}
              className={
                criticalEmails.length > 0 ? 'bg-red-600 hover:bg-red-700' :
                urgentEmails.length > 0 ? 'bg-orange-600 hover:bg-orange-700' :
                'bg-blue-600 hover:bg-blue-700'
              }
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Gérer Emails
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  );
}