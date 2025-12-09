import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import type { ScheduleCourse } from '@/types';
import { Search, Plus, BookOpen } from 'lucide-react';

interface CourseSearchProps {
  onCourseSelect: (courseCode: string) => void;
  selectedCourses: string[];
  requiredCourses: string[];
  onRequiredCourseAdd: (courseCode: string) => void;
  onCourseRemove: (courseCode: string) => void;
}

export function CourseSearch({
  onCourseSelect,
  selectedCourses,
  requiredCourses,
  onRequiredCourseAdd,
  onCourseRemove,
}: CourseSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<ScheduleCourse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchCourses();
    } else if (searchQuery.length === 0) {
      setCourses([]);
    }
  }, [searchQuery]);

  async function searchCourses() {
    setLoading(true);
    try {
      const data = await api.searchCourses(searchQuery);
      setCourses(data);
    } catch (error) {
      console.error('Error searching courses:', error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }

  function handleAddRequired(courseCode: string) {
    onRequiredCourseAdd(courseCode);
    onCourseSelect(courseCode);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses (e.g., CMPSC 131, MATH 140)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">Searching...</p>
        </div>
      )}

      {!loading && courses.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {courses.map((course) => (
            <Card key={course.id} className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{course.courseCode}</span>
                    <Badge variant="secondary">{course.credits} credits</Badge>
                  </div>
                  <p className="text-sm font-medium mb-1">{course.courseName}</p>
                  <p className="text-xs text-muted-foreground mb-2">{course.department}</p>
                  {course.prerequisites.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Prerequisites: {course.prerequisites.join(', ')}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {course.sections.length} section{course.sections.length !== 1 ? 's' : ''} available
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {!requiredCourses.includes(course.courseCode) && (
                    <Button
                      size="sm"
                      onClick={() => handleAddRequired(course.courseCode)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Required
                    </Button>
                  )}
                  {requiredCourses.includes(course.courseCode) && (
                    <Badge variant="default">Required</Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && searchQuery.length >= 2 && courses.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">No courses found</p>
        </div>
      )}
    </div>
  );
}

