import { useState } from 'react';
import type { Assignment } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Sparkles, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { aiService } from '@/lib/ai-service';
import { EZSolveDialog } from './EZSolveDialog';

interface AssignmentCardProps {
  assignment: Assignment;
  courseName: string;
  onUpdate: () => void;
}

export function AssignmentCard({ assignment, courseName, onUpdate }: AssignmentCardProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [ezSolveOpen, setEzSolveOpen] = useState(false);
  const [aiSolution, setAiSolution] = useState<any>(null);

  async function handleToggleComplete() {
    if (!currentUser) return;

    try {
      setLoading(true);

      // Find the course containing this assignment
      const coursesRef = collection(db, 'courses');
      const q = query(coursesRef, where('userId', '==', currentUser.uid));
      const snapshot = await getDocs(q);

      for (const courseDoc of snapshot.docs) {
        const courseData = courseDoc.data();
        const assignments = courseData.assignments || [];
        const assignmentIndex = assignments.findIndex((a: any) => a.id === assignment.id);

        if (assignmentIndex !== -1) {
          // Update the assignment status
          assignments[assignmentIndex].status = 
            assignment.status === 'completed' ? 'pending' : 'completed';
          assignments[assignmentIndex].updatedAt = new Date();

          await updateDoc(doc(db, 'courses', courseDoc.id), {
            assignments,
            updatedAt: new Date(),
          });

          toast({
            title: 'Success',
            description: `Assignment marked as ${assignments[assignmentIndex].status}`,
          });

          onUpdate();
          break;
        }
      }
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update assignment',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleEZSolve() {
    try {
      setLoading(true);
      const solution = await aiService.solveAssignment(assignment);
      setAiSolution(solution);
      setEzSolveOpen(true);

      // Mark assignment as AI-solved
      if (!currentUser) return;

      const coursesRef = collection(db, 'courses');
      const q = query(coursesRef, where('userId', '==', currentUser.uid));
      const snapshot = await getDocs(q);

      for (const courseDoc of snapshot.docs) {
        const courseData = courseDoc.data();
        const assignments = courseData.assignments || [];
        const assignmentIndex = assignments.findIndex((a: any) => a.id === assignment.id);

        if (assignmentIndex !== -1) {
          assignments[assignmentIndex].aiSolved = true;
          assignments[assignmentIndex].updatedAt = new Date();

          await updateDoc(doc(db, 'courses', courseDoc.id), {
            assignments,
            updatedAt: new Date(),
          });

          onUpdate();
          break;
        }
      }
    } catch (error) {
      console.error('Error with EZSolve:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate AI solution',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const isOverdue = assignment.status === 'pending' && assignment.dueDate < new Date();

  return (
    <>
      <Card className={isOverdue ? 'border-destructive' : ''}>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Checkbox
              checked={assignment.status === 'completed'}
              onCheckedChange={handleToggleComplete}
              disabled={loading}
              className="mt-1"
            />

            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className={`font-semibold ${assignment.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                    {assignment.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">{courseName}</p>
                  {assignment.description && (
                    <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2 items-end">
                  <Badge variant={assignment.status === 'completed' ? 'default' : isOverdue ? 'destructive' : 'secondary'}>
                    {assignment.status === 'completed' ? 'Completed' : isOverdue ? 'Overdue' : 'Pending'}
                  </Badge>
                  {assignment.aiSolved && (
                    <Badge variant="outline" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      AI Solved
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Due {format(assignment.dueDate, 'MMM d, yyyy h:mm a')}</span>
                </div>

                {assignment.status === 'pending' && (
                  <Button
                    size="sm"
                    variant={assignment.aiSolved ? 'outline' : 'default'}
                    onClick={handleEZSolve}
                    disabled={loading}
                    className="gap-2"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {assignment.aiSolved ? 'View Solution' : 'EZSolve'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <EZSolveDialog
        open={ezSolveOpen}
        onOpenChange={setEzSolveOpen}
        assignment={assignment}
        solution={aiSolution}
      />
    </>
  );
}

