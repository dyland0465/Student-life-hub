import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LandingPage } from '@/pages/LandingPage';

export function HomeRoute() {
  const { currentUser } = useAuth();

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LandingPage />;
}

