# Student Life Hub - Frontend

A modern React webapp for managing student life including coursework, health & fitness tracking, and sleep schedules, powered by AI features.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: ShadCN UI + Tailwind CSS
- **Backend**: Firebase (Authentication + Firestore Database)
- **Authentication**: Email/Password + Google OAuth
- **AI Integration**: OpenAI API for EZSolve feature

## Features

### Coursework Management
- Create and manage courses
- Track assignments with due dates
- Mark assignments as complete
- Filter by pending/completed status

### Health & Fitness
- Create custom workout routines
- Log workout sessions
- Track workout history and statistics
- AI-powered fitness recommendations

### Sleep Schedule
- Set target sleep schedule
- Log sleep sessions with quality ratings
- Track sleep consistency
- AI-powered sleep insights and recommendations

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password
   - Enable Google
3. Create Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
   - Set up security rules (see below)

### 3. Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_OPENAI_API_KEY=your_openai_key_optional
```

### 4. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Courses collection
    match /courses/{courseId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    
    // Fitness routines
    match /fitnessRoutines/{routineId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    
    // Workout logs
    match /workoutLogs/{logId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    
    // Sleep schedules
    match /sleepSchedules/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Sleep logs
    match /sleepLogs/{logId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
  }
}
```

### 5. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 6. Build for Production

```bash
npm run build
```

## AI Features

### EZSolve
The EZSolve feature provides AI-powered homework assistance. It uses OpenAI's API to help students understand their assignments better.

**Note**: 
- If you don't provide an OpenAI API key, the feature will work in demo mode with mock solutions
- The feature includes academic integrity warnings to encourage proper use
- Real API integration requires setting `VITE_OPENAI_API_KEY` in your `.env` file

### AI Recommendations
The app provides intelligent insights for:
- Study schedule optimization
- Fitness routine suggestions
- Sleep pattern analysis
- Personalized health recommendations

## Project Structure

```
src/
├── components/
│   ├── ui/              # ShadCN UI components
│   ├── auth/            # Authentication components
│   ├── coursework/      # Coursework management components
│   ├── health/          # Fitness tracking components
│   ├── sleep/           # Sleep tracking components
│   └── layout/          # Layout components (Header, Sidebar, etc.)
├── contexts/
│   └── AuthContext.tsx  # Authentication context
├── hooks/               # Custom React hooks
├── lib/
│   ├── firebase.ts      # Firebase configuration
│   ├── ai-service.ts    # AI service integration
│   └── utils.ts         # Utility functions
├── pages/               # Page components
├── types/               # TypeScript type definitions
├── App.tsx              # Main app component with routing
└── main.tsx             # Entry point
```

## Features Overview

### Dashboard
- Quick overview of upcoming assignments
- Recent workout statistics
- Latest sleep data
- AI-powered recommendations

### Coursework
- Full CRUD operations for courses
- Assignment tracking with due dates
- EZSolve AI button for homework help
- Status tracking (pending/completed)

### Health & Fitness
- Create and save workout routines
- Log workouts with duration and type
- View workout history
- AI fitness recommendations

### Sleep Schedule
- Set target sleep times
- Log sleep sessions
- Track sleep quality
- View consistency metrics
- AI sleep insights