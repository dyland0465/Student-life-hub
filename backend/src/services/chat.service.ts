import { v4 as uuidv4 } from 'uuid';

export interface ChatMessage {
  id: string;
  username: string;
  content: string;
  timestamp: string;
  isModerated: boolean;
}

// In-memory storage for demo purposes
// In production, this would be replaced with a database
class ChatStorage {
  private messages: ChatMessage[] = [];
  private maxMessages = 100; // Keep only last 100 messages

  addMessage(message: ChatMessage): void {
    this.messages.push(message);
    
    // Keep only the last maxMessages
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
  }

  getMessages(): ChatMessage[] {
    return [...this.messages].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  getMessageById(id: string): ChatMessage | undefined {
    return this.messages.find(msg => msg.id === id);
  }

  deleteMessage(id: string): boolean {
    const index = this.messages.findIndex(msg => msg.id === id);
    if (index !== -1) {
      this.messages.splice(index, 1);
      return true;
    }
    return false;
  }
}

export class ChatService {
  private storage = new ChatStorage();

  /**
   * Generate a random anonymous username
   */
  private generateAnonymousUsername(): string {
    const adjectives = [
      'Anonymous', 'Student', 'Learner', 'Curious', 'Friendly', 'Helpful',
      'Smart', 'Creative', 'Energetic', 'Kind', 'Wise', 'Bright'
    ];
    
    const nouns = [
      'Student', 'Learner', 'Explorer', 'Thinker', 'Dreamer', 'Builder',
      'Creator', 'Helper', 'Friend', 'Guide', 'Mentor', 'Scholar'
    ];

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 999) + 1;

    return `${adjective}${noun}${number}`;
  }

  /**
   * Get all messages
   */
  async getMessages(): Promise<ChatMessage[]> {
    return this.storage.getMessages();
  }

  /**
   * Send a new message
   */
  async sendMessage(content: string, username?: string): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: uuidv4(),
      username: username || this.generateAnonymousUsername(),
      content,
      timestamp: new Date().toISOString(),
      isModerated: false,
    };

    this.storage.addMessage(message);
    return message;
  }

  /**
   * Get a specific message by ID
   */
  async getMessageById(id: string): Promise<ChatMessage | null> {
    const message = this.storage.getMessageById(id);
    return message || null;
  }

  /**
   * Delete a message (for moderation purposes)
   */
  async deleteMessage(id: string): Promise<boolean> {
    return this.storage.deleteMessage(id);
  }

  /**
   * Mark a message as moderated
   */
  async moderateMessage(id: string): Promise<boolean> {
    const message = this.storage.getMessageById(id);
    if (message) {
      message.isModerated = true;
      return true;
    }
    return false;
  }
}
