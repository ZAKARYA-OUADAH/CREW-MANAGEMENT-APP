import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useActivity } from './ActivityService';
import { 
  User, 
  FileText, 
  CheckCircle, 
  Clock, 
  Plane, 
  Send, 
  AlertCircle,
  Eye,
  Edit,
  UserPlus,
  Calendar
} from 'lucide-react';

export default function ActivityBanner() {
  const { getRecentActivities } = useActivity();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activities, setActivities] = useState([]);
  const [isVisible, setIsVisible] = useState(true);

  // Add body spacing when component mounts, remove when unmounts
  useEffect(() => {
    document.body.classList.add('has-activity-banner');
    
    return () => {
      document.body.classList.remove('has-activity-banner');
    };
  }, []);

  // Get recent activities
  useEffect(() => {
    const recentActivities = getRecentActivities(10);
    setActivities(recentActivities);
  }, [getRecentActivities]);

  // Auto-rotate through activities every 4 seconds with fade effect
  useEffect(() => {
    if (activities.length === 0) return;

    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % activities.length);
        setIsVisible(true);
      }, 300); // Half of transition duration
    }, 4000);

    return () => clearInterval(interval);
  }, [activities.length]);

  // Refresh activities every 30 seconds
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      const recentActivities = getRecentActivities(10);
      setActivities(recentActivities);
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, [getRecentActivities]);

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'mission_created':
        return <Calendar className="h-3 w-3" />;
      case 'mission_validated':
        return <CheckCircle className="h-3 w-3" />;
      case 'mission_approved':
        return <CheckCircle className="h-3 w-3" />;
      case 'mission_rejected':
        return <AlertCircle className="h-3 w-3" />;
      case 'document_uploaded':
        return <FileText className="h-3 w-3" />;
      case 'profile_updated':
        return <Edit className="h-3 w-3" />;
      case 'crew_added':
        return <UserPlus className="h-3 w-3" />;
      case 'login':
        return <User className="h-3 w-3" />;
      case 'export_generated':
        return <Send className="h-3 w-3" />;
      case 'mission_assigned':
        return <Plane className="h-3 w-3" />;
      case 'payment_processed':
        return <Send className="h-3 w-3" />;
      default:
        return <Eye className="h-3 w-3" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'maintenant';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}j`;
  };

  if (activities.length === 0) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900 text-white py-2 shadow-sm">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-2 text-sm opacity-60">
            <Clock className="h-3 w-3 animate-pulse" />
            <span>Chargement des activités...</span>
          </div>
        </div>
      </div>
    );
  }

  const currentActivity = activities[currentIndex];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gray-900 text-white py-2 shadow-sm">
      <div className="container mx-auto px-4">
        <div 
          className={`flex items-center justify-center transition-all duration-600 ease-in-out ${
            isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-2'
          }`}
        >
          <div className="flex items-center space-x-3 text-sm">
            {/* User Avatar */}
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-xs bg-white/20 text-white text-[10px]">
                {currentActivity.userName.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            
            {/* User Name - Highlighted */}
            <span className="text-blue-300 font-medium">
              {currentActivity.userName}
            </span>
            
            {/* Action Icon */}
            <div className="text-white/70">
              {getActionIcon(currentActivity.actionType)}
            </div>
            
            {/* Action Text */}
            <span className="text-white/90">
              {currentActivity.action}
            </span>
            
            {/* Details - Highlighted if present */}
            {currentActivity.details && (
              <>
                <span className="text-white/40">•</span>
                <span className="text-yellow-300 font-medium">
                  {currentActivity.details}
                </span>
              </>
            )}
            
            {/* Time - Subtle */}
            <span className="text-white/40">•</span>
            <div className="flex items-center space-x-1 text-white/60">
              <Clock className="h-3 w-3" />
              <span>{formatTimeAgo(currentActivity.timestamp)}</span>
            </div>
            
            {/* Role Badge - Subtle */}
            <Badge 
              variant="outline" 
              className="text-xs border-white/20 bg-white/10 text-white/80 px-2 py-0"
            >
              {currentActivity.userRole === 'admin' ? 'Admin' : 
               currentActivity.userRole === 'internal' ? 'Staff' : 'Freelancer'}
            </Badge>
          </div>
          
          {/* Activity Counter - Right side */}
          <div className="absolute right-4 flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {activities.slice(0, Math.min(5, activities.length)).map((_, index) => (
                <div
                  key={index}
                  className={`h-1 w-1 rounded-full transition-all duration-300 ${
                    index === currentIndex % Math.min(5, activities.length)
                      ? 'bg-blue-400 w-2'
                      : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-white/50">
              {currentIndex + 1}/{activities.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}