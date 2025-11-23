import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Component that monitors Firebase errors and redirects to error page when needed
 */
export function FirebaseErrorHandler() {
  const { firebaseError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Reset redirect flag when location changes
    if (location.pathname !== '/error') {
      hasRedirected.current = false;
    }
  }, [location.pathname]);

  useEffect(() => {
    if (firebaseError && !hasRedirected.current) {
      // Only redirect if we're not already on the error page
      if (location.pathname !== '/error') {
        hasRedirected.current = true;
        navigate('/error', {
          state: {
            errorType: firebaseError.type,
            message: firebaseError.message,
          },
          replace: true,
        });
      }
    }
  }, [firebaseError, navigate, location.pathname]);

  return null;
}

