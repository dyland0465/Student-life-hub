# Student Life Hub

A web application to help students manage their academic life, health, fitness, and sleep - powered by AI.

![Tech Stack](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Express](https://img.shields.io/badge/Express-4.18-green)
![Firebase](https://img.shields.io/badge/Firebase-12.0-orange)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--5-purple)

## Features

### Coursework Management
- Create and organize courses
- Track assignments with due dates
- Mark assignments complete
- View upcoming deadlines

### Health & Fitness
- Create custom workout routines
- Log workout sessions
- Track fitness statistics
- AI-powered workout recommendations

### Sleep Tracking
- Set target sleep schedule
- Log sleep sessions with quality ratings
- Track sleep patterns and consistency
- AI sleep insights and recommendations

### AI-Powered Features
- **EZSolve** - Homework help
- Smart fitness recommendations
- Sleep pattern analysis
- Personalized insights

### Authentication
- Email/Password registration
- Google OAuth sign-in
- Secure Firebase authentication
- User profiles with major and year

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  - React 18 + TypeScript + Vite                         │
│  - ShadCN UI + Tailwind CSS                             │
│  - React Router + Context API                           │
│  - Responsive Design + Dark Mode                        │
└────────────┬────────────────────────────────────────────┘
             │
             │ HTTP/HTTPS
             │
┌────────────▼────────────────────────────────────────────┐
│                Backend API (Express)                     │
│  - Node.js + TypeScript                                 │
│  - Rate Limiting + CORS                                 │
│  - Firebase Auth Verification                           │
│  - OpenAI Integration                                   │
└────────────┬────────────────────────────────────────────┘
             │
       ┌─────┴──────┐
       │            │
   ┌───▼───┐    ┌──▼────┐
   │Firebase│    │OpenAI │
   │Auth/DB │    │  API  │
   └────────┘    └───────┘
```

## Quick Start

### Prerequisites
- Node.js 18+ installed
- Firebase project created
- OpenAI API key (optional)

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/Student-life-hub.git
cd Student-life-hub
```

### 2. Configure Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env with your Firebase credentials
```

### 3. Configure Backend

```bash
cd ../backend
# Create .env file (see backend/readme.md)
```

Add Firebase Admin SDK credentials:
1. Firebase Console → Project Settings → Service Accounts
2. Generate New Private Key
3. Copy values to backend/.env

### 4. Start Application

**Windows:**
```bash
# From project root
start.bat
```

**Manual start:**
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm install
npm run dev
```

### 5. Open Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health**: http://localhost:3001/api/health

## 📁 Project Structure

```
Student-life-hub/
├── frontend/                  # React application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ui/          # ShadCN UI components
│   │   │   ├── auth/        # Auth components
│   │   │   ├── coursework/  # Coursework features
│   │   │   ├── health/      # Fitness features
│   │   │   ├── sleep/       # Sleep tracking
│   │   │   └── layout/      # Layout components
│   │   ├── pages/           # Page components
│   │   ├── lib/             # Utilities & services
│   │   ├── hooks/           # Custom React hooks
│   │   ├── types/           # TypeScript types
│   │   └── contexts/        # React contexts
│   ├── public/              # Static assets
│   └── package.json
│
├── backend/                  # Express API
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   ├── config/          # Configuration
│   │   └── server.ts        # Entry point
│   └── package.json
│
├── start.bat                # Windows startup script
├── DEPLOYMENT.md            # Deployment guide
└── README.md               # This file
```

## Tech Stack

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **UI Library**: ShadCN UI
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State**: React Context API
- **Forms**: React Hook Form (implicit)
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Language**: TypeScript
- **Authentication**: Firebase Admin SDK
- **AI**: OpenAI API
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan

### Services
- **Authentication**: Firebase Auth
- **Database**: Cloud Firestore
- **AI**: OpenAI

## Documentation

- **[Frontend README](frontend/README.md)** - Frontend setup and features
- **[Backend README](backend/README.md)** - API documentation
- **[SRS Document](SWENG411%20SRS%20Team%20X.pdf)** - Requirements specification

## API Endpoints

### Health Check
```http
GET /api/health
```

### AI Endpoints

**EZSolve Assignment**
```http
POST /api/ai/solve-assignment
Authorization: Bearer <token>
Body: { "assignment": { "title": "...", "description": "..." } }
```

**Workout Recommendations**
```http
POST /api/ai/workout-recommendations
Body: { "fitnessLevel": "beginner", "goals": [...] }
```

**Sleep Insights**
```http
POST /api/ai/sleep-insights
Body: { "averageHours": 7, "consistency": 85, "recentLogs": [...] }
```

See [Backend README](backend/README.md) for complete API documentation.

## Environment Variables

### Frontend (.env)
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_API_URL=http://localhost:3001
```

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="..."
OPENAI_API_KEY=...
FRONTEND_URL=http://localhost:5173
```

## Features Roadmap

### Completed
- [x] User authentication (Email + Google)
- [x] Coursework management
- [x] Assignment tracking
- [x] EZSolve AI feature
- [x] Fitness tracking
- [x] Sleep schedule
- [x] Dashboard overview
- [x] Dark mode
- [x] Backend API
- [x] Rate limiting

### Planned
- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] Study groups/collaboration
- [ ] Calendar integration
- [ ] Export data (PDF/CSV)
- [ ] Advanced analytics
- [ ] Social features
- [ ] Grade tracking

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Team

Created as part of SWENG411 course project by J.A.D.E.

## Known Issues

- OpenAI API costs money (works in demo mode without key)
- Firebase free tier limits (10GB storage, 50k reads/day)

## License

MIT License
---
