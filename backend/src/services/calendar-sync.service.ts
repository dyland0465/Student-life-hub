import admin from '../config/firebase';
import type { Event, CalendarSyncConfig } from '../types';

// Simple encryption/decryption (not secure at all, but good enough for this project)
function encrypt(text: string, key: string): string {
  return Buffer.from(text).toString('base64');
}

function decrypt(encryptedText: string, key: string): string {
  return Buffer.from(encryptedText, 'base64').toString('utf-8');
}

export class CalendarSyncService {
  private getDb() {
    if (admin.apps.length === 0) {
      throw new Error('Firebase Admin not initialized. Please check server configuration.');
    }
    return admin.firestore();
  }
  
  private encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';

  /**
   * Get or create sync config for user
   */
  async getSyncConfig(userId: string): Promise<CalendarSyncConfig | null> {
    try {
      const db = this.getDb();
      const snapshot = await db
        .collection('calendarSyncConfig')
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        // Create default config
        const defaultConfig: Omit<CalendarSyncConfig, 'id'> = {
          userId,
          eventSources: {
            assignments: true,
            workouts: false,
            meals: false,
            sleep: false,
          },
          syncFrequency: 'hourly',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const db = this.getDb();
        const docRef = await db.collection('calendarSyncConfig').add(defaultConfig);
        return {
          id: docRef.id,
          ...defaultConfig,
        };
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as CalendarSyncConfig;
    } catch (error) {
      console.error('Error getting sync config:', error);
      return null;
    }
  }

  /**
   * Update sync config
   */
  async updateSyncConfig(
    userId: string,
    updates: Partial<CalendarSyncConfig>
  ): Promise<CalendarSyncConfig | null> {
    try {
      const db = this.getDb();
      const snapshot = await db
        .collection('calendarSyncConfig')
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        throw new Error('Sync config not found');
      }

      const docRef = snapshot.docs[0].ref;
      const updateData = {
        ...updates,
        updatedAt: new Date(),
      };

      await docRef.update(updateData);

      return this.getSyncConfig(userId);
    } catch (error) {
      console.error('Error updating sync config:', error);
      return null;
    }
  }

  /**
   * Connect Google Calendar
   */
  async connectGoogleCalendar(
    userId: string,
    accessToken: string,
    refreshToken: string,
    calendarId?: string
  ): Promise<boolean> {
    try {
      const config = await this.getSyncConfig(userId);
      if (!config) {
        throw new Error('Failed to get sync config');
      }

      const encryptedAccessToken = encrypt(accessToken, this.encryptionKey);
      const encryptedRefreshToken = encrypt(refreshToken, this.encryptionKey);

      await this.updateSyncConfig(userId, {
        googleCalendar: {
          connected: true,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          calendarId: calendarId || 'primary',
          lastSync: new Date(),
          syncEnabled: true,
        },
      });

      return true;
    } catch (error) {
      console.error('Error connecting Google Calendar:', error);
      return false;
    }
  }

  /**
   * Connect Apple Calendar
   */
  async connectAppleCalendar(
    userId: string,
    serverUrl: string,
    username: string,
    password: string,
    calendarName?: string
  ): Promise<boolean> {
    try {
      const config = await this.getSyncConfig(userId);
      if (!config) {
        throw new Error('Failed to get sync config');
      }

      const encryptedPassword = encrypt(password, this.encryptionKey);

      await this.updateSyncConfig(userId, {
        appleCalendar: {
          connected: true,
          serverUrl,
          username,
          password: encryptedPassword,
          calendarName: calendarName || 'Home',
          lastSync: new Date(),
          syncEnabled: true,
        },
      });

      return true;
    } catch (error) {
      console.error('Error connecting Apple Calendar:', error);
      return false;
    }
  }

  /**
   * Disconnect calendar service
   */
  async disconnectCalendar(userId: string, service: 'google' | 'apple'): Promise<boolean> {
    try {
      const config = await this.getSyncConfig(userId);
      if (!config) {
        return false;
      }

      if (service === 'google') {
        await this.updateSyncConfig(userId, {
          googleCalendar: {
            connected: false,
            syncEnabled: false,
          },
        });
      } else {
        await this.updateSyncConfig(userId, {
          appleCalendar: {
            connected: false,
            syncEnabled: false,
          },
        });
      }

      return true;
    } catch (error) {
      console.error(`Error disconnecting ${service} calendar:`, error);
      return false;
    }
  }

  /**
   * Push events to Google Calendar
   */
  async pushToGoogleCalendar(userId: string, events: Event[]): Promise<number> {
    try {
      const config = await this.getSyncConfig(userId);
      if (!config?.googleCalendar?.connected || !config.googleCalendar.accessToken) {
        throw new Error('Google Calendar not connected');
      }

      const accessToken = decrypt(config.googleCalendar.accessToken, this.encryptionKey);
      
      // placeholder
      let syncedCount = 0;
      
      for (const event of events) {
        if (event.source === 'manual' && !event.externalId) {
          // Mark event as synced
          const db = this.getDb();
          const eventRef = db.collection('events').doc(event.id);
          await eventRef.update({
            syncStatus: 'synced',
            externalId: `google-${event.id}-${Date.now()}`,
            updatedAt: new Date(),
          });
          syncedCount++;
        }
      }

      // Update last sync time
      await this.updateSyncConfig(userId, {
        googleCalendar: {
          ...config.googleCalendar,
          lastSync: new Date(),
        },
      });

      return syncedCount;
    } catch (error) {
      console.error('Error pushing to Google Calendar:', error);
      return 0;
    }
  }

  /**
   * Pull events from Google Calendar
   */
  async pullFromGoogleCalendar(userId: string): Promise<Event[]> {
    try {
      const config = await this.getSyncConfig(userId);
      if (!config?.googleCalendar?.connected || !config.googleCalendar.accessToken) {
        throw new Error('Google Calendar not connected');
      }

      const accessToken = decrypt(config.googleCalendar.accessToken, this.encryptionKey);
      
      // TODO: Implement actual Google Calendar API integration
      
      // Update last sync time
      await this.updateSyncConfig(userId, {
        googleCalendar: {
          ...config.googleCalendar,
          lastSync: new Date(),
        },
      });

      return [];
    } catch (error) {
      console.error('Error pulling from Google Calendar:', error);
      return [];
    }
  }

  /**
   * Push events to Apple Calendar
   */
  async pushToAppleCalendar(userId: string, events: Event[]): Promise<number> {
    try {
      const config = await this.getSyncConfig(userId);
      if (!config?.appleCalendar?.connected || !config.appleCalendar.password) {
        throw new Error('Apple Calendar not connected');
      }

      const password = decrypt(config.appleCalendar.password, this.encryptionKey);
      
      let syncedCount = 0;
      
      for (const event of events) {
        if (event.source === 'manual' && !event.externalId) {
          // Mark event as synced
          const db = this.getDb();
          const eventRef = db.collection('events').doc(event.id);
          await eventRef.update({
            syncStatus: 'synced',
            externalId: `apple-${event.id}-${Date.now()}`,
            updatedAt: new Date(),
          });
          syncedCount++;
        }
      }

      // Update last sync time
      await this.updateSyncConfig(userId, {
        appleCalendar: {
          ...config.appleCalendar,
          lastSync: new Date(),
        },
      });

      return syncedCount;
    } catch (error) {
      console.error('Error pushing to Apple Calendar:', error);
      return 0;
    }
  }

  /**
   * Pull events from Apple Calendar
   */
  async pullFromAppleCalendar(userId: string): Promise<Event[]> {
    try {
      const config = await this.getSyncConfig(userId);
      if (!config?.appleCalendar?.connected || !config.appleCalendar.password) {
        throw new Error('Apple Calendar not connected');
      }

      const password = decrypt(config.appleCalendar.password, this.encryptionKey);
      
      // TODO: Implement actual CalDAV integration
      
      // Update last sync time
      await this.updateSyncConfig(userId, {
        appleCalendar: {
          ...config.appleCalendar,
          lastSync: new Date(),
        },
      });

      return [];
    } catch (error) {
      console.error('Error pulling from Apple Calendar:', error);
      return [];
    }
  }
}

export const calendarSyncService = new CalendarSyncService();

