# Student Life Hub - Backend API

Express + TypeScript backend for the Student Life Hub with AI-powered features.

## Features

- **Secure AI Integration**: OpenAI API calls handled server-side
- **Firebase Authentication**: Verify Firebase auth tokens
- **Rate Limiting**: Prevent API abuse with configurable limits
- **CORS Protection**: Secure cross-origin requests
- **Error Handling**: Comprehensive error handling and logging
- **Type Safety**: Full TypeScript support

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── firebase.ts       # Firebase Admin setup
│   ├── middleware/
│   │   ├── auth.ts           # Authentication middleware
│   │   ├── rateLimiter.ts    # Rate limiting
│   │   └── errorHandler.ts   # Error handling
│   ├── routes/
│   │   ├── ai.ts             # AI endpoints
│   │   └── health.ts         # Health check
│   ├── services/
│   │   └── openai.service.ts # OpenAI integration
│   └── server.ts             # Main Express app
├── .env                      # Environment variables (create this)
├── .env.example              # Environment template
├── package.json
└── tsconfig.json
```

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the backend directory:

```env
# Server
PORT=3001
NODE_ENV=development

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-admin-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# OpenAI API
OPENAI_API_KEY=your-openai-api-key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### 3. Get Firebase Admin Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file
6. Copy the values to your `.env`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the quotes and \\n)

### 4. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Go to **API Keys**
4. Click **Create new secret key**
5. Copy to `.env` as `OPENAI_API_KEY`

**Note**: The backend works without OpenAI key (demo mode with mock data)

### 5. Run Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3001`

## API Endpoints

### Health Check

```http
GET /api/health
```

Returns server status and configuration.

### EZSolve - AI Assignment Helper

```http
POST /api/ai/solve-assignment
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "assignment": {
    "id": "assignment-123",
    "title": "Write a recursive function to calculate factorial",
    "description": "Optional description"
  }
}
```

**Response:**
```json
{
  "success": true,
  "solution": {
    "solution": "Detailed AI-generated solution...",
    "explanation": "Explanation of the approach",
    "steps": ["Step 1", "Step 2", "..."],
    "assignmentId": "assignment-123",
    "generatedAt": "2024-01-20T10:30:00.000Z"
  }
}
```

**Rate Limits:**
- 10 requests per hour per user
- Requires authentication

### Workout Recommendations

```http
POST /api/ai/workout-recommendations
Content-Type: application/json

{
  "fitnessLevel": "beginner",
  "goals": ["weight loss", "cardio"],
  "availableTime": 30
}
```

**Response:**
```json
{
  "success": true,
  "recommendations": [
    {
      "routineName": "Morning Cardio",
      "duration": 30,
      "type": "Cardio",
      "description": "..."
    }
  ]
}
```

**Rate Limits:**
- 20 requests per 15 minutes
- Authentication optional

### Sleep Insights

```http
POST /api/ai/sleep-insights
Content-Type: application/json

{
  "averageHours": 6.5,
  "consistency": 75,
  "recentLogs": [...]
}
```

**Response:**
```json
{
  "success": true,
  "insights": {
    "analysis": "Sleep analysis text...",
    "recommendations": ["Tip 1", "Tip 2", "..."],
    "score": 85
  }
}
```

## Security Features

### Authentication
- Firebase token verification
- Protected routes require valid JWT
- Optional auth for public endpoints

### Rate Limiting
- Global API limit: 100 requests per 15 minutes
- AI endpoints: 20 requests per 15 minutes
- EZSolve: 10 requests per hour per user

### CORS
- Configured to only allow frontend origin
- Credentials support enabled

### Input Validation
- Request body validation
- Maximum length checks
- Type checking

## 🔧 Development

### Available Scripts

```bash
# Development with hot reload
npm run dev

# Build TypeScript
npm run build

# Production start
npm start

# Type check
npm run type-check
```

### Project Dependencies

**Runtime:**
- `express` - Web framework
- `cors` - CORS handling
- `helmet` - Security headers
- `morgan` - HTTP logging
- `dotenv` - Environment variables
- `firebase-admin` - Firebase authentication
- `openai` - OpenAI API client
- `express-rate-limit` - Rate limiting

**Development:**
- `typescript` - Type safety
- `tsx` - TypeScript execution
- `@types/*` - Type definitions

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | Environment (development/production) |
| `FIREBASE_PROJECT_ID` | Yes* | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Yes* | Firebase admin email |
| `FIREBASE_PRIVATE_KEY` | Yes* | Firebase private key |
| `OPENAI_API_KEY` | No** | OpenAI API key |
| `FRONTEND_URL` | Yes | Frontend URL for CORS |
| `RATE_LIMIT_WINDOW_MS` | No | Rate limit window (default: 900000) |
| `RATE_LIMIT_MAX_REQUESTS` | No | Max requests per window (default: 100) |

\* Required for authentication to work
\** Works in demo mode without it

## 🧪 Testing

Test endpoints with curl or Postman:

```bash
# Health check
curl http://localhost:3001/api/health

# EZSolve (with auth token)
curl -X POST http://localhost:3001/api/ai/solve-assignment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{"assignment":{"id":"1","title":"Test assignment"}}'
```

## 📚 Integration with Frontend

Update frontend `.env` to point to your backend:

```env
VITE_API_URL=http://localhost:3001
# or in production:
VITE_API_URL=https://your-api.onrender.com
```

Update `frontend/src/lib/ai-service.ts` to call backend API instead of direct OpenAI calls.

## ⚠️ Important Notes

- **Never commit `.env` file** to version control
- **Rotate API keys** regularly
- **Monitor usage** to avoid unexpected costs
- **Set up logging** in production
- **Enable HTTPS** in production (automatic on Render/Railway)

## 🆘 Troubleshooting

### "Firebase not initialized"
- Check if Firebase credentials are correct in `.env`
- Verify private key format (must include `\n` for line breaks)

### "OpenAI API error"
- Verify API key is valid
- Check OpenAI account has credits
- Backend works without key (demo mode)

### "CORS error"
- Ensure `FRONTEND_URL` in `.env` matches your frontend URL
- Check if frontend is sending credentials correctly

### "Rate limit exceeded"
- Wait for rate limit window to expire
- Adjust limits in `.env` if needed for development
---