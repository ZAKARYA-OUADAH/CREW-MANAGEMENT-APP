import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Calendar, 
  Plane, 
  DollarSign, 
  CheckCircle,
  User,
  Eye,
  ArrowRight
} from 'lucide-react';

export default function FreelancerDashboard() {
  const { user } = useOutletContext<{ user: any }>();
  const navigate = useNavigate();

  // Mock data for demonstration
  const mockStats = {
    activeMissions: 3,
    totalEarnings: 45000,
    completedMissions: 12
  };

  const mockActiveMissions = [
    {
      id: 'FR-2024-001',
      aircraft: 'F-GXXX',
      date: '2024-01-20',
      status: 'in_progress',
      compensation: 5000,
      flights: 2
    },
    {
      id: 'FR-2024-002',
      aircraft: 'F-GYYY',
      date: '2024-01-22',
      status: 'confirmed',
      compensation: 3500,
      flights: 1
    }
  ];

  const mockCompletedMissions = [
    {
      id: 'FR-2024-003',
      aircraft: 'F-GZZZ',
      date: '2024-01-15',
      status: 'completed',
      compensation: 4200,
      flights: 3
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome, {user.name}</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-900">Freelancer</p>
            <p className="text-xs text-gray-500">CrewTech Member</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Plane className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Active Missions</p>
                <p className="text-2xl text-gray-900">{mockStats.activeMissions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Earnings (EUR)</p>
                <p className="text-2xl text-gray-900">{mockStats.totalEarnings.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl text-green-600">{mockStats.completedMissions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mission Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Missions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Plane className="h-5 w-5 text-blue-600" />
                <span>Active Missions</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/missions')}
                className="text-blue-600"
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockActiveMissions.map((mission) => (
              <div 
                key={mission.id} 
                className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/missions/${mission.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{mission.id}</span>
                      <Badge className={getStatusColor(mission.status)} className="text-xs">
                        {mission.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">
                      {mission.aircraft} • {formatDate(mission.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {mission.compensation.toLocaleString()} EUR
                    </p>
                    <p className="text-xs text-gray-500">{mission.flights} flight(s)</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Completed Missions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Recent Completed</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/missions')}
                className="text-blue-600"
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockCompletedMissions.map((mission) => (
              <div 
                key={mission.id} 
                className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/missions/${mission.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{mission.id}</span>
                      <Badge className={getStatusColor(mission.status)} className="text-xs">
                        {mission.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">
                      {mission.aircraft} • {formatDate(mission.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {mission.compensation.toLocaleString()} EUR
                    </p>
                    <p className="text-xs text-gray-500">{mission.flights} flight(s)</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => navigate('/missions')}
            >
              <Calendar className="h-6 w-6" />
              <span>View All Missions</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => navigate('/profile')}
            >
              <User className="h-6 w-6" />
              <span>Edit Profile</span>
            </Button>
            
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => navigate('/missions')}
            >
              <Eye className="h-6 w-6" />
              <span>View Missions</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Welcome Message */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <CardContent className="p-6">
          <h3 className="font-bold mb-2">Welcome to CrewTech Freelancer Portal</h3>
          <p className="text-sm text-blue-100">
            Manage your missions, view your schedule, and track your earnings all in one place.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}