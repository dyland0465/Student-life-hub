import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, BookOpen, Download, Settings, Edit, Trash2 } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Course } from '@/types';
import { CourseDialog } from '@/components/coursework/CourseDialog';
import { AssignmentDialog } from '@/components/coursework/AssignmentDialog';
import { AssignmentCard } from '@/components/coursework/AssignmentCard';
import { ImportCoursesDialog } from '@/components/coursework/ImportCoursesDialog';
import { useToast } from '@/hooks/use-toast';

export function CourseworkPage() {
  const { currentUser } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser) {
      loadCourses();
    }
  }, [currentUser]);

  async function loadCourses() {
    if (!currentUser) return;

    try {
      const coursesRef = collection(db, 'courses');
      const q = query(coursesRef, where('userId', '==', currentUser.uid));
      const snapshot = await getDocs(q);

      const loadedCourses = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        assignments: doc.data().assignments?.map((a: any) => ({
          ...a,
          dueDate: a.dueDate?.toDate() || new Date(),
          createdAt: a.createdAt?.toDate() || new Date(),
          updatedAt: a.updatedAt?.toDate() || new Date(),
        })) || [],
      })) as Course[];

      setCourses(loadedCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleAddCourse() {
    setSelectedCourse(null);
    setCourseDialogOpen(true);
  }

  function handleAddAssignment(course: Course) {
    setSelectedCourse(course);
    setAssignmentDialogOpen(true);
  }

  function handleEditCourse(course: Course) {
    setSelectedCourse(course);
    setCourseDialogOpen(true);
  }

  function handleDeleteCourse(course: Course) {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  }

  async function confirmDeleteCourse() {
    if (!courseToDelete || !currentUser) return;

    try {
      const courseRef = doc(db, 'courses', courseToDelete.id);
      await deleteDoc(courseRef);

      toast({
        title: 'Success',
        description: 'Course deleted successfully',
      });

      setDeleteDialogOpen(false);
      setCourseToDelete(null);
      loadCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete course',
        variant: 'destructive',
      });
    }
  }

  async function handleSaveCourse(courseData: Partial<Course>) {
    if (!currentUser) return;

    try {
      const now = new Date();
      
      if (selectedCourse) {
        // Update existing course
        const courseRef = doc(db, 'courses', selectedCourse.id);
        await updateDoc(courseRef, {
          ...courseData,
          updatedAt: now,
        });
      } else {
        // Create new course
        await addDoc(collection(db, 'courses'), {
          ...courseData,
          userId: currentUser.uid,
          assignments: [],
          createdAt: now,
          updatedAt: now,
        });
      }

      toast({
        title: 'Success',
        description: `Course ${selectedCourse ? 'updated' : 'created'} successfully`,
      });

      loadCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: 'Error',
        description: 'Failed to save course',
        variant: 'destructive',
      });
    }
  }

  const allAssignments = courses.flatMap((course) =>
    course.assignments.map((assignment) => ({ ...assignment, courseName: course.courseName }))
  );

  const pendingAssignments = allAssignments.filter((a) => a.status === 'pending');
  const completedAssignments = allAssignments.filter((a) => a.status === 'completed');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading coursework...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Coursework</h2>
          <p className="text-muted-foreground">Manage your courses and assignments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            Import from Canvas
          </Button>
          <Button onClick={handleAddCourse}>
            <Plus className="mr-2 h-4 w-4" />
            Add Course
          </Button>
        </div>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get started by adding your first course
            </p>
            <Button onClick={handleAddCourse}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Course
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Courses Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{course.courseName}</CardTitle>
                      <CardDescription>{course.courseId}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditCourse(course)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Course
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteCourse(course)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Course
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {course.assignments.length} assignment{course.assignments.length !== 1 ? 's' : ''}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddAssignment(course)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Assignments Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>Assignments</CardTitle>
              <CardDescription>View and manage your assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="pending">
                    Pending <Badge className="ml-2" variant="secondary">{pendingAssignments.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="completed">
                    Completed <Badge className="ml-2" variant="secondary">{completedAssignments.length}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="all">
                    All <Badge className="ml-2" variant="secondary">{allAssignments.length}</Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="space-y-4 mt-4">
                  {pendingAssignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No pending assignments. Great work!
                    </p>
                  ) : (
                    pendingAssignments.map((assignment) => (
                      <AssignmentCard
                        key={assignment.id}
                        assignment={assignment}
                        courseName={assignment.courseName || 'Unknown Course'}
                        onUpdate={loadCourses}
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="completed" className="space-y-4 mt-4">
                  {completedAssignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No completed assignments yet.
                    </p>
                  ) : (
                    completedAssignments.map((assignment) => (
                      <AssignmentCard
                        key={assignment.id}
                        assignment={assignment}
                        courseName={assignment.courseName || 'Unknown Course'}
                        onUpdate={loadCourses}
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="all" className="space-y-4 mt-4">
                  {allAssignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No assignments yet. Add one to get started!
                    </p>
                  ) : (
                    allAssignments.map((assignment) => (
                      <AssignmentCard
                        key={assignment.id}
                        assignment={assignment}
                        courseName={assignment.courseName || 'Unknown Course'}
                        onUpdate={loadCourses}
                      />
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      <CourseDialog
        open={courseDialogOpen}
        onOpenChange={(open) => {
          setCourseDialogOpen(open);
          if (!open) {
            setSelectedCourse(null);
          }
        }}
        course={selectedCourse}
        onSave={handleSaveCourse}
      />

      <AssignmentDialog
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        course={selectedCourse}
        onSave={loadCourses}
      />

      <ImportCoursesDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImportComplete={loadCourses}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{courseToDelete?.courseName}"? This action cannot be undone and will also delete all associated assignments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCourse} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

