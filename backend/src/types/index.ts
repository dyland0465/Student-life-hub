// Schedule Preset Types
export interface SchedulePreset {
  id: string;
  userId: string;
  name: string;
  type: 'free' | 'custom';
  parameters: ScheduleParameters;
  createdAt: Date;
}

export interface ScheduleParameters {
  prioritizeEasyProfessors?: number; // 0-100
  prioritizeLateStart?: number; // 0-100
  prioritizeEarlyEnd?: number; // 0-100
  preferredStartTime?: string; // HH:mm
  preferredEndTime?: string; // HH:mm
  avoidDays?: string[]; // ['Monday', 'Friday']
  gapPreference?: 'minimize' | 'maximize' | 'balanced';
  classSizePreference?: 'small' | 'medium' | 'large' | 'any';
  onlinePreference?: 'online' | 'in-person' | 'hybrid' | 'any';
}

// Course Catalog Types
export interface ScheduleCourse {
  id: string;
  courseCode: string; // e.g., "CMPSC 131"
  courseName: string;
  credits: number;
  prerequisites: string[]; // Course codes
  sections: CourseSection[];
  department: string;
  description?: string;
}

export interface CourseSection {
  id: string;
  sectionNumber: string;
  professor: string;
  professorRating?: number; // 0-5
  professorDifficulty?: number; // 0-5 (lower = easier)
  schedule: ClassSchedule[];
  capacity: number;
  enrolled: number;
  location: string;
  isOnline: boolean;
  isHybrid: boolean;
}

export interface ClassSchedule {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}

// Schedule Request & Generation
export interface ScheduleRequest {
  id: string;
  userId: string;
  semester: string; // e.g., "Fall 2024"
  requiredCourses: string[]; // Course codes user needs
  selectedCourses?: string[]; // Course codes user manually selected
  presetId?: string; // Preset to use
  parameters?: ScheduleParameters; // Custom parameters
  status: 'pending' | 'generating' | 'completed' | 'failed';
  createdAt: Date;
}

export interface GeneratedSchedule {
  id: string;
  requestId: string;
  userId: string;
  sections: SelectedSection[];
  conflicts: ScheduleConflict[];
  score: number; // Optimization score
  generatedAt: Date;
}

export interface SelectedSection {
  courseCode: string;
  courseName: string;
  sectionId: string;
  sectionNumber: string;
  professor: string;
  schedule: ClassSchedule[];
  credits: number;
}

export interface ScheduleConflict {
  type: 'prerequisite' | 'time' | 'capacity';
  message: string;
  affectedCourses: string[];
}

// Registration Queue
export interface RegistrationQueue {
  id: string;
  userId: string;
  scheduleId: string;
  sections: SelectedSection[];
  registrationDate: Date; // When LionPath opens
  status: 'pending' | 'queued' | 'registering' | 'success' | 'failed';
  lionPathConnected: boolean;
  attempts: number;
  lastAttempt?: Date;
  error?: string;
  createdAt: Date;
}

// Calendar Event Types
export interface Event {
  id: string;
  userId: string;
  title: string;
  date: string; // ISO date string (YYYY-MM-DD)
  time?: string; // HH:mm format
  category: 'academic' | 'personal' | 'wellness';
  description?: string;
  source?: 'manual' | 'assignment' | 'workout' | 'meal' | 'sleep' | 'google' | 'apple';
  sourceId?: string; // ID of the source item (e.g., assignment ID)
  externalId?: string; // ID from external calendar (Google/Apple)
  syncStatus?: 'synced' | 'pending' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface CalendarSyncConfig {
  id: string;
  userId: string;
  googleCalendar?: {
    connected: boolean;
    accessToken?: string; // Encrypted
    refreshToken?: string; // Encrypted
    calendarId?: string;
    lastSync?: Date;
    syncEnabled: boolean;
  };
  appleCalendar?: {
    connected: boolean;
    serverUrl?: string;
    username?: string;
    password?: string; // Encrypted
    calendarName?: string;
    lastSync?: Date;
    syncEnabled: boolean;
  };
  eventSources: {
    assignments: boolean;
    workouts: boolean;
    meals: boolean;
    sleep: boolean;
  };
  syncFrequency: 'realtime' | 'hourly' | 'daily';
  createdAt: Date;
  updatedAt: Date;
}

