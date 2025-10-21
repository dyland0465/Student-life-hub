import type { Assignment, AISolution } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';

interface EZSolveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: Assignment;
  solution: AISolution | null;
}

export function EZSolveDialog({ open, onOpenChange, assignment, solution }: EZSolveDialogProps) {
  if (!solution) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>EZSolve AI Assistant</DialogTitle>
            <Badge variant="secondary" className="ml-auto">Powered by AI</Badge>
          </div>
          <DialogDescription>
            AI-generated solution for: {assignment.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Academic Integrity Notice */}
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                  Academic Integrity Notice
                </p>
                <p className="text-yellow-800 dark:text-yellow-200">
                  This AI-generated solution is provided as a learning aid. Use it to understand concepts and approaches, 
                  but always complete your own work. Submitting AI-generated content as your own may violate academic 
                  integrity policies.
                </p>
              </div>
            </div>
          </div>

          {/* Assignment Details */}
          <div className="space-y-2">
            <h3 className="font-semibold">Assignment Details</h3>
            <div className="text-sm space-y-1">
              <p><span className="text-muted-foreground">Title:</span> {assignment.title}</p>
              {assignment.description && (
                <p><span className="text-muted-foreground">Description:</span> {assignment.description}</p>
              )}
              <p><span className="text-muted-foreground">Due Date:</span> {format(assignment.dueDate, 'PPP')}</p>
            </div>
          </div>

          <Separator />

          {/* AI Solution */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI-Generated Solution
            </h3>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {solution.solution}
              </div>
            </div>
          </div>

          {solution.steps && solution.steps.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold">Step-by-Step Approach</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  {solution.steps.map((step, index) => (
                    <li key={index} className="leading-relaxed">{step}</li>
                  ))}
                </ol>
              </div>
            </>
          )}

          <Separator />

          {/* Metadata */}
          <div className="text-xs text-muted-foreground">
            <p>Generated: {format(solution.generatedAt, 'PPP p')}</p>
            <p className="mt-1">{solution.explanation}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

