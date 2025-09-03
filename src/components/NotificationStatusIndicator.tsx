import React from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { 
  useDocumentNotifications, 
  formatTimeRemaining, 
  formatLastSentTime 
} from './DocumentNotificationService';
import { 
  Send, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Shield
} from 'lucide-react';

interface NotificationStatusIndicatorProps {
  crewId?: string;
  crewName?: string;
  missingDocs?: string[];
  currentUserId?: string;
  currentUserName?: string;
  onSendNotification?: () => void;
  compact?: boolean;
}

export default function NotificationStatusIndicator({
  crewId = '',
  crewName = '',
  missingDocs = [],
  currentUserId = '',
  currentUserName = '',
  onSendNotification,
  compact = false
}: NotificationStatusIndicatorProps) {
  const { 
    canSendNotification, 
    getNotificationStats, 
    recordNotification 
  } = useDocumentNotifications();

  const stats = getNotificationStats(crewId);
  const canSend = canSendNotification(crewId);

  const handleSendNotification = () => {
    if (canSend && onSendNotification) {
      // Record the notification
      recordNotification(crewId, crewName, currentUserId, currentUserName, missingDocs);
      // Call the original handler
      onSendNotification();
    }
  };

  const getStatusInfo = () => {
    if (!missingDocs || missingDocs.length === 0) {
      return {
        variant: 'success' as const,
        icon: <CheckCircle className="h-3 w-3" />,
        text: 'Complet',
        description: 'Tous les documents sont présents'
      };
    }

    if (canSend) {
      return {
        variant: 'available' as const,
        icon: <Send className="h-3 w-3" />,
        text: 'Peut notifier',
        description: 'Notification disponible'
      };
    }

    return {
      variant: 'blocked' as const,
      icon: <Shield className="h-3 w-3" />,
      text: `Bloqué ${formatTimeRemaining(stats.nextAvailableIn)}`,
      description: `Dernière notification envoyée par ${stats.lastSentBy} ${formatLastSentTime(stats.lastSentAt!)}`
    };
  };

  const statusInfo = getStatusInfo();

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex items-center space-x-2">
          {/* Status Badge */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className={`text-xs flex items-center space-x-1 ${
                  statusInfo.variant === 'success' 
                    ? 'bg-green-50 text-green-700 border-green-300'
                    : statusInfo.variant === 'available'
                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                    : 'bg-amber-50 text-amber-700 border-amber-300'
                }`}
              >
                {statusInfo.icon}
                <span>{statusInfo.text}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-xs">
                <p>{statusInfo.description}</p>
                {stats.totalSent > 0 && (
                  <p className="text-muted-foreground mt-1">
                    {stats.totalSent} notification{stats.totalSent > 1 ? 's' : ''} envoyée{stats.totalSent > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>

          {/* Action Button */}
          {missingDocs && missingDocs.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant={canSend ? "default" : "ghost"}
                  className={`text-xs px-2 py-1 ${
                    canSend 
                      ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={handleSendNotification}
                  disabled={!canSend}
                >
                  <Send className="h-3 w-3 mr-1" />
                  Notifier
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {canSend 
                    ? `Notifier ${crewName} pour ${missingDocs.length} document${missingDocs.length > 1 ? 's' : ''} manquant${missingDocs.length > 1 ? 's' : ''}`
                    : `Notification bloquée - ${formatTimeRemaining(stats.nextAvailableIn)} restantes`
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    );
  }

  // Full version for detailed views
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge 
            variant="outline" 
            className={`text-xs flex items-center space-x-1 ${
              statusInfo.variant === 'success' 
                ? 'bg-green-50 text-green-700 border-green-300'
                : statusInfo.variant === 'available'
                ? 'bg-blue-50 text-blue-700 border-blue-300'
                : 'bg-amber-50 text-amber-700 border-amber-300'
            }`}
          >
            {statusInfo.icon}
            <span>{statusInfo.text}</span>
          </Badge>

          {stats.totalSent > 0 && (
            <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">
              {stats.totalSent} envoi{stats.totalSent > 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {missingDocs && missingDocs.length > 0 && (
          <Button
            size="sm"
            variant={canSend ? "default" : "ghost"}
            className={`text-xs px-3 py-1 ${
              canSend 
                ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                : 'text-gray-400 cursor-not-allowed'
            }`}
            onClick={handleSendNotification}
            disabled={!canSend}
          >
            <Send className="h-3 w-3 mr-1" />
            {canSend ? 'Notifier' : 'Bloqué'}
          </Button>
        )}
      </div>

      {/* Additional info */}
      {(stats.lastSentBy || !canSend) && (
        <div className="text-xs text-gray-600 space-y-1">
          {stats.lastSentBy && (
            <div className="flex items-center space-x-1">
              <Info className="h-3 w-3" />
              <span>
                Dernière notification par <strong>{stats.lastSentBy}</strong> {formatLastSentTime(stats.lastSentAt!)}
              </span>
            </div>
          )}
          {!canSend && missingDocs && missingDocs.length > 0 && (
            <div className="flex items-center space-x-1 text-amber-600">
              <Clock className="h-3 w-3" />
              <span>
                Prochaine notification disponible dans {formatTimeRemaining(stats.nextAvailableIn)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}