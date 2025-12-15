import type { SelectedSection } from '../types';

export interface LionPathCredentials {
  username: string;
  password: string;
}

export interface RegistrationResult {
  success: boolean;
  message: string;
  registeredSections?: string[];
  failedSections?: string[];
}

export class LionPathService {
  private connections: Map<string, boolean> = new Map();

  /**
   * Mock connection to LionPath
   */
  connect(userId: string, credentials: LionPathCredentials): boolean {
    // Mock connection
    if (credentials.username && credentials.password) {
      this.connections.set(userId, true);
      console.log(`Mock LionPath connection established for user ${userId}`);
      return true;
    }
    return false;
  }

  /**
   * Check if user is connected
   */
  isConnected(userId: string): boolean {
    return this.connections.get(userId) || false;
  }

  /**
   * Disconnect from LionPath
   */
  disconnect(userId: string): void {
    this.connections.delete(userId);
  }

  /**
   * Check if registration is open for a semester
   */
  checkRegistrationOpen(semester: string): boolean {
    // Mock: For demo, registration is "open" if current date is after a certain date
    const now = new Date();
    const registrationDate = new Date(now.getFullYear(), now.getMonth(), 15); // 15th of current month
    
    return now >= registrationDate;
  }

  /**
   * Mock registration for classes
   */
  async registerForClasses(
    userId: string,
    sections: SelectedSection[]
  ): Promise<RegistrationResult> {
    if (!this.isConnected(userId)) {
      return {
        success: false,
        message: 'Not connected to LionPath. Please connect your account first.',
      };
    }

    const registeredSections: string[] = [];
    const failedSections: string[] = [];

    for (const section of sections) {
      const success = Math.random() > 0.1;
      
      if (success) {
        registeredSections.push(section.sectionId);
      } else {
        failedSections.push(section.sectionId);
      }
    }

    if (failedSections.length === 0) {
      return {
        success: true,
        message: `Successfully registered for ${registeredSections.length} section(s)`,
        registeredSections,
      };
    } else {
      return {
        success: false,
        message: `Registered for ${registeredSections.length} section(s), but ${failedSections.length} failed`,
        registeredSections,
        failedSections,
      };
    }
  }

  /**
   * Get registration status for a semester
   */
  getRegistrationStatus(semester: string): {
    isOpen: boolean;
    opensAt?: Date;
    closesAt?: Date;
  } {
    const isOpen = this.checkRegistrationOpen(semester);
    const now = new Date();
    
    return {
      isOpen,
      opensAt: isOpen ? undefined : new Date(now.getFullYear(), now.getMonth(), 15),
      closesAt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  }
}

export const lionPathService = new LionPathService();

