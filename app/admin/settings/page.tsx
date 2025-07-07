'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { 
  Settings, 
  Shield, 
  Database, 
  Bell, 
  Mail,
  Globe,
  Key,
  Users,
  AlertTriangle,
  CheckCircle,
  Save,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'

interface SystemSettings {
  maintenanceMode: boolean
  registrationEnabled: boolean
  emailNotifications: boolean
  maxFileSize: number
  sessionTimeout: number
  backupEnabled: boolean
  analyticsEnabled: boolean
  debugMode: boolean
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    maxFileSize: 10,
    sessionTimeout: 24,
    backupEnabled: true,
    analyticsEnabled: true,
    debugMode: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSecrets, setShowSecrets] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const supabase = createClient()
      
      // Fetch settings from database
      const { data: settingsData, error } = await supabase
        .from('system_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      if (settingsData) {
        setSettings({
          maintenanceMode: settingsData.maintenance_mode || false,
          registrationEnabled: settingsData.registration_enabled ?? true,
          emailNotifications: settingsData.email_notifications ?? true,
          maxFileSize: settingsData.max_file_size || 10,
          sessionTimeout: settingsData.session_timeout || 24,
          backupEnabled: settingsData.backup_enabled ?? true,
          analyticsEnabled: settingsData.analytics_enabled ?? true,
          debugMode: settingsData.debug_mode || false
        })
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching settings:', error)
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const supabase = createClient()
      
      // Save settings to database
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          id: 1, // Use a fixed ID for system settings
          maintenance_mode: settings.maintenanceMode,
          registration_enabled: settings.registrationEnabled,
          email_notifications: settings.emailNotifications,
          max_file_size: settings.maxFileSize,
          session_timeout: settings.sessionTimeout,
          backup_enabled: settings.backupEnabled,
          analytics_enabled: settings.analyticsEnabled,
          debug_mode: settings.debugMode,
          updated_at: new Date().toISOString()
        })

      if (error) throw error
      
      toast.success({
        title: 'Success',
        description: 'Settings saved successfully!'
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error({
        title: 'Error',
        description: 'Error saving settings'
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleSetting = (key: keyof SystemSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const updateSetting = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground">System configuration and preferences</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground">System configuration and preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Connected</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Supabase PostgreSQL</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Service
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Active</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Resend SMTP</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="h-4 w-4" />
              API Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Online</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">All endpoints healthy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Secure</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">SSL/TLS enabled</p>
          </CardContent>
        </Card>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>Basic system configuration options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Maintenance Mode</h4>
                  <p className="text-sm text-gray-500">Temporarily disable user access</p>
                </div>
                <Button
                  variant={settings.maintenanceMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSetting('maintenanceMode')}
                >
                  {settings.maintenanceMode ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">User Registration</h4>
                  <p className="text-sm text-gray-500">Allow new user signups</p>
                </div>
                <Button
                  variant={settings.registrationEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSetting('registrationEnabled')}
                >
                  {settings.registrationEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-gray-500">Send system notifications</p>
                </div>
                <Button
                  variant={settings.emailNotifications ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSetting('emailNotifications')}
                >
                  {settings.emailNotifications ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Analytics</h4>
                  <p className="text-sm text-gray-500">Collect usage analytics</p>
                </div>
                <Button
                  variant={settings.analyticsEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSetting('analyticsEnabled')}
                >
                  {settings.analyticsEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Max File Size (MB)</label>
                <Input
                  type="number"
                  value={settings.maxFileSize}
                  onChange={(e) => updateSetting('maxFileSize', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Session Timeout (hours)</label>
                <Input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Auto Backup</h4>
                  <p className="text-sm text-gray-500">Daily database backups</p>
                </div>
                <Button
                  variant={settings.backupEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSetting('backupEnabled')}
                >
                  {settings.backupEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Debug Mode</h4>
                  <p className="text-sm text-gray-500">Show detailed error logs</p>
                </div>
                <Button
                  variant={settings.debugMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSetting('debugMode')}
                >
                  {settings.debugMode ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>Authentication and security configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Password Policy</label>
                <select className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option>Minimum 8 characters</option>
                  <option>Minimum 12 characters</option>
                  <option>Complex requirements</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Two-Factor Authentication</label>
                <select className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option>Optional</option>
                  <option>Required for admins</option>
                  <option>Required for all users</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Rate Limiting</label>
                <select className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option>Standard (100 req/min)</option>
                  <option>Strict (50 req/min)</option>
                  <option>Relaxed (200 req/min)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Session Management</label>
                <select className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option>Single session per user</option>
                  <option>Multiple sessions allowed</option>
                  <option>Device-based sessions</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">IP Whitelist</label>
                <Input
                  placeholder="192.168.1.0/24, 10.0.0.0/8"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty to allow all IPs</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Audit Logging</h4>
                  <p className="text-sm text-gray-500">Log all admin actions</p>
                </div>
                <Button variant="default" size="sm">
                  Enabled
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Configuration
          </CardTitle>
          <CardDescription>API keys and webhook settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">API Rate Limit</label>
                <select className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option>1000 requests/hour</option>
                  <option>500 requests/hour</option>
                  <option>2000 requests/hour</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Webhook URL</label>
                <Input
                  placeholder="https://your-domain.com/webhook"
                  className="mt-1"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">API Documentation</h4>
                  <p className="text-sm text-gray-500">Public API docs</p>
                </div>
                <Button variant="outline" size="sm">
                  View Docs
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">API Key</label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type={showSecrets ? "text" : "password"}
                    value="sk_live_1234567890abcdef"
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSecrets(!showSecrets)}
                  >
                    {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Webhook Secret</label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type={showSecrets ? "text" : "password"}
                    value="whsec_abcdef1234567890"
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSecrets(!showSecrets)}
                  >
                    {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Regenerate Keys</h4>
                  <p className="text-sm text-gray-500">Create new API keys</p>
                </div>
                <Button variant="outline" size="sm">
                  Regenerate
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>Configure system notifications and alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">System Alerts</h4>
                  <p className="text-sm text-gray-500">Critical system notifications</p>
                </div>
                <Button variant="default" size="sm">
                  Enabled
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Error Reports</h4>
                  <p className="text-sm text-gray-500">Application error notifications</p>
                </div>
                <Button variant="default" size="sm">
                  Enabled
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">User Activity</h4>
                  <p className="text-sm text-gray-500">New user registrations</p>
                </div>
                <Button variant="outline" size="sm">
                  Disabled
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Order Notifications</h4>
                  <p className="text-sm text-gray-500">New order alerts</p>
                </div>
                <Button variant="default" size="sm">
                  Enabled
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Backup Alerts</h4>
                  <p className="text-sm text-gray-500">Database backup status</p>
                </div>
                <Button variant="default" size="sm">
                  Enabled
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Security Alerts</h4>
                  <p className="text-sm text-gray-500">Failed login attempts</p>
                </div>
                <Button variant="default" size="sm">
                  Enabled
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <h4 className="font-medium text-red-900">Clear All Data</h4>
              <p className="text-sm text-red-700">Permanently delete all user data and orders</p>
            </div>
            <Button variant="destructive" size="sm">
              Clear Data
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <h4 className="font-medium text-red-900">Reset System</h4>
              <p className="text-sm text-red-700">Reset all settings to default values</p>
            </div>
            <Button variant="destructive" size="sm">
              Reset System
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <h4 className="font-medium text-red-900">Delete System</h4>
              <p className="text-sm text-red-700">Completely remove the application</p>
            </div>
            <Button variant="destructive" size="sm">
              Delete System
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 