import express, { Request, Response } from 'express';
import { authenticateUser, type AuthRequest } from '../middleware/auth';
import admin from '../config/firebase';

const router = express.Router();

// Helper functions
function getUserId(req: AuthRequest): string | null {
  return req.user?.uid || null;
}

function checkFirebaseAdmin(): void {
  if (admin.apps.length === 0) {
    throw new Error('Database not available. Please check server configuration.');
  }
}

function validateMealType(mealType: string): void {
  if (!['Breakfast', 'Lunch', 'Dinner', 'Snack'].includes(mealType)) {
    throw new Error('Invalid meal type. Must be Breakfast, Lunch, Dinner, or Snack');
  }
}

function handleError(error: any, res: Response, defaultMessage: string, logMessage: string): void {
  console.error(logMessage, error);
  const status = error.message === 'Unauthorized' ? 401
    : error.message === 'Forbidden' ? 403
    : error.message === 'Meal not found' ? 404
    : 500;
  
  res.status(status).json({
    error: error.message || defaultMessage,
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
}

type RouteHandler = (req: AuthRequest, res: Response) => Promise<void>;

function asyncHandler(handler: RouteHandler, errorMessage: string, logMessage: string) {
  return async (req: AuthRequest, res: Response) => {
    try {
      await handler(req, res);
    } catch (error: any) {
      handleError(error, res, errorMessage, logMessage);
    }
  };
}

// Health check endpoint
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      openai: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key-here',
      firebase: !!process.env.FIREBASE_PROJECT_ID,
    }
  });
});

// Create meal
router.post('/meals', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  checkFirebaseAdmin();

  const { mealType, foodName, calories, protein, carbs, fats, date, notes } = req.body;

  if (!mealType || !foodName || calories === undefined || protein === undefined || carbs === undefined || fats === undefined || !date) {
    throw new Error('Missing required fields: mealType, foodName, calories, protein, carbs, fats, date');
  }

  validateMealType(mealType);

  const now = new Date();
  const mealDate = new Date(date);
  
  const mealData: any = {
    userId,
    mealType,
    foodName,
    calories: parseFloat(calories) || 0,
    protein: parseFloat(protein) || 0,
    carbs: parseFloat(carbs) || 0,
    fats: parseFloat(fats) || 0,
    date: admin.firestore.Timestamp.fromDate(mealDate),
    createdAt: admin.firestore.Timestamp.fromDate(now),
  };

  if (notes && notes.trim()) {
    mealData.notes = notes.trim();
  }

  const docRef = await admin.firestore().collection('meals').add(mealData);
  
  // Return the response with proper serialized dates
  res.status(201).json({
    id: docRef.id,
    userId,
    mealType,
    foodName,
    calories: parseFloat(calories) || 0,
    protein: parseFloat(protein) || 0,
    carbs: parseFloat(carbs) || 0,
    fats: parseFloat(fats) || 0,
    date: mealDate.toISOString(),
    createdAt: now.toISOString(),
    notes: notes && notes.trim() ? notes.trim() : undefined,
  });
}, 'Failed to create meal', 'Error creating meal:'));

// Get meals
router.get('/meals', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  checkFirebaseAdmin();

  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

  const mealsRef = admin.firestore().collection('meals');
  const query = mealsRef.where('userId', '==', userId).limit(limit);
  
  const snapshot = await query.get();
  
  const meals = snapshot.docs.map(doc => {
    const data = doc.data();
    const mealDate = data.date?.toDate() || new Date();
    const mealCreatedAt = data.createdAt?.toDate() || new Date();
    
    return {
      id: doc.id,
      userId: data.userId,
      mealType: data.mealType,
      foodName: data.foodName,
      calories: data.calories,
      protein: data.protein,
      carbs: data.carbs,
      fats: data.fats,
      date: mealDate.toISOString(),
      createdAt: mealCreatedAt.toISOString(),
      notes: data.notes || undefined,
      _dateObj: mealDate, // Keep for sorting
    };
  });

  // Sort by date descending on the server side
  meals.sort((a: any, b: any) => b._dateObj.getTime() - a._dateObj.getTime());

  // Remove the temporary _dateObj field before sending
  const mealsToSend = meals.map(({ _dateObj, ...meal }: any) => meal);

  res.json(mealsToSend);
}, 'Failed to fetch meals', 'Error fetching meals:'));

// Update meal
router.put('/meals/:id', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  checkFirebaseAdmin();

  const { id } = req.params;
  const { mealType, foodName, calories, protein, carbs, fats, date, notes } = req.body;

  const mealRef = admin.firestore().collection('meals').doc(id);
  const mealDoc = await mealRef.get();

  if (!mealDoc.exists) {
    throw new Error('Meal not found');
  }

  const mealData = mealDoc.data();
  if (mealData?.userId !== userId) {
    throw new Error('Forbidden');
  }

  const updateData: any = {};

  if (mealType !== undefined) {
    validateMealType(mealType);
    updateData.mealType = mealType;
  }
  if (foodName !== undefined) updateData.foodName = foodName;
  if (calories !== undefined) updateData.calories = parseFloat(calories) || 0;
  if (protein !== undefined) updateData.protein = parseFloat(protein) || 0;
  if (carbs !== undefined) updateData.carbs = parseFloat(carbs) || 0;
  if (fats !== undefined) updateData.fats = parseFloat(fats) || 0;
  if (date !== undefined) updateData.date = admin.firestore.Timestamp.fromDate(new Date(date));
  if (notes !== undefined) updateData.notes = notes.trim() || null;

  await mealRef.update(updateData);
  
  const updatedDoc = await mealRef.get();
  const updatedData = updatedDoc.data();
  
  if (!updatedData) {
    throw new Error('Failed to retrieve updated meal');
  }
  
  res.json({
    id: updatedDoc.id,
    userId: updatedData.userId,
    mealType: updatedData.mealType,
    foodName: updatedData.foodName,
    calories: updatedData.calories,
    protein: updatedData.protein,
    carbs: updatedData.carbs,
    fats: updatedData.fats,
    date: (updatedData.date?.toDate() || new Date()).toISOString(),
    createdAt: (updatedData.createdAt?.toDate() || new Date()).toISOString(),
    notes: updatedData.notes || undefined,
  });
}, 'Failed to update meal', 'Error updating meal:'));

// Delete meal
router.delete('/meals/:id', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  checkFirebaseAdmin();

  const { id } = req.params;
  const mealRef = admin.firestore().collection('meals').doc(id);
  const mealDoc = await mealRef.get();

  if (!mealDoc.exists) {
    throw new Error('Meal not found');
  }

  const mealData = mealDoc.data();
  if (mealData?.userId !== userId) {
    throw new Error('Forbidden');
  }

  await mealRef.delete();
  res.status(204).send();
}, 'Failed to delete meal', 'Error deleting meal:'));

// ==================== WORKOUT ENDPOINTS ====================

// Get workout logs
router.get('/workouts', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  checkFirebaseAdmin();

  const limitNum = req.query.limit ? parseInt(req.query.limit as string) : 20;

  const logsRef = admin.firestore().collection('workoutLogs');
  const query = logsRef.where('userId', '==', userId).limit(limitNum);
  
  const snapshot = await query.get();
  
  const workouts = snapshot.docs.map(doc => {
    const data = doc.data();
    const workoutDate = data.date?.toDate() || new Date();
    
    return {
      id: doc.id,
      userId: data.userId,
      routineId: data.routineId || null,
      routineName: data.routineName,
      duration: data.duration,
      type: data.type,
      date: workoutDate.toISOString(),
      notes: data.notes || undefined,
      _dateObj: workoutDate,
    };
  });

  // Sort by date descending
  workouts.sort((a: any, b: any) => b._dateObj.getTime() - a._dateObj.getTime());

  // Remove the temporary _dateObj field before sending
  const workoutsToSend = workouts.map(({ _dateObj, ...workout }: any) => workout);

  res.json(workoutsToSend);
}, 'Failed to fetch workouts', 'Error fetching workouts:'));

// Create workout log
router.post('/workouts', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  checkFirebaseAdmin();

  const { routineId, routineName, type, duration, date, notes } = req.body;

  if (!routineName || !type || !duration || !date) {
    throw new Error('Missing required fields: routineName, type, duration, date');
  }

  const workoutDate = new Date(date);
  
  const workoutData: any = {
    userId,
    routineId: routineId || null,
    routineName,
    type,
    duration: parseInt(duration),
    date: admin.firestore.Timestamp.fromDate(workoutDate),
  };

  if (notes && notes.trim()) {
    workoutData.notes = notes.trim();
  }

  const docRef = await admin.firestore().collection('workoutLogs').add(workoutData);
  
  res.status(201).json({
    id: docRef.id,
    userId,
    routineId: routineId || null,
    routineName,
    type,
    duration: parseInt(duration),
    date: workoutDate.toISOString(),
    notes: notes && notes.trim() ? notes.trim() : undefined,
  });
}, 'Failed to create workout', 'Error creating workout:'));

// Delete workout log
router.delete('/workouts/:id', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  checkFirebaseAdmin();

  const { id } = req.params;
  const workoutRef = admin.firestore().collection('workoutLogs').doc(id);
  const workoutDoc = await workoutRef.get();

  if (!workoutDoc.exists) {
    throw new Error('Workout not found');
  }

  const workoutData = workoutDoc.data();
  if (workoutData?.userId !== userId) {
    throw new Error('Forbidden');
  }

  await workoutRef.delete();
  res.status(204).send();
}, 'Failed to delete workout', 'Error deleting workout:'));

// ==================== ROUTINE ENDPOINTS ====================

// Get fitness routines
router.get('/routines', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  checkFirebaseAdmin();

  const routinesRef = admin.firestore().collection('fitnessRoutines');
  const query = routinesRef.where('userId', '==', userId);
  
  const snapshot = await query.get();
  
  const routines = snapshot.docs.map(doc => {
    const data = doc.data();
    const createdAt = data.createdAt?.toDate() || new Date();
    
    return {
      id: doc.id,
      userId: data.userId,
      routineName: data.routineName,
      duration: data.duration,
      type: data.type,
      description: data.description || undefined,
      createdAt: createdAt.toISOString(),
    };
  });

  res.json(routines);
}, 'Failed to fetch routines', 'Error fetching routines:'));

// Create fitness routine
router.post('/routines', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  checkFirebaseAdmin();

  const { routineName, type, duration, description } = req.body;

  if (!routineName || !type || !duration) {
    throw new Error('Missing required fields: routineName, type, duration');
  }

  const now = new Date();
  
  const routineData: any = {
    userId,
    routineName,
    type,
    duration: parseInt(duration),
    createdAt: admin.firestore.Timestamp.fromDate(now),
  };

  if (description && description.trim()) {
    routineData.description = description.trim();
  }

  const docRef = await admin.firestore().collection('fitnessRoutines').add(routineData);
  
  res.status(201).json({
    id: docRef.id,
    userId,
    routineName,
    type,
    duration: parseInt(duration),
    description: description && description.trim() ? description.trim() : undefined,
    createdAt: now.toISOString(),
  });
}, 'Failed to create routine', 'Error creating routine:'));

// Delete fitness routine
router.delete('/routines/:id', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  checkFirebaseAdmin();

  const { id } = req.params;
  const routineRef = admin.firestore().collection('fitnessRoutines').doc(id);
  const routineDoc = await routineRef.get();

  if (!routineDoc.exists) {
    throw new Error('Routine not found');
  }

  const routineData = routineDoc.data();
  if (routineData?.userId !== userId) {
    throw new Error('Forbidden');
  }

  await routineRef.delete();
  res.status(204).send();
}, 'Failed to delete routine', 'Error deleting routine:'));

// ==================== SHOPPING LIST ENDPOINTS ====================

// Get shopping lists
router.get('/shopping-lists', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  checkFirebaseAdmin();

  const listsRef = admin.firestore().collection('shoppingLists');
  const query = listsRef.where('userId', '==', userId);
  
  const snapshot = await query.get();
  
  const lists = snapshot.docs.map(doc => {
    const data = doc.data();
    const createdAt = data.createdAt?.toDate() || new Date();
    const updatedAt = data.updatedAt?.toDate() || new Date();
    
    return {
      id: doc.id,
      userId: data.userId,
      name: data.name,
      items: data.items || [],
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      _updatedAtObj: updatedAt,
    };
  });

  // Sort by updatedAt descending
  lists.sort((a: any, b: any) => b._updatedAtObj.getTime() - a._updatedAtObj.getTime());

  // Remove the temporary field before sending
  const listsToSend = lists.map(({ _updatedAtObj, ...list }: any) => list);

  res.json(listsToSend);
}, 'Failed to fetch shopping lists', 'Error fetching shopping lists:'));

// Create shopping list
router.post('/shopping-lists', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  checkFirebaseAdmin();

  const { name, items } = req.body;

  if (!name) {
    throw new Error('Missing required field: name');
  }

  const now = new Date();
  
  const listData = {
    userId,
    name,
    items: items || [],
    createdAt: admin.firestore.Timestamp.fromDate(now),
    updatedAt: admin.firestore.Timestamp.fromDate(now),
  };

  const docRef = await admin.firestore().collection('shoppingLists').add(listData);
  
  res.status(201).json({
    id: docRef.id,
    userId,
    name,
    items: items || [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });
}, 'Failed to create shopping list', 'Error creating shopping list:'));

// Update shopping list
router.put('/shopping-lists/:id', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  checkFirebaseAdmin();

  const { id } = req.params;
  const { name, items } = req.body;

  const listRef = admin.firestore().collection('shoppingLists').doc(id);
  const listDoc = await listRef.get();

  if (!listDoc.exists) {
    throw new Error('Shopping list not found');
  }

  const listData = listDoc.data();
  if (listData?.userId !== userId) {
    throw new Error('Forbidden');
  }

  const now = new Date();
  const updateData: any = {
    updatedAt: admin.firestore.Timestamp.fromDate(now),
  };

  if (name !== undefined) updateData.name = name;
  if (items !== undefined) updateData.items = items;

  await listRef.update(updateData);
  
  const updatedDoc = await listRef.get();
  const updatedData = updatedDoc.data();
  
  if (!updatedData) {
    throw new Error('Failed to retrieve updated shopping list');
  }
  
  res.json({
    id: updatedDoc.id,
    userId: updatedData.userId,
    name: updatedData.name,
    items: updatedData.items || [],
    createdAt: (updatedData.createdAt?.toDate() || new Date()).toISOString(),
    updatedAt: (updatedData.updatedAt?.toDate() || new Date()).toISOString(),
  });
}, 'Failed to update shopping list', 'Error updating shopping list:'));

// Delete shopping list
router.delete('/shopping-lists/:id', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  checkFirebaseAdmin();

  const { id } = req.params;
  const listRef = admin.firestore().collection('shoppingLists').doc(id);
  const listDoc = await listRef.get();

  if (!listDoc.exists) {
    throw new Error('Shopping list not found');
  }

  const listData = listDoc.data();
  if (listData?.userId !== userId) {
    throw new Error('Forbidden');
  }

  await listRef.delete();
  res.status(204).send();
}, 'Failed to delete shopping list', 'Error deleting shopping list:'));

// ==================== SLEEP ENDPOINTS ====================

// Get sleep schedule
router.get('/sleep-schedule', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  checkFirebaseAdmin();

  const scheduleRef = admin.firestore().collection('sleepSchedules').doc(userId);
  const scheduleDoc = await scheduleRef.get();

  if (!scheduleDoc.exists) {
    res.json(null);
    return;
  }

  const data = scheduleDoc.data();
  res.json({
    id: scheduleDoc.id,
    userId: data?.userId,
    bedTime: data?.bedTime,
    wakeTime: data?.wakeTime,
    targetHours: data?.targetHours,
  });
}, 'Failed to fetch sleep schedule', 'Error fetching sleep schedule:'));

// Create or update sleep schedule
router.put('/sleep-schedule', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  checkFirebaseAdmin();

  const { bedTime, wakeTime, targetHours } = req.body;

  if (!bedTime || !wakeTime || targetHours === undefined) {
    throw new Error('Missing required fields: bedTime, wakeTime, targetHours');
  }

  const scheduleData = {
    id: userId,
    userId,
    bedTime,
    wakeTime,
    targetHours: parseFloat(targetHours),
  };

  const scheduleRef = admin.firestore().collection('sleepSchedules').doc(userId);
  await scheduleRef.set(scheduleData);

  res.json(scheduleData);
}, 'Failed to update sleep schedule', 'Error updating sleep schedule:'));

// Get sleep logs
router.get('/sleep-logs', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  checkFirebaseAdmin();

  const limitNum = req.query.limit ? parseInt(req.query.limit as string) : 30;

  const logsRef = admin.firestore().collection('sleepLogs');
  const query = logsRef.where('userId', '==', userId).limit(limitNum);
  
  const snapshot = await query.get();
  
  const logs = snapshot.docs.map(doc => {
    const data = doc.data();
    const logDate = data.date?.toDate() || new Date();
    
    return {
      id: doc.id,
      userId: data.userId,
      date: logDate.toISOString(),
      bedTime: data.bedTime,
      wakeTime: data.wakeTime,
      actualHours: data.actualHours,
      quality: data.quality || undefined,
      notes: data.notes || undefined,
      _dateObj: logDate,
    };
  });

  // Sort by date descending
  logs.sort((a: any, b: any) => b._dateObj.getTime() - a._dateObj.getTime());

  // Remove the temporary field before sending
  const logsToSend = logs.map(({ _dateObj, ...log }: any) => log);

  res.json(logsToSend);
}, 'Failed to fetch sleep logs', 'Error fetching sleep logs:'));

// Create sleep log
router.post('/sleep-logs', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  checkFirebaseAdmin();

  const { date, bedTime, wakeTime, actualHours, quality, notes } = req.body;

  if (!date || !bedTime || !wakeTime || actualHours === undefined) {
    throw new Error('Missing required fields: date, bedTime, wakeTime, actualHours');
  }

  const logDate = new Date(date);
  
  const logData: any = {
    userId,
    date: admin.firestore.Timestamp.fromDate(logDate),
    bedTime,
    wakeTime,
    actualHours: parseFloat(actualHours),
  };

  if (quality) {
    logData.quality = quality;
  }
  if (notes && notes.trim()) {
    logData.notes = notes.trim();
  }

  const docRef = await admin.firestore().collection('sleepLogs').add(logData);
  
  res.status(201).json({
    id: docRef.id,
    userId,
    date: logDate.toISOString(),
    bedTime,
    wakeTime,
    actualHours: parseFloat(actualHours),
    quality: quality || undefined,
    notes: notes && notes.trim() ? notes.trim() : undefined,
  });
}, 'Failed to create sleep log', 'Error creating sleep log:'));

// Delete sleep log
router.delete('/sleep-logs/:id', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  checkFirebaseAdmin();

  const { id } = req.params;
  const logRef = admin.firestore().collection('sleepLogs').doc(id);
  const logDoc = await logRef.get();

  if (!logDoc.exists) {
    throw new Error('Sleep log not found');
  }

  const logData = logDoc.data();
  if (logData?.userId !== userId) {
    throw new Error('Forbidden');
  }

  await logRef.delete();
  res.status(204).send();
}, 'Failed to delete sleep log', 'Error deleting sleep log:'));

export default router;

