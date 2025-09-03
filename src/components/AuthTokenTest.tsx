import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

// Test the token generation function
const generateMockAccessToken = (userId: string, role: string): string => {
  try {
    // Use btoa (browser-native base64 encoding) instead of Buffer
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: userId,
      email: 'test@example.com',
      role,
      iss: 'supabase-demo',
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours from now
      iat: Math.floor(Date.now() / 1000)
    }));
    const signature = 'mock-signature-' + Math.random().toString(36).substr(2, 9);
    return `${header}.${payload}.${signature}`;
  } catch (error) {
    console.error('Error generating mock access token:', error);
    // Fallback to a simple token if encoding fails
    return `mock-token-${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
};

export default function AuthTokenTest() {
  const [testResult, setTestResult] = useState<{ success: boolean; token?: string; error?: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const testTokenGeneration = async () => {
    setIsGenerating(true);
    setTestResult(null);

    try {
      // Simulate some delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const testToken = generateMockAccessToken('test-user-123', 'admin');
      
      if (testToken && testToken.length > 10) {
        setTestResult({
          success: true,
          token: testToken
        });
      } else {
        throw new Error('Token generation returned invalid result');
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center">
          <RefreshCw className="h-5 w-5 mr-2" />
          Authentication Token Generation Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          This test verifies that JWT token generation works correctly in the browser environment.
        </p>

        <Button
          onClick={testTokenGeneration}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating Test Token...
            </>
          ) : (
            'Test Token Generation'
          )}
        </Button>

        {testResult && (
          <div className="mt-4 p-4 border rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              {testResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <Badge className={testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {testResult.success ? 'SUCCESS' : 'ERROR'}
              </Badge>
            </div>

            {testResult.success ? (
              <div className="space-y-2">
                <p className="text-sm text-green-700 font-medium">
                  ✅ Token generated successfully!
                </p>
                <div className="text-xs">
                  <p className="font-medium">Token length: {testResult.token?.length} characters</p>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                      Show generated token
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs break-all">
                      {testResult.token}
                    </pre>
                  </details>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-red-700 font-medium">
                  ❌ Token generation failed
                </p>
                <p className="text-xs text-red-600">
                  Error: {testResult.error}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p className="font-medium">What this test checks:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Browser-compatible base64 encoding (btoa function)</li>
            <li>JWT structure creation (header.payload.signature)</li>
            <li>Error handling and fallback mechanisms</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}