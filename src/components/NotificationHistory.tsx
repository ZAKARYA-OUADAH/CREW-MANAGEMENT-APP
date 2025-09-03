import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  useDocumentNotifications, 
  formatLastSentTime 
} from './DocumentNotificationService';
import { 
  Search, 
  Send, 
  Clock, 
  User, 
  FileText,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export default function NotificationHistory() {
  const { getAllNotificationRecords } = useDocumentNotifications();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('all');

  const allNotifications = getAllNotificationRecords();

  // Filter notifications based on search and timeframe
  const filteredNotifications = allNotifications.filter(notification => {
    const matchesSearch = 
      notification.crewName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.sentByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.missingDocs.some(doc => doc.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedTimeframe === 'all') return true;

    const notificationDate = new Date(notification.sentAt);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60 * 24));

    switch (selectedTimeframe) {
      case 'today':
        return daysDiff === 0;
      case 'week':
        return daysDiff <= 7;
      case 'month':
        return daysDiff <= 30;
      default:
        return true;
    }
  });

  // Calculate statistics
  const stats = {
    total: allNotifications.length,
    today: allNotifications.filter(n => {
      const notificationDate = new Date(n.sentAt);
      const today = new Date();
      return notificationDate.toDateString() === today.toDateString();
    }).length,
    thisWeek: allNotifications.filter(n => {
      const notificationDate = new Date(n.sentAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    }).length,
    uniqueCrewMembers: new Set(allNotifications.map(n => n.crewId)).size,
  };

  // Get most active senders
  const senderStats = allNotifications.reduce((acc, notification) => {
    acc[notification.sentByName] = (acc[notification.sentByName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topSenders = Object.entries(senderStats)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl text-gray-900">Document Notification History</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track all document reminder notifications sent to crew members
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Send className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-600">Total Notifications</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{stats.today}</p>
                <p className="text-xs text-gray-600">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{stats.thisWeek}</p>
                <p className="text-xs text-gray-600">This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-amber-100 rounded-lg">
                <User className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{stats.uniqueCrewMembers}</p>
                <p className="text-xs text-gray-600">Crew Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by crew name, sender, or document type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {['all', 'today', 'week', 'month'].map((timeframe) => (
                    <Button
                      key={timeframe}
                      variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTimeframe(timeframe)}
                      className="capitalize"
                    >
                      {timeframe === 'all' ? 'All Time' : timeframe}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications Table */}
          <Card>
            <CardContent className="p-0">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No notifications found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead className="min-w-36">Crew Member</TableHead>
                        <TableHead className="min-w-36">Sent By</TableHead>
                        <TableHead className="min-w-40">Missing Documents</TableHead>
                        <TableHead className="w-24">Count</TableHead>
                        <TableHead className="min-w-32">Sent At</TableHead>
                        <TableHead className="w-20">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredNotifications.map((notification) => (
                        <TableRow key={notification.crewId + notification.sentAt} className="hover:bg-gray-50">
                          <TableCell>
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 text-xs">
                                {notification.crewName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>

                          <TableCell className="font-medium">
                            <div className="truncate" title={notification.crewName}>
                              {notification.crewName}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 text-xs">
                                  {notification.sentByName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm truncate" title={notification.sentByName}>
                                {notification.sentByName}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {notification.missingDocs.slice(0, 3).map((doc, index) => (
                                <Badge key={index} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-300">
                                  {doc}
                                </Badge>
                              ))}
                              {notification.missingDocs.length > 3 && (
                                <Badge variant="outline" className="text-xs bg-gray-50 text-gray-500">
                                  +{notification.missingDocs.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              #{notification.notificationCount}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatLastSentTime(notification.sentAt)}</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-green-600">Sent</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Senders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Most Active Senders</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topSenders.map(([senderName, count], index) => (
                    <div key={senderName} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium">
                          {index + 1}
                        </div>
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 text-xs">
                            {senderName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{senderName}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {count} notification{count > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  ))}
                  {topSenders.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No notifications sent yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allNotifications.slice(0, 8).map((notification) => (
                    <div key={notification.crewId + notification.sentAt} className="flex items-center space-x-3 text-sm">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 text-xs">
                          {notification.crewName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="truncate">
                          <span className="font-medium">{notification.sentByName}</span> notified{' '}
                          <span className="font-medium">{notification.crewName}</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatLastSentTime(notification.sentAt)} • {notification.missingDocs.length} docs
                        </p>
                      </div>
                    </div>
                  ))}
                  {allNotifications.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No recent activity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}