"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings,
  User,
  Bell,
  Shield,
  Database,
  Mic,
  Languages,
  Save,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  badge: string;
  rank: string;
  station: string;
  phone?: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState({
    notifications: true,
    voiceInput: true,
    autoSave: true,
    darkMode: false,
    language: "en",
    voiceLanguage: "hi-IN",
    confidenceThreshold: 85,
  });

  const { toast } = useToast();
  const router = useRouter();

  // Fetch user profile and settings
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user profile
        const profileResponse = await fetch('/api/auth/me');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setUserProfile(profileData.user);
        } else {
          // Redirect to login if not authenticated
          router.push('/auth/signin');
          return;
        }

        // Get user settings (if they exist)
        const settingsResponse = await fetch('/api/user/settings');
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          setSettings(prev => ({ ...prev, ...settingsData.settings }));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: "Error",
          description: "Failed to load user data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router, toast]);

  const handleProfileUpdate = async (formData: Partial<UserProfile>) => {
    if (!userProfile) return;

    setSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUserProfile(updatedUser.user);
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSettingsSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        toast({
          title: "Settings Saved",
          description: "Your preferences have been updated successfully.",
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <header className="flex items-center gap-2 px-6 py-4 border-b border-border/40">
          <SidebarTrigger />
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure system preferences and user settings
            </p>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading settings...</span>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex flex-col h-screen">
        <header className="flex items-center gap-2 px-6 py-4 border-b border-border/40">
          <SidebarTrigger />
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure system preferences and user settings
            </p>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-muted-foreground">Please sign in to access settings.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-2 px-6 py-4 border-b border-border/40">
        <SidebarTrigger />
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure system preferences and user settings
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Tabs defaultValue="profile" className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="voice">Voice</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={userProfile?.name || ''}
                        onChange={(e) => setUserProfile(prev => prev ? {...prev, name: e.target.value} : null)}
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="badge">Badge Number</Label>
                      <Input
                        id="badge"
                        value={userProfile?.badge || ''}
                        disabled // Badge should not be editable
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Badge number cannot be changed
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="station">Police Station</Label>
                      <Input
                        id="station"
                        value={userProfile?.station || ''}
                        onChange={(e) => setUserProfile(prev => prev ? {...prev, station: e.target.value} : null)}
                        disabled={saving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rank">Rank</Label>
                      <Select
                        value={userProfile?.rank || 'CONSTABLE'}
                        onValueChange={(value) => setUserProfile(prev => prev ? {...prev, rank: value} : null)}
                        disabled={saving}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CONSTABLE">Constable</SelectItem>
                          <SelectItem value="HEAD_CONSTABLE">Head Constable</SelectItem>
                          <SelectItem value="ASI">ASI</SelectItem>
                          <SelectItem value="SUB_INSPECTOR">Sub Inspector</SelectItem>
                          <SelectItem value="INSPECTOR">Inspector</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userProfile?.email || ''}
                      disabled // Email should not be editable
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email address cannot be changed
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={userProfile?.phone || ''}
                      onChange={(e) => setUserProfile(prev => prev ? {...prev, phone: e.target.value} : null)}
                      disabled={saving}
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleProfileUpdate({
                        name: userProfile?.name,
                        station: userProfile?.station,
                        rank: userProfile?.rank,
                        phone: userProfile?.phone,
                      })}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Update Profile
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    System Preferences
                  </CardTitle>
                  <CardDescription>
                    Configure system behavior and interface settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable dark theme for better visibility in low light
                      </p>
                    </div>
                    <Switch
                      checked={settings.darkMode}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, darkMode: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-save</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically save FIR drafts while typing
                      </p>
                    </div>
                    <Switch
                      checked={settings.autoSave}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, autoSave: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive system notifications and updates
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, notifications: checked })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Interface Language</Label>
                    <Select
                      value={settings.language}
                      onValueChange={(value) =>
                        setSettings({ ...settings, language: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
                        <SelectItem value="mr">मराठी (Marathi)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>AI Confidence Threshold</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Minimum confidence level for AI suggestions (
                      {settings.confidenceThreshold}%)
                    </p>
                    <Input
                      type="range"
                      min="50"
                      max="100"
                      value={settings.confidenceThreshold}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          confidenceThreshold: parseInt(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="voice" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5" />
                    Voice Input Settings
                  </CardTitle>
                  <CardDescription>
                    Configure voice recognition and language preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Enable Voice Input</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow voice recording for FIR details
                      </p>
                    </div>
                    <Switch
                      checked={settings.voiceInput}
                      onCheckedChange={(checked) =>
                        setSettings({ ...settings, voiceInput: checked })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Voice Recognition Language</Label>
                    <Select
                      value={settings.voiceLanguage}
                      onValueChange={(value) =>
                        setSettings({ ...settings, voiceLanguage: value })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hi-IN">हिंदी (Hindi)</SelectItem>
                        <SelectItem value="en-IN">English (India)</SelectItem>
                        <SelectItem value="mr-IN">मराठी (Marathi)</SelectItem>
                        <SelectItem value="bn-IN">বাংলা (Bengali)</SelectItem>
                        <SelectItem value="ta-IN">தமிழ் (Tamil)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Microphone Test</Label>
                    <div className="flex gap-2">
                      <Button variant="outline">
                        <Mic className="h-4 w-4 mr-2" />
                        Test Microphone
                      </Button>
                      <Button variant="outline">Calibrate Audio</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Voice Commands</Label>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm mb-2 font-medium">
                        Available Commands:
                      </p>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• "Start recording" - Begin voice input</li>
                        <li>• "Stop recording" - End voice input</li>
                        <li>• "Clear text" - Clear current transcript</li>
                        <li>• "Generate FIR" - Process the recorded details</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                  <CardDescription>
                    Manage security preferences and access controls
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input id="current-password" type="password" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input id="new-password" type="password" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">
                      Confirm New Password
                    </Label>
                    <Input id="confirm-password" type="password" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline">Enable 2FA</Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Session Timeout</Label>
                    <Select defaultValue="30">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Access Log</Label>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm mb-2">Recent login activity:</p>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>• Today, 09:15 AM - Desktop (Current session)</p>
                        <p>• Yesterday, 17:30 PM - Mobile app</p>
                        <p>• Jan 14, 08:45 AM - Desktop</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Data Management
                  </CardTitle>
                  <CardDescription>
                    Manage your data, backups, and privacy settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Data Backup</Label>
                    <div className="flex gap-2">
                      <Button variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Backup Now
                      </Button>
                      <Button variant="outline">Restore Data</Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Last backup: January 15, 2024 at 2:30 AM
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Auto Backup Schedule</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Every Hour</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Data Retention</Label>
                    <Select defaultValue="1year">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6months">6 Months</SelectItem>
                        <SelectItem value="1year">1 Year</SelectItem>
                        <SelectItem value="2years">2 Years</SelectItem>
                        <SelectItem value="5years">5 Years</SelectItem>
                        <SelectItem value="permanent">Permanent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Export Data</Label>
                    <div className="flex gap-2">
                      <Button variant="outline">Export FIRs</Button>
                      <Button variant="outline">Export Case Laws</Button>
                      <Button variant="outline">Export All Data</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Privacy Settings</Label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Share usage analytics</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          Allow performance monitoring
                        </span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Enable crash reporting</span>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSettingsSave} disabled={saving} className="w-full md:w-auto">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving Settings...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save All Settings
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
