import express from 'express';
import { sanitizeMessage, validateMessage } from '../middleware/messageSanitizer';
import { chatLimiter } from '../middleware/rateLimiter';
import { ChatService } from '../services/chat.service';

const router = express.Router();
const chatService = new ChatService();

/**
 * GET /api/chat/messages
 * Get all chat messages
 */
router.get('/messages', async (req, res) => {
  try {
    const messages = await chatService.getMessages();
    res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * POST /api/chat/send
 * Send a new chat message
 */
router.post('/send', chatLimiter, validateMessage, sanitizeMessage, async (req, res) => {
  try {
    const { content, username } = req.body;
    const message = await chatService.sendMessage(content, username);
    res.json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
