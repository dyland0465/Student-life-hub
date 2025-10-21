import express from 'express';
import { authenticateUser, optionalAuth } from '../middleware/auth';
import { aiLimiter, ezSolveLimiter } from '../middleware/rateLimiter';
import { openAIService } from '../services/openai.service';

const router = express.Router();

// EZSolve - Solve assignment with AI
router.post('/solve-assignment', authenticateUser, ezSolveLimiter, async (req, res, next) => {
  try {
    const { assignment } = req.body;

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

    const solution = await openAIService.solveAssignment({
      title: assignment.title,
      description: assignment.description,
    });

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

export default router;

