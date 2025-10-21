import { useState, useEffect } from 'react';
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
import type { Course } from '@/types';

interface CourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
  onSave: (course: Partial<Course>) => void;
}

export function CourseDialog({ open, onOpenChange, course, onSave }: CourseDialogProps) {
  const [courseId, setCourseId] = useState('');
  const [courseName, setCourseName] = useState('');

  useEffect(() => {
    if (course) {
      setCourseId(course.courseId);
      setCourseName(course.courseName);
    } else {
      setCourseId('');
      setCourseName('');
    }
  }, [course, open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({ courseId, courseName });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{course ? 'Edit Course' : 'Add New Course'}</DialogTitle>
          <DialogDescription>
            {course ? 'Update course information' : 'Create a new course to track your assignments'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="courseId">Course ID</Label>
            <Input
              id="courseId"
              placeholder="CS 101"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="courseName">Course Name</Label>
            <Input
              id="courseName"
              placeholder="Introduction to Computer Science"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {course ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

