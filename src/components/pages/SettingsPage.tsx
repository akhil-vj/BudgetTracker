import { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Lock, 
  Bell, 
  Palette, 
  Globe, 
  CreditCard, 
  Shield, 
  Download,
  Printer,
  Trash2,
  Moon,
  Camera,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Eye,
  EyeOff,
  Check,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { usePreferences, CurrencyCode, DateFormatType, TimezoneType } from '@/contexts/PreferencesContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency, currencyNames } from '@/lib/currency';
import { dateFormatNames, timezoneNames, formatDate } from '@/lib/date';
import { generatePDF, generatePrintReport } from '@/lib/pdfExport';
import { EmptyState } from '@/components/ui/empty-state';

interface SettingsPageProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

export function SettingsPage({ activeTab = 'profile', onTabChange }: SettingsPageProps) {
  const { toast } = useToast();
  const { 
    preferences, 
    profile, 
    subscription,
    isLoading,
    updatePreferences,
    updateProfile,
    uploadAvatar,
  } = usePreferences();
  const { isAuthenticated, updatePassword, signOut, deleteAccount, user } = useAuth();
  const { pushStatus, requestPushPermission, disablePushNotifications } = useNotificationSettings();
  const { transactions } = useTransactions();
  
  const [authLoading, setAuthLoading] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    location: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Delete account state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Plan upgrade dialog
  const [showPlanDialog, setShowPlanDialog] = useState(false);

  // Notification states
  const [notificationLoading, setNotificationLoading] = useState(false);

  // Initialize profile form when profile loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber,
        location: profile.location,
      });
    }
  }, [profile]);

  // Handle profile photo upload
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 2MB.",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a JPG, PNG, or GIF image.",
        variant: "destructive",
      });
      return;
    }

    const result = await uploadAvatar(file);
    if (result) {
      toast({
        title: "Photo updated",
        description: "Your profile photo has been updated successfully.",
      });
    }
  };

  // Handle profile save
  const handleProfileSave = async () => {
    setProfileSaving(true);
    await updateProfile({
      firstName: profileForm.firstName,
      lastName: profileForm.lastName,
      phoneNumber: profileForm.phoneNumber,
      location: profileForm.location,
    });
    setProfileSaving(false);
    toast({
      title: "Profile updated",
      description: "Your profile information has been saved successfully.",
    });
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match.",
        variant: "destructive",
      });
      return;
    }

    setPasswordSaving(true);
    const { error } = await updatePassword(passwordForm.newPassword);
    setPasswordSaving(false);

    if (!error) {
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast({
        title: "Confirmation required",
        description: "Please type DELETE to confirm account deletion.",
        variant: "destructive",
      });
      return;
    }

    setAuthLoading(true);
    try {
      const success = await deleteAccount();
      setAuthLoading(false);
      
      if (success) {
        setShowDeleteDialog(false);
        setDeleteConfirmText('');
        toast({
          title: "Account deleted",
          description: "Your account and all associated data have been permanently deleted.",
        });
        // Redirect to home page after deletion
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      }
    } catch (error) {
      setAuthLoading(false);
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get password strength
  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { label: '', color: '' };
    if (password.length < 8) return { label: 'Weak', color: 'text-expense' };
    if (password.length < 12) return { label: 'Medium', color: 'text-yellow-500' };
    return { label: 'Strong', color: 'text-income' };
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated && !isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <EmptyState
          icon={User}
          title="Sign in to access settings"
          description="You need to be logged in to view and manage your account settings."
          actionLabel="Sign in"
          onAction={() => window.location.href = '/auth'}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayProfile = {
    firstName: profileForm.firstName || profile?.firstName || '',
    lastName: profileForm.lastName || profile?.lastName || '',
    email: profile?.email || '',
    phoneNumber: profileForm.phoneNumber || profile?.phoneNumber || '',
    location: profileForm.location || profile?.location || '',
    avatarUrl: profile?.avatarUrl || '',
  };

  const initials = `${displayProfile.firstName?.[0] || ''}${displayProfile.lastName?.[0] || ''}`.toUpperCase() || 'U';
  const passwordStrength = getPasswordStrength(passwordForm.newPassword);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl px-4 sm:px-0">
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="mb-4 sm:mb-6 flex flex-wrap h-auto gap-1 w-full justify-start">
          <TabsTrigger value="profile" className="gap-2 text-xs sm:text-sm flex-1 sm:flex-initial min-w-0">
            <User className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden md:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 text-xs sm:text-sm flex-1 sm:flex-initial min-w-0">
            <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden md:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2 text-xs sm:text-sm flex-1 sm:flex-initial min-w-0">
            <Palette className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden md:inline">Preferences</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2 text-xs sm:text-sm flex-1 sm:flex-initial min-w-0">
            <CreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden md:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2 text-xs sm:text-sm flex-1 sm:flex-initial min-w-0">
            <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden md:inline">Data & Privacy</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Profile Information</CardTitle>
              <CardDescription className="text-sm">Update your personal details and profile picture.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
              {/* Avatar Section */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <Avatar className="w-20 h-20 sm:w-20 sm:h-20">
                  <AvatarImage src={displayProfile.avatarUrl} />
                  <AvatarFallback className="text-xl bg-gradient-to-br from-primary to-[hsl(199,89%,48%)] text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2 text-center sm:text-left">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/jpeg,image/png,image/gif"
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 w-full sm:w-auto"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-4 h-4" />
                    Change Photo
                  </Button>
                  <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileForm.firstName || profile?.firstName || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileForm.lastName || profile?.lastName || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={displayProfile.email}
                    disabled
                    className="pl-10 bg-muted"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    value={profileForm.phoneNumber || profile?.phoneNumber || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={profileForm.location || profile?.location || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                    placeholder="Kerala, India"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  variant="gradient" 
                  onClick={handleProfileSave}
                  disabled={profileSaving}
                  className="w-full sm:w-auto"
                >
                  {profileSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Change Password</CardTitle>
              <CardDescription className="text-sm">Update your password to keep your account secure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Enter new password (min 8 characters)"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {passwordForm.newPassword && (
                  <p className={`text-xs ${passwordStrength.color}`}>
                    Password strength: {passwordStrength.label}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Confirm your new password"
                />
                {passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword && (
                  <p className="text-xs text-income flex items-center gap-1">
                    <Check className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>
              <div className="flex justify-end">
                <Button 
                  variant="gradient" 
                  onClick={handlePasswordChange}
                  disabled={passwordSaving || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  className="w-full sm:w-auto"
                >
                  {passwordSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication - Hidden for now
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Two-Factor Authentication</CardTitle>
              <CardDescription className="text-sm">Add an extra layer of security to your account.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <p className="font-medium text-foreground">Enable 2FA</p>
                  <p className="text-sm text-muted-foreground">
                    Use an authenticator app to generate one-time codes.
                  </p>
                </div>
                <Switch disabled className="flex-shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Coming soon</p>
            </CardContent>
          </Card>
          */}

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Active Sessions</CardTitle>
              <CardDescription className="text-sm">Manage your active sessions across devices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-secondary/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Current Browser</p>
                    <p className="text-sm text-muted-foreground">Current session</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-income border-income/30">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Session management coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4 sm:space-y-6">
          {/* Appearance Section - Hidden for now
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Appearance</CardTitle>
              <CardDescription className="text-sm">Customize how the app looks and feels.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-4 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Moon className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">Dark Mode</p>
                      <Badge variant="secondary" className="text-xs">Light Mode Coming Soon</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Use dark theme across the app</p>
                  </div>
                </div>
                <Switch 
                  disabled
                  checked={true}
                  className="flex-shrink-0"
                />
              </div>
            </CardContent>
          </Card>
          */}

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Regional Settings</CardTitle>
              <CardDescription className="text-sm">Set your preferred currency and date format.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select 
                    value={preferences.currency}
                    onValueChange={(value: CurrencyCode) => updatePreferences({ currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(currencyNames).map(([code, name]) => (
                        <SelectItem key={code} value={code}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select 
                    value={preferences.dateFormat}
                    onValueChange={(value: DateFormatType) => updatePreferences({ dateFormat: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(dateFormatNames).map(([format, name]) => (
                        <SelectItem key={format} value={format}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Timezone - Hidden for now
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select 
                  value={preferences.timezone}
                  onValueChange={(value: TimezoneType) => updatePreferences({ timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(timezoneNames).map(([tz, name]) => (
                      <SelectItem key={tz} value={tz}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              */}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Notifications</CardTitle>
              <CardDescription className="text-sm">Configure how you receive notifications and alerts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              {/* Push Notifications */}
              <div className="flex items-start justify-between gap-3 py-2">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <p className="font-medium text-foreground">Push notifications</p>
                  <p className="text-sm text-muted-foreground">Receive instant alerts on this device</p>
                  {pushStatus.isSupported ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Status: {pushStatus.isSubscribed ? '✓ Enabled' : 'Disabled'}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      Not supported in your browser
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {preferences.notificationsPush && pushStatus.isSupported && !pushStatus.isSubscribed ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        setNotificationLoading(true);
                        const success = await requestPushPermission();
                        setNotificationLoading(false);
                        if (success) {
                          await updatePreferences({ notificationsPush: true });
                        }
                      }}
                      disabled={notificationLoading || pushStatus.isLoading}
                    >
                      {notificationLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Enable
                    </Button>
                  ) : (
                    <Switch
                      checked={preferences.notificationsPush && pushStatus.isSubscribed}
                      disabled={!pushStatus.isSupported || notificationLoading || pushStatus.isLoading}
                      onCheckedChange={async (checked) => {
                        if (checked) {
                          setNotificationLoading(true);
                          const success = await requestPushPermission();
                          setNotificationLoading(false);
                          if (success) {
                            await updatePreferences({ notificationsPush: true });
                          }
                        } else {
                          setNotificationLoading(true);
                          await disablePushNotifications();
                          setNotificationLoading(false);
                          await updatePreferences({ notificationsPush: false });
                        }
                      }}
                    />
                  )}
                </div>
              </div>
              <Separator />

              {/* Email Notifications */}
              <div className="flex items-start justify-between gap-3 py-2">
                <div className="space-y-0.5 flex-1 min-w-0">
                  <p className="font-medium text-foreground">Email notifications</p>
                  <p className="text-sm text-muted-foreground">Receive email updates and summaries</p>
                </div>
                <Switch
                  checked={preferences.notificationsEmail}
                  onCheckedChange={(checked) => updatePreferences({ notificationsEmail: checked })}
                  className="flex-shrink-0"
                />
              </div>

              {/* Browser Permission Info */}
              {pushStatus.isSupported && pushStatus.permissionStatus === 'denied' && (
                <div className="mt-4 p-3 bg-expense/10 border border-expense/20 rounded-lg flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-expense flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-expense">Push Notifications Blocked</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      You've blocked notifications for this site. Please enable them in your browser settings to receive alerts.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Current Plan</CardTitle>
              <CardDescription className="text-sm">Manage your subscription and billing.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-gradient-to-r from-primary/10 to-[hsl(199,89%,48%)]/10 rounded-lg border border-primary/20">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-foreground capitalize">{subscription?.planName || 'Free'} Plan</h3>
                    <Badge className="bg-primary/20 text-primary hover:bg-primary/30">
                      {subscription?.status || 'Active'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {subscription?.planName === 'pro' 
                      ? `${formatCurrency(1, preferences.currency)}/month • Renews ${subscription?.nextBillingDate ? formatDate(subscription.nextBillingDate, preferences.dateFormat) : 'N/A'}`
                      : 'Free forever • Upgrade to Pro for more features'
                    }
                  </p>
                </div>
                <Button variant="outline" onClick={() => setShowPlanDialog(true)} className="w-full sm:w-auto">
                  {subscription?.planName === 'pro' ? 'Manage Plan' : 'Upgrade to Pro'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Pro Plan Features</CardTitle>
              <CardDescription className="text-sm">Just {formatCurrency(1, preferences.currency)}/month</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ul className="space-y-2">
                {[
                  'Unlimited transactions',
                  'Advanced AI predictions',
                  'Priority support',
                  'Export to PDF/Excel',
                  'Custom categories',
                  'Multiple payment methods tracking',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-income flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Billing History</CardTitle>
              <CardDescription className="text-sm">View and download your invoices.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No billing history yet</p>
                <p className="text-sm">Your invoices will appear here after your first payment</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data & Privacy Tab */}
        <TabsContent value="data" className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Privacy Settings</CardTitle>
              <CardDescription className="text-sm">Control how your data is used.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="grid gap-4 md:grid-cols-1 md:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground">Export Data</p>
                    <p className="text-sm text-muted-foreground">Print your financial data</p>
                  </div>
                  <div className="flex gap-2 flex-col sm:flex-row w-full sm:w-auto">
                    {/* <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        try {
                          // Calculate summary data
                          const expenses = transactions.filter(t => t.type === 'expense');
                          const income = transactions.filter(t => t.type === 'income');
                          
                          const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
                          const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
                          const totalSavings = totalIncome - totalExpenses;

                          // Group transactions by category for table
                          const expensesByCategory: Record<string, number> = {};
                          expenses.forEach(t => {
                            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
                          });

                          const categoryRows = Object.entries(expensesByCategory)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 10)
                            .map(([category, amount]) => [
                              category,
                              formatCurrency(amount, preferences.currency),
                            ]);

                          // Generate PDF
                          generatePDF({
                            title: 'Financial Data Export',
                            subtitle: `Generated on ${formatDate(new Date().toISOString().split('T')[0], preferences.dateFormat)}`,
                            summaryCards: [
                              { label: 'Total Income', value: formatCurrency(totalIncome, preferences.currency) },
                              { label: 'Total Expenses', value: formatCurrency(totalExpenses, preferences.currency) },
                              { label: 'Net Savings', value: formatCurrency(totalSavings, preferences.currency) },
                            ],
                            tables: [
                              {
                                title: 'Top Expense Categories',
                                headers: ['Category', 'Amount'],
                                rows: categoryRows,
                              },
                            ],
                            filename: `financial-data-${new Date().toISOString().split('T')[0]}.pdf`,
                            accentColor: [37, 99, 235],
                          });

                          toast({
                            title: "Export Successful",
                            description: "Your financial data has been downloaded as PDF",
                          });
                        } catch (error) {
                          toast({
                            title: "Export Failed",
                            description: "Unable to generate PDF. Please try again.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button> */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        try {
                          // Calculate summary data
                          const expenses = transactions.filter(t => t.type === 'expense');
                          const income = transactions.filter(t => t.type === 'income');
                          
                          const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
                          const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
                          const totalSavings = totalIncome - totalExpenses;

                          // Group transactions by category for table
                          const expensesByCategory: Record<string, number> = {};
                          expenses.forEach(t => {
                            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
                          });

                          const categoryRows = Object.entries(expensesByCategory)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 10)
                            .map(([category, amount]) => [
                              category,
                              formatCurrency(amount, preferences.currency),
                            ]);

                          // Generate printable report
                          generatePrintReport({
                            title: 'Financial Data Report',
                            subtitle: `Generated on ${formatDate(new Date().toISOString().split('T')[0], preferences.dateFormat)}`,
                            summaryCards: [
                              { label: 'Total Income', value: formatCurrency(totalIncome, preferences.currency) },
                              { label: 'Total Expenses', value: formatCurrency(totalExpenses, preferences.currency) },
                              { label: 'Net Savings', value: formatCurrency(totalSavings, preferences.currency) },
                            ],
                            tables: [
                              {
                                title: 'Top Expense Categories',
                                headers: ['Category', 'Amount'],
                                rows: categoryRows,
                              },
                            ],
                            filename: `financial-data-${new Date().toISOString().split('T')[0]}.pdf`,
                            accentColor: [37, 99, 235],
                          });

                          toast({
                            title: "Print Ready",
                            description: "Your financial report is ready to print",
                          });
                        } catch (error) {
                          toast({
                            title: "Print Failed",
                            description: "Unable to prepare report for printing. Please try again.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Print Report
                    </Button>
                  </div>
                </div>
                <Separator className="md:block hidden" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground">Personalized Insights</p>
                    <p className="text-sm text-muted-foreground">Allow AI to analyze your spending for better predictions</p>
                  </div>
                  <Switch 
                    checked={preferences.predictionsEnabled}
                    onCheckedChange={(checked) => updatePreferences({ predictionsEnabled: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-expense/30">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-expense text-lg sm:text-xl">Danger Zone</CardTitle>
              <CardDescription className="text-sm">Irreversible actions that affect your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-expense/20 rounded-lg bg-expense/5">
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="text-expense border-expense/30 hover:bg-expense/10 w-full sm:w-auto"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Plan Upgrade Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="sm:max-w-md mx-4 max-w-[calc(100vw-2rem)]">
          <DialogHeader>
            <DialogTitle>Upgrade to Pro Plan</DialogTitle>
            <DialogDescription>
              Get unlimited features for just {formatCurrency(1, preferences.currency)}/month
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <ul className="space-y-2">
              {[
                'Unlimited transactions',
                'Advanced AI predictions',
                'Priority support',
                'Export to PDF/Excel',
                'Custom categories',
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-income flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              This is a demo app. Payment processing is simulated.
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowPlanDialog(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              variant="gradient"
              onClick={() => {
                toast({
                  title: "Demo Mode",
                  description: "Payment processing would happen here in production.",
                });
                setShowPlanDialog(false);
              }}
              className="w-full sm:w-auto"
            >
              Subscribe for {formatCurrency(1, preferences.currency)}/month
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="mx-4 max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-expense flex-shrink-0" />
              Delete Account
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>This action is permanent and cannot be undone.</p>
              <p className="text-foreground font-medium">All your data will be permanently deleted:</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✗ All transactions and budgets</li>
                <li>✗ Profile information</li>
                <li>✗ Analytics and reports</li>
                <li>✗ Uploaded documents</li>
              </ul>
              <div className="pt-3">
                <Label htmlFor="deleteConfirm">To confirm, type "DELETE" below:</Label>
                <Input
                  id="deleteConfirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE to confirm"
                  className="mt-2"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setDeleteConfirmText('')} className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-expense hover:bg-expense/90 w-full sm:w-auto"
              disabled={deleteConfirmText !== 'DELETE' || authLoading}
              onClick={handleDeleteAccount}
            >
              {authLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Permanently Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}