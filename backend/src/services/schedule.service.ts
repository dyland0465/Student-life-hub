import type {
  ScheduleRequest,
  GeneratedSchedule,
  ScheduleParameters,
  ScheduleCourse,
  CourseSection,
  SelectedSection,
  ScheduleConflict,
  ClassSchedule,
} from '../types';
import { mockCourses, getCourseByCode, searchCourses } from '../data/mockCourses';
import { openAIService } from './openai.service';

export class ScheduleService {
  /**
   * Generate an optimal schedule based on user requirements and parameters
   */
  async generateSchedule(request: ScheduleRequest): Promise<GeneratedSchedule> {
    try {
      // Resolve prerequisites
      const allRequiredCourses = this.resolvePrerequisites(request.requiredCourses);

      // Get all course data
      const courses: ScheduleCourse[] = [];
      for (const courseCode of allRequiredCourses) {
        const course = getCourseByCode(courseCode);
        if (course) {
          courses.push(course);
        }
      }

      // Get parameters (from preset or direct)
      const parameters = request.parameters || this.getDefaultParameters();

      // Generate schedule using AI
      const generatedSchedule = await openAIService.generateOptimalSchedule(
        courses,
        parameters,
        request.requiredCourses
      );

      // Convert to GeneratedSchedule format
      const selectedSections: SelectedSection[] = generatedSchedule.sections.map(section => ({
        courseCode: section.courseCode,
        courseName: section.courseName,
        sectionId: section.sectionId,
        sectionNumber: section.sectionNumber,
        professor: section.professor,
        schedule: section.schedule,
        credits: section.credits,
      }));

      // Detect conflicts
      const conflicts = this.detectConflicts(selectedSections, courses);

      return {
        id: `schedule-${Date.now()}`,
        requestId: request.id,
        userId: request.userId,
        sections: selectedSections,
        conflicts,
        score: generatedSchedule.score,
        generatedAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating schedule:', error);
      throw new Error('Failed to generate schedule');
    }
  }

  /**
   * Resolve prerequisites - ensure all prerequisite courses are included
   */
  resolvePrerequisites(courseCodes: string[]): string[] {
    const resolved = new Set<string>();
    const toProcess = [...courseCodes];

    while (toProcess.length > 0) {
      const courseCode = toProcess.pop()!;
      if (resolved.has(courseCode)) continue;

      const course = getCourseByCode(courseCode);
      if (course) {
        resolved.add(courseCode);
        // Add prerequisites
        for (const prereq of course.prerequisites) {
          if (!resolved.has(prereq)) {
            toProcess.push(prereq);
          }
        }
      }
    }

    return Array.from(resolved);
  }

  /**
   * Detect conflicts in the generated schedule
   */
  detectConflicts(
    sections: SelectedSection[],
    courses: ScheduleCourse[]
  ): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];

    // Check for time conflicts
    for (let i = 0; i < sections.length; i++) {
      for (let j = i + 1; j < sections.length; j++) {
        const conflict = this.checkTimeConflict(sections[i], sections[j]);
        if (conflict) {
          conflicts.push({
            type: 'time',
            message: `Time conflict between ${sections[i].courseCode} and ${sections[j].courseCode}`,
            affectedCourses: [sections[i].courseCode, sections[j].courseCode],
          });
        }
      }
    }

    // Check for capacity issues
    for (const section of sections) {
      const course = courses.find(c => c.courseCode === section.courseCode);
      if (course) {
        const courseSection = course.sections.find(s => s.id === section.sectionId);
        if (courseSection && courseSection.enrolled >= courseSection.capacity) {
          conflicts.push({
            type: 'capacity',
            message: `${section.courseCode} section ${section.sectionNumber} is full`,
            affectedCourses: [section.courseCode],
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Check if two sections have overlapping times
   */
  private checkTimeConflict(section1: SelectedSection, section2: SelectedSection): boolean {
    for (const schedule1 of section1.schedule) {
      for (const schedule2 of section2.schedule) {
        if (schedule1.day === schedule2.day) {
          const start1 = this.timeToMinutes(schedule1.startTime);
          const end1 = this.timeToMinutes(schedule1.endTime);
          const start2 = this.timeToMinutes(schedule2.startTime);
          const end2 = this.timeToMinutes(schedule2.endTime);

          // Check if times overlap
          if (start1 < end2 && start2 < end1) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Convert time string (HH:mm) to minutes since midnight
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Get default parameters if none provided
   */
  private getDefaultParameters(): ScheduleParameters {
    return {
      prioritizeEasyProfessors: 50,
      prioritizeLateStart: 50,
      prioritizeEarlyEnd: 50,
      gapPreference: 'balanced',
      classSizePreference: 'any',
      onlinePreference: 'any',
    };
  }

  /**
   * Search courses
   */
  searchCourses(query: string): ScheduleCourse[] {
    return searchCourses(query);
  }

  /**
   * Get all courses
   */
  getAllCourses(): ScheduleCourse[] {
    return mockCourses;
  }

  /**
   * Get course by code
   */
  getCourseByCode(courseCode: string): ScheduleCourse | undefined {
    return getCourseByCode(courseCode);
  }
}

