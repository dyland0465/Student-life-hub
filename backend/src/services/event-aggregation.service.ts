import admin from '../config/firebase';
import type { Event, CalendarSyncConfig } from '../types';

export class EventAggregationService {
  private getDb() {
    if (admin.apps.length === 0) {
      throw new Error('Firebase Admin not initialized. Please check server configuration.');
    }
    return admin.firestore();
  }

  /**
   * Get all events for a user, aggregating from multiple sources
   */
  async getEvents(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    config?: CalendarSyncConfig
  ): Promise<Event[]> {
    const events: Event[] = [];

    // Get manually created events
    const manualEvents = await this.getManualEvents(userId, startDate, endDate);
    events.push(...manualEvents);

    // Get events from assignments if enabled
    if (!config || config.eventSources.assignments) {
      const assignmentEvents = await this.getAssignmentEvents(userId, startDate, endDate);
      events.push(...assignmentEvents);
    }

    // Get events from workouts if enabled
    if (!config || config.eventSources.workouts) {
      const workoutEvents = await this.getWorkoutEvents(userId, startDate, endDate);
      events.push(...workoutEvents);
    }

    // Get events from meals if enabled
    if (!config || config.eventSources.meals) {
      const mealEvents = await this.getMealEvents(userId, startDate, endDate);
      events.push(...mealEvents);
    }

    // Get events from sleep logs if enabled
    if (!config || config.eventSources.sleep) {
      const sleepEvents = await this.getSleepEvents(userId, startDate, endDate);
      events.push(...sleepEvents);
    }

    // Get synced events from external calendars
    if (config?.googleCalendar?.connected && config.googleCalendar.syncEnabled) {
      const googleEvents = await this.getSyncedEvents(userId, 'google', startDate, endDate);
      events.push(...googleEvents);
    }

    if (config?.appleCalendar?.connected && config.appleCalendar.syncEnabled) {
      const appleEvents = await this.getSyncedEvents(userId, 'apple', startDate, endDate);
      events.push(...appleEvents);
    }

    // Sort by date and time
    return events.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      return timeA.localeCompare(timeB);
    });
  }

  /**
   * Get manually created events
   */
  private async getManualEvents(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Event[]> {
    try {
      const db = this.getDb();
      let query = db
        .collection('events')
        .where('userId', '==', userId)
        .where('source', '==', 'manual');

      if (startDate && endDate) {
        query = query
          .where('date', '>=', this.formatDate(startDate))
          .where('date', '<=', this.formatDate(endDate));
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Event[];
    } catch (error) {
      console.error('Error fetching manual events:', error);
      return [];
    }
  }

  /**
   * Get events from assignments
   */
  private async getAssignmentEvents(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Event[]> {
    try {
      const db = this.getDb();
      const coursesSnapshot = await db
        .collection('courses')
        .where('userId', '==', userId)
        .get();

      const events: Event[] = [];
      const now = new Date();
      const start = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
      const end = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0);

      for (const courseDoc of coursesSnapshot.docs) {
        const courseData = courseDoc.data();
        const assignments = courseData.assignments || [];

        for (const assignment of assignments) {
          const dueDate = assignment.dueDate?.toDate();
          if (!dueDate) continue;

          // Filter by date range if provided
          if (dueDate < start || dueDate > end) continue;

          events.push({
            id: `assignment-${assignment.id || courseDoc.id}`,
            userId,
            title: `${assignment.title} - ${courseData.courseName}`,
            date: this.formatDate(dueDate),
            time: this.formatTime(dueDate),
            category: 'academic',
            description: assignment.description || '',
            source: 'assignment',
            sourceId: assignment.id || courseDoc.id,
            createdAt: assignment.createdAt?.toDate() || new Date(),
            updatedAt: assignment.updatedAt?.toDate() || new Date(),
          });
        }
      }

      return events;
    } catch (error) {
      console.error('Error fetching assignment events:', error);
      return [];
    }
  }

  /**
   * Get events from workout logs
   */
  private async getWorkoutEvents(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Event[]> {
    try {
      const db = this.getDb();
      let query = db
        .collection('workoutLogs')
        .where('userId', '==', userId);

      if (startDate && endDate) {
        query = query.where('date', '>=', startDate).where('date', '<=', endDate);
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        const workoutDate = data.date?.toDate() || new Date();
        return {
          id: `workout-${doc.id}`,
          userId,
          title: `${data.routineName || 'Workout'} - ${data.type || ''}`,
          date: this.formatDate(workoutDate),
          time: this.formatTime(workoutDate),
          category: 'wellness',
          description: data.notes || `Duration: ${data.duration || 0} minutes`,
          source: 'workout',
          sourceId: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      }) as Event[];
    } catch (error) {
      console.error('Error fetching workout events:', error);
      return [];
    }
  }

  /**
   * Get events from meal logs
   */
  private async getMealEvents(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Event[]> {
    try {
      const db = this.getDb();
      let query = db
        .collection('meals')
        .where('userId', '==', userId);

      if (startDate && endDate) {
        query = query.where('date', '>=', startDate).where('date', '<=', endDate);
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        const mealDate = data.date?.toDate() || new Date();
        return {
          id: `meal-${doc.id}`,
          userId,
          title: `${data.mealType || 'Meal'}: ${data.foodName || ''}`,
          date: this.formatDate(mealDate),
          time: this.formatTime(mealDate),
          category: 'wellness',
          description: `${data.calories || 0} calories | Protein: ${data.protein || 0}g | Carbs: ${data.carbs || 0}g | Fats: ${data.fats || 0}g`,
          source: 'meal',
          sourceId: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      }) as Event[];
    } catch (error) {
      console.error('Error fetching meal events:', error);
      return [];
    }
  }

  /**
   * Get events from sleep logs
   */
  private async getSleepEvents(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Event[]> {
    try {
      const db = this.getDb();
      let query = db
        .collection('sleepLogs')
        .where('userId', '==', userId);

      if (startDate && endDate) {
        query = query.where('date', '>=', startDate).where('date', '<=', endDate);
      }

      const snapshot = await query.get();
      const events: Event[] = [];

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const sleepDate = data.date?.toDate() || new Date();
        
        // Create bedtime event
        events.push({
          id: `sleep-bedtime-${doc.id}`,
          userId,
          title: 'Bedtime',
          date: this.formatDate(sleepDate),
          time: data.bedTime || '22:00',
          category: 'wellness',
          description: `Target: ${data.actualHours || 0} hours`,
          source: 'sleep',
          sourceId: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });

        // Create wake time event
        const wakeDate = new Date(sleepDate);
        events.push({
          id: `sleep-wake-${doc.id}`,
          userId,
          title: 'Wake Up',
          date: this.formatDate(wakeDate),
          time: data.wakeTime || '08:00',
          category: 'wellness',
          description: `Slept: ${data.actualHours || 0} hours | Quality: ${data.quality || 'N/A'}`,
          source: 'sleep',
          sourceId: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        });
      }

      return events;
    } catch (error) {
      console.error('Error fetching sleep events:', error);
      return [];
    }
  }

  /**
   * Get synced events from external calendars
   */
  private async getSyncedEvents(
    userId: string,
    source: 'google' | 'apple',
    startDate?: Date,
    endDate?: Date
  ): Promise<Event[]> {
    try {
      const db = this.getDb();
      let query = db
        .collection('events')
        .where('userId', '==', userId)
        .where('source', '==', source);

      if (startDate && endDate) {
        query = query
          .where('date', '>=', this.formatDate(startDate))
          .where('date', '<=', this.formatDate(endDate));
      }

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Event[];
    } catch (error) {
      console.error(`Error fetching ${source} events:`, error);
      return [];
    }
  }

  /**
   * Format date to YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Format time to HH:mm
   */
  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}

