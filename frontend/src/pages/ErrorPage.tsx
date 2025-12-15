import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, Home, WifiOff, ServerCrash } from 'lucide-react';

interface ErrorPageProps {
  errorType?: 'firebase' | 'network' | 'server' | 'unknown';
  message?: string;
}

interface LocationState {
  errorType?: 'firebase' | 'network' | 'server' | 'unknown';
  message?: string;
}

export function ErrorPage({ errorType: propErrorType, message: propMessage }: ErrorPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const locationState = location.state as LocationState | null;
  const errorType = locationState?.errorType || propErrorType || 'unknown';
  const message = locationState?.message || propMessage;

  const errorConfig = {
    firebase: {
      title: 'Firebase Service Unavailable',
      description: 'We are unable to connect to Firebase services. This could be due to a temporary outage or configuration issue.',
      icon: ServerCrash,
      suggestions: [
        'Check your internet connection',
        'Verify Firebase configuration',
        'Try refreshing the page',
        'Contact support if the issue persists',
      ],
    },
    network: {
      title: 'Network Connection Error',
      description: 'Unable to connect to our servers. Please check your internet connection.',
      icon: WifiOff,
      suggestions: [
        'Check your internet connection',
        'Try disabling VPN if active',
        'Check firewall settings',
        'Try using a different network',
      ],
    },
    server: {
      title: 'Server Error',
      description: 'Our servers are experiencing issues. We are working to resolve this as quickly as possible.',
      icon: ServerCrash,
      suggestions: [
        'The issue is on our end, not yours',
        'Please try again in a few minutes',
        'Check our status page for updates',
        'Contact support if urgent',
      ],
    },
    unknown: {
      title: 'Something Went Wrong',
      description: 'An unexpected error occurred. We apologize for the inconvenience.',
      icon: AlertCircle,
      suggestions: [
        'Try refreshing the page',
        'Clear your browser cache',
        'Check your internet connection',
        'Contact support if the problem continues',
      ],
    },
  };

  const config = errorConfig[errorType];
  const Icon = config.icon;

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    window.location.reload();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  useEffect(() => {
    // Log error for debugging
    console.error('Error page displayed:', { errorType, message, retryCount });
  }, [errorType, message, retryCount]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        <Card className="border-destructive/50 shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 bg-destructive/10 rounded-full">
                <Icon className="h-12 w-12 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-3xl md:text-4xl">{config.title}</CardTitle>
            <CardDescription className="text-lg">{config.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {message && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <h3 className="font-semibold text-lg">What you can do:</h3>
              <ul className="space-y-2">
                {config.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2 text-muted-foreground">
                    <span className="mt-1">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="flex-1"
                size="lg"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry Connection
                  </>
                )}
              </Button>
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="flex-1"
                size="lg"
                asChild
              >
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Home
                </Link>
              </Button>
            </div>

            {retryCount > 0 && (
              <p className="text-sm text-center text-muted-foreground">
                Retry attempt: {retryCount}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                If this problem persists, please contact our support team.
              </p>
              <p className="text-xs text-muted-foreground">
                Error Type: {errorType} | Timestamp: {new Date().toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

