import React from 'react';
import EmailNotificationService from './EmailNotificationService';
import MissionAssignmentService from './MissionAssignmentService';
import DocumentReminderService from './DocumentReminderService';
import ActivityBanner from './ActivityBanner';

interface AdminBackgroundServicesProps {
  userRole: string;
}

export default function AdminBackgroundServices({ userRole }: AdminBackgroundServicesProps) {
  // Only render for admin users
  if (userRole !== 'admin') {
    return null;
  }

  return (
    <>
      {/* Email Notification Service */}
      <EmailNotificationService />
      
      {/* Mission Assignment Service */}
      <MissionAssignmentService />
      
      {/* Document Reminder Service */}
      <DocumentReminderService />
      
      {/* Global Activity Banner */}
      <ActivityBanner />
    </>
  );
}