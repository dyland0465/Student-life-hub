import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, 
  CheckCircle2, 
  Clock, 
  FileText, 
  CheckSquare, 
  Send,
  Sparkles,
  AlertTriangle,
  Settings
} from 'lucide-react';
import { useState } from 'react';
import type { Assignment, AISolution } from '@/types';

export type EZSolveState = 
  | 'idle'
  | 'sending'
  | 'parsing'
  | 'awaiting_approval'
  | 'submitting'
  | 'done'
  | 'error';

export interface EZSolveConfig {
  llm: string;
  gradeTarget: string;
  waitTimeBeforeSubmission?: number; // in seconds, only for quizzes
  temperature?: number;
  maxTokens?: number;
}

interface EZSolveProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: Assignment;
  state: EZSolveState;
  solution: AISolution | null;
  error?: string;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
  onStart?: (config: EZSolveConfig) => void;
}

const stateConfig = {
  idle: {
    label: 'Ready',
    description: 'Preparing to start...',
    icon: Clock,
    progress: 0,
    color: 'text-muted-foreground',
  },
  sending: {
    label: 'State 1: Sending task to LLM model',
    description: 'Sending assignment details to AI for processing...',
    icon: Loader2,
    progress: 20,
    color: 'text-primary',
    spinning: true,
  },
  parsing: {
    label: 'State 2: Parsing best response from LLM',
    description: 'Analyzing and formatting the AI response...',
    icon: FileText,
    progress: 50,
    color: 'text-primary',
    spinning: true,
  },
  awaiting_approval: {
    label: 'State 3: Awaiting user approval',
    description: 'Review the solution and approve to continue',
    icon: CheckSquare,
    progress: 75,
    color: 'text-yellow-600 dark:text-yellow-400',
  },
  submitting: {
    label: 'State 4: Submitting assignment',
    description: 'Marking assignment as completed...',
    icon: Send,
    progress: 90,
    color: 'text-primary',
    spinning: true,
  },
  done: {
    label: 'State 5: Done!',
    description: 'Assignment has been successfully completed!',
    icon: CheckCircle2,
    progress: 100,
    color: 'text-green-600 dark:text-green-400',
  },
  error: {
    label: 'Error',
    description: 'Something went wrong',
    icon: AlertTriangle,
    progress: 0,
    color: 'text-destructive',
  },
};

export function EZSolveProgressModal({
  open,
  onOpenChange,
  assignment,
  state,
  solution,
  error,
  onApprove,
  onReject,
  onClose,
  onStart,
}: EZSolveProgressModalProps) {
  const config = stateConfig[state];
  const Icon = config.icon;
  const isSpinning = 'spinning' in config && config.spinning;

  // Configuration state
  const [ezSolveConfig, setEzSolveConfig] = useState<EZSolveConfig>({
    llm: 'gpt-3.5-turbo',
    gradeTarget: 'A',
    waitTimeBeforeSubmission: 30,
    temperature: 0.7,
    maxTokens: 1000,
  });

  // Check if assignment is a quiz (case-insensitive check)
  const isQuiz = assignment.title.toLowerCase().includes('quiz') || 
                 assignment.description?.toLowerCase().includes('quiz') ||
                 assignment.title.toLowerCase().includes('test') ||
                 assignment.description?.toLowerCase().includes('test');

  const handleStart = () => {
    if (onStart) {
      onStart(ezSolveConfig);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>EZSolve Automation</DialogTitle>
            <Badge variant="secondary" className="ml-auto">AI Powered</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Configuration Section (shown when idle) */}
          {state === 'idle' && (
            <Card className="border-primary/50">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Settings className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">EZSolve Configuration</h3>
                </div>

                <div className="space-y-4">
                  {/* LLM Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="llm-select">LLM Model</Label>
                    <Select
                      value={ezSolveConfig.llm}
                      onValueChange={(value) => setEzSolveConfig({ ...ezSolveConfig, llm: value })}
                    >
                      <SelectTrigger id="llm-select">
                        <SelectValue placeholder="Select LLM model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast, Cost-effective)</SelectItem>
                        <SelectItem value="gpt-4">GPT-4 (High Quality, Slower)</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo (Balanced)</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o (Latest, Best Quality)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Grade Target */}
                  <div className="space-y-2">
                    <Label htmlFor="grade-select">Grade Target</Label>
                    <Select
                      value={ezSolveConfig.gradeTarget}
                      onValueChange={(value) => setEzSolveConfig({ ...ezSolveConfig, gradeTarget: value })}
                    >
                      <SelectTrigger id="grade-select">
                        <SelectValue placeholder="Select grade target" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A (90-100%)</SelectItem>
                        <SelectItem value="B">B (80-89%)</SelectItem>
                        <SelectItem value="C">C (70-79%)</SelectItem>
                        <SelectItem value="D">D (60-69%)</SelectItem>
                        <SelectItem value="Pass">Pass (Minimum)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Wait Time Before Submission (only for quizzes) */}
                  {isQuiz && (
                    <div className="space-y-2">
                      <Label htmlFor="wait-time">Random Wait Time Before Submission (seconds)</Label>
                      <Input
                        id="wait-time"
                        type="number"
                        min="0"
                        max="300"
                        value={ezSolveConfig.waitTimeBeforeSubmission || 30}
                        onChange={(e) => setEzSolveConfig({ 
                          ...ezSolveConfig, 
                          waitTimeBeforeSubmission: parseInt(e.target.value) || 0 
                        })}
                        placeholder="30"
                      />
                      <p className="text-xs text-muted-foreground">
                        Random delay before auto-submitting quiz (0-300 seconds)
                      </p>
                    </div>
                  )}

                  {/* Advanced Options */}
                  <div className="space-y-3 pt-2 border-t">
                    <p className="text-sm font-medium text-muted-foreground">Advanced Options</p>
                    
                    <div className="space-y-2">
                      <Label htmlFor="temperature">Temperature (Creativity: 0.0-2.0)</Label>
                      <Input
                        id="temperature"
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        value={ezSolveConfig.temperature || 0.7}
                        onChange={(e) => setEzSolveConfig({ 
                          ...ezSolveConfig, 
                          temperature: parseFloat(e.target.value) || 0.7 
                        })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Lower = more focused, Higher = more creative
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max-tokens">Max Tokens (Response Length)</Label>
                      <Input
                        id="max-tokens"
                        type="number"
                        min="100"
                        max="4000"
                        step="100"
                        value={ezSolveConfig.maxTokens || 1000}
                        onChange={(e) => setEzSolveConfig({ 
                          ...ezSolveConfig, 
                          maxTokens: parseInt(e.target.value) || 1000 
                        })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum length of AI response (100-4000 tokens)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Start Button */}
                <Button
                  onClick={handleStart}
                  className="w-full"
                  size="lg"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start EZSolve
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Progress Section */}
          {state !== 'idle' && (
            <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-6 w-6 ${config.color} ${isSpinning ? 'animate-spin' : ''}`}
                />
                <div>
                  <p className="font-semibold">{config.label}</p>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </div>
              </div>
              <Badge variant={state === 'done' ? 'default' : 'secondary'}>
                {Math.round(config.progress)}%
              </Badge>
            </div>
            <Progress value={config.progress} className="h-2" />
          </div>
          )}

          {/* Error Display */}
          {state === 'error' && error && (
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-semibold text-destructive">Error</p>
                    <p className="text-sm text-muted-foreground mt-1">{error}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Solution Preview (State 3: Awaiting Approval) */}
          {state === 'awaiting_approval' && solution && (
            <Card className="border-primary/50">
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">AI-Generated Solution Preview</h3>
                  <div className="rounded-lg bg-muted p-4 max-h-96 overflow-y-auto">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {solution.solution}
                      </div>
                    </div>
                  </div>
                </div>

                {solution.steps && solution.steps.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Step-by-Step Approach:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      {solution.steps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Academic Integrity Notice */}
                <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-yellow-900 dark:text-yellow-100">
                      <strong>Academic Integrity:</strong> Review this solution carefully. 
                      Submitting AI-generated content as your own may violate academic policies.
                    </p>
                  </div>
                </div>

                {/* Approval Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={onApprove}
                    className="flex-1"
                    size="lg"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve & Submit
                  </Button>
                  <Button
                    onClick={onReject}
                    variant="outline"
                    className="flex-1"
                    size="lg"
                  >
                    Reject & Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success Message (State 5: Done) */}
          {state === 'done' && (
            <Card className="border-green-500/50 bg-green-50 dark:bg-green-950">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto" />
                  <div>
                    <p className="font-semibold text-lg">Assignment Completed!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      "{assignment.title}" has been marked as completed.
                    </p>
                  </div>
                  <Button onClick={onClose} className="w-full">
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cancel Button (for states that allow cancellation) */}
          {state !== 'done' && state !== 'awaiting_approval' && state !== 'error' && (
            <Button
              onClick={onReject}
              variant="outline"
              className="w-full"
              disabled={state === 'submitting'}
            >
              Cancel
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

