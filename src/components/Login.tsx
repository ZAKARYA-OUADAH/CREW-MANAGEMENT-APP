import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Plane, AlertCircle, Copy, Eye, EyeOff, Users, Briefcase, User, Info } from 'lucide-react';
import { useAuth } from './AuthProvider';

interface LoginProps {
  seedingCredentials?: {
    admin: { email: string; password: string; name: string; role: string };
    internal: { email: string; password: string; name: string; role: string };
    freelancers: Array<{ email: string; password: string; name: string; role: string }>;
  };
}

const DEFAULT_CREDENTIALS = {
  admin: {
    email: 'admin@crewtech.fr',
    password: 'admin123!',
    name: 'Sophie Laurent',
    role: 'Operations Manager'
  },
  internal: {
    email: 'internal@crewtech.fr',
    password: 'internal123!',
    name: 'Pierre Dubois',
    role: 'Internal Captain'
  },
  freelancers: [
    {
      email: 'freelancer@aviation.com',
      password: 'freelancer123!',
      name: 'Lisa Anderson',
      role: 'Flight Attendant'
    },
    {
      email: 'captain@freelance.eu',
      password: 'captain123!',
      name: 'Marco Rossi',
      role: 'Freelance Captain'
    },
    {
      email: 'sarah@crewaviation.com',
      password: 'sarah123!',
      name: 'Sarah Mitchell',
      role: 'First Officer'
    }
  ]
};

export default function Login({ seedingCredentials }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await signIn(email, password);
      if (!result.success) {
        console.error('Login error:', result.error);
        setError(result.error || 'Login failed. Please check your credentials.');
      }
      // If successful, the AuthProvider will handle the user state update
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (userEmail: string, userPassword: string) => {
    setEmail(userEmail);
    setPassword(userPassword);
    setError('');
  };

  const copyCredentials = (credentials: any) => {
    const text = `Email: ${credentials.email}\nPassword: ${credentials.password}`;
    navigator.clipboard.writeText(text);
  };

  const credentials = seedingCredentials || DEFAULT_CREDENTIALS;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">      
      <div className="max-w-md w-full mx-4 space-y-6">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Plane className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">CrewTech</h1>
          <p className="text-gray-600 mt-2">Business Aviation Crew Management Platform</p>
        </div>

        {/* System Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">Local Authentication Mode</h3>
                <p className="text-xs text-blue-700 mt-1">
                  The system is now running with local authentication. Use the test accounts below to sign in directly without requiring external database setup.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Connecting...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Test Credentials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Test Accounts</span>
              <Badge className="bg-green-100 text-green-800">Ready to Use</Badge>
            </CardTitle>
            <p className="text-sm text-gray-600">
              Click "Use" to automatically fill the login form with the selected account credentials.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Admin Account */}
            <div className="border rounded-lg p-3 bg-blue-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                  <Badge className="bg-blue-100 text-blue-800">Administrator</Badge>
                  <span className="text-sm font-medium">{credentials.admin.name}</span>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyCredentials(credentials.admin)}
                    className="h-7 w-7 p-0"
                    title="Copy credentials"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => quickLogin(credentials.admin.email, credentials.admin.password)}
                    className="h-7 px-2 text-xs"
                  >
                    Use
                  </Button>
                </div>
              </div>
              <div className="text-xs space-y-1 text-gray-600">
                <div><strong>Email:</strong> {credentials.admin.email}</div>
                <div><strong>Password:</strong> {credentials.admin.password}</div>
                <div className="text-blue-700"><strong>Access:</strong> Full management, missions, crew</div>
              </div>
            </div>

            {/* Internal Staff Account */}
            <div className="border rounded-lg p-3 bg-green-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-green-600" />
                  <Badge className="bg-green-100 text-green-800">Internal Staff</Badge>
                  <span className="text-sm font-medium">{credentials.internal.name}</span>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyCredentials(credentials.internal)}
                    className="h-7 w-7 p-0"
                    title="Copy credentials"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => quickLogin(credentials.internal.email, credentials.internal.password)}
                    className="h-7 px-2 text-xs"
                  >
                    Use
                  </Button>
                </div>
              </div>
              <div className="text-xs space-y-1 text-gray-600">
                <div><strong>Email:</strong> {credentials.internal.email}</div>
                <div><strong>Password:</strong> {credentials.internal.password}</div>
                <div className="text-green-700"><strong>Access:</strong> Freelancer interface, internal employee</div>
              </div>
            </div>

            {/* Freelancer Accounts */}
            <div className="border rounded-lg p-3 bg-purple-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Plane className="h-4 w-4 text-purple-600" />
                  <Badge className="bg-purple-100 text-purple-800">Freelancers</Badge>
                  <span className="text-sm font-medium">{credentials.freelancers.length} accounts</span>
                </div>
              </div>
              <div className="space-y-2">
                {credentials.freelancers.slice(0, 2).map((freelancer, index) => (
                  <div key={index} className="bg-white rounded p-2 border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{freelancer.name}</span>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCredentials(freelancer)}
                          className="h-6 w-6 p-0"
                          title="Copy credentials"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => quickLogin(freelancer.email, freelancer.password)}
                          className="h-6 px-2 text-xs"
                        >
                          Use
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs space-y-0.5 text-gray-600">
                      <div>{freelancer.email} / {freelancer.password}</div>
                      <div className="text-purple-700">{freelancer.role}</div>
                    </div>
                  </div>
                ))}
                {credentials.freelancers.length > 2 && (
                  <div className="text-xs text-gray-500 text-center py-1">
                    +{credentials.freelancers.length - 2} other freelancer accounts available
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Welcome Message */}
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="p-6">
            <h3 className="font-bold mb-2">Welcome to CrewTech</h3>
            <p className="text-sm text-blue-100">
              Business aviation crew management platform running in local mode. 
              Manage your missions, crews and planning with ease.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}