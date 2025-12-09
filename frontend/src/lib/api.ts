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
};

