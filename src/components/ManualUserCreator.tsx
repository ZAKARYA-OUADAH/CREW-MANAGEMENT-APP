import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  UserPlus, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ManualUserCreatorProps {
  onUserCreated?: (userEmail: string) => void;
}

export default function ManualUserCreator({ onUserCreated }: ManualUserCreatorProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'freelancer'
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setResult(null);

    try {
      // Validate form
      if (!formData.email || !formData.password || !formData.name) {
        setResult({
          success: false,
          message: 'All fields are required'
        });
        return;
      }

      // Call the signup endpoint
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-9fd39b98/auth/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            role: formData.role,
            type: formData.role
          })
        }
      );

      const data = await response.json();

      if (response.ok && !data.error) {
        setResult({
          success: true,
          message: `User ${formData.email} created successfully`,
          details: data.user
        });

        // Reset form
        setFormData({
          email: '',
          password: '',
          name: '',
          role: 'freelancer'
        });

        if (onUserCreated) {
          onUserCreated(formData.email);
        }
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to create user',
          details: data
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: 'Network error: ' + error.message,
        details: error
      });
    } finally {
      setIsCreating(false);
    }
  };

  const fillTestUser = (userType: 'admin' | 'internal' | 'freelancer') => {
    const testUsers = {
      admin: {
        email: 'admin@crewtech.fr',
        password: 'admin123!',
        name: 'Sophie Laurent',
        role: 'admin'
      },
      internal: {
        email: 'internal@crewtech.fr',
        password: 'internal123!',
        name: 'Pierre Dubois',
        role: 'internal'
      },
      freelancer: {
        email: 'freelancer@aviation.com',
        password: 'freelancer123!',
        name: 'Lisa Anderson',
        role: 'freelancer'
      }
    };

    setFormData(testUsers[userType]);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserPlus className="h-5 w-5" />
          <span>Manual User Creation</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Create individual user accounts manually
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="user@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="freelancer">Freelancer</option>
              <option value="internal">Internal</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating User...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Create User
              </>
            )}
          </Button>
        </form>

        {/* Quick fill buttons */}
        <div className="space-y-2">
          <Label className="text-sm">Quick Fill Test Users:</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fillTestUser('admin')}
            >
              Admin
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fillTestUser('internal')}
            >
              Internal
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fillTestUser('freelancer')}
            >
              Freelancer
            </Button>
          </div>
        </div>

        {result && (
          <Alert className={result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
              <strong>{result.success ? 'Success!' : 'Error:'}</strong>
              <div className="mt-1">{result.message}</div>
              {result.details && (
                <details className="mt-2">
                  <summary className="text-xs cursor-pointer">View details</summary>
                  <pre className="text-xs mt-1 p-2 bg-black/5 rounded overflow-auto max-h-32">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}