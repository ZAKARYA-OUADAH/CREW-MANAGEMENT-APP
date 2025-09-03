import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { 
  AlertTriangle,
  ExternalLink,
  Play,
  Zap,
  Copy
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import EdgeFunctionQuickTester from './EdgeFunctionQuickTester';
import EdgeFunctionHTTPTester from './EdgeFunctionHTTPTester';

const EdgeFunction404Alert: React.FC = () => {
  const [showTester, setShowTester] = useState(false);
  const [showHTTPTester, setShowHTTPTester] = useState(false);

  const copyDeployCode = () => {
    const code = `import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://nrvzifxdmllgcidfhlzh.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydnppZnhkbWxsZ2NpZGZobHpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjM5NjY5MCwiZXhwIjoyMDcxOTcyNjkwfQ.dCx1BUVy4K7YecsyNN5pAIJ_CKLgO-s5KM5WKIZQyWs'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE'
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const path = url.pathname

  try {
    if (path === '/make-server-9fd39b98/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        service: 'CrewTech Platform',
        message: 'Edge Function is working! 🎉'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      error: 'Route not found',
      available_routes: ['/make-server-9fd39b98/health']
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})`;

    navigator.clipboard.writeText(code);
    toast.success('Code copié ! Allez sur Dashboard Supabase pour le déployer.');
  };

  return (
    <>
      <Alert className="border-red-200 bg-red-50 animate-pulse">
        <AlertTriangle className="h-5 w-5 text-red-600" />
        <AlertDescription>
          <div className="space-y-3">
            <div>
              <strong className="text-red-800">🚨 ERREUR 404 DÉTECTÉE</strong>
              <p className="text-red-700 text-sm mt-1">
                Edge Function "make-server-9fd39b98" inexistante. Déploiement requis immédiatement.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Button 
                onClick={() => setShowHTTPTester(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
                size="sm"
              >
                <Play className="h-4 w-4 mr-2" />
                🌐 TEST HTTP
              </Button>
              
              <Button 
                onClick={() => setShowTester(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                size="sm"
              >
                <Zap className="h-4 w-4 mr-2" />
                🧪 DIAGNOSTIC
              </Button>
              
              <Button
                onClick={copyDeployCode}
                variant="outline"
                size="sm"
              >
                <Copy className="h-4 w-4 mr-2" />
                📋 COPIER CODE
              </Button>
              
              <Button
                onClick={() => window.open('https://supabase.com/dashboard/project/nrvzifxdmllgcidfhlzh/functions', '_blank')}
                variant="outline"
                size="sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                🚀 DÉPLOYER
              </Button>
            </div>

            <div className="bg-red-100 border border-red-200 rounded p-2 text-xs">
              <strong className="text-red-800">Instructions rapides:</strong>
              <ol className="text-red-700 mt-1 ml-4 list-decimal">
                <li>Cliquez "📋 COPIER CODE"</li>
                <li>Cliquez "🚀 DÉPLOYER" pour ouvrir Dashboard Supabase</li>
                <li>Créez fonction nommée "make-server-9fd39b98"</li>
                <li>Collez le code et déployez</li>
                <li>Cliquez "🌐 TEST HTTP" pour tester avec le code Figma/Make</li>
              </ol>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {showTester && (
        <EdgeFunctionQuickTester 
          onClose={() => setShowTester(false)}
        />
      )}

      {showHTTPTester && (
        <EdgeFunctionHTTPTester 
          onClose={() => setShowHTTPTester(false)}
        />
      )}
    </>
  );
};

export default EdgeFunction404Alert;