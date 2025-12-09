import OpenAI from 'openai';

class OpenAIService {
  private client: OpenAI | null = null;
  private isConfigured: boolean = false;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (apiKey && apiKey !== 'your-openai-api-key-here') {
      this.client = new OpenAI({ apiKey });
      this.isConfigured = true;
      console.log('OpenAI service initialized');
    } else {
      console.warn('OpenAI API key not configured. AI features will use mock data.');
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

  async getMealRecommendations(data: {
    mealHistory?: any[];
    preferences?: string[];
    dietaryRestrictions?: string[];
    targetCalories?: number;
  }): Promise<any[]> {
    if (!this.isConfigured || !this.client) {
      return this.getMockMealRecommendations(data);
    }

    try {
      const historyContext = data.mealHistory && data.mealHistory.length > 0
        ? `Recent meals: ${data.mealHistory.slice(0, 5).map((m: any) => m.foodName).join(', ')}`
        : 'No meal history available';
      
      const prompt = `Create 3-4 personalized meal recommendations for a student with:
- Meal History: ${historyContext}
- Preferences: ${data.preferences?.join(', ') || 'none specified'}
- Dietary Restrictions: ${data.dietaryRestrictions?.join(', ') || 'none'}
- Target Calories: ${data.targetCalories || 'not specified'} per day

Format as a JSON array with: foodName, mealType (Breakfast/Lunch/Dinner/Snack), calories, protein (grams), carbs (grams), fats (grams), description`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a nutritionist creating healthy meal recommendations for busy students.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 600,
      });

      const content = response.choices[0].message.content || '';
      
      try {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : this.getMockMealRecommendations(data);
      } catch {
        return this.getMockMealRecommendations(data);
      }
    } catch (error) {
      console.error('OpenAI meal recommendations error:', error);
      return this.getMockMealRecommendations(data);
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
    if (!this.isConfigured || !this.client) {
      return this.getMockShoppingListSuggestions(data);
    }

    try {
      const mealContext = data.mealPlan && data.mealPlan.length > 0
        ? `Planned meals: ${data.mealPlan.map((m: any) => m.foodName || m.name).join(', ')}`
        : data.recentMeals && data.recentMeals.length > 0
        ? `Recent meals: ${data.recentMeals.slice(0, 5).map((m: any) => m.foodName).join(', ')}`
        : 'No meal context available';

      const prompt = `Generate a shopping list based on:
- ${mealContext}
- Preferences: ${data.preferences?.join(', ') || 'none specified'}

Provide:
1. A list of grocery items with quantities
2. 2-3 helpful shopping tips

Format as JSON: { "items": [{"name": "...", "quantity": "..."}], "suggestions": ["...", "..."] }`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant creating shopping lists for students based on their meal plans.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const content = response.choices[0].message.content || '';
      
      try {
        return JSON.parse(content);
      } catch {
        return this.getMockShoppingListSuggestions(data);
      }
    } catch (error) {
      console.error('OpenAI shopping list error:', error);
      return this.getMockShoppingListSuggestions(data);
    }
  }

  private extractSteps(content: string): string[] {
    // Try to extract numbered steps from the content
    const stepMatches = content.match(/\d+\.\s+[^\n]+/g);
    if (stepMatches && stepMatches.length > 0) {
      return stepMatches.map(step => step.replace(/^\d+\.\s+/, ''));
    }
    return [];
  }

  private getMockMealRecommendations(data: any) {
    return [
      {
        foodName: 'Greek Yogurt with Berries and Granola',
        mealType: 'Breakfast',
        calories: 350,
        protein: 20,
        carbs: 45,
        fats: 8,
        description: 'High-protein breakfast to fuel your morning classes. Rich in antioxidants and fiber.',
      },
      {
        foodName: 'Grilled Chicken Salad',
        mealType: 'Lunch',
        calories: 450,
        protein: 35,
        carbs: 25,
        fats: 20,
        description: 'Balanced lunch with lean protein and fresh vegetables. Perfect for maintaining energy throughout the day.',
      },
      {
        foodName: 'Salmon with Quinoa and Vegetables',
        mealType: 'Dinner',
        calories: 550,
        protein: 40,
        carbs: 50,
        fats: 18,
        description: 'Nutrient-dense dinner with omega-3 fatty acids. Great for brain health and recovery.',
      },
      {
        foodName: 'Apple with Almond Butter',
        mealType: 'Snack',
        calories: 200,
        protein: 6,
        carbs: 25,
        fats: 10,
        description: 'Healthy snack to keep you satisfied between meals. Provides sustained energy.',
      },
    ];
  }

  private getMockShoppingListSuggestions(data: any) {
    return {
      items: [
        { name: 'Chicken Breast', quantity: '1 lb' },
        { name: 'Salmon Fillets', quantity: '2 pieces' },
        { name: 'Greek Yogurt', quantity: '32 oz' },
        { name: 'Mixed Berries', quantity: '1 package' },
        { name: 'Quinoa', quantity: '1 bag' },
        { name: 'Mixed Greens', quantity: '1 bag' },
        { name: 'Almond Butter', quantity: '1 jar' },
        { name: 'Apples', quantity: '6 pieces' },
      ],
      suggestions: [
        'Buy fresh produce at the beginning of the week for maximum freshness',
        'Consider buying frozen fruits and vegetables for longer shelf life',
        'Look for sales on protein sources like chicken and fish',
      ],
    };
  }

  async generateOptimalSchedule(
    courses: any[],
    parameters: any,
    userRequirements: string[]
  ): Promise<{
    sections: any[];
    score: number;
  }> {
    // If OpenAI not configured, return mock schedule
    if (!this.isConfigured || !this.client) {
      return this.getMockSchedule(courses, parameters, userRequirements);
    }

    try {
      const prompt = this.buildSchedulePrompt(courses, parameters, userRequirements);

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that helps students create optimal class schedules. Analyze course sections and select the best combination based on user preferences, avoiding time conflicts and optimizing for the specified parameters.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = response.choices[0].message.content || '';
      return this.parseScheduleResponse(content, courses);
    } catch (error: any) {
      console.error('OpenAI API error in schedule generation:', error);
      return this.getMockSchedule(courses, parameters, userRequirements);
    }
  }

  private buildSchedulePrompt(courses: any[], parameters: any, userRequirements: string[]): string {
    let prompt = `Generate an optimal class schedule for the following courses:\n\n`;

    // Add course information
    for (const course of courses) {
      prompt += `Course: ${course.courseCode} - ${course.courseName}\n`;
      prompt += `Credits: ${course.credits}\n`;
      prompt += `Prerequisites: ${course.prerequisites.join(', ') || 'None'}\n`;
      prompt += `Available Sections:\n`;
      
      for (const section of course.sections) {
        prompt += `  Section ${section.sectionNumber}:\n`;
        prompt += `    Professor: ${section.professor} (Rating: ${section.professorRating || 'N/A'}, Difficulty: ${section.professorDifficulty || 'N/A'})\n`;
        prompt += `    Schedule: ${section.schedule.map((s: any) => `${s.day} ${s.startTime}-${s.endTime}`).join(', ')}\n`;
        prompt += `    Location: ${section.location}\n`;
        prompt += `    Capacity: ${section.enrolled}/${section.capacity}\n`;
        prompt += `    Online: ${section.isOnline ? 'Yes' : 'No'}\n`;
      }
      prompt += '\n';
    }

    // Add parameters
    prompt += `\nOptimization Parameters:\n`;
    if (parameters.prioritizeEasyProfessors) {
      prompt += `- Prioritize Easy Professors: ${parameters.prioritizeEasyProfessors}%\n`;
    }
    if (parameters.prioritizeLateStart) {
      prompt += `- Prioritize Late Start: ${parameters.prioritizeLateStart}%\n`;
    }
    if (parameters.prioritizeEarlyEnd) {
      prompt += `- Prioritize Early End: ${parameters.prioritizeEarlyEnd}%\n`;
    }
    if (parameters.preferredStartTime) {
      prompt += `- Preferred Start Time: ${parameters.preferredStartTime}\n`;
    }
    if (parameters.preferredEndTime) {
      prompt += `- Preferred End Time: ${parameters.preferredEndTime}\n`;
    }
    if (parameters.avoidDays && parameters.avoidDays.length > 0) {
      prompt += `- Avoid Days: ${parameters.avoidDays.join(', ')}\n`;
    }
    if (parameters.gapPreference) {
      prompt += `- Gap Preference: ${parameters.gapPreference}\n`;
    }
    if (parameters.classSizePreference) {
      prompt += `- Class Size Preference: ${parameters.classSizePreference}\n`;
    }
    if (parameters.onlinePreference) {
      prompt += `- Online Preference: ${parameters.onlinePreference}\n`;
    }

    prompt += `\nPlease select one section for each required course, ensuring:\n`;
    prompt += `1. No time conflicts between selected sections\n`;
    prompt += `2. Optimal match with the specified parameters\n`;
    prompt += `3. Sections are not full (enrolled < capacity)\n`;
    prompt += `4. Return the schedule as JSON with sections array and optimization score (0-100)\n`;

    return prompt;
  }

  private parseScheduleResponse(content: string, courses: any[]): {
    sections: any[];
    score: number;
  } {
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          sections: parsed.sections || [],
          score: parsed.score || 75,
        };
      }
    } catch (error) {
      console.error('Error parsing schedule response:', error);
    }

    // Fallback to mock
    return this.getMockSchedule(courses, {}, []);
  }

  private getMockSchedule(courses: any[], parameters: any, userRequirements: string[]): {
    sections: any[];
    score: number;
  } {
    const selectedSections: any[] = [];
    let score = 80;

    for (const course of courses) {
      if (course.sections.length > 0) {
        // Select first available section (can be improved with actual optimization)
        const section = course.sections[0];
        selectedSections.push({
          courseCode: course.courseCode,
          courseName: course.courseName,
          sectionId: section.id,
          sectionNumber: section.sectionNumber,
          professor: section.professor,
          schedule: section.schedule,
          credits: course.credits,
        });

        // Adjust score based on parameters
        if (parameters.prioritizeEasyProfessors && section.professorDifficulty) {
          score += (5 - section.professorDifficulty) * 2;
        }
        if (section.professorRating) {
          score += (section.professorRating - 3) * 5;
        }
      }
    }

    // Normalize score to 0-100
    score = Math.max(0, Math.min(100, score));

    return {
      sections: selectedSections,
      score: Math.round(score),
    };
  }
}

export const openAIService = new OpenAIService();

