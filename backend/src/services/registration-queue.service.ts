import type { RegistrationQueue, SelectedSection } from '../types';
import { lionPathService } from './lionpath.service';

export class RegistrationQueueService {
  private queue: Map<string, RegistrationQueue> = new Map();

  /**
   * Add schedule to registration queue
   */
  addToQueue(
    userId: string,
    scheduleId: string,
    sections: SelectedSection[],
    registrationDate: Date
  ): RegistrationQueue {
    const queueItem: RegistrationQueue = {
      id: `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      scheduleId,
      sections,
      registrationDate,
      status: 'pending',
      lionPathConnected: lionPathService.isConnected(userId),
      attempts: 0,
      createdAt: new Date(),
    };

    this.queue.set(queueItem.id, queueItem);
    return queueItem;
  }

  /**
   * Get queue items for a user
   */
  getUserQueue(userId: string): RegistrationQueue[] {
    return Array.from(this.queue.values()).filter(item => item.userId === userId);
  }

  /**
   * Get queue item by ID
   */
  getQueueItem(queueId: string): RegistrationQueue | undefined {
    return this.queue.get(queueId);
  }

  /**
   * Update queue item status
   */
  updateQueueItem(queueId: string, updates: Partial<RegistrationQueue>): RegistrationQueue | null {
    const item = this.queue.get(queueId);
    if (!item) return null;

    const updated = { ...item, ...updates };
    this.queue.set(queueId, updated);
    return updated;
  }

  /**
   * Process registration queue
   */
  async processQueue(): Promise<void> {
    const now = new Date();
    
    for (const [queueId, item] of this.queue.entries()) {
      if (item.status === 'success' || item.status === 'failed') {
        continue;
      }

      // Check if registration date has arrived
      if (now >= item.registrationDate) {
        if (item.status === 'pending') {
          this.updateQueueItem(queueId, { status: 'queued' });
        }

        // Attempt registration if connected
        if (item.lionPathConnected && item.status === 'queued') {
          await this.attemptRegistration(queueId);
        }
      }
    }
  }

  /**
   * Attempt to register for classes
   */
  private async attemptRegistration(queueId: string): Promise<void> {
    const item = this.queue.get(queueId);
    if (!item) return;

    // Update to registering
    this.updateQueueItem(queueId, {
      status: 'registering',
      attempts: item.attempts + 1,
      lastAttempt: new Date(),
    });

    try {
      const result = await lionPathService.registerForClasses(item.userId, item.sections);

      if (result.success) {
        this.updateQueueItem(queueId, {
          status: 'success',
        });
      } else {
        // Retry logic
        if (item.attempts < 3) {
          this.updateQueueItem(queueId, {
            status: 'queued',
            error: result.message,
          });
        } else {
          this.updateQueueItem(queueId, {
            status: 'failed',
            error: result.message,
          });
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed';
      
      if (item.attempts < 3) {
        this.updateQueueItem(queueId, {
          status: 'queued',
          error: errorMessage,
        });
      } else {
        this.updateQueueItem(queueId, {
          status: 'failed',
          error: errorMessage,
        });
      }
    }
  }

  /**
   * Remove queue item
   */
  removeFromQueue(queueId: string): boolean {
    return this.queue.delete(queueId);
  }

  /**
   * Start periodic queue processing
   */
  startProcessing(intervalMs: number = 60000): void {
    setInterval(() => {
      this.processQueue().catch(error => {
        console.error('Error processing registration queue:', error);
      });
    }, intervalMs);
  }
}

export const registrationQueueService = new RegistrationQueueService();

