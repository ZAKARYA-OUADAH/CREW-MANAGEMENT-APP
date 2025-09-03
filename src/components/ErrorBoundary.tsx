import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="h-6 w-6" />
                <span>Erreur de l'application</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <Bug className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Une erreur inattendue s'est produite dans l'application CrewTech.
                </AlertDescription>
              </Alert>

              {this.state.error && (
                <div className="space-y-2">
                  <h3 className="font-medium">Détails de l'erreur :</h3>
                  <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                    <div className="text-red-600 font-medium">
                      {this.state.error.name}: {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                          Voir la stack trace
                        </summary>
                        <pre className="mt-2 text-xs overflow-auto max-h-40">
                          {this.state.error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}

              {this.state.errorInfo && (
                <div className="space-y-2">
                  <h3 className="font-medium">Informations du composant :</h3>
                  <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                    <pre className="overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <Button onClick={this.handleRefresh} className="flex items-center space-x-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>Recharger la page</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={this.handleReset}
                  className="flex items-center space-x-2"
                >
                  <span>Réessayer</span>
                </Button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Que faire maintenant ?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Essayez de recharger la page</li>
                  <li>• Vérifiez votre connexion internet</li>
                  <li>• Contactez l'administrateur si le problème persiste</li>
                  <li>• Vérifiez la console du navigateur pour plus de détails</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;