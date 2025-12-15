import { v4 as uuidv4 } from 'uuid';
import admin from '../config/firebase';

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: string;
  roomId: string;
  isModerated: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  code: string;
  type: 'global' | 'private';
  members: string[];
  createdBy: string;
  createdAt: string;
  maxMembers: number;
}

export interface UserChatProfile {
  chatDisplayName: string;
  chatRooms: string[];
}

export class ChatService {
  private db = admin.firestore();

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

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
   * Initialize global chat room
   */
  async initializeGlobalRoom(): Promise<void> {
    const globalRoomRef = this.db.collection('chatRooms').doc('global');
    const globalRoom = await globalRoomRef.get();
    
    if (!globalRoom.exists) {
      await globalRoomRef.set({
        id: 'global',
        name: 'Global Chat',
        code: 'GLOBAL',
        type: 'global',
        members: [],
        createdBy: 'system',
        createdAt: new Date().toISOString(),
        maxMembers: 1000
      });
    }
  }

  /**
   * Get user's chat rooms
   */
  async getRoomsByUser(userId: string): Promise<ChatRoom[]> {
    const userDoc = await this.db.collection('users').doc(userId).get();
    let roomIds: string[] = ['global'];
    
    if (userDoc.exists) {
      const userData = userDoc.data() as any;
      const userRooms = userData.chatRooms || [];
      roomIds = [...new Set([...roomIds, ...userRooms])];
    }
    
    const rooms: ChatRoom[] = [];
    for (const roomId of roomIds) {
      const roomDoc = await this.db.collection('chatRooms').doc(roomId).get();
      if (roomDoc.exists) {
        rooms.push(roomDoc.data() as ChatRoom);
      }
    }
    
    return rooms;
  }

  /**
   * Create a new private chat room
   */
  async createRoom(userId: string, name: string, customCode?: string): Promise<ChatRoom> {
    const userRooms = await this.getRoomsByUser(userId);
    const privateRooms = userRooms.filter(room => room.type === 'private');
    
    if (privateRooms.length >= 10) {
      throw new Error('Maximum number of private rooms reached (10)');
    }

    const roomId = uuidv4();
    let roomCode = customCode || this.generateRoomCode();
    
    // Ensure code is unique
    while (await this.isCodeTaken(roomCode)) {
      roomCode = this.generateRoomCode();
    }

    const room: ChatRoom = {
      id: roomId,
      name,
      code: roomCode,
      type: 'private',
      members: [userId],
      createdBy: userId,
      createdAt: new Date().toISOString(),
      maxMembers: 5
    };

    await this.db.collection('chatRooms').doc(roomId).set(room);
    
    await this.addRoomToUser(userId, roomId);
    
    return room;
  }

  /**
   * Join a room by code
   */
  async joinRoom(userId: string, roomCode: string): Promise<ChatRoom> {
    const roomsSnapshot = await this.db.collection('chatRooms')
      .where('code', '==', roomCode)
      .limit(1)
      .get();

    if (roomsSnapshot.empty) {
      throw new Error('Room not found');
    }

    const roomDoc = roomsSnapshot.docs[0];
    const room = roomDoc.data() as ChatRoom;

    if (room.members.includes(userId)) {
      return room;
    }

    if (room.members.length >= room.maxMembers) {
      throw new Error('Room is full');
    }

    // Add user to room
    await roomDoc.ref.update({
      members: [...room.members, userId]
    });

    // Add room to user's chatRooms array
    await this.addRoomToUser(userId, room.id);

    return { ...room, members: [...room.members, userId] };
  }

  /**
   * Leave a room
   */
  async leaveRoom(userId: string, roomId: string): Promise<void> {
    if (roomId === 'global') {
      throw new Error('Cannot leave global room');
    }

    const roomRef = this.db.collection('chatRooms').doc(roomId);
    const roomDoc = await roomRef.get();
    
    if (!roomDoc.exists) {
      throw new Error('Room not found');
    }

    const room = roomDoc.data() as ChatRoom;
    const updatedMembers = room.members.filter(member => member !== userId);
    
    if (updatedMembers.length === 0) {
      // Delete room if no members left
      await this.deleteRoomAndMessages(roomId);
    } else {
      // Remove user from room
      await roomRef.update({ members: updatedMembers });
    }

    // Remove room from user's chatRooms array
    await this.removeRoomFromUser(userId, roomId);
  }

  /**
   * Delete a room
   */
  async deleteRoom(userId: string, roomId: string): Promise<void> {
    if (roomId === 'global') {
      throw new Error('Cannot delete global room');
    }

    const roomRef = this.db.collection('chatRooms').doc(roomId);
    const roomDoc = await roomRef.get();
    
    if (!roomDoc.exists) {
      throw new Error('Room not found');
    }

    const room = roomDoc.data() as ChatRoom;
    
    // Only room creator can delete
    if (room.createdBy !== userId) {
      throw new Error('Only room creator can delete room');
    }

    // Delete the room and all its messages
    await this.deleteRoomAndMessages(roomId);

    // Remove room from all members' chatRooms arrays
    for (const memberId of room.members) {
      await this.removeRoomFromUser(memberId, roomId);
    }
  }

  /**
   * Get messages for a specific room
   */
  async getRoomMessages(roomId: string, limit: number = 100): Promise<ChatMessage[]> {
    const messagesSnapshot = await this.db
      .collection('chatRooms')
      .doc(roomId)
      .collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return messagesSnapshot.docs.map(doc => doc.data() as ChatMessage).reverse();
  }

  /**
   * Send a message to a room
   */
  async sendMessageToRoom(roomId: string, userId: string, content: string, username?: string): Promise<ChatMessage> {
    // Verify room exists
    const roomDoc = await this.db.collection('chatRooms').doc(roomId).get();
    if (!roomDoc.exists) {
      throw new Error('Room not found');
    }

    const room = roomDoc.data() as ChatRoom;
    
    if (room.type === 'private' && !room.members.includes(userId)) {
      throw new Error('Not a member of this room');
    }

    // Get user's display name for private rooms
    let displayName = username || this.generateAnonymousUsername();
    if (room.type === 'private') {
      const userDoc = await this.db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data() as any;
        displayName = userData.chatDisplayName || userData.name || displayName;
      }
    }

    const message: ChatMessage = {
      id: uuidv4(),
      userId,
      username: displayName,
      content,
      timestamp: new Date().toISOString(),
      roomId,
      isModerated: false,
    };

    await this.db
      .collection('chatRooms')
      .doc(roomId)
      .collection('messages')
      .doc(message.id)
      .set(message);

    return message;
  }

  /**
   * Update room name and code
   */
  async updateRoom(userId: string, roomId: string, updates: { name?: string; code?: string }): Promise<ChatRoom> {
    const roomRef = this.db.collection('chatRooms').doc(roomId);
    const roomDoc = await roomRef.get();
    
    if (!roomDoc.exists) {
      throw new Error('Room not found');
    }

    const room = roomDoc.data() as ChatRoom;
    
    // Only room creator can update
    if (room.createdBy !== userId) {
      throw new Error('Only room creator can update room');
    }

    // Check if new code is taken
    if (updates.code && updates.code !== room.code) {
      if (await this.isCodeTaken(updates.code)) {
        throw new Error('Room code already taken');
      }
    }

    await roomRef.update(updates);
    
    return { ...room, ...updates };
  }

  /**
   * Invite user to room
   */
  async inviteUserToRoom(inviterId: string, roomId: string, inviteeUserId: string): Promise<void> {
    const roomRef = this.db.collection('chatRooms').doc(roomId);
    const roomDoc = await roomRef.get();
    
    if (!roomDoc.exists) {
      throw new Error('Room not found');
    }

    const room = roomDoc.data() as ChatRoom;
    
    // Check if inviter is a member
    if (!room.members.includes(inviterId)) {
      throw new Error('Not a member of this room');
    }

    // Check if room is full
    if (room.members.length >= room.maxMembers) {
      throw new Error('Room is full');
    }

    // Add user to room
    await roomRef.update({
      members: [...room.members, inviteeUserId]
    });

    // Add room to user's chatRooms array
    await this.addRoomToUser(inviteeUserId, roomId);
  }

  /**
   * Get user's chat display name
   */
  async getUserChatProfile(userId: string): Promise<UserChatProfile | null> {
    const userDoc = await this.db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data() as any;
    return {
      chatDisplayName: userData.chatDisplayName || userData.name || 'Student',
      chatRooms: userData.chatRooms || ['global']
    };
  }

  /**
   * Update user's chat display name
   */
  async updateUserChatProfile(userId: string, chatDisplayName: string): Promise<void> {
    await this.db.collection('users').doc(userId).update({
      chatDisplayName
    });
  }

  // Helper methods
  private async isCodeTaken(code: string): Promise<boolean> {
    const snapshot = await this.db.collection('chatRooms')
      .where('code', '==', code)
      .limit(1)
      .get();
    return !snapshot.empty;
  }

  private async addRoomToUser(userId: string, roomId: string): Promise<void> {
    if (roomId === 'global') {
      return;
    }
    
    const userRef = this.db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data() as any;
      const chatRooms = userData.chatRooms || [];
      if (!chatRooms.includes(roomId)) {
        await userRef.update({
          chatRooms: [...chatRooms, roomId]
        });
      }
    }
  }

  private async removeRoomFromUser(userId: string, roomId: string): Promise<void> {
    if (roomId === 'global') {
      return;
    }
    
    const userRef = this.db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data() as any;
      const chatRooms = (userData.chatRooms || []).filter((id: string) => id !== roomId);
      await userRef.update({ chatRooms });
    }
  }

  private async deleteRoomAndMessages(roomId: string): Promise<void> {
    const roomRef = this.db.collection('chatRooms').doc(roomId);
    
    // Delete all messages in the room
    const messagesSnapshot = await roomRef.collection('messages').get();
    const batch = this.db.batch();
    
    messagesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete the room itself
    batch.delete(roomRef);
    
    // Commit the batch delete
    await batch.commit();
  }

  // Legacy method
  async getMessages(): Promise<ChatMessage[]> {
    return this.getRoomMessages('global');
  }

  async sendMessage(content: string, username?: string): Promise<ChatMessage> {
    const dummyUserId = 'anonymous_' + Date.now();
    return this.sendMessageToRoom('global', dummyUserId, content, username);
  }
}
