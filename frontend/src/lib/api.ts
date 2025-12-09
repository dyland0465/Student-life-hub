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
  try {
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
  } catch (error: any) {
    // Handle network errors (backend not running, CORS, etc.)
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error(
        `Cannot connect to backend server at ${API_URL}. Please ensure the backend is running.`
      );
    }
    throw error;
  }
}

export const api = {
  /**
   * Solve assignment with AI (EZSolve feature)
   */
  async solveAssignment(assignment: {
    id: string;
    title: string;
    description?: string;
  }, config?: {
    llm?: string;
    gradeTarget?: string;
    waitTimeBeforeSubmission?: number;
    temperature?: number;
    maxTokens?: number;
  }) {
    return apiRequest('/api/ai/solve-assignment', {
      method: 'POST',
      body: JSON.stringify({ assignment, config }),
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
   * Get AI meal recommendations
   */
  async getMealRecommendations(data: {
    mealHistory?: any[];
    preferences?: string[];
    dietaryRestrictions?: string[];
    targetCalories?: number;
  }) {
    return apiRequest('/api/ai/meal-recommendations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get AI shopping list suggestions
   */
  async getShoppingListSuggestions(data: {
    mealPlan?: any[];
    recentMeals?: any[];
    preferences?: string[];
  }) {
    return apiRequest('/api/ai/shopping-list-suggestions', {
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

  /**
   * Chat functionality
   */
  async getChatMessages() {
    return apiRequest('/api/chat/messages');
  },

  async sendChatMessage(content: string, username?: string) {
    return apiRequest('/api/chat/send', {
      method: 'POST',
      body: JSON.stringify({ content, username }),
    });
  },

  /**
   * Chat room functionality
   */
  async getChatRooms() {
    return apiRequest('/api/chat/rooms');
  },

  async createChatRoom(name: string, customCode?: string) {
    return apiRequest('/api/chat/rooms/create', {
      method: 'POST',
      body: JSON.stringify({ name, customCode }),
    });
  },

  async joinChatRoom(roomCode: string) {
    return apiRequest('/api/chat/rooms/join', {
      method: 'POST',
      body: JSON.stringify({ roomCode }),
    });
  },

  async getRoomMessages(roomId: string, limit?: number) {
    const params = limit ? `?limit=${limit}` : '';
    
    // For global room, don't require authentication
    if (roomId === 'global') {
      const response = await fetch(`${API_URL}/api/chat/rooms/${roomId}/messages${params}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }
      
      return response.json();
    }
    
    // For private rooms, use authenticated request
    return apiRequest(`/api/chat/rooms/${roomId}/messages${params}`);
  },

  async sendRoomMessage(roomId: string, content: string, username?: string) {
    // For global room, don't require authentication
    if (roomId === 'global') {
      const response = await fetch(`${API_URL}/api/chat/rooms/${roomId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, username }),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }
      
      return response.json();
    }
    
    // For private rooms, use authenticated request
    return apiRequest(`/api/chat/rooms/${roomId}/send`, {
      method: 'POST',
      body: JSON.stringify({ content, username }),
    });
  },

  async updateChatRoom(roomId: string, updates: { name?: string; code?: string }) {
    return apiRequest(`/api/chat/rooms/${roomId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async leaveChatRoom(roomId: string) {
    return apiRequest(`/api/chat/rooms/${roomId}/leave`, {
      method: 'DELETE',
    });
  },

  async deleteChatRoom(roomId: string) {
    return apiRequest(`/api/chat/rooms/${roomId}`, {
      method: 'DELETE',
    });
  },

  async inviteUserToRoom(roomId: string, inviteeUserId: string) {
    return apiRequest(`/api/chat/rooms/${roomId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ inviteeUserId }),
    });
  },

  async getChatProfile() {
    return apiRequest('/api/chat/profile');
  },

  async updateChatProfile(chatDisplayName: string) {
    return apiRequest('/api/chat/profile', {
      method: 'PUT',
      body: JSON.stringify({ chatDisplayName }),
    });
  },

  /**
   * Schedule Builder functionality
   */
  async searchCourses(query?: string) {
    const params = query ? `?q=${encodeURIComponent(query)}` : '';
    return apiRequest(`/api/schedule/courses${params}`);
  },

  async getCourse(courseCode: string) {
    return apiRequest(`/api/schedule/courses/${courseCode}`);
  },

  async generateSchedule(request: {
    semester: string;
    requiredCourses: string[];
    selectedCourses?: string[];
    presetId?: string;
    parameters?: any;
  }) {
    return apiRequest('/api/schedule/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async getPresets() {
    return apiRequest('/api/schedule/presets');
  },

  async createPreset(name: string, parameters: any) {
    return apiRequest('/api/schedule/presets', {
      method: 'POST',
      body: JSON.stringify({ name, parameters }),
    });
  },

  async updatePreset(presetId: string, name: string, parameters: any) {
    return apiRequest(`/api/schedule/presets/${presetId}`, {
      method: 'PUT',
      body: JSON.stringify({ name, parameters }),
    });
  },

  async deletePreset(presetId: string) {
    return apiRequest(`/api/schedule/presets/${presetId}`, {
      method: 'DELETE',
    });
  },

  async addToRegistrationQueue(scheduleId: string, sections: any[], registrationDate: string) {
    return apiRequest('/api/schedule/register', {
      method: 'POST',
      body: JSON.stringify({ scheduleId, sections, registrationDate }),
    });
  },

  async getRegistrationQueue() {
    return apiRequest('/api/schedule/queue');
  },

  async connectLionPath(username: string, password: string) {
    return apiRequest('/api/schedule/lionpath/connect', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  async getLionPathStatus() {
    return apiRequest('/api/schedule/lionpath/status');
  },

  async disconnectLionPath() {
    return apiRequest('/api/schedule/lionpath/disconnect', {
      method: 'POST',
    });
  },

  /**
   * Calendar functionality
   */
  async getEvents(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    return apiRequest(`/api/calendar/events${queryString ? `?${queryString}` : ''}`);
  },

  async createEvent(event: {
    title: string;
    date: string;
    time?: string;
    category: 'academic' | 'personal' | 'wellness';
    description?: string;
  }) {
    return apiRequest('/api/calendar/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  },

  async updateEvent(eventId: string, event: {
    title?: string;
    date?: string;
    time?: string;
    category?: 'academic' | 'personal' | 'wellness';
    description?: string;
  }) {
    return apiRequest(`/api/calendar/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    });
  },

  async deleteEvent(eventId: string) {
    return apiRequest(`/api/calendar/events/${eventId}`, {
      method: 'DELETE',
    });
  },

  async getCalendarSyncConfig() {
    return apiRequest('/api/calendar/sync/config');
  },

  async updateCalendarSyncConfig(config: {
    eventSources?: {
      assignments?: boolean;
      workouts?: boolean;
      meals?: boolean;
      sleep?: boolean;
    };
    syncFrequency?: 'realtime' | 'hourly' | 'daily';
  }) {
    return apiRequest('/api/calendar/sync/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  },

  async connectGoogleCalendar(accessToken: string, refreshToken: string, calendarId?: string) {
    return apiRequest('/api/calendar/sync/google/connect', {
      method: 'POST',
      body: JSON.stringify({ accessToken, refreshToken, calendarId }),
    });
  },

  async connectAppleCalendar(serverUrl: string, username: string, password: string, calendarName?: string) {
    return apiRequest('/api/calendar/sync/apple/connect', {
      method: 'POST',
      body: JSON.stringify({ serverUrl, username, password, calendarName }),
    });
  },

  async disconnectCalendar(service: 'google' | 'apple') {
    return apiRequest('/api/calendar/sync/disconnect', {
      method: 'POST',
      body: JSON.stringify({ service }),
    });
  },

  async syncCalendar(service: 'google' | 'apple', direction: 'push' | 'pull') {
    const endpoint = direction === 'push' ? '/api/calendar/sync/push' : '/api/calendar/sync/pull';
    return apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({ service }),
    });
  },
};

