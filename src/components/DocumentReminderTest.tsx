import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { useSupabaseData } from './SupabaseDataProvider';
import { useDocumentNotifications, formatTimeRemaining, formatLastSentTime } from './DocumentNotificationService';
import { useAuth } from './AuthProvider';
import { 
  FileText, 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle,
  Play,
  RefreshCw
} from 'lucide-react';

export default function DocumentReminderTest() {
  const { crewMembers } = useSupabaseData();
  const { 
    canSendNotification, 
    getLastNotification, 
    getAllNotificationRecords,
    getNotificationStats 
  } = useDocumentNotifications();
  const { user } = useAuth();
  const [isManualTesting, setIsManualTesting] = useState(false);

  // Function to check for missing documents (same logic as DocumentReminderService)
  const checkMissingDocuments = (crewMember: any): string[] => {
    const missingFields: string[] = [];

    if (!crewMember.phone) missingFields.push('Téléphone');
    if (!crewMember.address) missingFields.push('Adresse');
    if (!crewMember.emergency_contact) missingFields.push('Contact d\'urgence');
    if (!crewMember.iban) missingFields.push('RIB/IBAN');
    if (!crewMember.passport_number) missingFields.push('Numéro de passeport');
    if (!crewMember.passport_expiry) missingFields.push('Date d\'expiration passeport');
    if (!crewMember.passport_country) missingFields.push('Pays du passeport');
    if (!crewMember.medical_certificate_expiry) missingFields.push('Certificat médical');
    if (!crewMember.license_expiry) missingFields.push('Licence de vol');
    
    if (crewMember.role === 'pilot') {
      if (!crewMember.qualifications?.includes('ATP')) missingFields.push('Qualification ATP');
    }
    if (crewMember.role === 'cabin_crew') {
      if (!crewMember.qualifications?.includes('Safety')) missingFields.push('Qualification Safety');
    }

    return missingFields;
  };

  // Get crew members with missing documents
  const crewWithMissingDocs = crewMembers
    .filter(crew => crew.role !== 'admin' && crew.status === 'active')
    .map(crew => ({
      ...crew,
      missingFields: checkMissingDocuments(crew),
      notificationStats: getNotificationStats(crew.id)
    }))
    .filter(crew => crew.missingFields.length > 0);

  // Trigger manual document check
  const triggerManualCheck = () => {
    setIsManualTesting(true);
    console.log('🔧 Triggering manual document check...');
    
    // Use the global function we exposed
    if (typeof window !== 'undefined' && window.triggerDocumentCheck) {
      window.triggerDocumentCheck();
    }
    
    setTimeout(() => {
      setIsManualTesting(false);
    }, 3000);
  };

  const allNotificationRecords = getAllNotificationRecords();

  if (user?.role !== 'admin') {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Cette page est réservée aux administrateurs.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900">Test Notifications Documents</h1>
          <p className="text-muted-foreground">
            Système de rappel automatique pour les documents manquants (toutes les 24h)
          </p>
        </div>
        <Button 
          onClick={triggerManualCheck}
          disabled={isManualTesting}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isManualTesting ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          Test Manuel
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Équipages avec docs manquants</p>
                <p className="text-2xl font-medium">{crewWithMissingDocs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total documents manquants</p>
                <p className="text-2xl font-medium">
                  {crewWithMissingDocs.reduce((total, crew) => total + crew.missingFields.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Notifications envoyées</p>
                <p className="text-2xl font-medium">{allNotificationRecords.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Crew Members with Missing Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Équipages avec Documents Manquants</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {crewWithMissingDocs.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Tous les documents sont complets!</h3>
              <p className="text-muted-foreground">Aucun équipage n'a de documents manquants.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {crewWithMissingDocs.map(crew => (
                <div key={crew.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium">{crew.name}</h4>
                        <Badge variant="outline">{crew.role}</Badge>
                        <Badge 
                          variant={crew.notificationStats.canSendNow ? "destructive" : "secondary"}
                        >
                          {crew.notificationStats.canSendNow ? "Peut envoyer" : "En cooldown"}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Documents manquants:</p>
                          <div className="flex flex-wrap gap-1">
                            {crew.missingFields.map(field => (
                              <Badge key={field} variant="outline" className="text-xs">
                                {field}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Notifications envoyées: </span>
                            <span className="font-medium">{crew.notificationStats.totalSent}</span>
                          </div>
                          {crew.notificationStats.lastSentAt && (
                            <div>
                              <span className="text-muted-foreground">Dernière notification: </span>
                              <span className="font-medium">
                                {formatLastSentTime(crew.notificationStats.lastSentAt)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {!crew.notificationStats.canSendNow && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Prochaine notification dans: </span>
                            <span className="font-medium text-orange-600">
                              {formatTimeRemaining(crew.notificationStats.nextAvailableIn)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Historique des Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allNotificationRecords.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Aucune notification envoyée pour le moment
            </div>
          ) : (
            <div className="space-y-3">
              {allNotificationRecords.slice(0, 10).map((record, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{record.crewName}</span>
                      <Badge variant="outline">#{record.notificationCount}</Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatLastSentTime(record.sentAt)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {record.missingDocs.map(doc => (
                      <Badge key={doc} variant="secondary" className="text-xs">
                        {doc}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Envoyé par: {record.sentByName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Testing Instructions */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>Instructions de test:</strong>
          <br />• Le système vérifie automatiquement toutes les 24h
          <br />• Utilisez le bouton "Test Manuel" pour déclencher une vérification immédiate
          <br />• Les notifications respectent un délai de 24h entre les envois
          <br />• Ouvrez la console pour voir les logs détaillés
        </AlertDescription>
      </Alert>
    </div>
  );
}