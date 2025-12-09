import express, { Request, Response } from 'express';
import { authenticateUser, type AuthRequest } from '../middleware/auth';
import admin from '../config/firebase';
import { EventAggregationService } from '../services/event-aggregation.service';
import { calendarSyncService } from '../services/calendar-sync.service';
import type { Event } from '../types';

const router = express.Router();
const eventAggregationService = new EventAggregationService();

// Create event
router.post('/events', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if Firebase Admin is initialized
    if (admin.apps.length === 0) {
      console.error('Firebase Admin not initialized');
      return res.status(500).json({ 
        error: 'Database not available. Please check server configuration.' 
      });
    }

    const { title, date, time, category, description } = req.body;

    if (!title || !date || !category) {
      return res.status(400).json({ error: 'Missing required fields: title, date, category' });
    }

    if (!['academic', 'personal', 'wellness'].includes(category)) {
      return res.status(400).json({ error: 'Invalid category. Must be academic, personal, or wellness' });
    }

    const eventData = {
      userId,
      title,
      date,
      time: time || null,
      category,
      description: description || '',
      source: 'manual',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await admin.firestore().collection('events').add(eventData);
    const event: Event = {
      id: docRef.id,
      ...eventData,
    };

    res.status(201).json(event);
  } catch (error: any) {
    console.error('Error creating event:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create event',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get events
router.get('/events', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if Firebase Admin is initialized
    if (admin.apps.length === 0) {
      console.error('Firebase Admin not initialized');
      return res.status(500).json({ 
        error: 'Database not available. Please check server configuration.' 
      });
    }

    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const config = await calendarSyncService.getSyncConfig(userId);
    const events = await eventAggregationService.getEvents(userId, startDate, endDate, config || undefined);

    res.json(events);
  } catch (error: any) {
    console.error('Error fetching events:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch events',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update event
router.put('/events/:id', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if Firebase Admin is initialized
    if (admin.apps.length === 0) {
      console.error('Firebase Admin not initialized');
      return res.status(500).json({ 
        error: 'Database not available. Please check server configuration.' 
      });
    }

    const { id } = req.params;
    const { title, date, time, category, description } = req.body;

    const eventRef = admin.firestore().collection('events').doc(id);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventData = eventDoc.data();
    if (eventData?.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Only allow updating manual events
    if (eventData?.source !== 'manual') {
      return res.status(400).json({ error: 'Cannot update auto-generated events' });
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (date !== undefined) updateData.date = date;
    if (time !== undefined) updateData.time = time;
    if (category !== undefined) {
      if (!['academic', 'personal', 'wellness'].includes(category)) {
        return res.status(400).json({ error: 'Invalid category' });
      }
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
  } catch (error: any) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event
router.delete('/events/:id', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if Firebase Admin is initialized
    if (admin.apps.length === 0) {
      console.error('Firebase Admin not initialized');
      return res.status(500).json({ 
        error: 'Database not available. Please check server configuration.' 
      });
    }

    const { id } = req.params;

    const eventRef = admin.firestore().collection('events').doc(id);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventData = eventDoc.data();
    if (eventData?.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Only allow deleting manual events
    if (eventData?.source !== 'manual') {
      return res.status(400).json({ error: 'Cannot delete auto-generated events' });
    }

    await eventRef.delete();
    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Get sync configuration
router.get('/sync/config', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const config = await calendarSyncService.getSyncConfig(userId);
    if (!config) {
      return res.status(500).json({ error: 'Failed to get sync config' });
    }

    // Remove sensitive data before sending
    const safeConfig = {
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

    res.json(safeConfig);
  } catch (error: any) {
    console.error('Error fetching sync config:', error);
    res.status(500).json({ error: 'Failed to fetch sync config' });
  }
});

// Update sync configuration
router.put('/sync/config', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { eventSources, syncFrequency } = req.body;

    const updates: any = {};
    if (eventSources !== undefined) updates.eventSources = eventSources;
    if (syncFrequency !== undefined) updates.syncFrequency = syncFrequency;

    const config = await calendarSyncService.updateSyncConfig(userId, updates);
    if (!config) {
      return res.status(500).json({ error: 'Failed to update sync config' });
    }

    // Remove sensitive data before sending
    const safeConfig = {
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

    res.json(safeConfig);
  } catch (error: any) {
    console.error('Error updating sync config:', error);
    res.status(500).json({ error: 'Failed to update sync config' });
  }
});

// Connect Google Calendar
router.post('/sync/google/connect', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { accessToken, refreshToken, calendarId } = req.body;

    if (!accessToken || !refreshToken) {
      return res.status(400).json({ error: 'Missing accessToken or refreshToken' });
    }

    const success = await calendarSyncService.connectGoogleCalendar(
      userId,
      accessToken,
      refreshToken,
      calendarId
    );

    if (!success) {
      return res.status(500).json({ error: 'Failed to connect Google Calendar' });
    }

    res.json({ success: true, message: 'Google Calendar connected successfully' });
  } catch (error: any) {
    console.error('Error connecting Google Calendar:', error);
    res.status(500).json({ error: 'Failed to connect Google Calendar' });
  }
});

// Connect Apple Calendar
router.post('/sync/apple/connect', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { serverUrl, username, password, calendarName } = req.body;

    if (!serverUrl || !username || !password) {
      return res.status(400).json({ error: 'Missing required fields: serverUrl, username, password' });
    }

    const success = await calendarSyncService.connectAppleCalendar(
      userId,
      serverUrl,
      username,
      password,
      calendarName
    );

    if (!success) {
      return res.status(500).json({ error: 'Failed to connect Apple Calendar' });
    }

    res.json({ success: true, message: 'Apple Calendar connected successfully' });
  } catch (error: any) {
    console.error('Error connecting Apple Calendar:', error);
    res.status(500).json({ error: 'Failed to connect Apple Calendar' });
  }
});

// Disconnect calendar service
router.post('/sync/disconnect', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { service } = req.body;

    if (!service || !['google', 'apple'].includes(service)) {
      return res.status(400).json({ error: 'Invalid service. Must be google or apple' });
    }

    const success = await calendarSyncService.disconnectCalendar(userId, service);

    if (!success) {
      return res.status(500).json({ error: `Failed to disconnect ${service} calendar` });
    }

    res.json({ success: true, message: `${service} calendar disconnected successfully` });
  } catch (error: any) {
    console.error('Error disconnecting calendar:', error);
    res.status(500).json({ error: 'Failed to disconnect calendar' });
  }
});

// Push events to external calendar
router.post('/sync/push', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { service } = req.body;

    if (!service || !['google', 'apple'].includes(service)) {
      return res.status(400).json({ error: 'Invalid service. Must be google or apple' });
    }

    // Get user's manual events
    const config = await calendarSyncService.getSyncConfig(userId);
    const events = await eventAggregationService.getEvents(userId, undefined, undefined, config || undefined);
    const manualEvents = events.filter(e => e.source === 'manual');

    let syncedCount = 0;
    if (service === 'google') {
      syncedCount = await calendarSyncService.pushToGoogleCalendar(userId, manualEvents);
    } else {
      syncedCount = await calendarSyncService.pushToAppleCalendar(userId, manualEvents);
    }

    res.json({ success: true, syncedCount, message: `Synced ${syncedCount} events to ${service} calendar` });
  } catch (error: any) {
    console.error('Error pushing events:', error);
    res.status(500).json({ error: 'Failed to push events' });
  }
});

// Pull events from external calendar
router.post('/sync/pull', authenticateUser, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { service } = req.body;

    if (!service || !['google', 'apple'].includes(service)) {
      return res.status(400).json({ error: 'Invalid service. Must be google or apple' });
    }

    let events: Event[] = [];
    if (service === 'google') {
      events = await calendarSyncService.pullFromGoogleCalendar(userId);
    } else {
      events = await calendarSyncService.pullFromAppleCalendar(userId);
    }

    // Save pulled events to database
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
  } catch (error: any) {
    console.error('Error pulling events:', error);
    res.status(500).json({ error: 'Failed to pull events' });
  }
});

export default router;

