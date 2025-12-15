import express, { Request, Response } from 'express';
import { authenticateUser, type AuthRequest } from '../middleware/auth';
import admin from '../config/firebase';
import { EventAggregationService } from '../services/event-aggregation.service';
import { calendarSyncService } from '../services/calendar-sync.service';
import type { Event, CalendarSyncConfig } from '../types';

const router = express.Router();
const eventAggregationService = new EventAggregationService();

// Helper functions
function getUserId(req: AuthRequest): string | null {
  return req.user?.uid || null;
}

function checkFirebaseAdmin(): void {
  if (admin.apps.length === 0) {
    throw new Error('Database not available. Please check server configuration.');
  }
}

function validateCategory(category: string): void {
  if (!['academic', 'personal', 'wellness'].includes(category)) {
    throw new Error('Invalid category. Must be academic, personal, or wellness');
  }
}

function validateService(service: string): 'google' | 'apple' {
  if (!service || !['google', 'apple'].includes(service)) {
    throw new Error('Invalid service. Must be google or apple');
  }
  return service as 'google' | 'apple';
}

function sanitizeSyncConfig(config: CalendarSyncConfig): any {
  return {
    ...config,
    googleCalendar: config.googleCalendar ? {
      connected: config.googleCalendar.connected,
      calendarId: config.googleCalendar.calendarId,
      lastSync: config.googleCalendar.lastSync,
      syncEnabled: config.googleCalendar.syncEnabled,
    } : undefined,
    appleCalendar: config.appleCalendar ? {
      connected: config.appleCalendar.connected,
      serverUrl: config.appleCalendar.serverUrl,
      calendarName: config.appleCalendar.calendarName,
      lastSync: config.appleCalendar.lastSync,
      syncEnabled: config.appleCalendar.syncEnabled,
    } : undefined,
  };
}

async function getEventDoc(id: string) {
  const eventRef = admin.firestore().collection('events').doc(id);
  const eventDoc = await eventRef.get();
  if (!eventDoc.exists) {
    throw new Error('Event not found');
  }
  return { ref: eventRef, doc: eventDoc, data: eventDoc.data()! };
}

function ensureEventOwnership(eventData: any, userId: string): void {
  if (eventData.userId !== userId) {
    throw new Error('Forbidden');
  }
}

function ensureManualEvent(eventData: any): void {
  if (eventData.source !== 'manual') {
    throw new Error('Cannot modify auto-generated events');
  }
}

function handleError(error: any, res: Response, defaultMessage: string, logMessage: string): void {
  console.error(logMessage, error);
  const status = error.message === 'Unauthorized' ? 401
    : error.message === 'Forbidden' ? 403
    : error.message === 'Event not found' ? 404
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

// Create event
router.post('/events', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  checkFirebaseAdmin();

  const { title, date, time, category, description } = req.body;

  if (!title || !date || !category) {
    throw new Error('Missing required fields: title, date, category');
  }

  validateCategory(category);

  const eventData = {
    userId,
    title,
    date,
    time: time || null,
    category,
    description: description || '',
    source: 'manual' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const docRef = await admin.firestore().collection('events').add(eventData);
  const event: Event = {
    id: docRef.id,
    ...eventData,
  };

  res.status(201).json(event);
}, 'Failed to create event', 'Error creating event:'));

// Get events
router.get('/events', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  checkFirebaseAdmin();

  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  const config = await calendarSyncService.getSyncConfig(userId);
  const events = await eventAggregationService.getEvents(userId, startDate, endDate, config || undefined);

  res.json(events);
}, 'Failed to fetch events', 'Error fetching events:'));

// Update event
router.put('/events/:id', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  checkFirebaseAdmin();

  const { id } = req.params;
  const { title, date, time, category, description } = req.body;

  const { ref: eventRef, data: eventData } = await getEventDoc(id);
  ensureEventOwnership(eventData, userId);
  ensureManualEvent(eventData);

  const updateData: any = { updatedAt: new Date() };

  if (title !== undefined) updateData.title = title;
  if (date !== undefined) updateData.date = date;
  if (time !== undefined) updateData.time = time;
  if (category !== undefined) {
    validateCategory(category);
    updateData.category = category;
  }
  if (description !== undefined) updateData.description = description;

  await eventRef.update(updateData);
  const updatedDoc = await eventRef.get();
  const event: Event = {
    id: updatedDoc.id,
    ...updatedDoc.data(),
    createdAt: updatedDoc.data()?.createdAt?.toDate() || new Date(),
    updatedAt: updatedDoc.data()?.updatedAt?.toDate() || new Date(),
  } as Event;

  res.json(event);
}, 'Failed to update event', 'Error updating event:'));

// Delete event
router.delete('/events/:id', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  checkFirebaseAdmin();

  const { id } = req.params;
  const { ref: eventRef, data: eventData } = await getEventDoc(id);
  ensureEventOwnership(eventData, userId);
  ensureManualEvent(eventData);

  await eventRef.delete();
  res.status(204).send();
}, 'Failed to delete event', 'Error deleting event:'));

// Get sync configuration
router.get('/sync/config', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  const config = await calendarSyncService.getSyncConfig(userId);
  if (!config) {
    throw new Error('Failed to get sync config');
  }

  res.json(sanitizeSyncConfig(config));
}, 'Failed to fetch sync config', 'Error fetching sync config:'));

// Update sync configuration
router.put('/sync/config', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  const { eventSources, syncFrequency } = req.body;

  const updates: any = {};
  if (eventSources !== undefined) updates.eventSources = eventSources;
  if (syncFrequency !== undefined) updates.syncFrequency = syncFrequency;

  const config = await calendarSyncService.updateSyncConfig(userId, updates);
  if (!config) {
    throw new Error('Failed to update sync config');
  }

  res.json(sanitizeSyncConfig(config));
}, 'Failed to update sync config', 'Error updating sync config:'));

// Connect Google Calendar
router.post('/sync/google/connect', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  const { accessToken, refreshToken, calendarId } = req.body;

  if (!accessToken || !refreshToken) {
    throw new Error('Missing accessToken or refreshToken');
  }

  const success = await calendarSyncService.connectGoogleCalendar(
    userId,
    accessToken,
    refreshToken,
    calendarId
  );

  if (!success) {
    throw new Error('Failed to connect Google Calendar');
  }

  res.json({ success: true, message: 'Google Calendar connected successfully' });
}, 'Failed to connect Google Calendar', 'Error connecting Google Calendar:'));

// Connect Apple Calendar
router.post('/sync/apple/connect', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  const { serverUrl, username, password, calendarName } = req.body;

  if (!serverUrl || !username || !password) {
    throw new Error('Missing required fields: serverUrl, username, password');
  }

  const success = await calendarSyncService.connectAppleCalendar(
    userId,
    serverUrl,
    username,
    password,
    calendarName
  );

  if (!success) {
    throw new Error('Failed to connect Apple Calendar');
  }

  res.json({ success: true, message: 'Apple Calendar connected successfully' });
}, 'Failed to connect Apple Calendar', 'Error connecting Apple Calendar:'));

// Disconnect calendar service
router.post('/sync/disconnect', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  const service = validateService(req.body.service);

  const success = await calendarSyncService.disconnectCalendar(userId, service);

  if (!success) {
    throw new Error(`Failed to disconnect ${service} calendar`);
  }

  res.json({ success: true, message: `${service} calendar disconnected successfully` });
}, 'Failed to disconnect calendar', 'Error disconnecting calendar:'));

// Push events to external calendar
router.post('/sync/push', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  const service = validateService(req.body.service);

  const config = await calendarSyncService.getSyncConfig(userId);
  const events = await eventAggregationService.getEvents(userId, undefined, undefined, config || undefined);
  const manualEvents = events.filter(e => e.source === 'manual');

  const syncedCount = service === 'google'
    ? await calendarSyncService.pushToGoogleCalendar(userId, manualEvents)
    : await calendarSyncService.pushToAppleCalendar(userId, manualEvents);

  res.json({ success: true, syncedCount, message: `Synced ${syncedCount} events to ${service} calendar` });
}, 'Failed to push events', 'Error pushing events:'));

// Pull events from external calendar
router.post('/sync/pull', authenticateUser, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  if (!userId) throw new Error('Unauthorized');

  const service = validateService(req.body.service);

  const events: Event[] = service === 'google'
    ? await calendarSyncService.pullFromGoogleCalendar(userId)
    : await calendarSyncService.pullFromAppleCalendar(userId);

  const db = admin.firestore();
  for (const event of events) {
    await db.collection('events').add({
      ...event,
      source: service,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  res.json({ success: true, pulledCount: events.length, events, message: `Pulled ${events.length} events from ${service} calendar` });
}, 'Failed to pull events', 'Error pulling events:'));

export default router;

