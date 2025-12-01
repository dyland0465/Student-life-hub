import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initializeFirebaseAdmin } from './config/firebase';
import { initializeChatService } from './routes/chat';
import aiRoutes from './routes/ai';
import healthRoutes from './routes/health';
import chatRoutes from './routes/chat';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Firebase Admin
initializeFirebaseAdmin();

// Initialize chat service after Firebase is ready
const chatService = initializeChatService();
chatService.initializeGlobalRoom().catch(error => {
  console.error('Failed to initialize global chat room:', error);
});

// Middleware
app.use(helmet()); // Security headers
app.use(morgan('dev')); // Logging
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Student Life Hub API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      ai: {
        solveAssignment: 'POST /api/ai/solve-assignment',
        workoutRecommendations: 'POST /api/ai/workout-recommendations',
        sleepInsights: 'POST /api/ai/sleep-insights',
      },
      chat: {
        getMessages: 'GET /api/chat/messages',
        sendMessage: 'POST /api/chat/send',
      }
    }
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

export default app;

