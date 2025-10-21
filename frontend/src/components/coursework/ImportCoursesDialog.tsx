import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { importService, type LMSProvider, type ImportedCourse } from '@/lib/import-service';
import { Loader2, Check, AlertCircle, Download } from 'lucide-react';

interface ImportCoursesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

export function ImportCoursesDialog({ open, onOpenChange, onImportComplete }: ImportCoursesDialogProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [importedCourses, setImportedCourses] = useState<ImportedCourse[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<LMSProvider>('canvas');
  
  // Form fields
  const [canvasToken, setCanvasToken] = useState('');
  const [blackboardUsername, setBlackboardUsername] = useState('');
  const [blackboardPassword, setBlackboardPassword] = useState('');
  const [googleToken, setGoogleToken] = useState('');
  const [moodleUrl, setMoodleUrl] = useState('');
  const [moodleToken, setMoodleToken] = useState('');

  async function handleImport() {
    if (!currentUser) return;

    setLoading(true);
    setImportedCourses([]);

    try {
      let courses: ImportedCourse[] = [];

      switch (selectedProvider) {
        case 'canvas':
          courses = await importService.importFromCanvas(canvasToken || 'demo-token-12345678');
          break;
        case 'blackboard':
          courses = await importService.importFromBlackboard(
            blackboardUsername || 'demo-user',
            blackboardPassword || 'demo-pass'
          );
          break;
        case 'google-classroom':
          courses = await importService.importFromGoogleClassroom(googleToken || 'demo-google-token');
          break;
        case 'moodle':
          courses = await importService.importFromMoodle(
            moodleUrl || 'https://moodle.university.edu',
            moodleToken || 'demo-moodle-token'
          );
          break;
      }

      setImportedCourses(courses);
      
      toast({
        title: 'Courses Found!',
        description: `Found ${courses.length} course${courses.length !== 1 ? 's' : ''} with ${courses.reduce((sum, c) => sum + c.assignments.length, 0)} assignments`,
      });
    } catch (error: any) {
      toast({
        title: 'Import Failed',
        description: error.message || 'Failed to import courses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveImportedCourses() {
    if (!currentUser || importedCourses.length === 0) return;

    setLoading(true);

    try {
      const now = new Date();

      for (const course of importedCourses) {
        const courseData = {
          userId: currentUser.uid,
          courseId: course.courseId,
          courseName: course.courseName,
          instructor: course.instructor,
          term: course.term,
          assignments: course.assignments.map((assignment, index) => ({
            id: `${course.courseId}-${index}-${Date.now()}`,
            courseId: course.courseId,
            title: assignment.title,
            description: assignment.description || '',
            dueDate: assignment.dueDate,
            status: 'pending',
            aiSolved: false,
            pointsPossible: assignment.pointsPossible,
            createdAt: now,
            updatedAt: now,
          })),
          createdAt: now,
          updatedAt: now,
        };

        await addDoc(collection(db, 'courses'), courseData);
      }

      toast({
        title: 'Import Successful!',
        description: `Imported ${importedCourses.length} courses successfully`,
      });

      onImportComplete();
      onOpenChange(false);
      
      // Reset state
      setImportedCourses([]);
      setCanvasToken('');
      setBlackboardUsername('');
      setBlackboardPassword('');
      setGoogleToken('');
      setMoodleUrl('');
      setMoodleToken('');
    } catch (error) {
      console.error('Error saving imported courses:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save imported courses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import Courses from External Platform
          </DialogTitle>
          <DialogDescription>
            Connect your existing course management system to quickly import your courses and assignments.
          </DialogDescription>
        </DialogHeader>

        {importedCourses.length === 0 ? (
          <Tabs defaultValue="canvas" onValueChange={(value) => setSelectedProvider(value as LMSProvider)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="canvas">Canvas</TabsTrigger>
              <TabsTrigger value="blackboard">Blackboard</TabsTrigger>
              <TabsTrigger value="google-classroom">Google</TabsTrigger>
              <TabsTrigger value="moodle">Moodle</TabsTrigger>
            </TabsList>

            <TabsContent value="canvas" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Demo Mode:</strong> Currently showing mock Canvas data. To use real data, you'll need a Canvas API token from your institution.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="canvasToken">Canvas API Token (Optional for Demo)</Label>
                <Input
                  id="canvasToken"
                  type="password"
                  placeholder="Enter your Canvas API token or leave blank for demo"
                  value={canvasToken}
                  onChange={(e) => setCanvasToken(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Get your token from: Account → Settings → New Access Token
                </p>
              </div>
            </TabsContent>

            <TabsContent value="blackboard" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Demo Mode:</strong> Currently showing mock Blackboard data.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="bbUsername">Blackboard Username (Optional)</Label>
                <Input
                  id="bbUsername"
                  placeholder="username"
                  value={blackboardUsername}
                  onChange={(e) => setBlackboardUsername(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bbPassword">Blackboard Password (Optional)</Label>
                <Input
                  id="bbPassword"
                  type="password"
                  placeholder="password"
                  value={blackboardPassword}
                  onChange={(e) => setBlackboardPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </TabsContent>

            <TabsContent value="google-classroom" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Demo Mode:</strong> Currently showing mock Google Classroom data.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label>Google Classroom Authorization</Label>
                <Button variant="outline" className="w-full" disabled={loading}>
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Connect with Google (Demo)
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="moodle" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Demo Mode:</strong> Currently showing mock Moodle data.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="moodleUrl">Moodle Site URL (Optional)</Label>
                <Input
                  id="moodleUrl"
                  placeholder="https://moodle.university.edu"
                  value={moodleUrl}
                  onChange={(e) => setMoodleUrl(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="moodleToken">Moodle Web Services Token (Optional)</Label>
                <Input
                  id="moodleToken"
                  type="password"
                  placeholder="Your Moodle token"
                  value={moodleToken}
                  onChange={(e) => setMoodleToken(e.target.value)}
                  disabled={loading}
                />
              </div>
            </TabsContent>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Import Courses
                  </>
                )}
              </Button>
            </DialogFooter>
          </Tabs>
        ) : (
          <div className="space-y-4">
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-900 dark:text-green-100">
                <strong>Import Preview:</strong> Found {importedCourses.length} courses. Review and save to add them to your Student Life Hub.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {importedCourses.map((course, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">{course.courseName}</h4>
                      <p className="text-sm text-muted-foreground">{course.courseId}</p>
                      {course.instructor && (
                        <p className="text-sm text-muted-foreground">{course.instructor}</p>
                      )}
                    </div>
                    {course.term && (
                      <Badge variant="secondary">{course.term}</Badge>
                    )}
                  </div>
                  <div className="text-sm">
                    <strong>{course.assignments.length}</strong> assignment{course.assignments.length !== 1 ? 's' : ''}
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setImportedCourses([])} 
                disabled={loading}
              >
                Back
              </Button>
              <Button onClick={handleSaveImportedCourses} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Save All Courses
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

