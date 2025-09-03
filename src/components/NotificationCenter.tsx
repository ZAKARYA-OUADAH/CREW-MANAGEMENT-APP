import React, { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useNotifications } from './NotificationContext';
import EmailQuickActions from './EmailQuickActions';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Users,
  FileText,
  Settings,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Mail
} from 'lucide-react';

interface NotificationCenterProps {
  onNavigate?: (url: string) => void;
}

export default function NotificationCenter({ onNavigate }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearNotifications,
    handleNotificationAction,
    getUnreadEmailPendingCount
  } = useNotifications();

  const unreadEmailCount = getUnreadEmailPendingCount();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info': return <Info className="h-4 w-4 text-blue-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mission': return <Calendar className="h-3 w-3" />;
      case 'validation': return <CheckCircle className="h-3 w-3" />;
      case 'profile': return <Users className="h-3 w-3" />;
      case 'admin': return <Settings className="h-3 w-3" />;
      case 'system': return <Settings className="h-3 w-3" />;
      case 'date_modification': return <Calendar className="h-3 w-3" />;
      case 'email_pending': return <Mail className="h-3 w-3" />;
      default: return <Info className="h-3 w-3" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimestamp = (timestampString: string | undefined) => {
    if (!timestampString) {
      return 'Unknown time';
    }

    try {
      const timestamp = new Date(timestampString);
      
      if (isNaN(timestamp.getTime())) {
        return 'Invalid time';
      }

      const now = new Date();
      const diff = now.getTime() - timestamp.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return timestamp.toLocaleDateString();
    } catch (error) {
      console.warn('Error formatting timestamp:', timestampString, error);
      return 'Unknown time';
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    const actionUrl = notification.metadata?.actionUrl;
    if (actionUrl && onNavigate) {
      onNavigate(actionUrl);
      setIsOpen(false);
    }
  };

  const handleApprove = async (notificationId: string, missionId: string) => {
    try {
      if (handleNotificationAction) {
        await handleNotificationAction(notificationId, 'approve', { missionId });
        markAsRead(notificationId);
      }
    } catch (error) {
      console.error('Error approving date modification:', error);
    }
  };

  const handleReject = async (notificationId: string, missionId: string) => {
    try {
      if (handleNotificationAction) {
        await handleNotificationAction(notificationId, 'reject', { missionId });
        markAsRead(notificationId);
      }
    } catch (error) {
      console.error('Error rejecting date modification:', error);
    }
  };

  const safeNotifications = notifications || [];

  const NotificationContent = () => {
    if (safeNotifications.length === 0) {
      return (
        <div className="w-80 p-6 text-center">
          <Bell className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg text-gray-900 mb-2">No notifications</h3>
          <p className="text-sm text-gray-600">You're all caught up!</p>
        </div>
      );
    }

    return (
      <div className="w-80">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {unreadCount} new
                </Badge>
              )}
              {unreadEmailCount > 0 && (
                <Badge className="bg-red-100 text-red-800 border-red-200">
                  <Mail className="h-3 w-3 mr-1" />
                  {unreadEmailCount} email{unreadEmailCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
            {safeNotifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearNotifications}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear all
              </Button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-96">
          <div className="space-y-0">
            {safeNotifications.map((notification, index) => {
              const notificationId = notification?.id || `notif-${index}`;
              const notificationType = notification?.type || 'info';
              const notificationCategory = notification?.category || 'system';
              const notificationTitle = notification?.title || 'No title';
              const notificationMessage = notification?.message || 'No message';
              const notificationRead = notification?.read || false;
              const notificationCreatedAt = notification?.createdAt;
              const isDateModification = notificationCategory === 'date_modification';
              const isEmailPending = notificationCategory === 'email_pending';

              return (
                <div key={notificationId}>
                  <div 
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notificationRead ? 'bg-blue-50/50' : ''
                    } ${getTypeColor(notificationType)} border-l-4`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 pt-1">
                        {getNotificationIcon(notificationType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-900 mb-1">
                              {notificationTitle}
                            </p>
                            <p className="text-xs text-gray-600 mb-2">
                              {notificationMessage}
                            </p>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                {getCategoryIcon(notificationCategory)}
                                <span className="capitalize">{notificationCategory.replace('_', ' ')}</span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {formatTimestamp(notificationCreatedAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            {notification?.metadata?.actionUrl && (
                              <ExternalLink className="h-3 w-3 text-gray-400" />
                            )}
                            {!notificationRead && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Email Quick Actions */}
                    {isEmailPending && !notificationRead && (
                      <div className="mt-3 pt-2 border-t border-gray-200">
                        <EmailQuickActions
                          notification={notification}
                          onMarkAsRead={markAsRead}
                          onAction={handleNotificationAction}
                        />
                      </div>
                    )}
                    
                    {/* Action buttons for date modification requests */}
                    {isDateModification && !notificationRead && (
                      <div className="flex items-center justify-end space-x-2 mt-3 pt-2 border-t border-gray-200">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(notificationId, notification.metadata?.missionId);
                          }}
                          className="h-8 px-3 text-xs"
                        >
                          <ThumbsDown className="h-3 w-3 mr-1" />
                          Contester
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(notificationId, notification.metadata?.missionId);
                          }}
                          className="h-8 px-3 text-xs"
                        >
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          Valider
                        </Button>
                      </div>
                    )}

                    {/* General action buttons */}
                    {!isDateModification && !isEmailPending && (
                      <div className="flex items-center justify-between mt-2">
                        {notification?.metadata?.actionUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notification);
                            }}
                            className="h-6 text-xs"
                          >
                            View Details
                          </Button>
                        )}
                        <div className="flex items-center space-x-2">
                          {!notificationRead && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notificationId);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {index < safeNotifications.length - 1 && <Separator />}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className={`absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center ${
                unreadEmailCount > 0 ? 'bg-red-600 animate-pulse' : ''
              }`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-0 border border-gray-200 shadow-lg">
        <NotificationContent />
      </PopoverContent>
    </Popover>
  );
}