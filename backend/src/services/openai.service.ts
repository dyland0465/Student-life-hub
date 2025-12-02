import OpenAI from 'openai';

class OpenAIService {
  private client: OpenAI | null = null;
  private isConfigured: boolean = false;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (apiKey && apiKey !== 'your-openai-api-key-here') {
      this.client = new OpenAI({ apiKey });
      this.isConfigured = true;
      console.log('✅ OpenAI service initialized');
    } else {
      console.warn('⚠️  OpenAI API key not configured. AI features will use mock data.');
    }
  }

  async solveAssignment(assignment: {
    title: string;
    description?: string;
  }, config?: {
    llm?: string;
    gradeTarget?: string;
    waitTimeBeforeSubmission?: number;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{
    solution: string;
    explanation: string;
    steps?: string[];
  }> {
    // If OpenAI not configured, return mock solution
    if (!this.isConfigured || !this.client) {
      return this.getMockSolution(assignment, config);
    }

    try {
      // Use configured LLM model or default to gpt-3.5-turbo
      const model = config?.llm || 'gpt-3.5-turbo';
      const temperature = config?.temperature ?? 0.7;
      const maxTokens = config?.maxTokens ?? 1000;
      const gradeTarget = config?.gradeTarget || 'A';

      // Build prompt with grade target consideration
      const gradeContext = gradeTarget === 'A' 
        ? 'Aim for excellence and thorough understanding.'
        : gradeTarget === 'B'
        ? 'Focus on solid understanding and correct application.'
        : gradeTarget === 'C'
        ? 'Ensure basic competency and correct approach.'
        : 'Provide a clear, correct solution.';

      const prompt = `You are an AI tutor helping students understand their homework. Provide clear explanations, step-by-step solutions, and educational guidance. Always emphasize learning and understanding over just providing answers.

Assignment: ${assignment.title}
${assignment.description ? `Description: ${assignment.description}` : ''}

Grade Target: ${gradeTarget}
${gradeContext}

Please provide:
1. A detailed explanation of the concept
2. Step-by-step approach to solve this
3. Educational insights that help the student learn

Remember to encourage academic integrity and understanding.`;

      const response = await this.client.chat.completions.create({
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are an educational AI tutor focused on helping students learn and understand concepts.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: temperature,
        max_tokens: maxTokens,
      });

      const content = response.choices[0].message.content || '';

      return {
        solution: content,
        explanation: `AI-generated solution using ${model}`,
        steps: this.extractSteps(content),
      };
    } catch (error: any) {
      console.error('OpenAI API error:', error);
      
      // Return mock solution on error
      return this.getMockSolution(assignment, config);
    }
  }

  async getWorkoutRecommendations(profile: {
    fitnessLevel?: string;
    goals?: string[];
    availableTime?: number;
  }): Promise<any[]> {
    if (!this.isConfigured || !this.client) {
      return this.getMockWorkoutRecommendations();
    }

    try {
      const prompt = `Create 3 personalized workout recommendations for a student with:
- Fitness Level: ${profile.fitnessLevel || 'beginner'}
- Goals: ${profile.goals?.join(', ') || 'general fitness'}
- Available Time: ${profile.availableTime || 30} minutes

Format as a JSON array with: routineName, duration, type, description`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a fitness coach creating workout plans for busy students.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 500,
      });

      const content = response.choices[0].message.content || '';
      
      // Try to parse JSON, fallback to mock if fails
      try {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : this.getMockWorkoutRecommendations();
      } catch {
        return this.getMockWorkoutRecommendations();
      }
    } catch (error) {
      console.error('OpenAI workout error:', error);
      return this.getMockWorkoutRecommendations();
    }
  }

  async analyzeSleepPattern(sleepData: {
    averageHours: number;
    consistency: number;
    recentLogs: any[];
  }): Promise<{
    analysis: string;
    recommendations: string[];
    score: number;
  }> {
    if (!this.isConfigured || !this.client) {
      return this.getMockSleepAnalysis(sleepData);
    }

    try {
      const prompt = `Analyze this student's sleep pattern:
- Average sleep: ${sleepData.averageHours} hours
- Consistency: ${sleepData.consistency}%
- Recent logs: ${sleepData.recentLogs.length} nights tracked

Provide:
1. Brief analysis (2-3 sentences)
2. 3-4 specific recommendations
3. Overall sleep health score (0-100)

Format as JSON: { "analysis": "...", "recommendations": ["...", "..."], "score": 85 }`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a sleep health expert helping students optimize their sleep.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 400,
      });

      const content = response.choices[0].message.content || '';
      
      try {
        return JSON.parse(content);
      } catch {
        return this.getMockSleepAnalysis(sleepData);
      }
    } catch (error) {
      console.error('OpenAI sleep analysis error:', error);
      return this.getMockSleepAnalysis(sleepData);
    }
  }

  // Helper methods for mock data
  private getMockSolution(assignment: any, config?: any) {
    const gradeTarget = config?.gradeTarget || 'A';
    const model = config?.llm || 'gpt-3.5-turbo';
    
    return {
      solution: `Here's an AI-generated guide for "${assignment.title}":\n\n**Understanding the Problem:**\nBreak down the assignment into smaller, manageable parts. Identify the key concepts and requirements.\n\n**Research & Planning:**\nGather relevant information from your textbooks, lecture notes, and reliable online sources. Create an outline of your approach.\n\n**Step-by-Step Approach:**\n1. Review the relevant course material\n2. Identify the core concepts being tested\n3. Break down complex problems into simpler components\n4. Work through each component systematically\n5. Verify your understanding at each step\n\n**Grade Target: ${gradeTarget}**\n${gradeTarget === 'A' ? 'Focus on thoroughness and excellence in your approach.' : gradeTarget === 'B' ? 'Ensure solid understanding and correct application.' : 'Ensure basic competency and correct approach.'}\n\n**Tips for Success:**\n- Start early to give yourself time to think\n- Don't hesitate to ask your professor or TA for clarification\n- Study with classmates to gain different perspectives\n- Practice similar problems to reinforce your understanding\n\n**Academic Integrity Note:**\nUse this guide to understand the concepts and approach. Make sure to complete the work yourself and cite any sources you use.`,
      explanation: `Demo solution - Configure OpenAI API key for personalized AI assistance (Model: ${model})`,
      steps: [
        'Understand the requirements',
        'Break down the problem',
        'Research relevant concepts',
        'Develop your solution',
        'Review and verify your work',
      ],
    };
  }

  private getMockWorkoutRecommendations() {
    return [
      {
        routineName: 'Morning Energy Boost',
        duration: 20,
        type: 'Cardio',
        description: 'Start your day with light cardio to increase energy and focus for classes.',
      },
      {
        routineName: 'Study Break Stretch',
        duration: 15,
        type: 'Flexibility',
        description: 'Perfect for breaks between study sessions. Reduces tension and improves circulation.',
      },
      {
        routineName: 'Evening Strength Circuit',
        duration: 30,
        type: 'Strength',
        description: 'Build strength and relieve stress after a day of classes.',
      },
    ];
  }

  private getMockSleepAnalysis(data: any) {
    return {
      analysis: `You're averaging ${data.averageHours.toFixed(1)} hours of sleep with ${data.consistency.toFixed(0)}% consistency. ${
        data.averageHours >= 7 ? 'Your sleep duration is good!' : 'Try to get more sleep for better academic performance.'
      }`,
      recommendations: [
        data.averageHours < 7 ? 'Aim for 7-8 hours of sleep per night' : 'Maintain your current sleep duration',
        data.consistency < 70 ? 'Try to keep a consistent sleep schedule' : 'Great consistency! Keep it up',
        'Avoid screens 30 minutes before bed',
        'Create a relaxing bedtime routine',
      ],
      score: Math.min(100, Math.round((data.averageHours / 8) * 50 + data.consistency * 0.5)),
    };
  }

  private extractSteps(content: string): string[] {
    // Try to extract numbered steps from the content
    const stepMatches = content.match(/\d+\.\s+[^\n]+/g);
    if (stepMatches && stepMatches.length > 0) {
      return stepMatches.map(step => step.replace(/^\d+\.\s+/, ''));
    }
    return [];
  }
}

export const openAIService = new OpenAIService();

