import express from 'express';
import { authenticateUser, optionalAuth } from '../middleware/auth';
import { aiLimiter, ezSolveLimiter } from '../middleware/rateLimiter';
import { openAIService } from '../services/openai.service';

const router = express.Router();

// EZSolve - Solve assignment with AI
router.post('/solve-assignment', authenticateUser, ezSolveLimiter, async (req, res, next) => {
  try {
    const { assignment, config } = req.body;

    if (!assignment || !assignment.title) {
      return res.status(400).json({ error: 'Assignment title is required' });
    }

    // Validate input
    if (assignment.title.length > 500) {
      return res.status(400).json({ error: 'Assignment title too long (max 500 characters)' });
    }

    if (assignment.description && assignment.description.length > 2000) {
      return res.status(400).json({ error: 'Description too long (max 2000 characters)' });
    }

    // Validate config if provided
    if (config) {
      if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
        return res.status(400).json({ error: 'Temperature must be between 0 and 2' });
      }
      if (config.maxTokens !== undefined && (config.maxTokens < 100 || config.maxTokens > 4000)) {
        return res.status(400).json({ error: 'Max tokens must be between 100 and 4000' });
      }
      if (config.waitTimeBeforeSubmission !== undefined && (config.waitTimeBeforeSubmission < 0 || config.waitTimeBeforeSubmission > 300)) {
        return res.status(400).json({ error: 'Wait time must be between 0 and 300 seconds' });
      }
    }

    const solution = await openAIService.solveAssignment({
      title: assignment.title,
      description: assignment.description,
    }, config);

    res.json({
      success: true,
      solution: {
        ...solution,
        assignmentId: assignment.id,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get workout recommendations
router.post('/workout-recommendations', optionalAuth, aiLimiter, async (req, res, next) => {
  try {
    const { fitnessLevel, goals, availableTime } = req.body;

    const recommendations = await openAIService.getWorkoutRecommendations({
      fitnessLevel,
      goals,
      availableTime,
    });

    res.json({
      success: true,
      recommendations,
    });
  } catch (error) {
    next(error);
  }
});

// Analyze sleep pattern
router.post('/sleep-insights', optionalAuth, aiLimiter, async (req, res, next) => {
  try {
    const { averageHours, consistency, recentLogs } = req.body;

    if (typeof averageHours !== 'number' || typeof consistency !== 'number') {
      return res.status(400).json({ error: 'Invalid sleep data' });
    }

    const insights = await openAIService.analyzeSleepPattern({
      averageHours,
      consistency,
      recentLogs: recentLogs || [],
    });

    res.json({
      success: true,
      insights,
    });
  } catch (error) {
    next(error);
  }
});

// Get meal recommendations
router.post('/meal-recommendations', optionalAuth, aiLimiter, async (req, res, next) => {
  try {
    const { mealHistory, preferences, dietaryRestrictions, targetCalories } = req.body;

    const recommendations = await openAIService.getMealRecommendations({
      mealHistory: mealHistory || [],
      preferences: preferences || [],
      dietaryRestrictions: dietaryRestrictions || [],
      targetCalories,
    });

    res.json({
      success: true,
      recommendations,
    });
  } catch (error) {
    next(error);
  }
});

// Get shopping list suggestions
router.post('/shopping-list-suggestions', optionalAuth, aiLimiter, async (req, res, next) => {
  try {
    const { mealPlan, recentMeals, preferences } = req.body;

    const suggestions = await openAIService.getShoppingListSuggestions({
      mealPlan: mealPlan || [],
      recentMeals: recentMeals || [],
      preferences: preferences || [],
    });

    res.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

