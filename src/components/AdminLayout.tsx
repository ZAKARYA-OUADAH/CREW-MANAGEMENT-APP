import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { 
  Settings, 
  LogOut, 
  Users, 
  FileText, 
  Calculator, 
  DollarSign, 
  Plane,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Database
} from 'lucide-react';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { useSidebarCollapse } from './useSidebarCollapse';

interface AdminLayoutProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  onLogout: () => void;
}

export default function AdminLayout({ user, onLogout }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { isCollapsed, toggleSidebar } = useSidebarCollapse();
  
  const navigation = [
    { name: 'Dashboard', href: '/', icon: FileText },
    { name: 'Mission Request', href: '/mission-request', icon: Plane },
    { name: 'Manage Missions', href: '/manage-missions', icon: FileText },
    { name: 'Manage Crew', href: '/manage-crew', icon: Users },
    { name: 'Enhanced Crew', href: '/enhanced-crew', icon: Database },
    { name: 'Invite User', href: '/invite-user', icon: UserPlus },
    { name: 'Finance Export', href: '/finance-export', icon: DollarSign },
    { name: 'Cost Simulation', href: '/cost-simulation', icon: Calculator },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  // Get current pathname for active state detection
  const currentPath = window.location.pathname;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white shadow-lg flex flex-col transition-all duration-300 ease-in-out`}>
        {/* Header */}
        <div className={`${isCollapsed ? 'p-3' : 'p-6'} border-b transition-all duration-300 ease-in-out`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Plane className="h-6 w-6 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-semibold text-gray-900">CrewTech</h1>
                <p className="text-sm text-gray-500">Admin Portal</p>
              </div>
            )}
          </div>
        </div>

        {/* Toggle Button */}
        <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-b`}>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={`${isCollapsed ? 'w-full justify-center px-2' : 'w-full justify-start'} text-gray-600 hover:text-gray-900 hover:bg-gray-100`}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Réduire
              </>
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${isCollapsed ? 'p-2' : 'p-4'} space-y-2 transition-all duration-300 ease-in-out overflow-y-auto`}>
          {navigation.map((item) => {
            const isActive = currentPath === item.href || 
                           (item.href !== '/' && currentPath.startsWith(item.href));
            
            return (
              <Button
                key={item.name}
                variant={isActive ? "default" : "ghost"}
                className={`${isCollapsed ? 'justify-center px-3' : 'justify-start'} w-full ${
                  isActive 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
                onClick={() => handleNavigation(item.href)}
              >
                <item.icon className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
                {!isCollapsed && item.name}
              </Button>
            );
          })}
        </nav>

        <Separator />

        {/* User info and logout */}
        <div className={`${isCollapsed ? 'p-2' : 'p-4'} space-y-3 transition-all duration-300 ease-in-out`}>
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className={`w-full ${isCollapsed ? 'justify-center px-2' : 'justify-start'} text-gray-700 hover:text-gray-900`}
          >
            <LogOut className={`h-4 w-4 ${isCollapsed ? '' : 'mr-2'}`} />
            {!isCollapsed && 'Logout'}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Administration Dashboard
              </h2>
              <p className="text-sm text-gray-600">
                Manage missions, crew, and operations
              </p>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}