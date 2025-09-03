import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ExternalLink, 
  Mail, 
  Clock, 
  AlertTriangle,
  User,
  Plane,
  DollarSign
} from 'lucide-react';
import type { Notification } from './NotificationContext';

interface EmailQuickActionsProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onAction?: (notificationId: string, action: string, data?: any) => void;
}

export default function EmailQuickActions({ 
  notification, 
  onMarkAsRead, 
  onAction 
}: EmailQuickActionsProps) {
  const { metadata } = notification;
  
  if (notification.category !== 'email_pending' || !metadata) {
    return null;
  }

  const handleManageEmail = () => {
    // Navigate to manage missions with this specific mission highlighted
    const url = `/manage-missions?filter=pending_client_approval&highlight=${metadata.missionId}`;
    window.open(url, '_blank');
    onMarkAsRead(notification.id);
  };

  const handleMarkAsHandled = () => {
    onMarkAsRead(notification.id);
  };

  const getUrgencyIcon = () => {
    switch (metadata.urgencyLevel) {
      case 'critical':
        return <AlertTriangle className="h-3 w-3 text-red-600" />;
      case 'urgent':
        return <Clock className="h-3 w-3 text-orange-600" />;
      default:
        return <Mail className="h-3 w-3 text-blue-600" />;
    }
  };

  const getUrgencyBadge = () => {
    const urgency = metadata.urgencyLevel;
    if (urgency === 'critical') {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200">
          🚨 Critique ({metadata.hoursAgo}h)
        </Badge>
      );
    }
    if (urgency === 'urgent') {
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
          ⚠️ Urgent ({metadata.hoursAgo}h)
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
        📧 Normal ({metadata.hoursAgo || 0}h)
      </Badge>
    );
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  return (
    <div className="space-y-3">
      {/* Mission details */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getUrgencyIcon()}
            <span className="font-medium text-sm">{metadata.missionId}</span>
          </div>
          {getUrgencyBadge()}
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <User className="h-3 w-3" />
            <span>{metadata.crewName}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Plane className="h-3 w-3" />
            <span>{metadata.aircraftImmat}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Mail className="h-3 w-3" />
            <span className="truncate">{metadata.clientEmail}</span>
          </div>
          <div className="flex items-center space-x-1">
            <DollarSign className="h-3 w-3" />
            <span>{formatAmount(metadata.totalAmount || 0, metadata.currency || 'EUR')}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <Button
          size="sm"
          onClick={handleManageEmail}
          className={
            metadata.urgencyLevel === 'critical' ? 'bg-red-600 hover:bg-red-700' :
            metadata.urgencyLevel === 'urgent' ? 'bg-orange-600 hover:bg-orange-700' :
            'bg-blue-600 hover:bg-blue-700'
          }
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          Gérer Email
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAsHandled}
          className="text-gray-600 hover:text-gray-800"
        >
          Marquer comme traité
        </Button>
      </div>

      {/* Context help */}
      <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
        💡 <strong>Conseil:</strong> {
          metadata.urgencyLevel === 'critical' 
            ? 'Email en attente depuis plus de 24h - action urgente requise!'
            : metadata.urgencyLevel === 'urgent'
            ? 'Email en attente depuis plus de 8h - traitement prioritaire recommandé.'
            : 'Email récemment généré - envoi dans les prochaines heures recommandé.'
        }
      </div>
    </div>
  );
}