import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Calendar, 
  Plane, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Plus,
  ArrowRight,
  Activity,
  Euro
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Mock data for demonstration
  const mockStats = {
    activeMissions: 12,
    pendingMissions: 8,
    totalMissions: 45,
    activeCrew: 24
  };

  const mockRecentMissions = [
    {
      id: 1,
      departure: { airport: 'CDG' },
      arrival: { airport: 'LHR' },
      status: 'in_progress',
      aircraft_type: 'Citation CJ3+',
      mission_number: 'CT-2024-001',
      date: '2024-01-15',
      budget: 15000
    },
    {
      id: 2,
      departure: { airport: 'LBG' },
      arrival: { airport: 'NCE' },
      status: 'confirmed',
      aircraft_type: 'Falcon 7X',
      mission_number: 'CT-2024-002',
      date: '2024-01-16',
      budget: 25000
    },
    {
      id: 3,
      departure: { airport: 'ORY' },
      arrival: { airport: 'GVA' },
      status: 'pending',
      aircraft_type: 'King Air 350',
      mission_number: 'CT-2024-003',
      date: '2024-01-17',
      budget: 12000
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
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Activity className="h-4 w-4" />;
      case 'confirmed':
        return <Clock className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl text-gray-900">Dashboard CrewTech</h1>
          <p className="text-muted-foreground">
            {currentTime.toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} • {currentTime.toLocaleTimeString('fr-FR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => navigate('/mission-request/new')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Mission
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Missions Actives</p>
                <p className="text-2xl font-medium">{mockStats.activeMissions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">En Attente</p>
                <p className="text-2xl font-medium">{mockStats.pendingMissions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Plane className="h-5 w-5 text-green-600" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Missions</p>
                <div className="flex items-center space-x-2">
                  <p className="text-2xl font-medium">{mockStats.totalMissions}</p>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Équipage Actif</p>
                <p className="text-2xl font-medium">{mockStats.activeCrew}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={() => navigate('/mission-request')}
            >
              <Plane className="h-6 w-6" />
              <span>Nouvelle Mission</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={() => navigate('/manage-crew')}
            >
              <Users className="h-6 w-6" />
              <span>Gérer Équipage</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col space-y-2"
              onClick={() => navigate('/finance-export')}
            >
              <Euro className="h-6 w-6" />
              <span>Export Finance</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Missions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Missions Récentes</span>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/manage-missions')}
          >
            Voir Tout
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockRecentMissions.map((mission) => (
              <div key={mission.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(mission.status)}
                    <Badge className={getStatusColor(mission.status)}>
                      {mission.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-medium">
                      {mission.departure.airport} → {mission.arrival.airport}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {mission.aircraft_type} • {mission.mission_number}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(mission.date).toLocaleDateString('fr-FR')} • 
                      €{mission.budget.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100 border-2 border-background flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Welcome Message */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <CardContent className="p-6">
          <h3 className="font-bold mb-2">Bienvenue sur CrewTech</h3>
          <p className="text-sm text-blue-100">
            Plateforme de gestion des équipages d'aviation d'affaires. 
            Gérez vos missions, équipages et planifications en toute simplicité.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}