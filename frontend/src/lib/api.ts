import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Get Firebase auth token for API requests
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    
    const token = await user.getIdToken();
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  /**
   * Solve assignment with AI (EZSolve feature)
   */
  async solveAssignment(assignment: {
    id: string;
    title: string;
    description?: string;
  }) {
    return apiRequest('/api/ai/solve-assignment', {
      method: 'POST',
      body: JSON.stringify({ assignment }),
    });
  },

  /**
   * Get AI workout recommendations
   */
  async getWorkoutRecommendations(profile: {
    fitnessLevel?: string;
    goals?: string[];
    availableTime?: number;
  }) {
    return apiRequest('/api/ai/workout-recommendations', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  },

  /**
   * Get AI sleep insights
   */
  async getSleepInsights(data: {
    averageHours: number;
    consistency: number;
    recentLogs: any[];
  }) {
    return apiRequest('/api/ai/sleep-insights', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Health check
   */
  async healthCheck() {
    const response = await fetch(`${API_URL}/api/health`);
    return response.json();
  },
};

