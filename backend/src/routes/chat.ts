import express, { Request, Response, NextFunction } from 'express';
import { sanitizeMessage, validateMessage } from '../middleware/messageSanitizer';
import { chatLimiter } from '../middleware/rateLimiter';
import { verifyFirebaseToken } from '../config/firebase';
import { ChatService } from '../services/chat.service';

const router = express.Router();
let chatService: ChatService;

// Initialize chat service
export const initializeChatService = () => {
  if (!chatService) {
    chatService = new ChatService();
  }
  return chatService;
};

// Helper function to get chat service
const getChatService = () => {
  if (!chatService) {
    throw new Error('Chat service not initialized. Call initializeChatService() first.');
  }
  return chatService;
};

// Middleware to verify Firebase token and extract user ID
const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await verifyFirebaseToken(token);
    
    if (!decodedToken) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    (req as any).userId = decodedToken.uid;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * GET /api/chat/rooms
 * Get user's chat rooms
 */
router.get('/rooms', authenticateUser, async (req: Request, res: Response) => {
  try {
    const rooms = await getChatService().getRoomsByUser((req as any).userId);
    res.json({ rooms });
  } catch (error: any) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

/**
 * POST /api/chat/rooms/create
 * Create a new private chat room
 */
router.post('/rooms/create', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { name, customCode } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Room name is required' });
    }

    const room = await getChatService().createRoom((req as any).userId, name.trim(), customCode);
    res.json({ room });
  } catch (error: any) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: error.message || 'Failed to create room' });
  }
});

/**
 * POST /api/chat/rooms/join
 * Join a room by code
 */
router.post('/rooms/join', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { roomCode } = req.body;
    
    if (!roomCode || roomCode.trim().length === 0) {
      return res.status(400).json({ error: 'Room code is required' });
    }

    const room = await getChatService().joinRoom((req as any).userId, roomCode.trim().toUpperCase());
    res.json({ room });
  } catch (error: any) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: error.message || 'Failed to join room' });
  }
});

/**
 * GET /api/chat/rooms/:roomId/messages
 * Get messages for a specific room
 */
router.get('/rooms/:roomId/messages', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { limit = 100 } = req.query;
    
    // For global room, allow anonymous access
    // For private rooms, require authentication
    if (roomId !== 'global') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required for private rooms' });
      }
      
      const token = authHeader.split(' ')[1];
      const decodedToken = await verifyFirebaseToken(token);
      if (!decodedToken) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }
    
    const messages = await getChatService().getRoomMessages(roomId, parseInt(limit as string));
    res.json({ messages });
  } catch (error: any) {
    console.error('Error fetching room messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * POST /api/chat/rooms/:roomId/send
 * Send a message to a specific room
 */
router.post('/rooms/:roomId/send', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { roomId } = req.params;
    
    // For global room, allow anonymous users
    // For private rooms, require authentication
    if (roomId === 'global') {
      return next();
    } else {
      return authenticateUser(req, res, next);
    }
  } catch (error: any) {
    console.error('Error in send message middleware:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}, chatLimiter, validateMessage, sanitizeMessage, async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { content, username } = req.body;
    
    // For global room, allow anonymous users
    // For private rooms, require authentication
    let userId = (req as any).userId;
    if (!userId && roomId === 'global') {
      // Generate a temporary userId for anonymous global chat
      userId = 'anonymous_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    } else if (!userId) {
      return res.status(401).json({ error: 'Authentication required for private rooms' });
    }
    
    const message = await getChatService().sendMessageToRoom(roomId, userId, content, username);
    res.json({ message });
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message || 'Failed to send message' });
  }
});

/**
 * Update room name and code
 */
router.put('/rooms/:roomId', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { name, code } = req.body;
    
    const updates: { name?: string; code?: string } = {};
    if (name !== undefined) updates.name = name.trim();
    if (code !== undefined) updates.code = code.trim().toUpperCase();
    
    const room = await getChatService().updateRoom((req as any).userId, roomId, updates);
    res.json({ room });
  } catch (error: any) {
    console.error('Error updating room:', error);
    res.status(500).json({ error: error.message || 'Failed to update room' });
  }
});

/**
 * Leave a room
 */
router.delete('/rooms/:roomId/leave', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    
    await getChatService().leaveRoom((req as any).userId, roomId);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error leaving room:', error);
    res.status(500).json({ error: error.message || 'Failed to leave room' });
  }
});

/**
 * Delete a room
 */
router.delete('/rooms/:roomId', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    
    await getChatService().deleteRoom((req as any).userId, roomId);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: error.message || 'Failed to delete room' });
  }
});

/**
 * Invite user to room
 */
router.post('/rooms/:roomId/invite', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { inviteeUserId } = req.body;
    
    if (!inviteeUserId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    await getChatService().inviteUserToRoom((req as any).userId, roomId, inviteeUserId);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error inviting user:', error);
    res.status(500).json({ error: error.message || 'Failed to invite user' });
  }
});

/**
 * Get user's chat profile
 */
router.get('/profile', authenticateUser, async (req: Request, res: Response) => {
  try {
    const profile = await getChatService().getUserChatProfile((req as any).userId);
    res.json({ profile });
  } catch (error: any) {
    console.error('Error fetching chat profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * Update user's chat display name
 */
router.put('/profile', authenticateUser, async (req: Request, res: Response) => {
  try {
    const { chatDisplayName } = req.body;
    
    if (!chatDisplayName || chatDisplayName.trim().length === 0) {
      return res.status(400).json({ error: 'Display name is required' });
    }
    
    await getChatService().updateUserChatProfile((req as any).userId, chatDisplayName.trim());
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating chat profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * GET /api/chat/messages (legacy)
 */
router.get('/messages', async (req: Request, res: Response) => {
  try {
    const messages = await getChatService().getMessages();
    res.json({ messages });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * Send a new chat message (legacy)
 */
router.post('/send', chatLimiter, validateMessage, sanitizeMessage, async (req: Request, res: Response) => {
  try {
    const { content, username } = req.body;
    const message = await getChatService().sendMessage(content, username);
    res.json({ message });
  } catch (error: any) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
