// User and Student types
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Student extends User {
  major: string;
  year: number;
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
  duration: number; // in minutes
  type: string; // e.g., "Cardio", "Strength", "Yoga"
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
  username: string;
  content: string;
  timestamp: string;
  isModerated?: boolean;
}

