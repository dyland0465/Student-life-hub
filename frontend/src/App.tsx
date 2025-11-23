import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/toaster';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { HomeRoute } from '@/components/auth/HomeRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FirebaseErrorHandler } from '@/components/FirebaseErrorHandler';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { CourseworkPage } from '@/pages/CourseworkPage';
import { HealthPage } from '@/pages/HealthPage';
import { SleepPage } from '@/pages/SleepPage';
import { ChatPage } from '@/pages/ChatPage';
import { ErrorPage } from '@/pages/ErrorPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <FirebaseErrorHandler />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/error" element={<ErrorPage />} />
              <Route path="/" element={<HomeRoute />} />
              
              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/coursework" element={<CourseworkPage />} />
                <Route path="/health" element={<HealthPage />} />
                <Route path="/sleep" element={<SleepPage />} />
                <Route path="/chat" element={<ChatPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <Toaster />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
