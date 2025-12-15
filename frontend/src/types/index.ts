// User and Student types
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Student extends User {
  major: string;
  year: number;
  chatDisplayName?: string;
  isPro?: boolean;
}

// Coursework types
export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  dueDate: Date;
  status: 'pending' | 'completed';
  aiSolved?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  assignments: Assignment[];
  createdAt: Date;
  updatedAt: Date;
}

// Health & Fitness types
export interface FitnessRoutine {
  id: string;
  userId: string;
  routineName: string;
  duration: number;
  type: string;
  description?: string;
  createdAt: Date;
}

export interface WorkoutLog {
  id: string;
  userId: string;
  routineId: string;
  routineName: string;
  duration: number;
  type: string;
  date: Date;
  notes?: string;
}

// Meal tracking types
export interface Meal {
  id: string;
  userId: string;
  date: Date;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  foodName: string;
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fats: number; // grams
  notes?: string;
  createdAt: Date;
}

// Shopping list types
export interface ShoppingListItem {
  name: string;
  quantity: string;
  checked: boolean;
}

export interface ShoppingList {
  id: string;
  userId: string;
  name: string;
  items: ShoppingListItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Sleep types
export interface SleepSchedule {
  id: string;
  userId: string;
  bedTime: string; // HH:mm format
  wakeTime: string; // HH:mm format
  targetHours: number;
}

export interface SleepLog {
  id: string;
  userId: string;
  date: Date;
  bedTime: string;
  wakeTime: string;
  actualHours: number;
  quality?: 'poor' | 'fair' | 'good' | 'excellent';
  notes?: string;
}

// Health Manager combining fitness and sleep
export interface HealthData {
  sleepSchedule?: SleepSchedule;
  recentSleepLogs: SleepLog[];
  fitnessRoutines: FitnessRoutine[];
  recentWorkouts: WorkoutLog[];
}

// AI Service types
export interface AISolution {
  assignmentId: string;
  solution: string;
  explanation: string;
  steps?: string[];
  generatedAt: Date;
}

export interface AIInsight {
  type: 'sleep' | 'fitness' | 'study';
  title: string;
  message: string;
  recommendations: string[];
}

// Chat types
export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: string;
  roomId: string;
  isModerated?: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  code: string;
  type: 'global' | 'private';
  members: string[];
  createdBy: string;
  createdAt: string;
  maxMembers: number;
  unreadCount?: number;
}

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
  courseCode: string; 
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
  semester: string;
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
  score: number;
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
  registrationDate: Date;
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
    calendarId?: string;
    lastSync?: Date;
    syncEnabled: boolean;
  };
  appleCalendar?: {
    connected: boolean;
    serverUrl?: string;
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

export type EventSource = 'assignments' | 'workouts' | 'meals' | 'sleep';

