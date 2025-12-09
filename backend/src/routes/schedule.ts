import express, { Request, Response } from 'express';
import { authenticateUser, type AuthRequest } from '../middleware/auth';
import { ScheduleService } from '../services/schedule.service';
import { lionPathService } from '../services/lionpath.service';
import { registrationQueueService } from '../services/registration-queue.service';
import type {
  ScheduleRequest,
  SchedulePreset,
  ScheduleParameters,
} from '../types';

const router = express.Router();
const scheduleService = new ScheduleService();

// Get all courses or search courses
router.get('/courses', authenticateUser, async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    
    if (query) {
      const courses = scheduleService.searchCourses(query);
      res.json(courses);
    } else {
      const courses = scheduleService.getAllCourses();
      res.json(courses);
    }
  } catch (error: any) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get course by code
router.get('/courses/:courseCode', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { courseCode } = req.params;
    const course = scheduleService.getCourseByCode(courseCode);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  } catch (error: any) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Generate schedule
router.post('/generate', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      semester,
      requiredCourses,
      selectedCourses,
      presetId,
      parameters,
    } = req.body;

    if (!semester || !requiredCourses || requiredCourses.length === 0) {
      return res.status(400).json({ error: 'Semester and required courses are required' });
    }

    const request: ScheduleRequest = {
      id: `request-${Date.now()}`,
      userId,
      semester,
      requiredCourses,
      selectedCourses,
      presetId,
      parameters,
      status: 'generating',
      createdAt: new Date(),
    };

    const generatedSchedule = await scheduleService.generateSchedule(request);

    res.json(generatedSchedule);
  } catch (error: any) {
    console.error('Error generating schedule:', error);
    res.status(500).json({ error: error.message || 'Failed to generate schedule' });
  }
});

// Get user's presets
router.get('/presets', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Free presets (available to all users)
    const freePresets: SchedulePreset[] = [
      {
        id: 'free-easy-professors',
        userId: 'system',
        name: 'Prioritize Easy Professors',
        type: 'free',
        parameters: {
          prioritizeEasyProfessors: 100,
          gapPreference: 'balanced',
          classSizePreference: 'any',
          onlinePreference: 'any',
        },
        createdAt: new Date(),
      },
      {
        id: 'free-late-start',
        userId: 'system',
        name: 'Prioritize Late In',
        type: 'free',
        parameters: {
          prioritizeLateStart: 100,
          preferredStartTime: '11:00',
          gapPreference: 'balanced',
          classSizePreference: 'any',
          onlinePreference: 'any',
        },
        createdAt: new Date(),
      },
      {
        id: 'free-early-end',
        userId: 'system',
        name: 'Prioritize Early Out',
        type: 'free',
        parameters: {
          prioritizeEarlyEnd: 100,
          preferredEndTime: '14:00',
          gapPreference: 'balanced',
          classSizePreference: 'any',
          onlinePreference: 'any',
        },
        createdAt: new Date(),
      },
    ];

    // TODO: Load custom presets from database for this user
    res.json(freePresets);
  } catch (error: any) {
    console.error('Error fetching presets:', error);
    res.status(500).json({ error: 'Failed to fetch presets' });
  }
});

// Create custom preset (Pro only)
router.post('/presets', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // TODO: Check if user is Pro

    const { name, parameters } = req.body;

    if (!name || !parameters) {
      return res.status(400).json({ error: 'Name and parameters are required' });
    }

    const preset: SchedulePreset = {
      id: `preset-${Date.now()}`,
      userId,
      name,
      type: 'custom',
      parameters,
      createdAt: new Date(),
    };

    // TODO: Save to database
    res.json(preset);
  } catch (error: any) {
    console.error('Error creating preset:', error);
    res.status(500).json({ error: 'Failed to create preset' });
  }
});

// Update preset (Pro only)
router.put('/presets/:id', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // TODO: Check if user is Pro and owns the preset
    // TODO: Update in database

    res.json({ message: 'Preset updated' });
  } catch (error: any) {
    console.error('Error updating preset:', error);
    res.status(500).json({ error: 'Failed to update preset' });
  }
});

// Delete preset (Pro only)
router.delete('/presets/:id', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // TODO: Check if user is Pro and owns the preset
    // TODO: Delete from database

    res.json({ message: 'Preset deleted' });
  } catch (error: any) {
    console.error('Error deleting preset:', error);
    res.status(500).json({ error: 'Failed to delete preset' });
  }
});

// Add to registration queue
router.post('/register', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { scheduleId, sections, registrationDate } = req.body;

    if (!scheduleId || !sections || !registrationDate) {
      return res.status(400).json({ error: 'Schedule ID, sections, and registration date are required' });
    }

    const queueItem = registrationQueueService.addToQueue(
      userId,
      scheduleId,
      sections,
      new Date(registrationDate)
    );

    res.json(queueItem);
  } catch (error: any) {
    console.error('Error adding to registration queue:', error);
    res.status(500).json({ error: 'Failed to add to registration queue' });
  }
});

// Get registration queue
router.get('/queue', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const queue = registrationQueueService.getUserQueue(userId);
    res.json(queue);
  } catch (error: any) {
    console.error('Error fetching registration queue:', error);
    res.status(500).json({ error: 'Failed to fetch registration queue' });
  }
});

// Connect to LionPath
router.post('/lionpath/connect', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const connected = lionPathService.connect(userId, { username, password });

    if (connected) {
      res.json({ 
        success: true, 
        message: 'Successfully connected to LionPath (Demo Mode)',
        note: 'This is a demo. Real LionPath integration coming soon.',
      });
    } else {
      res.status(400).json({ error: 'Failed to connect to LionPath' });
    }
  } catch (error: any) {
    console.error('Error connecting to LionPath:', error);
    res.status(500).json({ error: 'Failed to connect to LionPath' });
  }
});

// Get LionPath connection status
router.get('/lionpath/status', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const connected = lionPathService.isConnected(userId);
    res.json({ connected });
  } catch (error: any) {
    console.error('Error checking LionPath status:', error);
    res.status(500).json({ error: 'Failed to check LionPath status' });
  }
});

// Disconnect from LionPath
router.post('/lionpath/disconnect', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    lionPathService.disconnect(userId);
    res.json({ success: true, message: 'Disconnected from LionPath' });
  } catch (error: any) {
    console.error('Error disconnecting from LionPath:', error);
    res.status(500).json({ error: 'Failed to disconnect from LionPath' });
  }
});

export default router;

