import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/useAuth';
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Lock, Camera, Trash2, AlertTriangle, ChevronDown } from 'lucide-react';

interface ProfileSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSettingsDialog({ open, onOpenChange }: ProfileSettingsDialogProps) {
  const { currentUser, studentProfile, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [dangerZoneOpen, setDangerZoneOpen] = useState(false);

  // Profile tab state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [major, setMajor] = useState('');
  const [year, setYear] = useState('1');
  const [photoURL, setPhotoURL] = useState('');

  // Password tab state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (open && currentUser && studentProfile) {
      setName(studentProfile.name || '');
      setEmail(currentUser.email || '');
      setMajor(studentProfile.major || '');
      setYear(studentProfile.year?.toString() || '1');
      setPhotoURL(currentUser.photoURL || '');
    }
  }, [open, currentUser, studentProfile]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();

    if (!currentUser || !studentProfile) return;

    setLoading(true);

    try {
      // Use default photo if URL is empty
      const defaultPhoto = 'https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png';
      const finalPhotoURL = photoURL.trim() || defaultPhoto;

      // Update Firebase Auth profile (display name and photo)
      await updateProfile(currentUser, {
        displayName: name,
        photoURL: finalPhotoURL,
      });

      // Update Firestore user document
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        name,
        major,
        year: parseInt(year),
      });

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();

    if (!currentUser || !currentUser.email) {
      toast({
        title: 'Error',
        description: 'No user logged in',
        variant: 'destructive',
      });
      return;
    }

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all password fields',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords Don\'t Match',
        description: 'New password and confirmation must match',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Password Too Short',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, newPassword);

      toast({
        title: 'Password Changed',
        description: 'Your password has been changed successfully',
      });

      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      let errorMessage = 'Failed to change password';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Current password is incorrect';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'New password is too weak';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please log out and log back in before changing your password';
      }

      toast({
        title: 'Password Change Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function deleteAllUserData(userId: string) {
    try {
      // Delete user profile
      await deleteDoc(doc(db, 'users', userId));

      // Delete all courses
      const coursesQuery = query(collection(db, 'courses'), where('userId', '==', userId));
      const coursesSnapshot = await getDocs(coursesQuery);
      const courseDeletions = coursesSnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(courseDeletions);

      // Delete all fitness routines
      const routinesQuery = query(collection(db, 'fitnessRoutines'), where('userId', '==', userId));
      const routinesSnapshot = await getDocs(routinesQuery);
      const routineDeletions = routinesSnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(routineDeletions);

      // Delete all workout logs
      const workoutsQuery = query(collection(db, 'workoutLogs'), where('userId', '==', userId));
      const workoutsSnapshot = await getDocs(workoutsQuery);
      const workoutDeletions = workoutsSnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(workoutDeletions);

      // Delete sleep schedule
      const sleepScheduleDoc = doc(db, 'sleepSchedules', userId);
      await deleteDoc(sleepScheduleDoc).catch(() => {
        // Ignore if doesn't exist
      });

      // Delete all sleep logs
      const sleepQuery = query(collection(db, 'sleepLogs'), where('userId', '==', userId));
      const sleepSnapshot = await getDocs(sleepQuery);
      const sleepDeletions = sleepSnapshot.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(sleepDeletions);

      console.log('✅ All user data deleted from Firestore');
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw error;
    }
  }

  async function handleDeleteAccount() {
    if (!currentUser) return;

    setDeleteLoading(true);

    try {
      // Delete all user data from Firestore
      await deleteAllUserData(currentUser.uid);

      // Delete Firebase Auth account
      await deleteUser(currentUser);

      toast({
        title: 'Account Deleted',
        description: 'Your account has been permanently deleted',
      });

      // Close dialog and redirect to login
      onOpenChange(false);
      await logout();
      navigate('/login', { replace: true });
    } catch (error: any) {
      console.error('Error deleting account:', error);
      
      let errorMessage = 'Failed to delete account';
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Please log out and log back in before deleting your account';
      }

      toast({
        title: 'Deletion Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
      setDeleteConfirmText('');
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>
            Manage your account settings and preferences
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security">
              <Lock className="mr-2 h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4 overflow-y-auto flex-1 pr-2">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Avatar Section */}
              <div className="flex items-center gap-4 py-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage 
                    src={photoURL || 'https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png'} 
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {name ? getInitials(name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Label htmlFor="photoURL">Profile Photo URL</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="photoURL"
                      type="url"
                      placeholder="Leave empty for default photo"
                      value={photoURL}
                      onChange={(e) => setPhotoURL(e.target.value)}
                      disabled={loading}
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={() => setPhotoURL('')}
                      title="Reset to default photo"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter an image URL or leave empty for default photo
                  </p>
                </div>
              </div>

              {/* Basic Information */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              {/* Academic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="major">Major</Label>
                  <Input
                    id="major"
                    placeholder="Computer Science"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Select value={year} onValueChange={setYear} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Freshman</SelectItem>
                      <SelectItem value="2">Sophomore</SelectItem>
                      <SelectItem value="3">Junior</SelectItem>
                      <SelectItem value="4">Senior</SelectItem>
                      <SelectItem value="5">Graduate</SelectItem>
                      <SelectItem value="6">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 overflow-y-auto flex-1 pr-2">
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Note:</strong> If you signed in with Google, you cannot change your password here.
                  Manage your password through your Google account.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
              </DialogFooter>
            </form>

            {/* Danger Zone - Collapsible */}
            <Separator className="my-6" />
            
            <Collapsible open={dangerZoneOpen} onOpenChange={setDangerZoneOpen}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-semibold">Danger Zone</span>
                  </div>
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform ${dangerZoneOpen ? 'rotate-180' : ''}`} 
                  />
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  Irreversible actions that permanently affect your account
                </p>

                <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Delete Account</h4>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                    </div>
                    
                    <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="h-5 w-5" />
                          Delete Account Permanently?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3 text-left">
                          <p>
                            This will <strong>permanently delete</strong>:
                          </p>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Your user account and profile</li>
                            <li>All your courses and assignments</li>
                            <li>All workout logs and fitness routines</li>
                            <li>All sleep logs and schedules</li>
                            <li>Any AI-generated solutions</li>
                          </ul>
                          <p className="text-destructive font-medium pt-2">
                            This action cannot be undone. All your data will be lost forever.
                          </p>
                          <div className="pt-2">
                            <Label htmlFor="deleteConfirm" className="text-sm">
                              Type <strong>DELETE</strong> to confirm:
                            </Label>
                            <Input
                              id="deleteConfirm"
                              placeholder="Type DELETE"
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                              className="mt-2"
                            />
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleteLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete My Account
                            </>
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

