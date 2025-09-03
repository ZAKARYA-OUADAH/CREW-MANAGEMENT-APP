import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Textarea } from './ui/textarea';
import { 
  DollarSign, 
  Settings as SettingsIcon, 
  Bell, 
  Database, 
  Save,
  Plus,
  Trash2,
  Code,
  Languages,
  History,
  AlertCircle,
  Activity,
  Wrench
} from 'lucide-react';
import DatabaseSeeder from './DatabaseSeeder';
import DatabaseCleaner from './DatabaseCleaner';
import AuthDiagnostic from './AuthDiagnostic';
import NotificationHistory from './NotificationHistory';
import SupabaseConfigUpdater from './SupabaseConfigUpdater';
import AdvancedSupabaseDiagnostic from './AdvancedSupabaseDiagnostic';
import SupabaseKeysStatus from './SupabaseKeysStatus';
import SupabaseConnectionTest from './SupabaseConnectionTest';
import BuildHealthCheck from './BuildHealthCheck';
import DataSeeder from './DataSeeder';
import EdgeFunctionsDiagnostic from './EdgeFunctionsDiagnostic';
import SupabaseDeploymentGuide from './SupabaseDeploymentGuide';
import EdgeFunctionsLogAnalyzer from './EdgeFunctionsLogAnalyzer';
import SupabaseGlobalStatus from './SupabaseGlobalStatus';
import SmartEdgeFunctionsGuide from './SmartEdgeFunctionsGuide';
import AdvancedEdgeFunctionsDiagnostic from './AdvancedEdgeFunctionsDiagnostic';
import EdgeFunctionsMonitor from './EdgeFunctionsMonitor';
import QuickFixEdgeFunctions from './QuickFixEdgeFunctions';
import { 
  ConfigurationService,
  aircraftConfig,
  currencyConfig,
  positionConfig,
  companySettings
} from './ConfigurationService';

// Initialize pay matrix from ConfigurationService
const initializePayMatrix = () => {
  const matrix = [];
  let id = 1;
  
  for (const position of positionConfig) {
    for (const aircraft of aircraftConfig) {
      const dailyRate = ConfigurationService.getSalaryRate(position, aircraft.type, 'daily');
      const monthlyRate = ConfigurationService.getSalaryRate(position, aircraft.type, 'monthly');
      const perDiem = ConfigurationService.getPerDiem(position);
      
      if (dailyRate > 0) { // Only add if we have rates defined
        matrix.push({
          id: id.toString(),
          position,
          aircraft: aircraft.type,
          dailyRate,
          weeklyRate: dailyRate * 5, // Calculate weekly from daily
          monthlyRate,
          perDiem
        });
        id++;
      }
    }
  }
  
  return matrix;
};

const mockPayMatrix = initializePayMatrix();

export default function Settings() {
  const [payMatrix, setPayMatrix] = useState(mockPayMatrix);
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false,
      documentReminders: true,
      documentReminderCooldown: 24 // hours
    },
    integrations: {
      mint: true,
      leon: true,
      autoSync: true,
      syncInterval: 30
    },
    general: {
      currency: companySettings.defaultCurrency,
      timezone: companySettings.timezone,
      language: 'fr',
      companyName: companySettings.name,
      defaultPerDiem: companySettings.defaultPerDiem,
      defaultOwnerEmail: companySettings.defaultOwnerEmail
    }
  });

  const handlePayMatrixChange = (id: string, field: string, value: string | number) => {
    setPayMatrix(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addPayMatrixRow = () => {
    const newId = (payMatrix.length + 1).toString();
    const defaultPosition = positionConfig[0] || 'Captain';
    const defaultAircraft = aircraftConfig[0]?.type || 'Citation CJ3+';
    
    setPayMatrix(prev => [...prev, {
      id: newId,
      position: defaultPosition,
      aircraft: defaultAircraft,
      dailyRate: 0,
      weeklyRate: 0,
      monthlyRate: 0,
      perDiem: 0
    }]);
  };

  const deletePayMatrixRow = (id: string) => {
    setPayMatrix(prev => prev.filter(item => item.id !== id));
  };

  const handleSettingChange = (category: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const saveSettings = () => {
    console.log('Saving settings:', settings);
    console.log('Saving pay matrix:', payMatrix);
    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl text-gray-900">Settings</h1>
        <Button onClick={saveSettings} className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="pay-matrix" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="pay-matrix">Pay Matrix</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="notification-history">History</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="development">Development</TabsTrigger>
        </TabsList>

        {/* Pay Matrix Tab */}
        <TabsContent value="pay-matrix" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2" />
                    Pay Matrix Configuration
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Configure rates by position and aircraft type
                  </p>
                </div>
                <Button onClick={addPayMatrixRow} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Row
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Position</th>
                      <th className="text-left p-2">Aircraft</th>
                      <th className="text-left p-2">Daily Rate</th>
                      <th className="text-left p-2">Weekly Rate</th>
                      <th className="text-left p-2">Monthly Rate</th>
                      <th className="text-left p-2">Per Diem</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payMatrix.map((row) => (
                      <tr key={row.id} className="border-b">
                        <td className="p-2">
                          <Select 
                            value={row.position} 
                            onValueChange={(value) => handlePayMatrixChange(row.id, 'position', value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {positionConfig.map(position => (
                                <SelectItem key={position} value={position}>
                                  {position}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2">
                          <Select 
                            value={row.aircraft} 
                            onValueChange={(value) => handlePayMatrixChange(row.id, 'aircraft', value)}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {aircraftConfig.map(aircraft => (
                                <SelectItem key={aircraft.id} value={aircraft.type}>
                                  {aircraft.type} ({aircraft.immat})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={row.dailyRate}
                            onChange={(e) => handlePayMatrixChange(row.id, 'dailyRate', parseInt(e.target.value) || 0)}
                            className="w-24"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={row.weeklyRate}
                            onChange={(e) => handlePayMatrixChange(row.id, 'weeklyRate', parseInt(e.target.value) || 0)}
                            className="w-24"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={row.monthlyRate}
                            onChange={(e) => handlePayMatrixChange(row.id, 'monthlyRate', parseInt(e.target.value) || 0)}
                            className="w-24"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={row.perDiem}
                            onChange={(e) => handlePayMatrixChange(row.id, 'perDiem', parseInt(e.target.value) || 0)}
                            className="w-20"
                          />
                        </td>
                        <td className="p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePayMatrixRow(row.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-600">Receive notifications via email</p>
                </div>
                <Switch
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) => handleSettingChange('notifications', 'email', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-gray-600">Receive browser push notifications</p>
                </div>
                <Switch
                  checked={settings.notifications.push}
                  onCheckedChange={(checked) => handleSettingChange('notifications', 'push', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-gray-600">Receive notifications via SMS</p>
                </div>
                <Switch
                  checked={settings.notifications.sms}
                  onCheckedChange={(checked) => handleSettingChange('notifications', 'sms', checked)}
                />
              </div>
              
              <hr className="my-6" />
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Document Reminder Settings</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Document Missing Reminders</Label>
                    <p className="text-sm text-gray-600">Send reminders for missing crew documents</p>
                  </div>
                  <Switch
                    checked={settings.notifications.documentReminders}
                    onCheckedChange={(checked) => handleSettingChange('notifications', 'documentReminders', checked)}
                  />
                </div>
                
                {settings.notifications.documentReminders && (
                  <div className="space-y-2 ml-4 p-4 bg-gray-50 rounded-lg">
                    <Label>Reminder Cooldown Period</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={settings.notifications.documentReminderCooldown}
                        onChange={(e) => handleSettingChange('notifications', 'documentReminderCooldown', parseInt(e.target.value) || 24)}
                        className="w-20"
                        min="1"
                        max="168"
                      />
                      <span className="text-sm text-gray-600">hours</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Minimum time between reminder notifications for the same crew member to prevent spam. 
                      Default is 24 hours (1 day).
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification History Tab */}
        <TabsContent value="notification-history" className="space-y-4">
          <NotificationHistory />
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                System Integrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Mint Integration</Label>
                  <p className="text-sm text-gray-600">Sync crew data with Mint system</p>
                </div>
                <Switch
                  checked={settings.integrations.mint}
                  onCheckedChange={(checked) => handleSettingChange('integrations', 'mint', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Leon Integration</Label>
                  <p className="text-sm text-gray-600">Sync flight data with Leon system</p>
                </div>
                <Switch
                  checked={settings.integrations.leon}
                  onCheckedChange={(checked) => handleSettingChange('integrations', 'leon', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto Synchronization</Label>
                  <p className="text-sm text-gray-600">Automatically sync data at regular intervals</p>
                </div>
                <Switch
                  checked={settings.integrations.autoSync}
                  onCheckedChange={(checked) => handleSettingChange('integrations', 'autoSync', checked)}
                />
              </div>
              {settings.integrations.autoSync && (
                <div className="space-y-2">
                  <Label>Sync Interval (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.integrations.syncInterval}
                    onChange={(e) => handleSettingChange('integrations', 'syncInterval', parseInt(e.target.value) || 30)}
                    className="w-32"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="h-5 w-5 mr-2" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={settings.general.companyName}
                    onChange={(e) => handleSettingChange('general', 'companyName', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Select 
                    value={settings.general.currency} 
                    onValueChange={(value) => handleSettingChange('general', 'currency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyConfig.map(currency => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select 
                    value={settings.general.timezone} 
                    onValueChange={(value) => handleSettingChange('general', 'timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Per Diem</Label>
                  <Input
                    type="number"
                    value={settings.general.defaultPerDiem}
                    onChange={(e) => handleSettingChange('general', 'defaultPerDiem', parseInt(e.target.value) || 100)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Owner Email</Label>
                  <Input
                    type="email"
                    value={settings.general.defaultOwnerEmail}
                    onChange={(e) => handleSettingChange('general', 'defaultOwnerEmail', e.target.value)}
                    placeholder="owner@company.com"
                  />
                  <p className="text-xs text-gray-500">
                    Email address used by default for mission requests and approvals
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Development Tab */}
        <TabsContent value="development" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="h-5 w-5 mr-2" />
                Development Tools
              </CardTitle>
              <p className="text-sm text-gray-600">
                Tools for development and testing purposes
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Database className="h-4 w-4 mr-2" />
                  Configuration et Diagnostic Supabase
                </h3>
                <p className="text-sm text-gray-600">
                  Statut des clés, diagnostic complet et outils de configuration
                </p>
                
                {/* Statut global Supabase */}
                <SupabaseGlobalStatus autoRefresh={true} refreshInterval={30000} />
                
                {/* Monitoring temps réel Edge Functions */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2 flex items-center">
                    <Activity className="h-4 w-4 mr-2" />
                    Monitoring Edge Functions en Temps Réel
                  </h4>
                  <p className="text-sm text-green-800 mb-3">
                    Surveillance continue des Edge Functions avec métriques de performance et alertes automatiques.
                  </p>
                  <EdgeFunctionsMonitor autoStart={false} refreshInterval={10000} />
                </div>
                
                {/* Solutions rapides pour erreurs courantes */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                    <Wrench className="h-4 w-4 mr-2" />
                    Solutions Rapides (Erreurs 404/401)
                  </h4>
                  <p className="text-sm text-blue-800 mb-3">
                    Guides ciblés pour résoudre rapidement les erreurs courantes des Edge Functions.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <h5 className="text-sm font-medium text-blue-900 mb-2">Erreur 404 - Fonction non trouvée</h5>
                        <QuickFixEdgeFunctions errorType="404" />
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium text-blue-900 mb-2">Erreur 401 - Authentification</h5>
                        <QuickFixEdgeFunctions errorType="401" />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Guide intelligent de déploiement - Solution recommandée */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2 flex items-center">
                    <Code className="h-4 w-4 mr-2" />
                    Guide de Déploiement Intelligent (Complet)
                  </h4>
                  <p className="text-sm text-green-800 mb-3">
                    Solution pas-à-pas complète pour déployer les Edge Functions et résoudre tous les problèmes.
                  </p>
                  <SmartEdgeFunctionsGuide />
                </div>
                
                {/* Diagnostic spécialisé Edge Functions */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Diagnostic Avancé Edge Functions (Nouveau)
                  </h4>
                  <p className="text-sm text-red-800 mb-3">
                    Diagnostic ultra-détaillé avec analyse des erreurs 404/401 et solutions automatiques ciblées.
                  </p>
                  <AdvancedEdgeFunctionsDiagnostic />
                </div>
                
                {/* Diagnostic Edge Functions classique */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-medium text-orange-900 mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Diagnostic Edge Functions (Classique)
                  </h4>
                  <p className="text-sm text-orange-800 mb-3">
                    Diagnostic standard pour vérifier l'état des Edge Functions.
                  </p>
                  <EdgeFunctionsDiagnostic autoRun={false} />
                </div>
                
                {/* Guide de déploiement complet */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                    <Code className="h-4 w-4 mr-2" />
                    Guide de Déploiement Complet
                  </h4>
                  <p className="text-sm text-blue-800 mb-3">
                    Instructions détaillées pour déployer les Edge Functions sur Supabase avec toutes les commandes nécessaires.
                  </p>
                  <SupabaseDeploymentGuide />
                </div>
                
                {/* Analyseur de logs */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-900 mb-2 flex items-center">
                    <Code className="h-4 w-4 mr-2" />
                    Analyseur de Logs Edge Functions
                  </h4>
                  <p className="text-sm text-purple-800 mb-3">
                    Analysez les logs pour identifier automatiquement les problèmes et obtenir des solutions ciblées.
                  </p>
                  <EdgeFunctionsLogAnalyzer />
                </div>
                
                <BuildHealthCheck />
                <SupabaseKeysStatus />
                <SupabaseConnectionTest />
                <AdvancedSupabaseDiagnostic />
                <DataSeeder />
                <SupabaseConfigUpdater />
              </div>
              
              <hr className="my-6" />
              
              <AuthDiagnostic />
              <DatabaseSeeder />
              <DatabaseCleaner />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}