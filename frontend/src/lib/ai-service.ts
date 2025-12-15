import type { Assignment, FitnessRoutine, SleepLog, AISolution, AIInsight } from '@/types';
import type { EZSolveConfig } from '@/components/coursework/EZSolveProgressModal';
import { api } from './api';

class AIService {

  async solveAssignment(assignment: Assignment, config?: EZSolveConfig): Promise<AISolution> {
    try {
      const response = await api.solveAssignment({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
      }, config);

      return {
        assignmentId: response.solution.assignmentId,
        solution: response.solution.solution,
        explanation: response.solution.explanation,
        steps: response.solution.steps,
        generatedAt: new Date(response.solution.generatedAt),
      };
    } catch (error) {
      console.error('Error calling backend API:', error);
      return this.getMockSolution(assignment);
    }
  }

  async getWorkoutRecommendations(userProfile: {
    fitnessLevel?: string;
    goals?: string[];
    availableTime?: number;
  }): Promise<FitnessRoutine[]> {
    try {
      const response = await api.getWorkoutRecommendations(userProfile);
      
      return response.recommendations.map((rec: any, index: number) => ({
        id: `ai-rec-${index + 1}`,
        userId: '',
        routineName: rec.routineName,
        duration: rec.duration,
        type: rec.type,
        description: rec.description,
        createdAt: new Date(),
      }));
    } catch (error) {
      console.error('Error getting workout recommendations:', error);
      return this.getMockWorkoutRecommendations();
    }
  }
  
  private getMockWorkoutRecommendations(): FitnessRoutine[] {
    return [
      {
        id: 'ai-rec-1',
        userId: '',
        routineName: 'Morning Cardio',
        duration: 30,
        type: 'Cardio',
        description: 'Start your day with energy with a quick, structured routine.',
        createdAt: new Date(),
      },
      {
        id: 'ai-rec-2',
        userId: '',
        routineName: 'Strength Training',
        duration: 45,
        type: 'Strength',
        description: 'Build muscle and improve overall fitness with a balanced session.',
        createdAt: new Date(),
      },
    ];
  }

  async analyzeSleepPattern(sleepLogs: SleepLog[]): Promise<AIInsight> {
    if (sleepLogs.length === 0) {
      return {
        type: 'sleep',
        title: 'Start Tracking Your Sleep',
        message: 'Begin logging your sleep to get insights.',
        recommendations: ['Log your bedtime and wake time daily', 'Aim for consistent sleep schedule'],
      };
    }

    const avgHours = sleepLogs.reduce((sum, log) => sum + log.actualHours, 0) / sleepLogs.length;
    const consistency = this.calculateSleepConsistency(sleepLogs);

    try {
      const response = await api.getSleepInsights({
        averageHours: avgHours,
        consistency,
        recentLogs: sleepLogs,
      });

      return {
        type: 'sleep',
        title: 'AI Sleep Analysis',
        message: response.insights.analysis,
        recommendations: response.insights.recommendations,
      };
    } catch (error) {
      console.error('Error getting sleep insights:', error);
      // Fallback to local analysis
      return {
        type: 'sleep',
        title: 'AI Sleep Analysis',
        message: `You average ${avgHours.toFixed(1)} hours of sleep. Consistency score: ${consistency}%`,
        recommendations: this.generateSleepRecommendations(avgHours, consistency),
      };
    }
  }


  async getStudySchedule(_courses: any[], assignments: Assignment[]): Promise<any> {
    const upcomingAssignments = assignments
      .filter(a => a.status === 'pending')
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    return {
      message: 'Suggested study schedule',
      schedule: upcomingAssignments.slice(0, 5).map(assignment => ({
        assignment: assignment.title,
        recommendedTime: '2 hours',
        priority: 'High',
      })),
    };
  }

  async getMealRecommendations(data: {
    mealHistory?: any[];
    preferences?: string[];
    dietaryRestrictions?: string[];
    targetCalories?: number;
  }): Promise<any[]> {
    try {
      const response = await api.getMealRecommendations(data);
      return response.recommendations || [];
    } catch (error) {
      console.error('Error getting meal recommendations:', error);
      return this.getMockMealRecommendations();
    }
  }

  async getShoppingListSuggestions(data: {
    mealPlan?: any[];
    recentMeals?: any[];
    preferences?: string[];
  }): Promise<{
    items: Array<{ name: string; quantity: string }>;
    suggestions: string[];
  }> {
    try {
      const response = await api.getShoppingListSuggestions(data);
      return response.suggestions || { items: [], suggestions: [] };
    } catch (error) {
      console.error('Error getting shopping list suggestions:', error);
      return this.getMockShoppingListSuggestions();
    }
  }

  private getMockMealRecommendations() {
    return [
      {
        foodName: 'Greek Yogurt with Berries',
        mealType: 'Breakfast',
        calories: 350,
        protein: 20,
        carbs: 45,
        fats: 8,
        description: 'High-protein breakfast to fuel your morning classes.',
      },
      {
        foodName: 'Grilled Chicken Salad',
        mealType: 'Lunch',
        calories: 450,
        protein: 35,
        carbs: 25,
        fats: 20,
        description: 'Balanced lunch with lean protein and fresh vegetables.',
      },
    ];
  }

  private getMockShoppingListSuggestions() {
    return {
      items: [
        { name: 'Chicken Breast', quantity: '1 lb' },
        { name: 'Greek Yogurt', quantity: '32 oz' },
        { name: 'Mixed Berries', quantity: '1 package' },
        { name: 'Mixed Greens', quantity: '1 bag' },
      ],
      suggestions: [
        'Buy fresh produce at the beginning of the week',
        'Look for sales on protein sources',
      ],
    };
  }

  // Helper methods
  private getMockSolution(assignment: Assignment): AISolution {
    return {
      assignmentId: assignment.id,
      solution: `Here's a quick guide for "${assignment.title}":\n\n1. Break the assignment into smaller parts.\n2. Review your notes and source material.\n3. Outline the steps you need to take.\n4. Work through each step carefully.\n5. Double-check your work.\n\nThis is demo content. Add an OpenAI API key for live responses.`,
      explanation: 'Demo response. Configure an OpenAI API key for live solutions.',
      steps: [
        'Understand the requirements',
        'Break down the problem',
        'Research relevant concepts',
        'Solve step by step',
        'Review and verify',
      ],
      generatedAt: new Date(),
    };
  }

  private calculateSleepConsistency(logs: SleepLog[]): number {
    if (logs.length < 2) return 100;
    
    const hours = logs.map(l => l.actualHours);
    const avg = hours.reduce((a, b) => a + b, 0) / hours.length;
    const variance = hours.reduce((sum, h) => sum + Math.pow(h - avg, 2), 0) / hours.length;
    const stdDev = Math.sqrt(variance);
    
    return Math.max(0, Math.min(100, 100 - (stdDev * 20)));
  }

  private generateSleepRecommendations(avgHours: number, consistency: number): string[] {
    const recommendations: string[] = [];

    if (avgHours < 7) {
      recommendations.push('Try to get at least 7-8 hours of sleep per night');
      recommendations.push('Consider going to bed 30 minutes earlier');
    } else if (avgHours > 9) {
      recommendations.push('You might be oversleeping. Aim for 7-8 hours');
    }

    if (consistency < 70) {
      recommendations.push('Maintain a consistent sleep schedule, even on weekends');
      recommendations.push('Set a regular bedtime alarm');
    }

    if (recommendations.length === 0) {
      recommendations.push('Great job! Your sleep habits are on track');
      recommendations.push('Keep maintaining this healthy sleep pattern');
    }

    return recommendations;
  }
}

export const aiService = new AIService();

